export function listValue(value: unknown) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean)
  return String(value || "").split(/[\n,]/).map((item) => item.trim()).filter(Boolean)
}

export function numericValue(value: unknown) {
  if (value === "" || value === null || value === undefined) return null
  const next = Number(value)
  return Number.isFinite(next) ? next : null
}

export function optionalUuid(value: unknown) {
  const text = String(value || "").trim()
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text) ? text : null
}

export function slugifyProperty(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

export function normalizePropertyPayload(payload: Record<string, any>) {
  const title = String(payload.title || "").trim()
  return {
    title,
    slug: String(payload.slug || slugifyProperty(title) || "proprietate").trim(),
    description: payload.description || null,
    type: payload.type || "APARTMENT",
    transaction_type: payload.transaction_type || payload.transaction || "sale",
    transaction: payload.transaction_type || payload.transaction || "sale",
    price: numericValue(payload.price) || 0,
    currency: payload.currency || "EUR",
    city: payload.city || payload.zone || "Bucuresti",
    county: payload.county || null,
    address: payload.address || null,
    area_sqm: numericValue(payload.area_sqm || payload.surface) || 0,
    surface: numericValue(payload.area_sqm || payload.surface) || 0,
    rooms: numericValue(payload.rooms) || 0,
    bathrooms: numericValue(payload.bathrooms || payload.baths) || 0,
    baths: numericValue(payload.bathrooms || payload.baths) || 0,
    parking_spots: numericValue(payload.parking_spots) || 0,
    floor: numericValue(payload.floor),
    year_built: numericValue(payload.year_built),
    status: payload.status || "DRAFT",
    featured: Boolean(payload.featured === true || payload.featured === "true" || payload.featured === "1"),
    cover_image_url: payload.cover_image_url || null,
    gallery_urls: listValue(payload.gallery_urls),
    floorplan_urls: listValue(payload.floorplan_urls),
    amenities: listValue(payload.amenities),
    meta_title: payload.meta_title || null,
    meta_description: payload.meta_description || null,
    owner_email: payload.owner_email || null,
    agent_email: payload.agent_email || null,
    published_at: payload.status === "PUBLISHED" ? payload.published_at || new Date().toISOString() : payload.published_at || null,
    updated_at: new Date().toISOString(),
  }
}
