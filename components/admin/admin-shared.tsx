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
    group: "Command",
    items: [
      { id: "overview", label: "Dashboard", mark: "D" },
      { id: "properties", label: "Properties", mark: "P" },
      { id: "listings", label: "Listings", mark: "L" },
      { id: "media", label: "Media", mark: "IMG" },
      { id: "crm", label: "Leads CRM", mark: "CRM" },
      { id: "clients", label: "Clients", mark: "CL" },
      { id: "appointments", label: "Tours", mark: "T" },
      { id: "calendar", label: "Calendar", mark: "CAL" },
    ],
  },
  {
    group: "Operations",
    items: [
      { id: "agents", label: "Agents", mark: "AG" },
      { id: "transactions", label: "Transactions", mark: "TR" },
      { id: "accounting", label: "Accounting", mark: "EUR" },
      { id: "maintenance", label: "Maintenance", mark: "M" },
      { id: "documents", label: "Documents", mark: "DOC" },
      { id: "marketing", label: "Marketing", mark: "MK" },
      { id: "operations", label: "Back office", mark: "BO" },
      { id: "bulk", label: "Bulk ops", mark: "CSV" },
    ],
  },
  {
    group: "Control",
    items: [
      { id: "integrations", label: "Integrations", mark: "API" },
      { id: "reports", label: "Reports", mark: "R" },
      { id: "analytics", label: "Analytics", mark: "AN" },
      { id: "ownerPortal", label: "Owners", mark: "OWN" },
      { id: "compliance", label: "Compliance", mark: "CO" },
      { id: "content", label: "Content", mark: "CMS" },
      { id: "users", label: "Roles", mark: "RBAC" },
      { id: "tools", label: "Tools", mark: "TL" },
      { id: "settings", label: "Settings", mark: "S" },
      { id: "audit", label: "Audit", mark: "AUD" },
    ],
  },
]

export const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "CLOSED", "LOST"]
export const appointmentStatuses = ["REQUESTED", "CONFIRMED", "DONE", "CANCELLED"]
export const propertyStatuses = ["PUBLISHED", "DRAFT", "SOLD", "RENTED"]
export const propertyTypes = ["APARTMENT", "HOUSE", "VILLA", "LAND", "COMMERCIAL"]

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
