import { isPageKey, type PageKey } from '@/store/slices/navigation'

const AUTH_RETURN_STORAGE_KEY = 'pm-auth-return-v1'
const LEGACY_RETURN_PAGE_KEY = 'pm-auth-return-page'
const LEGACY_RETURN_PROPERTY_KEY = 'pm-auth-return-property'
const LEGACY_RETURN_CONTEXT_KEY = 'pm-auth-return-context'
const AUTH_RETURN_TTL_MS = 60 * 60 * 1000
const MAX_CONTEXT_ENTRIES = 16
const MAX_CONTEXT_VALUE_LENGTH = 1_000

export const AUTH_CALLBACK_QUERY_PARAM = 'auth_callback'

export type AuthReturnContext = Record<string, string | null>

export interface AuthReturnTarget {
  page: PageKey
  context?: AuthReturnContext
}

interface StoredAuthReturnTarget extends AuthReturnTarget {
  createdAt: number
  version: 1
}

function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null

  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function sanitizeContext(value: unknown): AuthReturnContext | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined

  const context: AuthReturnContext = {}
  for (const [key, entry] of Object.entries(value).slice(0, MAX_CONTEXT_ENTRIES)) {
    if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(key)) continue
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue

    if (entry === null) {
      context[key] = null
    } else if (typeof entry === 'string') {
      context[key] = entry.slice(0, MAX_CONTEXT_VALUE_LENGTH)
    }
  }

  return Object.keys(context).length > 0 ? context : undefined
}

function parseStoredTarget(value: string | null): StoredAuthReturnTarget | null {
  if (!value) return null

  try {
    const parsed = JSON.parse(value) as Partial<StoredAuthReturnTarget>
    const now = Date.now()
    const page = typeof parsed.page === 'string' ? parsed.page : null
    if (
      parsed.version !== 1
      || !isPageKey(page)
      || typeof parsed.createdAt !== 'number'
      || parsed.createdAt > now + 60_000
      || now - parsed.createdAt > AUTH_RETURN_TTL_MS
    ) {
      return null
    }

    return {
      version: 1,
      createdAt: parsed.createdAt,
      page,
      context: sanitizeContext(parsed.context),
    }
  } catch {
    return null
  }
}

function clearLegacyReturnKeys(storage: Storage) {
  storage.removeItem(LEGACY_RETURN_PAGE_KEY)
  storage.removeItem(LEGACY_RETURN_PROPERTY_KEY)
  storage.removeItem(LEGACY_RETURN_CONTEXT_KEY)
}

function readLegacyTarget(storage: Storage): AuthReturnTarget | null {
  const legacyPage = storage.getItem(LEGACY_RETURN_PAGE_KEY)
  const legacyContext = storage.getItem(LEGACY_RETURN_CONTEXT_KEY)
  const legacyProperty = storage.getItem(LEGACY_RETURN_PROPERTY_KEY)

  clearLegacyReturnKeys(storage)

  if (!legacyPage && !legacyContext && !legacyProperty) return null

  let context: AuthReturnContext | undefined
  if (legacyContext) {
    try {
      context = sanitizeContext(JSON.parse(legacyContext))
    } catch {
      context = undefined
    }
  }

  if (legacyProperty && !context?.fromProperty) {
    context = { ...context, fromProperty: legacyProperty.slice(0, MAX_CONTEXT_VALUE_LENGTH) }
  }

  return {
    page: isPageKey(legacyPage) ? legacyPage : 'dashboard',
    context,
  }
}

export function saveAuthReturnTarget(page: PageKey, context?: AuthReturnContext): boolean {
  const storage = getSessionStorage()
  if (!storage) return false

  const target: StoredAuthReturnTarget = {
    version: 1,
    createdAt: Date.now(),
    page,
    context: sanitizeContext(context),
  }

  try {
    storage.setItem(AUTH_RETURN_STORAGE_KEY, JSON.stringify(target))
    clearLegacyReturnKeys(storage)
    return true
  } catch {
    return false
  }
}

export function peekAuthReturnTarget(): AuthReturnTarget | null {
  const storage = getSessionStorage()
  if (!storage) return null

  const target = parseStoredTarget(storage.getItem(AUTH_RETURN_STORAGE_KEY))
  if (target) return { page: target.page, context: target.context }

  storage.removeItem(AUTH_RETURN_STORAGE_KEY)
  const legacyTarget = readLegacyTarget(storage)
  if (legacyTarget) saveAuthReturnTarget(legacyTarget.page, legacyTarget.context)
  return legacyTarget
}

export function ensureAuthReturnTarget(page: PageKey = 'dashboard'): AuthReturnTarget {
  const existing = peekAuthReturnTarget()
  if (existing) return existing

  saveAuthReturnTarget(page)
  return { page }
}

export function consumeAuthReturnTarget(): AuthReturnTarget | null {
  const storage = getSessionStorage()
  if (!storage) return null

  const storedValue = storage.getItem(AUTH_RETURN_STORAGE_KEY)
  storage.removeItem(AUTH_RETURN_STORAGE_KEY)

  const target = parseStoredTarget(storedValue)
  if (target) {
    clearLegacyReturnKeys(storage)
    return { page: target.page, context: target.context }
  }

  return readLegacyTarget(storage)
}

export function hasAuthReturnTarget(): boolean {
  return peekAuthReturnTarget() !== null
}

export function isAuthCallbackUrl(): boolean {
  if (typeof window === 'undefined') return false
  return new URL(window.location.href).searchParams.has(AUTH_CALLBACK_QUERY_PARAM)
}

export function clearAuthCallbackUrl(): void {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  const isMarkedCallback = url.searchParams.has(AUTH_CALLBACK_QUERY_PARAM)
  url.searchParams.delete(AUTH_CALLBACK_QUERY_PARAM)
  url.searchParams.delete('error')
  url.searchParams.delete('error_code')
  url.searchParams.delete('error_description')
  if (isMarkedCallback) url.searchParams.delete('code')

  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash
  const hashParams = new URLSearchParams(hash)
  if (
    hashParams.has('access_token')
    || hashParams.has('refresh_token')
    || hashParams.has('error')
    || hashParams.has('error_description')
  ) {
    url.hash = ''
  }

  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
}

export function consumeAuthCallbackError(): string | null {
  if (typeof window === 'undefined') return null

  const url = new URL(window.location.href)
  const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash)
  const message = url.searchParams.get('error_description')
    || hashParams.get('error_description')
    || url.searchParams.get('error')
    || hashParams.get('error')

  if (!message) return null

  clearAuthCallbackUrl()
  return message.replace(/\+/g, ' ').slice(0, 500)
}
