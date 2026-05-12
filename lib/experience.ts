import type { Property } from "@/lib/supabase"

export type BuyerProfile = {
  budget: number
  area: string
  rooms: number
  purpose: "locuire" | "investitie" | "familie" | "birou"
}

export const zoneProfiles = [
  {
    slug: "pipera",
    name: "Pipera",
    headline: "Proprietati pentru familii active si expati",
    description: "Pipera este potrivita pentru clienti care vor acces rapid la scoli private, birouri, comunitati noi si case cu suprafete generoase.",
    avgPrice: 2190,
    demand: "Ridicata",
    strengths: ["scoli private", "birouri", "ansambluri noi", "acces nord"],
  },
  {
    slug: "floreasca",
    name: "Floreasca",
    headline: "Apartamente premium aproape de parc si business",
    description: "Floreasca ramane una dintre cele mai bune zone pentru apartamente premium, chirii solide si cerere constanta.",
    avgPrice: 3010,
    demand: "Foarte ridicata",
    strengths: ["parc", "restaurante", "birouri", "lichiditate buna"],
  },
  {
    slug: "corbeanca",
    name: "Corbeanca",
    headline: "Case cu teren si ritm mai linistit",
    description: "Corbeanca se potriveste clientilor care vor curte, intimitate si o alternativa mai aerisita la oras.",
    avgPrice: 1680,
    demand: "Stabila",
    strengths: ["teren", "case noi", "liniste", "familii"],
  },
  {
    slug: "bucuresti-nord",
    name: "Bucuresti Nord",
    headline: "Portofoliu mixt cu acces bun la zonele premium",
    description: "Zona de nord concentreaza cererea pentru vile, apartamente premium si proprietati de investitie usor de inchiriat.",
    avgPrice: 2450,
    demand: "Ridicata",
    strengths: ["transport", "business", "educatie", "servicii"],
  },
]

export const documentChecklist = [
  "extras de carte funciara actualizat",
  "act de proprietate si istoric tranzactie",
  "certificat energetic",
  "situatie fiscala si cadastru",
  "reguli asociatie / urbanism, dupa caz",
]

export function scoreProperty(property: Property, profile: BuyerProfile) {
  let score = 38
  const reasons: string[] = []

  if (property.price <= profile.budget) {
    score += 24
    reasons.push("se incadreaza in buget")
  } else {
    score -= Math.min(18, Math.round(((property.price - profile.budget) / Math.max(profile.budget, 1)) * 30))
  }

  if (profile.area === "orice" || property.city.toLowerCase().includes(profile.area.toLowerCase())) {
    score += 18
    reasons.push("zona este potrivita")
  }

  if (property.rooms >= profile.rooms) {
    score += 12
    reasons.push("numarul de camere acopera cerinta")
  }

  if (profile.purpose === "investitie" && property.area_sqm > 0 && property.price / property.area_sqm < 2600) {
    score += 10
    reasons.push("pret/mp competitiv pentru investitie")
  }

  if (profile.purpose === "familie" && property.rooms >= 3 && property.parking_spots > 0) {
    score += 10
    reasons.push("configuratie buna pentru familie")
  }

  if (property.featured) {
    score += 8
    reasons.push("selectata de echipa HQS")
  }

  return { score: Math.max(1, Math.min(100, score)), reasons: reasons.slice(0, 4) }
}

export function estimateMonthlyPayment(price: number, advancePercent = 20, years = 25) {
  const principal = price * (1 - advancePercent / 100)
  return Math.round(principal / (years * 12))
}
