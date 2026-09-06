// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearAuthCallbackUrl, consumeAuthReturnTarget, ensureAuthReturnTarget, getAuthCallbackUrl, peekAuthReturnTarget, saveAuthReturnTarget } from './auth-return'

beforeEach(() => { sessionStorage.clear(); history.replaceState(null, '', '/') })
afterEach(() => vi.restoreAllMocks())

describe('login return destinations', () => {
  it('preserves a viewing request across login and consumes it once', () => {
    saveAuthReturnTarget('programare-vizionare', { propertyId: '123', propertyTitle: 'Apartament' })
    expect(ensureAuthReturnTarget('dashboard').page).toBe('programare-vizionare')
    expect(consumeAuthReturnTarget()).toEqual({ page: 'programare-vizionare', context: { propertyId: '123', propertyTitle: 'Apartament' } })
    expect(consumeAuthReturnTarget()).toBeNull()
  })
  it('cannot return to login indefinitely', () => {
    saveAuthReturnTarget('login')
    expect(consumeAuthReturnTarget()?.page).toBe('dashboard')
  })
  it('ignores expired and external destinations', () => {
    sessionStorage.setItem('pm-auth-return-v1', JSON.stringify({ version: 1, page: 'dashboard', createdAt: Date.now() - 3_600_001 }))
    expect(peekAuthReturnTarget()).toBeNull()
    sessionStorage.setItem('pm-auth-return-v1', JSON.stringify({ version: 1, page: 'https://external.test', createdAt: Date.now() }))
    expect(peekAuthReturnTarget()).toBeNull()
  })
  it.each(['getItem', 'setItem', 'removeItem'] as const)('continues when storage.%s throws', (method) => {
    vi.spyOn(Storage.prototype, method).mockImplementation(() => { throw new Error('Storage blocked') })
    expect(() => saveAuthReturnTarget('dashboard')).not.toThrow()
    expect(() => peekAuthReturnTarget()).not.toThrow()
    expect(() => consumeAuthReturnTarget()).not.toThrow()
    expect(ensureAuthReturnTarget().page).toBe('dashboard')
  })
  it.each(['google', 'email'] as const)('returns %s authentication to the initiating origin', (kind) => {
    expect(getAuthCallbackUrl(kind, 'https://worker.example.test')).toBe(`https://worker.example.test/?page=login&auth_callback=${kind}`)
    expect(getAuthCallbackUrl(kind, 'http://localhost:3000')).toContain('http://localhost:3000/')
  })
  it('cleans credentials and callback markers from browser history', () => {
    history.replaceState(null, '', '/?page=login&auth_callback=google&code=test#access_token=test&refresh_token=test')
    clearAuthCallbackUrl()
    expect(location.search).toBe('?page=login')
    expect(location.hash).toBe('')
  })
})
