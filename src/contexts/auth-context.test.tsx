// @vitest-environment jsdom
import React, { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '@supabase/supabase-js'
import { AuthProvider, useAuth } from './auth-context'

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(), onAuthStateChange: vi.fn(), signInWithPassword: vi.fn(), signUp: vi.fn(),
  signOut: vi.fn(), readProfile: vi.fn(), unsubscribe: vi.fn(),
}))
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: mocks,
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.readProfile }) }) }),
  },
}))

let auth: ReturnType<typeof useAuth>
let root: Root
let emit: (event: string, session: Session | null) => void
const session = (id = 'demo-user') => ({ user: { id, email: 'demo@example.test', user_metadata: {} }, access_token: 'test-token' } as Session)
function Probe() {
  const value = useAuth()
  useEffect(() => { auth = value }, [value])
  return <span>{value.profile?.role ?? 'no-profile'}</span>
}
async function render() {
  await act(async () => { root.render(<AuthProvider><Probe /></AuthProvider>) })
}
async function flushProfile() { await act(async () => { await vi.advanceTimersByTimeAsync(20) }) }

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  mocks.getSession.mockResolvedValue({ data: { session: null }, error: null })
  mocks.onAuthStateChange.mockImplementation((callback) => { emit = callback; return { data: { subscription: { unsubscribe: mocks.unsubscribe } } } })
  mocks.readProfile.mockResolvedValue({ data: { id: 'demo-user', role: 'CLIENT', is_active: true }, error: null })
  mocks.signInWithPassword.mockResolvedValue({ error: null })
  mocks.signUp.mockResolvedValue({ data: { session: null }, error: null })
  mocks.signOut.mockResolvedValue({ error: null })
  sessionStorage.clear()
  root = createRoot(document.createElement('div'))
})
afterEach(async () => { await act(async () => root.unmount()); vi.useRealTimers() })

describe('Supabase account lifecycle', () => {
  it('does not overwrite a new sign-in with a stale initial session response', async () => {
    let resolveInitial!: (value: unknown) => void
    mocks.getSession.mockReturnValue(new Promise(resolve => { resolveInitial = resolve }))
    await render()
    await act(async () => emit('SIGNED_IN', session()))
    await act(async () => resolveInitial({ data: { session: null }, error: null }))
    await flushProfile()
    expect(auth.user?.id).toBe('demo-user')
    expect(auth.profile?.role).toBe('CLIENT')
    expect(auth.loading).toBe(false)
  })
  it.each(['CLIENT', 'OWNER', 'AGENT', 'ADMIN'])('restores the verified %s profile', async role => {
    mocks.getSession.mockResolvedValue({ data: { session: session() }, error: null })
    mocks.readProfile.mockResolvedValue({ data: { id: 'demo-user', role, is_active: true }, error: null })
    await render(); await flushProfile()
    expect(auth.profile?.role).toBe(role)
    expect(auth.hasRole(role as 'CLIENT')).toBe(true)
  })
  it('fails closed when a profile cannot be verified, then recovers on retry', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: session() }, error: null })
    mocks.readProfile.mockResolvedValue({ data: null, error: { message: 'offline' } })
    await render(); await flushProfile()
    expect(auth.profile).toBeNull()
    expect(auth.profileError).toBeTruthy()
    expect(auth.loading).toBe(false)
    expect(auth.hasRole('CLIENT', 'ADMIN')).toBe(false)
    mocks.readProfile.mockResolvedValue({ data: { id: 'demo-user', role: 'OWNER', is_active: true }, error: null })
    await act(async () => auth.refreshProfile())
    expect(auth.profile?.role).toBe('OWNER')
    expect(auth.profileError).toBeNull()
  })
  it('does not retain privileged profile data after sign-out while a lookup is pending', async () => {
    let resolveProfile!: (value: unknown) => void
    mocks.getSession.mockResolvedValue({ data: { session: session() }, error: null })
    mocks.readProfile.mockReturnValue(new Promise(resolve => { resolveProfile = resolve }))
    await render(); await flushProfile()
    await act(async () => emit('SIGNED_OUT', null))
    await act(async () => resolveProfile({ data: { id: 'demo-user', role: 'ADMIN', is_active: true }, error: null }))
    expect(auth.user).toBeNull()
    expect(auth.profile).toBeNull()
  })
  it('normalizes email without altering the password', async () => {
    await render()
    await auth.signIn(' demo@example.test ', ' Password With Spaces ')
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({ email: 'demo@example.test', password: ' Password With Spaces ' })
  })
  it('returns email confirmation to the current deployment and reports whether it is needed', async () => {
    await render()
    const result = await auth.signUp('demo@example.test', 'test-password', 'Demo', 'OWNER')
    expect(result.needsEmailConfirmation).toBe(true)
    expect(mocks.signUp).toHaveBeenCalledWith(expect.objectContaining({ options: expect.objectContaining({
      emailRedirectTo: `${location.origin}/?page=login&auth_callback=email`,
      data: { full_name: 'Demo', account_type: 'OWNER' },
    }) }))
    mocks.signUp.mockResolvedValue({ data: { session: session() }, error: null })
    expect((await auth.signUp('demo@example.test', 'test-password')).needsEmailConfirmation).toBe(false)
  })
  it('reports logout errors and limits logout to the current session', async () => {
    await render()
    mocks.signOut.mockResolvedValue({ error: { message: 'offline' } })
    expect((await auth.signOut()).error).toBeTruthy()
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' })
  })
  it('shows recovery after a slow profile request instead of loading forever', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: session() }, error: null })
    mocks.readProfile.mockReturnValue(new Promise(() => {}))
    await render(); await flushProfile()
    await act(async () => { await vi.advanceTimersByTimeAsync(8_000) })
    expect(auth.loading).toBe(false)
    expect(auth.profileError).toBeTruthy()
    expect(auth.profile).toBeNull()
  })
})
