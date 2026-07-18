import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedSupabaseClient, supabase } from '@/lib/supabase'

type AuthenticatedClient = ReturnType<typeof createAuthenticatedSupabaseClient>

export type AdminAuthResult =
  | { client: AuthenticatedClient; userId: string; email: string }
  | { response: NextResponse }

export async function requireAdmin(request: NextRequest): Promise<AdminAuthResult> {
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

  return {
    client,
    userId: authData.user.id,
    email: authData.user.email || authData.user.id,
  }
}
