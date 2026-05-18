export type AdminWorkflowRow = Record<string, any>

export type ChecklistItem = {
  id: string
  label: string
  ok: boolean
  fix: string
}

function text(value: unknown) {
  return String(value || "").trim()
}

function list(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean)
  return text(value).split(/[\n,]/).map((item) => item.trim()).filter(Boolean)
}

function hasCover(property: AdminWorkflowRow, media: AdminWorkflowRow[]) {
  if (text(property.cover_image_url || property.cover_image)) return true
  return media.some((item) => item.property_id === property.id && String(item.kind || "").toLowerCase() === "cover")
}

export function buildPropertyPublishChecklist(property: AdminWorkflowRow, media: AdminWorkflowRow[] = []) {
  const galleryCount = list(property.gallery_urls).length + media.filter((item) => item.property_id === property.id && ["cover", "gallery"].includes(String(item.kind || "").toLowerCase())).length
  const floorplans = list(property.floorplan_urls).length + media.filter((item) => item.property_id === property.id && String(item.kind || "").toLowerCase() === "floorplan").length
  const description = text(property.description)
  const checks: ChecklistItem[] = [
    { id: "title", label: "Titlu clar", ok: text(property.title).length >= 8, fix: "Adauga un titlu descriptiv de minimum 8 caractere." },
    { id: "pricing", label: "Pret si moneda", ok: Number(property.price || 0) > 0 && Boolean(text(property.currency || "EUR")), fix: "Completeaza pretul si moneda." },
    { id: "location", label: "Localizare", ok: Boolean(text(property.city) && text(property.address || property.county)), fix: "Completeaza orasul si adresa/judetul." },
    { id: "specs", label: "Specificatii", ok: Number(property.area_sqm || property.surface || 0) > 0 && Number(property.rooms || 0) > 0, fix: "Adauga suprafata si numarul de camere." },
    { id: "description", label: "Descriere comerciala", ok: description.length >= 120, fix: "Scrie o descriere de minimum 120 caractere." },
    { id: "cover", label: "Cover image", ok: hasCover(property, media), fix: "Seteaza o imagine cover in Media." },
    { id: "gallery", label: "Galerie minima", ok: galleryCount >= 3, fix: "Adauga cel putin 3 imagini in galerie." },
    { id: "seo", label: "SEO", ok: text(property.meta_title).length >= 20 && text(property.meta_description).length >= 50, fix: "Completeaza meta title si meta description." },
    { id: "ownership", label: "Proprietar si agent", ok: Boolean(text(property.owner_email) && text(property.agent_email)), fix: "Completeaza owner_email si agent_email." },
    { id: "floorplan", label: "Plan sau justificare", ok: floorplans > 0 || list(property.amenities).length >= 3, fix: "Adauga floorplan sau cel putin 3 amenities relevante." },
  ]
  const passed = checks.filter((item) => item.ok).length
  return {
    checks,
    passed,
    total: checks.length,
    score: Math.round((passed / checks.length) * 100),
    ready: passed === checks.length,
    missing: checks.filter((item) => !item.ok),
  }
}
