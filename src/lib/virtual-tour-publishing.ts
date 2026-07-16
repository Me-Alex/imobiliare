'use client'

import { supabase } from '@/lib/supabase'
import {
  dataUrlMimeType,
  extensionForMimeType,
  parseExternalTourUrl,
  type VirtualTour,
  type VirtualTourDraft,
} from '@/lib/virtual-tours'

async function uploadDataUrl(bucket: string, path: string, dataUrl: string): Promise<void> {
  const response = await fetch(dataUrl)
  if (!response.ok) throw new Error('Fișierul local nu a putut fi pregătit pentru upload.')
  const blob = await response.blob()
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: blob.type || dataUrlMimeType(dataUrl),
    cacheControl: '31536000',
    upsert: false,
  })
  if (error) throw new Error(error.message)
}

export async function uploadListingImages(params: {
  userId: string
  propertyId: string
  urls: string[]
}): Promise<string[]> {
  const uploadedPaths: string[] = []
  try {
    const result: string[] = []
    for (let index = 0; index < params.urls.length; index += 1) {
      const url = params.urls[index]
      if (!url.startsWith('data:')) {
        result.push(url)
        continue
      }

      const mimeType = dataUrlMimeType(url)
      const extension = extensionForMimeType(mimeType)
      const path = `${params.userId}/${params.propertyId}/gallery-${index + 1}.${extension}`
      await uploadDataUrl('listing-photos', path, url)
      uploadedPaths.push(path)
      const { data } = supabase.storage.from('listing-photos').getPublicUrl(path)
      result.push(data.publicUrl)
    }
    return result
  } catch (error) {
    if (uploadedPaths.length) await supabase.storage.from('listing-photos').remove(uploadedPaths)
    throw error
  }
}

export async function submitVirtualTour(params: {
  propertyId: string
  propertyTitle: string
  userId: string
  draft: VirtualTourDraft
}): Promise<VirtualTour | null> {
  const { draft } = params
  if (draft.mode === 'NONE') return null

  const parsedExternal = draft.mode === 'EXTERNAL' ? parseExternalTourUrl(draft.externalUrl) : null
  if (draft.mode === 'EXTERNAL' && !parsedExternal) {
    throw new Error('Linkul turului virtual nu este valid.')
  }
  if (draft.mode === 'NATIVE' && draft.scenes.length === 0) {
    throw new Error('Turul 360° nu conține nicio cameră.')
  }

  const provider = draft.mode === 'NATIVE' ? 'NATIVE' : parsedExternal!.provider
  const { data: tourRow, error: tourError } = await supabase
    .from('virtual_tours')
    .insert({
      property_id: params.propertyId,
      provider,
      external_url: parsedExternal?.embedUrl || null,
      status: 'IN_REVIEW',
      title: `Tur virtual · ${params.propertyTitle}`.slice(0, 160),
      created_by: params.userId,
      submitted_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (tourError || !tourRow) throw new Error(tourError?.message || 'Turul virtual nu a putut fi creat.')

  const tourId = String(tourRow.id)
  if (draft.mode === 'EXTERNAL') {
    return {
      id: tourId,
      provider,
      status: 'IN_REVIEW',
      title: `Tur virtual · ${params.propertyTitle}`,
      externalUrl: parsedExternal!.embedUrl,
      scenes: [],
    }
  }

  const uploadedPaths: string[] = []
  try {
    const orderedScenes = [...draft.scenes].sort((a, b) => a.sortOrder - b.sortOrder)
    const sceneRows: Array<{
      id: string
      tour_id: string
      title: string
      storage_bucket: 'virtual-tour-drafts'
      storage_path: string
      image_url: null
      sort_order: number
      initial_yaw: number
      initial_pitch: number
      initial_fov: number
    }> = []
    for (let index = 0; index < orderedScenes.length; index += 1) {
      const scene = orderedScenes[index]
      const mimeType = dataUrlMimeType(scene.imageUrl)
      const extension = extensionForMimeType(mimeType)
      const path = `${params.userId}/${params.propertyId}/${scene.id}.${extension}`
      await uploadDataUrl('virtual-tour-drafts', path, scene.imageUrl)
      uploadedPaths.push(path)
      sceneRows.push({
        id: scene.id,
        tour_id: tourId,
        title: scene.title.trim(),
        storage_bucket: 'virtual-tour-drafts',
        storage_path: path,
        image_url: null,
        sort_order: index,
        initial_yaw: scene.initialYaw,
        initial_pitch: scene.initialPitch,
        initial_fov: scene.initialFov,
      })
    }

    const { error: scenesError } = await supabase.from('virtual_tour_scenes').insert(sceneRows)
    if (scenesError) throw new Error(scenesError.message)

    const hotspotRows = orderedScenes.flatMap((scene) => scene.hotspots.map((hotspot) => ({
      id: hotspot.id,
      scene_id: scene.id,
      target_scene_id: hotspot.targetSceneId,
      label: hotspot.label,
      yaw: hotspot.yaw,
      pitch: hotspot.pitch,
    })))
    if (hotspotRows.length) {
      const { error: hotspotsError } = await supabase.from('virtual_tour_hotspots').insert(hotspotRows)
      if (hotspotsError) throw new Error(hotspotsError.message)
    }

    const entrySceneId = draft.entrySceneId || orderedScenes[0].id
    const { error: entryError } = await supabase
      .from('virtual_tours')
      .update({ entry_scene_id: entrySceneId, updated_at: new Date().toISOString() })
      .eq('id', tourId)
    if (entryError) throw new Error(entryError.message)

    return {
      id: tourId,
      provider: 'NATIVE',
      status: 'IN_REVIEW',
      title: `Tur virtual · ${params.propertyTitle}`,
      entrySceneId,
      scenes: orderedScenes,
    }
  } catch (error) {
    if (uploadedPaths.length) await supabase.storage.from('virtual-tour-drafts').remove(uploadedPaths)
    await supabase.from('virtual_tours').delete().eq('id', tourId)
    throw error
  }
}
