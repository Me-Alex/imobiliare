import { cache } from "react"
import { fallbackProperties } from "@/lib/fresh-data"
import { supabase, type Property } from "@/lib/supabase"

function normalizeProperty(property: Property): Property {
  return {
    ...property,
    currency: property.currency || "EUR",
    status: property.status || "PUBLISHED",
    cover_image_url: property.cover_image_url || null,
    gallery_urls: Array.isArray(property.gallery_urls) ? property.gallery_urls : null,
  }
}

export const getPublishedProperties = cache(async (limit = 32) => {
  try {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("status", "PUBLISHED")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error || !data?.length) return fallbackProperties.slice(0, limit)
    return data.map((item) => normalizeProperty(item as Property))
  } catch {
    return fallbackProperties.slice(0, limit)
  }
})

export const getPropertyBySlug = cache(async (slug: string) => {
  try {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("slug", slug)
      .eq("status", "PUBLISHED")
      .maybeSingle()

    if (!error && data) return normalizeProperty(data as Property)
  } catch {
    // Fallback below keeps static rendering resilient when Supabase is slow.
  }

  return fallbackProperties.find((property) => property.slug === slug) || null
})

export async function getSimilarProperties(property: Property, limit = 3) {
  const all = await getPublishedProperties(24)
  return all
    .filter((item) => item.id !== property.id)
    .sort((a, b) => {
      const cityScore = Number(b.city === property.city) - Number(a.city === property.city)
      if (cityScore !== 0) return cityScore
      return Math.abs(a.price - property.price) - Math.abs(b.price - property.price)
    })
    .slice(0, limit)
}
