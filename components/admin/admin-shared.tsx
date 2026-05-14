import {
  Activity,
  BarChart3,
  Building2,
  CalendarClock,
  ClipboardList,
  FileText,
  Gauge,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UserRoundCog,
  Users,
} from "lucide-react"

export type Row = Record<string, any>
export type View = "overview" | "crm" | "properties" | "appointments" | "operations" | "content" | "reports" | "users" | "tools" | "settings" | "audit"
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

export const nav: Array<{ group: string; items: Array<{ id: View; label: string; icon: any }> }> = [
  { group: "Business", items: [{ id: "overview", label: "Command", icon: LayoutDashboard }, { id: "crm", label: "CRM", icon: Users }, { id: "properties", label: "Proprietati", icon: Building2 }, { id: "appointments", label: "Programari", icon: CalendarClock }] },
  { group: "Platforma", items: [{ id: "operations", label: "Operatiuni", icon: ClipboardList }, { id: "content", label: "Continut", icon: FileText }, { id: "reports", label: "Rapoarte", icon: BarChart3 }] },
  { group: "Control", items: [{ id: "users", label: "Echipa", icon: UserRoundCog }, { id: "tools", label: "Instrumente", icon: Gauge }, { id: "settings", label: "Setari", icon: Settings }, { id: "audit", label: "Audit", icon: ShieldCheck }] },
]

export const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "CLOSED", "LOST"]
export const appointmentStatuses = ["REQUESTED", "CONFIRMED", "DONE", "CANCELLED"]
export const propertyStatuses = ["PUBLISHED", "DRAFT", "SOLD", "RENTED"]
export const propertyTypes = ["APARTMENT", "HOUSE", "VILLA", "LAND", "COMMERCIAL"]

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json")
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 12000)
  try {
    const res = await fetch(appUrl(path), { ...init, headers, credentials: "same-origin", signal: init?.signal || controller.signal })
    const type = res.headers.get("Content-Type") || ""
    const body = type.includes("application/json") ? await res.json().catch(() => ({})) : await res.text()
    if (!res.ok) throw new Error(typeof body === "object" && body?.error ? String(body.error) : "Cererea a esuat")
    return body as T
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw new Error("API-ul admin nu a raspuns la timp.")
    throw err
  } finally {
    window.clearTimeout(timeout)
  }
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

export const dashboardIcons = { Activity, BarChart3, Building2, FileText, Users }
