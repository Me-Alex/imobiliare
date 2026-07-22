import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedSupabaseClient, supabase } from '@/lib/supabase'
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

function hasResponse(result: AccountAuthResult | AdminAuthResult): result is { response: NextResponse } {
  return 'response' in result
}

async function authenticateRequest(request: NextRequest): Promise<AuthenticatedIdentity | { response: NextResponse }> {
  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return unauthorized()
  }

  const token = authorization.slice(7)
  const { data: authData, error: authError } = await supabase.auth.getUser(token)
  if (authError || !authData.user) {
    return unauthorized()
  }

  return {
    client: createAuthenticatedSupabaseClient(token),
    userId: authData.user.id,
    email: authData.user.email?.trim().toLowerCase() || '',
  }
}

export async function requireAuthenticatedAccount(request: NextRequest): Promise<AccountAuthResult> {
  const identity = await authenticateRequest(request)
  if ('response' in identity) return identity

  const { data: profile, error: profileError } = await identity.client
    .from('profiles')
    .select('role,is_active')
    .eq('id', identity.userId)
    .maybeSingle()

  if (profileError || !profile || profile.is_active === false) {
    return forbidden()
  }

  return {
    ...identity,
    role: normalizeAccountRole(profile.role),
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

async function isAdmin(client: AuthenticatedClient): Promise<boolean> {
  const { data, error } = await client.rpc('is_admin_user')
  return !error && data === true
}

export async function requireAdmin(request: NextRequest): Promise<AdminAuthResult> {
  const identity = await authenticateRequest(request)
  if ('response' in identity) return identity

  if (!await isAdmin(identity.client)) return forbidden()
  return identity
}

export async function requireStaff(request: NextRequest): Promise<AccountAuthResult> {
  const account = await requireAuthenticatedAccount(request)
  if (hasResponse(account)) return account

  if (account.role === 'AGENT' || await isAdmin(account.client)) return account
  return forbidden()
}
