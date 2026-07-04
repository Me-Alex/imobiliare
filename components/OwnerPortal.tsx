"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Building2,
  ClipboardList,
  FileText,
  MapPin,
  ArrowUpRight,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import PortalAuthGateway from "@/components/PortalAuthGateway"
import { supabase } from "@/lib/supabase"

/* ─── Types ─── */

type OwnerData = {
  owner: { email: string }
  properties: Record<string, any>[]
  reports: Record<string, any>[]
  documents: Record<string, any>[]
}

/* ─── Nav config ─── */

const OWNER_TABS = [
  { key: "proprietati", label: "Proprietăți", icon: Building2 },
  { key: "rapoarte", label: "Rapoarte", icon: ClipboardList },
  { key: "documente", label: "Documente", icon: FileText },
] as const

type OwnerTabKey = (typeof OWNER_TABS)[number]["key"]

/* ─── Helpers ─── */

function formatEur(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num || 0)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—"
  try {
    return new Date(dateStr).toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

function statusBadge(status?: string): { label: string; className: string } {
  if (!status) return { label: "DRAFT", className: "bg-bg-surface text-text-muted border-bg-surface" }
  const s = status.toUpperCase()
  if (
    ["ACTIV", "ACTIVE", "PUBLICAT", "PUBLISHED", "FINALIZAT", "COMPLETAT", "SEMNAT", "APROBAT"].includes(s)
  )
    return { label: status, className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" }
  if (
    ["PENDING", "IN_LUCRU", "IN_PROGRESS", "REVIEW", "DRAFT", "EXPEDIAT", "GENERAT", "TRIMIS"].includes(s)
  )
    return { label: status, className: "bg-amber-500/10 text-amber-600 border-amber-500/20" }
  if (["EXPIRAT", "RESPINS", "ANULAT", "ERECOARE", "ESUAT", "REFUZAT"].includes(s))
    return { label: status, className: "bg-rose-500/10 text-rose-600 border-rose-500/20" }
  return { label: status, className: "bg-bg-surface text-text-muted border-bg-surface" }
}

function StatusBadge({ status }: { status?: string }) {
  const badge = statusBadge(status)
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${badge.className}`}
    >
      {badge.label}
    </span>
  )
}

/* ─── StatCard ─── */

function StatCard({
  label,
  value,
  icon,
  onClick,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-xl border border-bg-surface bg-bg-card p-4 text-left transition hover:border-accent/30 hover:shadow-md ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-text-muted">{label}</p>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-black text-accent">{value}</p>
    </button>
  )
}

/* ─── Main Component ─── */

export default function OwnerPortal() {
  const router = useRouter()
  const [token, setToken] = useState("")
  const [data, setData] = useState<OwnerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [toast, setToast] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<OwnerTabKey>("proprietati")

  /* ── Auth + data ── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const accessToken = data.session?.access_token || ""
      setToken(accessToken)
      if (accessToken) void load(accessToken)
      else setLoading(false)
    })
  }, [])

  async function load(accessToken: string) {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/owner/dashboard", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "Portalul proprietar nu s-a încărcat.")
      setData(body)
    } catch (err: any) {
      setError(err?.message || "Portalul proprietar nu s-a încărcat.")
    } finally {
      setLoading(false)
    }
  }

  /* ── Toast auto-dismiss ── */
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4500)
      return () => clearTimeout(t)
    }
  }, [toast])

  /* ── Logout ── */
  async function logout() {
    await supabase.auth.signOut()
    setToken("")
    setData(null)
    router.push("/owner")
  }

  /* ---------- Auth gate ---------- */
  if (!token) {
    return (
      <PortalAuthGateway
        redirectTo="/owner"
        onAuthenticated={(accessToken) => {
          setToken(accessToken)
          void load(accessToken)
        }}
      />
    )
  }

  const properties = data?.properties || []
  const reports = data?.reports || []
  const documents = data?.documents || []
  const ownerEmail = data?.owner?.email || ""

  const firstName = ownerEmail
    ? ownerEmail.split("@")[0].charAt(0).toUpperCase() + ownerEmail.split("@")[0].slice(1)
    : ""

  /* ── Sidebar content (shared) ── */
  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link
          href="/"
          className="text-xl font-black tracking-tight text-text-primary transition hover:opacity-80"
        >
          HQS<span className="text-accent">.</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3" aria-label="Navigare portal proprietar">
        {OWNER_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key)
                setSidebarOpen(false)
              }}
              className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-accent/10 font-bold text-accent"
                  : "text-text-muted hover:bg-bg-surface hover:text-text-primary"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-accent" />
              )}
              <Icon
                className={`h-[18px] w-[18px] shrink-0 ${
                  isActive ? "text-accent" : "text-text-muted group-hover:text-text-primary"
                }`}
                aria-hidden
              />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Bottom: email + logout */}
      <div className="shrink-0 border-t border-bg-surface px-3 py-4">
        {ownerEmail && (
          <p className="mb-2 truncate px-2 text-xs text-text-muted" title={ownerEmail}>
            {ownerEmail}
          </p>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-text-muted transition hover:bg-bg-surface hover:text-rose-500"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Deconectare
        </button>
      </div>
    </div>
  )

  /* ── Section renderers ── */

  function renderProperties() {
    if (properties.length === 0) {
      return (
        <div className="rounded-xl border border-bg-surface bg-bg-card py-16 text-center">
          <Building2 className="mx-auto h-10 w-10 text-text-muted/40" />
          <p className="mt-3 text-sm text-text-muted">Nu există proprietăți asociate acestui cont.</p>
        </div>
      )
    }
    return (
      <div className="rounded-xl border border-bg-surface bg-bg-card divide-y divide-bg-surface">
        {properties.map((p) => {
          const slug = p.slug
          const content = (
            <div className="flex items-center justify-between gap-4 py-4 px-5 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-text-primary truncate">{p.title || "Fără titlu"}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-muted">
                  {(p.city || p.zone) && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {[p.city, p.zone].filter(Boolean).join(", ")}
                    </span>
                  )}
                  <span className="font-semibold text-accent">{formatEur(p.price || 0)}</span>
                </div>
              </div>
              <StatusBadge status={p.status} />
            </div>
          )
          return slug ? (
            <Link
              key={p.id}
              href={`/proprietate/${slug}`}
              className="group flex items-center justify-between transition hover:bg-bg-primary/40"
            >
              <div className="flex flex-1 items-center justify-between">
                <div className="min-w-0 flex-1">{content}</div>
                <ArrowUpRight className="mr-5 h-4 w-4 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </Link>
          ) : (
            <div key={p.id}>{content}</div>
          )
        })}
      </div>
    )
  }

  function renderReports() {
    if (reports.length === 0) {
      return (
        <div className="rounded-xl border border-bg-surface bg-bg-card py-16 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-text-muted/40" />
          <p className="mt-3 text-sm text-text-muted">Nu există rapoarte publicate.</p>
        </div>
      )
    }
    return (
      <div className="rounded-xl border border-bg-surface bg-bg-card divide-y divide-bg-surface">
        {reports.map((r) => (
          <div
            key={r.id}
            className="flex flex-col gap-2 py-4 px-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-text-primary">{r.title || "Fără titlu"}</p>
              <p className="mt-1 text-sm text-text-muted">{r.summary || "Fără sumar."}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {r.created_at && <span className="text-xs text-text-muted">{formatDate(r.created_at)}</span>}
              <StatusBadge status={r.status} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  function renderDocuments() {
    if (documents.length === 0) {
      return (
        <div className="rounded-xl border border-bg-surface bg-bg-card py-16 text-center">
          <FileText className="mx-auto h-10 w-10 text-text-muted/40" />
          <p className="mt-3 text-sm text-text-muted">Nu există documente asociate acestui cont.</p>
        </div>
      )
    }
    return (
      <div className="rounded-xl border border-bg-surface bg-bg-card divide-y divide-bg-surface">
        {documents.map((d) => (
          <div
            key={d.id}
            className="flex flex-col gap-2 py-4 px-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-text-primary">{d.title || "Fără titlu"}</p>
              <p className="mt-1 text-sm text-text-muted">
                {d.file_url
                  ? d.file_url.split("/").pop() || "document"
                  : d.docusign_envelope_id
                    ? "DocuSign"
                    : "document privat"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {d.type && <span className="text-xs text-text-muted">{d.type}</span>}
              <StatusBadge status={d.status} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  function renderContent() {
    switch (activeTab) {
      case "proprietati":
        return renderProperties()
      case "rapoarte":
        return renderReports()
      case "documente":
        return renderDocuments()
    }
  }

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
          <p className="mt-3 text-sm text-text-muted">Se încarcă portalul proprietar...</p>
        </div>
      </div>
    )
  }

  /* ---------- Error ---------- */
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
        <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 text-center">
          <p className="text-sm font-bold text-rose-400">{error}</p>
          <button
            onClick={() => {
              setError("")
              void load(token)
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-bg-card px-4 py-2.5 text-sm font-semibold text-text-primary shadow-sm transition hover:bg-bg-surface"
          >
            Reîncearcă
          </button>
        </div>
      </div>
    )
  }

  /* ========== Full layout ========== */
  return (
    <div className="relative flex min-h-screen flex-col bg-bg-primary lg:flex-row">
      {/* ─── Toast ─── */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 rounded-xl border border-accent/20 bg-bg-card px-4 py-3 text-sm font-medium text-accent shadow-lg">
          {toast}
        </div>
      )}

      {/* ─── Mobile backdrop ─── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Mobile top bar ─── */}
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-bg-surface bg-bg-card px-4 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-text-muted transition hover:bg-bg-surface hover:text-text-primary"
          aria-label="Deschide meniu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/" className="ml-auto text-lg font-black tracking-tight text-text-primary">
          HQS<span className="text-accent">.</span>
        </Link>
        <button
          onClick={logout}
          className="ml-auto inline-flex items-center justify-center rounded-lg p-2 text-text-muted transition hover:bg-bg-surface hover:text-rose-500"
          aria-label="Deconectare"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      {/* ─── Desktop sidebar ─── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-bg-surface bg-bg-card lg:block">
        {sidebarContent}
      </aside>

      {/* ─── Mobile sidebar drawer ─── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-bg-surface bg-bg-card transition-transform duration-200 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute right-3 top-4 inline-flex items-center justify-center rounded-lg p-1.5 text-text-muted transition hover:bg-bg-surface hover:text-text-primary"
          aria-label="Închide meniu"
        >
          <X className="h-4 w-4" />
        </button>
        {sidebarContent}
      </aside>

      {/* ─── Main content area ─── */}
      <main className="flex-1 lg:pl-64">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Welcome header */}
          <div className="mb-6">
            <span className="inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
              Cont proprietar
            </span>
            <h1 className="mt-2 text-2xl font-black text-text-primary sm:text-3xl">
              Bun venit, {firstName}!
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              Gestionează proprietățile, rapoartele și documentele tale
            </p>
          </div>

          {/* Stats row */}
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard
              label="Proprietăți"
              value={properties.length}
              icon={<Building2 className="h-4 w-4 text-accent/60" />}
              onClick={() => setActiveTab("proprietati")}
            />
            <StatCard
              label="Rapoarte"
              value={reports.length}
              icon={<ClipboardList className="h-4 w-4 text-accent/60" />}
              onClick={() => setActiveTab("rapoarte")}
            />
            <StatCard
              label="Documente"
              value={documents.length}
              icon={<FileText className="h-4 w-4 text-accent/60" />}
              onClick={() => setActiveTab("documente")}
            />
          </div>

          {/* Tab content */}
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
