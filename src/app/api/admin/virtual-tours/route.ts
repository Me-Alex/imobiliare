import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedSupabaseClient, supabase } from '@/lib/supabase'

type AuthenticatedClient = ReturnType<typeof createAuthenticatedSupabaseClient>

async function requireAdmin(request: NextRequest): Promise<
  | { client: AuthenticatedClient; userId: string }
  | { response: NextResponse }
> {
  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const token = authorization.slice(7)
  const { data: authData, error: authError } = await supabase.auth.getUser(token)
  if (authError || !authData.user) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const client = createAuthenticatedSupabaseClient(token)
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role,is_active')
    .eq('id', authData.user.id)
    .maybeSingle()
  if (profileError || !profile || profile.role !== 'ADMIN' || profile.is_active === false) {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { client, userId: authData.user.id }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('response' in auth) return auth.response

  const { data, error } = await auth.client
    .from('virtual_tours')
    .select(`
      id,provider,external_url,status,title,entry_scene_id,submitted_at,reviewed_at,review_note,created_at,
      properties!inner(id,title,slug),
      virtual_tour_scenes!virtual_tour_scenes_tour_id_fkey(id,title,storage_bucket,storage_path,image_url,sort_order,initial_yaw,initial_pitch,initial_fov)
    `)
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const tours = await Promise.all((data || []).map(async (tour) => {
    const scenes = await Promise.all((tour.virtual_tour_scenes || []).map(async (scene) => {
      if (scene.image_url) return { ...scene, preview_url: scene.image_url }
      const { data: signed } = await auth.client.storage
        .from(scene.storage_bucket)
        .createSignedUrl(scene.storage_path, 15 * 60)
      return { ...scene, preview_url: signed?.signedUrl || null }
    }))
    return {
      ...tour,
      virtual_tour_scenes: scenes.sort((a, b) => a.sort_order - b.sort_order),
    }
  }))

  return NextResponse.json({ tours })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('response' in auth) return auth.response

  let body: { id?: string; action?: string; note?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const id = body.id?.trim()
  const action = body.action?.trim().toUpperCase()
  const note = body.note?.trim().slice(0, 1000) || null
  if (!id || !['APPROVE', 'REJECT'].includes(action || '')) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const { data: tour, error: tourError } = await auth.client
    .from('virtual_tours')
    .select('id,provider,property_id,status,virtual_tour_scenes!virtual_tour_scenes_tour_id_fkey(id,storage_bucket,storage_path,image_url)')
    .eq('id', id)
    .maybeSingle()
  if (tourError) return NextResponse.json({ error: tourError.message }, { status: 500 })
  if (!tour) return NextResponse.json({ error: 'Tour not found' }, { status: 404 })

  if (action === 'REJECT') {
    const { error } = await auth.client
      .from('virtual_tours')
      .update({
        status: 'REJECTED',
        review_note: note || 'Turul necesită corecturi înainte de publicare.',
        reviewed_by: auth.userId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, status: 'REJECTED' })
  }

  const sourcePaths: string[] = []
  if (tour.provider === 'NATIVE') {
    for (const scene of tour.virtual_tour_scenes || []) {
      if (scene.image_url && scene.storage_bucket === 'virtual-tours') continue

      const { data: file, error: downloadError } = await auth.client.storage
        .from(scene.storage_bucket)
        .download(scene.storage_path)
      if (downloadError || !file) {
        return NextResponse.json({ error: downloadError?.message || 'Panorama nu poate fi citită.' }, { status: 500 })
      }

      const extension = scene.storage_path.split('.').pop()?.toLocaleLowerCase('en-US') || 'jpg'
      const publishedPath = `${tour.property_id}/${scene.id}.${extension}`
      const { error: uploadError } = await auth.client.storage
        .from('virtual-tours')
        .upload(publishedPath, file, {
          contentType: file.type || 'image/jpeg',
          cacheControl: '31536000',
          upsert: true,
        })
      if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

      const { data: publicAsset } = auth.client.storage.from('virtual-tours').getPublicUrl(publishedPath)
      const { error: sceneError } = await auth.client
        .from('virtual_tour_scenes')
        .update({
          storage_bucket: 'virtual-tours',
          storage_path: publishedPath,
          image_url: publicAsset.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', scene.id)
      if (sceneError) return NextResponse.json({ error: sceneError.message }, { status: 500 })
      sourcePaths.push(scene.storage_path)
    }
  }

  const publishedAt = new Date().toISOString()
  const { error: publishError } = await auth.client
    .from('virtual_tours')
    .update({
      status: 'PUBLISHED',
      review_note: note,
      reviewed_by: auth.userId,
      reviewed_at: publishedAt,
      published_at: publishedAt,
      updated_at: publishedAt,
    })
    .eq('id', id)
  if (publishError) return NextResponse.json({ error: publishError.message }, { status: 500 })

  if (sourcePaths.length) {
    const { error: cleanupError } = await auth.client.storage.from('virtual-tour-drafts').remove(sourcePaths)
    if (cleanupError) console.warn('Virtual tour draft cleanup failed:', cleanupError.message)
  }

  return NextResponse.json({ ok: true, status: 'PUBLISHED' })
}
