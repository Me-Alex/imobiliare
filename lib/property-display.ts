import type { Property } from "@/lib/supabase"
import { formatCurrency, formatInt } from "@/lib/format"

type PropertyLike = Pick<Property, "price" | "currency" | "area_sqm" | "rooms" | "bathrooms" | "parking_spots" | "address" | "city" | "county">

export function hasKnownPrice(value: number | string | null | undefined) {
  const numeric = Number(value || 0)
  return Number.isFinite(numeric) && numeric > 0
}

export function formatPropertyPrice(value: number | string | null | undefined, fallback = "Pret la cerere") {
  return hasKnownPrice(value) ? formatCurrency(value) : fallback
}

export function formatPropertyArea(value: number | string | null | undefined, fallback = "La cerere") {
  const numeric = Number(value || 0)
  return Number.isFinite(numeric) && numeric > 0 ? `${formatInt(numeric)} mp` : fallback
}

export function formatPropertyCount(value: number | string | null | undefined, singular: string, plural: string, fallback = "-") {
  const numeric = Number(value || 0)
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback
  return `${formatInt(numeric)} ${numeric === 1 ? singular : plural}`
}

export function cleanLocation(...parts: Array<string | null | undefined>) {
  const seen = new Set<string>()
  return parts
    .map((part) => String(part || "").trim())
    .map((part) => part.replace(/^[,\s]+|[,\s]+$/g, ""))
    .filter((part) => part && !["null", "undefined", "-", "n/a"].includes(part.toLowerCase()))
    .filter((part) => {
      const key = part.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .join(", ")
}

export function propertyLocation(property: Partial<PropertyLike>, fallback = "Romania") {
  return cleanLocation(property.address, property.city, property.county) || fallback
}

export function propertyShortLocation(property: Partial<PropertyLike>, fallback = "Romania") {
  return cleanLocation(property.city, property.county) || fallback
}
