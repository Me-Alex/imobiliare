import type { Property, PropertyType } from "@/lib/supabase"

export type PropertyFilters = {
  q?: string
  zone?: string
  type?: string
  budget?: number
}

export type BuyerBrief = {
  budget: number
  zone: string
  rooms: number
  purpose: "locuire" | "familie" | "investitie" | "birou"
}

export const navItems = [
  { href: "/proprietati", label: "Proprietati" },
  { href: "/zone", label: "Zone" },
  { href: "/comparare", label: "Comparare" },
  { href: "/portal", label: "Portal" },
  { href: "/contact", label: "Contact" },
]

export const propertyTypeLabels: Record<PropertyType, string> = {
  APARTMENT: "Apartament",
  HOUSE: "Casa",
  VILLA: "Vila",
  LAND: "Teren",
  COMMERCIAL: "Comercial",
}

export const propertyTypes = [
  { value: "toate", label: "Toate tipurile" },
  { value: "APARTMENT", label: propertyTypeLabels.APARTMENT },
  { value: "HOUSE", label: propertyTypeLabels.HOUSE },
  { value: "VILLA", label: propertyTypeLabels.VILLA },
  { value: "LAND", label: propertyTypeLabels.LAND },
  { value: "COMMERCIAL", label: propertyTypeLabels.COMMERCIAL },
]

export const zoneGuides = [
  {
    slug: "pipera",
    name: "Pipera",
    headline: "Case, vile si apartamente pentru familii active",
    summary: "Zona buna pentru scoli private, birouri, ansambluri noi si acces rapid spre nord.",
    avgPrice: 2190,
    demand: "ridicata",
    risk: "mediu",
    strengths: ["scoli private", "birouri", "ansambluri noi", "case cu teren"],
  },
  {
    slug: "floreasca",
    name: "Floreasca",
    headline: "Apartamente premium cu lichiditate foarte buna",
    summary: "Potrivita pentru cumparatori care vor parc, restaurante, birouri si cerere constanta la revanzare.",
    avgPrice: 3010,
    demand: "foarte ridicata",
    risk: "scazut",
    strengths: ["parc", "business", "restaurante", "revanzare rapida"],
  },
  {
    slug: "bucuresti-nord",
    name: "Bucuresti Nord",
    headline: "Portofoliu mixt pentru locuire si investitie",
    summary: "Acopera zonele cautate pentru vile, apartamente mari si proprietati usor de inchiriat.",
    avgPrice: 2450,
    demand: "ridicata",
    risk: "scazut",
    strengths: ["transport", "servicii", "business", "educatie"],
  },
  {
    slug: "corbeanca",
    name: "Corbeanca",
    headline: "Case cu teren si ritm rezidential mai linistit",
    summary: "Alternativa aerisita pentru clienti care vor curte, intimitate si cost/mp mai echilibrat.",
    avgPrice: 1680,
    demand: "stabila",
    risk: "mediu",
    strengths: ["teren", "liniste", "aeroport", "familii"],
  },
]

export const servicePillars = [
  {
    title: "Portofoliu verificat",
    text: "Curatam lista de proprietati, verificam datele importante si publicam doar ofertele care pot fi explicate clar.",
  },
  {
    title: "Decizie asistata",
    text: "Fiecare client primeste comparatie, pret/mp, risc de zona, estimare de rata si urmatorul pas recomandat.",
  },
  {
    title: "CRM operational",
    text: "Lead-urile, programarile, ofertele si documentele ajung in acelasi flux pentru echipa HQS.",
  },
  {
    title: "Portal client",
    text: "Clientii isi salveaza favoritele, trimit oferte, vad documentele si pastreaza istoricul deciziilor.",
  },
]

export const workflowSteps = [
  { title: "Brief", text: "Buget, zona, criterii, finantare si termen." },
  { title: "Shortlist", text: "Proprietati filtrate cu motive clare pentru fiecare recomandare." },
  { title: "Vizionare", text: "Sloturi propuse, checklist si intrebari pregatite inainte de drum." },
  { title: "Oferta", text: "Pret recomandat, avans, clauze si spatiu de negociere." },
  { title: "Inchidere", text: "Documente, notar, follow-up si arhiva in portal." },
]

export const fallbackProperties: Property[] = [
  {
    id: "fallback-floreasca",
    title: "Apartament premium cu terasa in Floreasca",
    slug: "apartament-premium-floreasca",
    description: "Apartament luminos, compartimentare practica, terasa mare si acces rapid la parc, restaurante si birouri.",
    price: 285000,
    currency: "EUR",
    type: "APARTMENT",
    status: "PUBLISHED",
    city: "Floreasca",
    county: "Bucuresti",
    address: "Strada Rahmaninov",
    area_sqm: 92,
    rooms: 3,
    bathrooms: 2,
    parking_spots: 1,
    featured: true,
    cover_image_url: "/images/property-apartment.png",
    gallery_urls: ["/images/property-apartment.png", "/images/hqs-hero.png"],
    published_at: "2026-05-01T09:00:00.000Z",
    created_at: "2026-05-01T09:00:00.000Z",
  },
  {
    id: "fallback-pipera",
    title: "Vila noua pentru familie in Pipera",
    slug: "vila-familie-pipera",
    description: "Vila eficienta, curte privata, birou separat si acces facil la scoli private si zona de business.",
    price: 620000,
    currency: "EUR",
    type: "VILLA",
    status: "PUBLISHED",
    city: "Pipera",
    county: "Ilfov",
    address: "Erou Iancu Nicolae",
    area_sqm: 240,
    rooms: 5,
    bathrooms: 4,
    parking_spots: 2,
    featured: true,
    cover_image_url: "/images/property-villa.png",
    gallery_urls: ["/images/property-villa.png", "/images/hqs-hero.png"],
    published_at: "2026-05-02T09:00:00.000Z",
    created_at: "2026-05-02T09:00:00.000Z",
  },
  {
    id: "fallback-baneasa",
    title: "Casa renovata langa Padurea Baneasa",
    slug: "casa-renovata-baneasa",
    description: "Casa cu gradina, zona linistita, finisaje noi si spatii flexibile pentru locuire si lucru de acasa.",
    price: 445000,
    currency: "EUR",
    type: "HOUSE",
    status: "PUBLISHED",
    city: "Baneasa",
    county: "Bucuresti",
    address: "Aleea Privighetorilor",
    area_sqm: 176,
    rooms: 4,
    bathrooms: 3,
    parking_spots: 2,
    featured: false,
    cover_image_url: "/images/property-house.png",
    gallery_urls: ["/images/property-house.png", "/images/hqs-hero.png"],
    published_at: "2026-05-03T09:00:00.000Z",
    created_at: "2026-05-03T09:00:00.000Z",
  },
  {
    id: "fallback-dorobanti",
    title: "Apartament elegant in Dorobanti",
    slug: "apartament-dorobanti-elegant",
    description: "Apartament intr-un imobil boutique, aproape de cafenele, parcuri si artere centrale.",
    price: 398000,
    currency: "EUR",
    type: "APARTMENT",
    status: "PUBLISHED",
    city: "Dorobanti",
    county: "Bucuresti",
    address: "Strada Londra",
    area_sqm: 118,
    rooms: 4,
    bathrooms: 2,
    parking_spots: 1,
    featured: true,
    cover_image_url: "/images/property-apartment.png",
    gallery_urls: ["/images/property-apartment.png", "/images/hqs-hero.png"],
    published_at: "2026-05-04T09:00:00.000Z",
    created_at: "2026-05-04T09:00:00.000Z",
  },
  {
    id: "fallback-corbeanca",
    title: "Teren intravilan in Corbeanca",
    slug: "teren-corbeanca-intravilan",
    description: "Teren cu deschidere buna, utilitati in apropiere si potential pentru casa individuala.",
    price: 132000,
    currency: "EUR",
    type: "LAND",
    status: "PUBLISHED",
    city: "Corbeanca",
    county: "Ilfov",
    address: "Strada Primaverii",
    area_sqm: 760,
    rooms: 0,
    bathrooms: 0,
    parking_spots: 0,
    featured: false,
    cover_image_url: "/images/property-land.png",
    gallery_urls: ["/images/property-land.png", "/images/hqs-hero.png"],
    published_at: "2026-05-05T09:00:00.000Z",
    created_at: "2026-05-05T09:00:00.000Z",
  },
  {
    id: "fallback-commercial",
    title: "Spatiu comercial vizibil in Bucuresti Nord",
    slug: "spatiu-comercial-bucuresti-nord",
    description: "Spatiu la parter, vitrina larga, flux pietonal bun si configuratie pentru showroom sau servicii.",
    price: 510000,
    currency: "EUR",
    type: "COMMERCIAL",
    status: "PUBLISHED",
    city: "Bucuresti Nord",
    county: "Bucuresti",
    address: "Soseaua Pipera",
    area_sqm: 148,
    rooms: 3,
    bathrooms: 2,
    parking_spots: 4,
    featured: false,
    cover_image_url: "/images/property-commercial.png",
    gallery_urls: ["/images/property-commercial.png", "/images/hqs-hero.png"],
    published_at: "2026-05-06T09:00:00.000Z",
    created_at: "2026-05-06T09:00:00.000Z",
  },
]

const localTypeImages: Record<PropertyType, string> = {
  APARTMENT: "/images/property-apartment.png",
  HOUSE: "/images/property-house.png",
  VILLA: "/images/property-villa.png",
  LAND: "/images/property-land.png",
  COMMERCIAL: "/images/property-commercial.png",
}

export function propertyImage(property: Pick<Property, "type" | "cover_image_url">) {
  return property.cover_image_url || localTypeImages[property.type] || "/images/hqs-hero.png"
}

export function propertyGallery(property: Pick<Property, "type" | "cover_image_url" | "gallery_urls">) {
  const gallery = Array.isArray(property.gallery_urls) ? property.gallery_urls.filter(Boolean) : []
  return Array.from(new Set([propertyImage(property), ...gallery, "/images/hqs-hero.png"]))
}

export function formatCurrency(value: number, currency = "EUR") {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0)
}

export function pricePerSqm(property: Pick<Property, "price" | "area_sqm">) {
  if (!property.area_sqm || !property.price) return 0
  return Math.round(property.price / property.area_sqm)
}

export function getAllZones(properties: Property[]) {
  return Array.from(new Set(["Toate zonele", ...zoneGuides.map((zone) => zone.name), ...properties.map((item) => item.city).filter(Boolean)])).slice(0, 16)
}

export function filterProperties(properties: Property[], filters: PropertyFilters) {
  const query = normalize(filters.q || "")
  const zone = filters.zone && filters.zone !== "Toate zonele" ? normalize(filters.zone) : ""
  const type = filters.type && filters.type !== "toate" ? filters.type : ""
  const budget = Number(filters.budget || 0)

  return properties.filter((property) => {
    const haystack = normalize([property.title, property.description, property.city, property.address, property.type].join(" "))
    if (query && !haystack.includes(query)) return false
    if (zone && !normalize(property.city).includes(zone) && !normalize(property.address).includes(zone)) return false
    if (type && property.type !== type) return false
    if (budget > 0 && property.price > budget) return false
    return true
  })
}

export function scorePropertyForBuyer(property: Property, brief: BuyerBrief) {
  let score = 42
  const reasons: string[] = []
  if (property.price <= brief.budget) {
    score += 23
    reasons.push("se incadreaza in buget")
  }
  if (brief.zone === "orice" || normalize(property.city).includes(normalize(brief.zone))) {
    score += 18
    reasons.push("zona cautata")
  }
  if (property.rooms >= brief.rooms) {
    score += 12
    reasons.push("camere suficiente")
  }
  if (brief.purpose === "investitie" && pricePerSqm(property) < 2600) {
    score += 9
    reasons.push("pret/mp competitiv")
  }
  if (brief.purpose === "familie" && property.parking_spots > 0 && property.rooms >= 3) {
    score += 10
    reasons.push("bun pentru familie")
  }
  if (property.featured) {
    score += 7
    reasons.push("selectie HQS")
  }
  return { score: Math.max(1, Math.min(99, score)), reasons: reasons.slice(0, 4) }
}

export function calculateSimpleValuation(input: { area: number; rooms: number; zone: string; condition: string; parking: number }) {
  const zone = zoneGuides.find((item) => normalize(input.zone).includes(normalize(item.name))) || zoneGuides[2]
  const conditionFactor = input.condition === "premium" ? 1.15 : input.condition === "renovat" ? 1.07 : input.condition === "de-renovat" ? 0.88 : 1
  const roomFactor = input.rooms >= 4 ? 1.04 : input.rooms <= 1 ? 0.95 : 1
  const base = Math.max(20, input.area) * zone.avgPrice * conditionFactor * roomFactor + Math.max(0, input.parking) * 8000
  return {
    low: Math.round(base * 0.94),
    mid: Math.round(base),
    high: Math.round(base * 1.08),
    confidence: Math.min(94, 70 + Math.round(zone.avgPrice / 180)),
    zone,
  }
}

export function buildLocalOffer(input: { title: string; listPrice: number; budget: number; advance: number; days: number; risk: string }) {
  const riskFactor = input.risk === "ridicat" ? 0.91 : input.risk === "mediu" ? 0.95 : 0.98
  const base = Math.min(input.listPrice || 0, input.budget || input.listPrice || 0)
  const recommended = Math.round(base * riskFactor)
  return {
    title: input.title,
    recommended,
    advanceValue: Math.round(recommended * Math.max(1, input.advance) / 100),
    negotiationRoom: Math.max(0, Math.round((input.listPrice || 0) - recommended)),
    clauses: [
      "verificare acte inainte de avans",
      "raspuns solicitat in 48 de ore",
      `${Math.max(1, input.days)} zile pana la semnarea promisiunii`,
      input.risk === "ridicat" ? "clauza pentru remedieri tehnice" : "calendar rapid cu notarul",
    ],
  }
}

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
}
