import type { BuyerProfile } from "@/lib/experience"

export const FAVORITES_KEY = "hqs-favorites"
export const COMPARE_KEY = "hqs-compare"
export const BUYER_INTENT_KEY = "hqs-buyer-intent"
export const RECENT_VIEWS_KEY = "hqs-recent-views"
export const SAVED_SEARCHES_KEY = "hqs-saved-searches"

export type BuyerIntent = BuyerProfile & {
  updatedAt?: string
}

export type RecentPropertyView = {
  id: string
  title: string
  slug: string
  city?: string
  price?: number
  viewedAt: string
}

export type SavedSearch = {
  id: string
  label: string
  query: string
  type: string
  zone: string
  rooms: number
  maxPrice: number
  minArea: number
  featuredOnly: boolean
  results: number
  createdAt: string
}

export type ClientPreferenceSnapshot = {
  favorites: string[]
  compare: string[]
  buyerIntent: BuyerIntent
  recentViews: RecentPropertyView[]
  savedSearches: SavedSearch[]
}

export const DEFAULT_BUYER_INTENT: BuyerIntent = {
  budget: 250000,
  area: "orice",
  rooms: 3,
  purpose: "locuire",
}

export function readStoredIds(key: string) {
  if (typeof window === "undefined") return []
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]")
    return Array.isArray(value) ? value.filter((id) => typeof id === "string") : []
  } catch {
    return []
  }
}

export function writeStoredIds(key: string, ids: string[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(Array.from(new Set(ids))))
  dispatchClientEvent("hqs-selection")
}

export function clearStoredIds(key: string) {
  if (typeof window === "undefined") return
  localStorage.removeItem(key)
  dispatchClientEvent("hqs-selection")
}

export function toggleStoredId(key: string, id: string, limit?: number) {
  const current = readStoredIds(key)
  const exists = current.includes(id)
  const next = exists ? current.filter((item) => item !== id) : [...current, id]
  const limited = limit ? next.slice(-limit) : next
  writeStoredIds(key, limited)
  return { selected: !exists, ids: limited }
}

export function readBuyerIntent(): BuyerIntent {
  if (typeof window === "undefined") return DEFAULT_BUYER_INTENT
  try {
    const value = JSON.parse(localStorage.getItem(BUYER_INTENT_KEY) || "null")
    if (!value || typeof value !== "object") return DEFAULT_BUYER_INTENT
    return {
      budget: clampNumber(value.budget, 75000, 1000000, DEFAULT_BUYER_INTENT.budget),
      area: typeof value.area === "string" ? value.area : DEFAULT_BUYER_INTENT.area,
      rooms: clampNumber(value.rooms, 1, 6, DEFAULT_BUYER_INTENT.rooms),
      purpose: isPurpose(value.purpose) ? value.purpose : DEFAULT_BUYER_INTENT.purpose,
      updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : undefined,
    }
  } catch {
    return DEFAULT_BUYER_INTENT
  }
}

export function writeBuyerIntent(intent: BuyerIntent) {
  if (typeof window === "undefined") return
  const next: BuyerIntent = {
    budget: clampNumber(intent.budget, 75000, 1000000, DEFAULT_BUYER_INTENT.budget),
    area: intent.area || DEFAULT_BUYER_INTENT.area,
    rooms: clampNumber(intent.rooms, 1, 6, DEFAULT_BUYER_INTENT.rooms),
    purpose: intent.purpose || DEFAULT_BUYER_INTENT.purpose,
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(BUYER_INTENT_KEY, JSON.stringify(next))
  dispatchClientEvent("hqs-buyer-intent")
}

export function readRecentPropertyViews() {
  if (typeof window === "undefined") return [] as RecentPropertyView[]
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_VIEWS_KEY) || "[]")
    return Array.isArray(value)
      ? value.filter((item) => item && typeof item.id === "string" && typeof item.slug === "string").slice(0, 8)
      : []
  } catch {
    return []
  }
}

export function rememberPropertyView(view: Omit<RecentPropertyView, "viewedAt">) {
  if (typeof window === "undefined") return
  const next = [
    { ...view, viewedAt: new Date().toISOString() },
    ...readRecentPropertyViews().filter((item) => item.id !== view.id),
  ].slice(0, 8)
  localStorage.setItem(RECENT_VIEWS_KEY, JSON.stringify(next))
  dispatchClientEvent("hqs-recent-views")
}

export function readSavedSearches() {
  if (typeof window === "undefined") return [] as SavedSearch[]
  try {
    const value = JSON.parse(localStorage.getItem(SAVED_SEARCHES_KEY) || "[]")
    return Array.isArray(value) ? value.filter((item) => item && typeof item.id === "string").slice(0, 6) : []
  } catch {
    return []
  }
}

export function writeSavedSearches(searches: SavedSearch[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(searches.slice(0, 6)))
  dispatchClientEvent("hqs-saved-searches")
}

export function readClientPreferenceSnapshot(): ClientPreferenceSnapshot {
  return {
    favorites: readStoredIds(FAVORITES_KEY),
    compare: readStoredIds(COMPARE_KEY),
    buyerIntent: readBuyerIntent(),
    recentViews: readRecentPropertyViews(),
    savedSearches: readSavedSearches(),
  }
}

export function subscribeClientPreferences(callback: () => void) {
  if (typeof window === "undefined") return () => undefined
  const events = ["storage", "hqs-selection", "hqs-buyer-intent", "hqs-recent-views", "hqs-saved-searches"]
  events.forEach((event) => window.addEventListener(event, callback))
  return () => events.forEach((event) => window.removeEventListener(event, callback))
}

function dispatchClientEvent(name: string) {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(name))
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.max(min, Math.min(max, number))
}

function isPurpose(value: unknown): value is BuyerProfile["purpose"] {
  return value === "locuire" || value === "investitie" || value === "familie" || value === "birou"
}
