import { supabase } from "@/lib/supabase"

export type Row = Record<string, any>
export type View =
  | "overview"
  | "properties"
  | "listings"
  | "media"
  | "crm"
  | "clients"
  | "appointments"
  | "calendar"
  | "agents"
  | "transactions"
  | "accounting"
  | "maintenance"
  | "documents"
  | "marketing"
  | "operations"
  | "bulk"
  | "integrations"
  | "content"
  | "reports"
  | "ownerPortal"
  | "analytics"
  | "compliance"
  | "users"
  | "tools"
  | "settings"
  | "audit"
export type ModuleType = "payment_plans" | "projects" | "team_users" | "owners" | "documents" | "notifications" | "activities"

export const defaultCore = { leads: [] as Row[], properties: [] as Row[], appointments: [] as Row[], audit: [] as Row[] }
export const defaultModules = {
  payment_plans: [] as Row[],
  projects: [] as Row[],
  team_users: [] as Row[],
  owners: [] as Row[],
  documents: [] as Row[],
  notifications: [] as Row[],
  activities: [] as Row[],
  settings: { agency: "HQS Imobiliare", commission: 3, target: 500000, vat: 19, theme: "system" } as Row,
}

export const nav: Array<{ group: string; items: Array<{ id: View; label: string; mark: string }> }> = [
  {
    group: "Comanda",
    items: [
      { id: "overview", label: "Panou principal", mark: "D" },
      { id: "properties", label: "Proprietati", mark: "P" },
      { id: "listings", label: "Anunturi", mark: "L" },
      { id: "media", label: "Media", mark: "IMG" },
      { id: "crm", label: "Leaduri CRM", mark: "CRM" },
      { id: "clients", label: "Clienti", mark: "CL" },
      { id: "appointments", label: "Vizionari", mark: "T" },
      { id: "calendar", label: "Calendar", mark: "CAL" },
    ],
  },
  {
    group: "Operatiuni",
    items: [
      { id: "agents", label: "Agenti", mark: "AG" },
      { id: "transactions", label: "Tranzactii", mark: "TR" },
      { id: "accounting", label: "Contabilitate", mark: "EUR" },
      { id: "maintenance", label: "Mentenanta", mark: "M" },
      { id: "documents", label: "Documente", mark: "DOC" },
      { id: "marketing", label: "Marketing", mark: "MK" },
      { id: "operations", label: "Back office", mark: "BO" },
      { id: "bulk", label: "Operatiuni bulk", mark: "CSV" },
    ],
  },
  {
    group: "Control",
    items: [
      { id: "integrations", label: "Integrari", mark: "API" },
      { id: "reports", label: "Rapoarte", mark: "R" },
      { id: "analytics", label: "Analitice", mark: "AN" },
      { id: "ownerPortal", label: "Proprietari", mark: "OWN" },
      { id: "compliance", label: "Conformitate", mark: "CO" },
      { id: "content", label: "Continut", mark: "CMS" },
      { id: "users", label: "Roluri", mark: "RBAC" },
      { id: "tools", label: "Instrumente", mark: "TL" },
      { id: "settings", label: "Setari", mark: "S" },
      { id: "audit", label: "Audit", mark: "AUD" },
    ],
  },
]

export const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "CLOSED", "LOST"]
export const appointmentStatuses = ["REQUESTED", "CONFIRMED", "DONE", "CANCELLED"]
export const propertyStatuses = ["PUBLISHED", "DRAFT", "SOLD", "RENTED"]
export const propertyTypes = ["APARTMENT", "HOUSE", "VILLA", "LAND", "COMMERCIAL"]

export const statusLabels: Record<string, string> = {
  ACCEPTED: "Acceptat",
  ACTIVE: "Activ",
  APPROVED: "Aprobat",
  AVAILABLE: "Disponibil",
  CANCELLED: "Anulat",
  CLOSED: "Inchis",
  CONFIRMED: "Confirmat",
  CONTACTED: "Contactat",
  DONE: "Finalizat",
  DRAFT: "Draft",
  EXPIRED: "Expirat",
  FAILED_CONFIG: "Configurare lipsa",
  FAILED_PROVIDER: "Eroare provider",
  HIGH: "Ridicat",
  INACTIVE: "Inactiv",
  LOST: "Pierdut",
  MEDIUM: "Mediu",
  NEEDS_ALT: "Necesita text alternativ",
  NEGOTIATING: "Negociere",
  NEW: "Nou",
  OPEN: "Deschis",
  PAID: "Platit",
  PENDING: "In asteptare",
  PUBLISHED: "Publicat",
  QUALIFIED: "Calificat",
  QUEUED: "In coada",
  REJECTED: "Respins",
  RENTED: "Inchiriat",
  REQUESTED: "Solicitat",
  RETRYING: "Se reincerca",
  SENT: "Trimis",
  SIGNED: "Semnat",
  SOLD: "Vandut",
  SUBMITTED: "Trimis",
  UNKNOWN: "Necunoscut",
  VALID: "Valid",
  VOID: "Anulat contabil",
}

export const propertyTypeLabels: Record<string, string> = {
  APARTMENT: "Apartament",
  HOUSE: "Casa",
  VILLA: "Vila",
  LAND: "Teren",
  COMMERCIAL: "Spatiu comercial",
}

export const fieldLabels: Record<string, string> = {
  action: "actiune",
  address: "adresa",
  advance: "avans",
  agent_email: "email agent",
  agency: "agentie",
  alt: "text alternativ",
  amenities: "facilitati",
  amount: "suma",
  body: "continut",
  budget: "buget",
  capacity: "capacitate",
  category: "categorie",
  channel: "canal",
  city: "oras",
  client_email: "email client",
  client_name: "nume client",
  commission: "comision",
  counter_offer: "contraoferta",
  county: "judet",
  currency: "moneda",
  description: "descriere",
  due_at: "scadenta",
  email: "email",
  ends_at: "se termina la",
  entity: "entitate",
  expires_at: "expira la",
  featured: "promovat",
  financing_status: "status finantare",
  floor: "etaj",
  floorplan_urls: "URL-uri planuri",
  full_name: "nume complet",
  gallery_urls: "URL-uri galerie",
  id: "ID",
  kind: "tip media",
  lat: "latitudine",
  lng: "longitudine",
  months: "luni",
  name: "nume",
  notes: "note",
  owner_email: "email proprietar",
  owner_name: "nume proprietar",
  period_end: "sfarsit perioada",
  period_start: "inceput perioada",
  permissions: "permisiuni",
  phone: "telefon",
  price: "pret",
  priority: "prioritate",
  property: "proprietate",
  property_id: "ID proprietate",
  purpose: "scop",
  return_url: "URL revenire",
  role: "rol",
  rooms: "camere",
  score: "scor",
  signer_email: "email semnatar",
  signer_name: "nume semnatar",
  slug: "slug",
  starts_at: "incepe la",
  status: "status",
  subject: "subiect",
  summary: "rezumat",
  target: "tinta",
  theme: "tema",
  title: "titlu",
  total: "total",
  transaction_type: "tip tranzactie",
  type: "tip",
  url: "URL",
  vat: "TVA",
  year_built: "an constructie",
  zone_slug: "slug zona",
}

export function statusLabel(value: unknown) {
  const key = String(value || "").toUpperCase()
  return statusLabels[key] || String(value || "-")
}

export function propertyTypeLabel(value: unknown) {
  const key = String(value || "").toUpperCase()
  return propertyTypeLabels[key] || String(value || "-")
}

export function fieldLabel(value: string) {
  return fieldLabels[value] || value.replace(/_/g, " ")
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json")
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`)
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 12000)
  try {
    const res = await fetch(appUrl(path), { ...init, headers, credentials: "same-origin", signal: init?.signal || controller.signal })
    const type = res.headers.get("Content-Type") || ""
    const body = type.includes("application/json") ? await res.json().catch(() => ({})) : await res.text()
    if (res.status === 401 && typeof window !== "undefined" && !window.location.pathname.includes("/admin/login")) {
      window.location.href = "/admin/login"
    }
    if (!res.ok) throw new Error(typeof body === "object" && body?.error ? String(body.error) : "Cererea a esuat")
    return body as T
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw new Error("API-ul admin nu a raspuns la timp.")
    throw err
  } finally {
    window.clearTimeout(timeout)
  }
}

export function confirmRisk(message: string) {
  return typeof window === "undefined" || window.confirm(message)
}

export function appUrl(path: string) {
  if (typeof window === "undefined") return path
  return new URL(path, window.location.origin).toString()
}

export function money(value: number | string | null | undefined, currency = "EUR") {
  return `${currency} ${Number(value || 0).toLocaleString("ro-RO")}`
}

export function date(value?: string | null, withTime = false) {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "-"
  return withTime ? d.toLocaleString("ro-RO") : d.toLocaleDateString("ro-RO")
}

export function matches(row: Row, query: string) {
  const q = query.trim().toLowerCase()
  return !q || Object.values(row).join(" ").toLowerCase().includes(q)
}

export function countBy(rows: Row[], key: string) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const value = String(row?.[key] || "neclasificat")
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})
}

export function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

export function csv(rows: Array<Array<string | number | null | undefined>>) {
  return rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")
}

export const dashboardIcons = { Activity: "A", BarChart3: "B", Building2: "P", FileText: "D", Users: "U" }
