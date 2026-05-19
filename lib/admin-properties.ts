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
    price: numericValue(payload.price) || 0,
    currency: payload.currency || "EUR",
    city: payload.city || payload.zone || "Bucuresti",
    county: payload.county || null,
    address: payload.address || null,
    area_sqm: numericValue(payload.area_sqm || payload.surface) || 0,
    rooms: numericValue(payload.rooms) || 0,
    bathrooms: numericValue(payload.bathrooms || payload.baths) || 0,
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

function hasOwn(payload: Record<string, any>, key: string) {
  return Object.prototype.hasOwnProperty.call(payload, key)
}

// For PATCH updates: only include keys explicitly supplied by the client.
// This prevents accidental data loss when the UI patches just one field (e.g. status).
export function normalizePropertyPatch(payload: Record<string, any>) {
  const patch: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }

  if (hasOwn(payload, "title")) {
    patch.title = String(payload.title || "").trim()
  }
  if (hasOwn(payload, "slug")) {
    const title = patch.title ?? String(payload.title || "").trim()
    patch.slug = String(payload.slug || slugifyProperty(title) || "proprietate").trim()
  }
  if (hasOwn(payload, "description")) patch.description = payload.description || null
  if (hasOwn(payload, "type")) patch.type = payload.type || "APARTMENT"
  if (hasOwn(payload, "transaction_type") || hasOwn(payload, "transaction")) {
    patch.transaction_type = payload.transaction_type || payload.transaction || "sale"
  }
  if (hasOwn(payload, "price")) patch.price = numericValue(payload.price) || 0
  if (hasOwn(payload, "currency")) patch.currency = payload.currency || "EUR"
  if (hasOwn(payload, "city") || hasOwn(payload, "zone")) patch.city = payload.city || payload.zone || "Bucuresti"
  if (hasOwn(payload, "county")) patch.county = payload.county || null
  if (hasOwn(payload, "address")) patch.address = payload.address || null
  if (hasOwn(payload, "area_sqm") || hasOwn(payload, "surface")) patch.area_sqm = numericValue(payload.area_sqm || payload.surface) || 0
  if (hasOwn(payload, "rooms")) patch.rooms = numericValue(payload.rooms) || 0
  if (hasOwn(payload, "bathrooms") || hasOwn(payload, "baths")) patch.bathrooms = numericValue(payload.bathrooms || payload.baths) || 0
  if (hasOwn(payload, "parking_spots")) patch.parking_spots = numericValue(payload.parking_spots) || 0
  if (hasOwn(payload, "floor")) patch.floor = numericValue(payload.floor)
  if (hasOwn(payload, "year_built")) patch.year_built = numericValue(payload.year_built)
  if (hasOwn(payload, "status")) patch.status = payload.status || "DRAFT"
  if (hasOwn(payload, "featured")) patch.featured = Boolean(payload.featured === true || payload.featured === "true" || payload.featured === "1")
  if (hasOwn(payload, "cover_image_url")) patch.cover_image_url = payload.cover_image_url || null
  if (hasOwn(payload, "gallery_urls")) patch.gallery_urls = listValue(payload.gallery_urls)
  if (hasOwn(payload, "floorplan_urls")) patch.floorplan_urls = listValue(payload.floorplan_urls)
  if (hasOwn(payload, "amenities")) patch.amenities = listValue(payload.amenities)
  if (hasOwn(payload, "meta_title")) patch.meta_title = payload.meta_title || null
  if (hasOwn(payload, "meta_description")) patch.meta_description = payload.meta_description || null
  if (hasOwn(payload, "owner_email")) patch.owner_email = payload.owner_email || null
  if (hasOwn(payload, "agent_email")) patch.agent_email = payload.agent_email || null

  if (hasOwn(payload, "published_at")) {
    patch.published_at = payload.published_at || null
  }

  if (String(patch.status || "").toUpperCase() === "PUBLISHED") {
    patch.published_at = patch.published_at || payload.published_at || new Date().toISOString()
  }

  return patch
}
