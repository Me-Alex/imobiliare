import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedSupabaseClient } from '@/lib/supabase'
import { normalizeAccountRole, type AccountRole } from '@/lib/account-roles'

type AuthenticatedClient = ReturnType<typeof createAuthenticatedSupabaseClient>

type AuthenticatedIdentity = {
  client: AuthenticatedClient
  userId: string
  email: string
}

export type AuthenticatedAccount = AuthenticatedIdentity & {
  role: AccountRole
}

export type AccountAuthResult =
  | AuthenticatedAccount
  | { response: NextResponse }

export type AdminAuthResult =
  | AuthenticatedIdentity
  | { response: NextResponse }

function unauthorized() {
  return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
}

function forbidden() {
  return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
}

function unavailable() {
  return { response: NextResponse.json({ error: 'Serviciul de autentificare este indisponibil. Încearcă din nou.' }, {
    status: 503, headers: { 'Retry-After': '30', 'Cache-Control': 'no-store' },
  }) }
}

export function hasResponse(result: AccountAuthResult | AdminAuthResult): result is { response: NextResponse } {
  return 'response' in result
}

async function authenticateRequest(request: NextRequest): Promise<AuthenticatedIdentity | { response: NextResponse }> {
  const authorization = request.headers.get('Authorization')
  const token = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1]
  if (!token) return unauthorized()

  try {
    const client = createAuthenticatedSupabaseClient(token)
    const { data: authData, error: authError } = await client.auth.getUser(token)
    if (authError && (!authError.status || authError.status >= 500)) return unavailable()
    if (authError || !authData.user) {
      return unauthorized()
    }

    return {
      client,
      userId: authData.user.id,
      email: authData.user.email?.trim().toLowerCase() || '',
    }
  } catch {
    return unavailable()
  }
}

export async function requireAuthenticatedAccount(request: NextRequest): Promise<AccountAuthResult> {
  const identity = await authenticateRequest(request)
  if ('response' in identity) return identity

  try {
    const { data: profile, error: profileError } = await identity.client
      .from('profiles')
      .select('role,is_active')
      .eq('id', identity.userId)
      .maybeSingle()

    if (profileError) return unavailable()
    if (!profile || profile.is_active === false) {
      return forbidden()
    }

    return {
      ...identity,
      role: normalizeAccountRole(profile.role),
    }
  } catch {
    return unavailable()
  }
}

export async function requireAccountRole(
  request: NextRequest,
  allowedRoles: readonly AccountRole[],
): Promise<AccountAuthResult> {
  const account = await requireAuthenticatedAccount(request)
  if (hasResponse(account)) return account

  if (!allowedRoles.includes(account.role)) return forbidden()
  return account
}

export async function requireAdmin(request: NextRequest): Promise<AdminAuthResult> {
  const identity = await requireAuthenticatedAccount(request)
  if ('response' in identity) return identity

  try {
    const { data, error } = await identity.client.rpc('is_admin_user')
    if (error) return unavailable()
    return data === true ? identity : forbidden()
  } catch {
    return unavailable()
  }
}

export async function requireStaff(request: NextRequest): Promise<AccountAuthResult> {
  const account = await requireAuthenticatedAccount(request)
  if (hasResponse(account)) return account

  if (account.role === 'AGENT') return account
  try {
    const { data, error } = await account.client.rpc('is_admin_user')
    if (error) return unavailable()
    return data === true ? account : forbidden()
  } catch {
    return unavailable()
  }
}
