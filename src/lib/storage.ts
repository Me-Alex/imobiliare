// LocalStorage helpers

export function loadFromLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : fallback
  } catch {
    return fallback
  }
}

export function saveToLS(key: string, data: unknown): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // Storage full or unavailable
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
// Preferences remain usable for this tab when storage is blocked by the browser.
const temporaryPreferences = new Map<string, string | null>()

export function readBrowserPreference(key: string): string | null {
  if (typeof window === 'undefined') return null
  if (temporaryPreferences.has(key)) return temporaryPreferences.get(key) ?? null
  try { return window.localStorage.getItem(key) } catch { return null }
}

export function writeBrowserPreference(key: string, value: string | null): void {
  if (typeof window === 'undefined') return
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
    temporaryPreferences.delete(key)
  } catch {
    temporaryPreferences.set(key, value)
  }
  window.dispatchEvent(new StorageEvent('storage', { key }))
}
