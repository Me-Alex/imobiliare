"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LogOut,
  User,
  Heart,
  Sparkles,
  FileText,
  Tag,
  CalendarDays,
  Clock,
  Shield,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react"
import { usePortal } from "@/components/portal/PortalContext"
import { LoadingState } from "@/components/admin/ui"
import type { ReactNode } from "react"

/* ─── Tab config & exports ─── */

export const PORTAL_TABS = [
  { key: "profil", route: "profile", label: "Profil", icon: User },
  { key: "favorite", route: "favorites", label: "Favorite", icon: Heart },
  { key: "recomandari", route: "recommendations", label: "Recomandări", icon: Sparkles },
  { key: "documente", route: "documents", label: "Documente", icon: FileText },
  { key: "oferte", route: "offers", label: "Oferte", icon: Tag },
  { key: "programari", route: "appointments", label: "Programări", icon: CalendarDays },
  { key: "activitate", route: "activity", label: "Activitate", icon: Clock },
  { key: "securitate", route: "security", label: "Securitate", icon: Shield },
] as const

export type PortalTabKey = (typeof PORTAL_TABS)[number]["key"]

export const routeToTab: Record<string, PortalTabKey> = {
  profile: "profil", profil: "profil",
  favorite: "favorite", favorites: "favorite",
  recommendations: "recomandari", recomandari: "recomandari",
  documents: "documente", documente: "documente",
  offers: "oferte", oferte: "oferte",
  appointments: "programari", programari: "programari",
  activity: "activitate", activitate: "activitate",
  security: "securitate", securitate: "securitate",
}

/* ─── Main Shell ─── */

export default function PortalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, documents, favorites, offers, appointments, notifications, loading, message } = usePortal()
  const [toastVisible, setToastVisible] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const segment = pathname?.split("/").filter(Boolean)[1] || ""
  const activeTab = routeToTab[String(segment).toLowerCase()] || "profil"

  const displayName = profile?.full_name && profile.full_name !== "Client HQS"
    ? profile.full_name
    : user?.email
      ? user.email.split("@")[0].charAt(0).toUpperCase() + user.email.split("@")[0].slice(1)
      : ""

  async function logout() {
    const { supabase } = await import("@/lib/supabase")
    await supabase.auth.signOut()
    router.push("/portal")
  }

  /* Toast auto-dismiss */
  useEffect(() => {
    if (message) {
      setToastVisible(true)
      const t = setTimeout(() => setToastVisible(false), 4500)
      return () => clearTimeout(t)
    }
    setToastVisible(false)
  }, [message])

  /* Close mobile sidebar on route change */
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  /* ─── Sidebar content (shared desktop + mobile) ─── */
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

      {/* Back to site link */}
      <div className="px-3 pb-1">
        <Link href="/" className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-muted hover:text-accent transition">
          <ArrowLeft className="h-3 w-3" /> Înapoi pe site
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 px-3" aria-label="Portal navigare">
        {PORTAL_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          const href =
            tab.key === "profil" ? "/portal/profile" : `/portal/${tab.route}`

          return (
            <Link
              key={tab.key}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-accent/10 font-bold text-accent"
                  : "text-text-muted hover:bg-bg-surface hover:text-text-primary"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Left accent bar for active */}
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
              {/* Notification badge for Activitate */}
              {tab.key === "activitate" && notifications?.some((n) => n.status !== "READ" && n.status !== "read") && (
                <span className="ml-auto h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: avatar + email + logout */}
      <div className="shrink-0 border-t border-bg-surface px-3 py-4">
        {user?.email && (
          <div className="mb-2 flex items-center gap-2.5 px-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent">
              {user.email.charAt(0).toUpperCase() || "C"}
            </div>
            <p className="min-w-0 truncate text-xs text-text-muted" title={user.email}>
              {user.email}
            </p>
          </div>
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

  return (
    <div className="relative flex min-h-screen flex-col bg-bg-primary lg:flex-row">
      {/* ─── Toast ─── */}
      {toastVisible && message && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 rounded-xl border border-accent/20 bg-bg-card px-4 py-3 text-sm font-medium text-accent shadow-lg">
          {message}
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
        <Link
          href="/"
          className="ml-auto text-lg font-black tracking-tight text-text-primary"
        >
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

      {/* ─── Desktop sidebar (always visible on lg+) ─── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-bg-surface bg-bg-card lg:block">
        {sidebarContent}
      </aside>

      {/* ─── Mobile sidebar drawer ─── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-bg-surface bg-bg-card transition-transform duration-200 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute right-3 top-4 inline-flex items-center justify-center rounded-lg p-1.5 text-text-muted transition hover:bg-bg-surface hover:text-text-primary"
          aria-label="Inchide meniu"
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
              Cont client
            </span>
            <h1 className="mt-2 text-2xl font-black text-text-primary sm:text-3xl">
              Bun venit{(displayName ? `, ${displayName}` : "")}!
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              Workspace-ul tău personal HQS
            </p>
          </div>

          {/* Stats row */}
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Favorite"
              value={favorites.length}
              href="/portal/favorites"
              icon={<Heart className="h-4 w-4 text-accent/60" />}
            />
            <StatCard
              label="Documente"
              value={documents.length}
              href="/portal/documents"
              icon={<FileText className="h-4 w-4 text-accent/60" />}
            />
            <StatCard
              label="Oferte"
              value={offers.length}
              href="/portal/offers"
              icon={<Tag className="h-4 w-4 text-accent/60" />}
            />
            <StatCard
              label="Programări"
              value={appointments.length}
              href="/portal/appointments"
              icon={<CalendarDays className="h-4 w-4 text-accent/60" />}
            />
          </div>

          {/* Tab content */}
          {loading ? (
            <LoadingState message="Se încarcă datele..." />
          ) : (
            <div>{children}</div>
          )}
        </div>
      </main>
    </div>
  )
}

/* ─── StatCard with optional icon ─── */

function StatCard({
  label,
  value,
  href,
  icon,
}: {
  label: string
  value: string | number
  href?: string
  icon?: ReactNode
}) {
  const inner = (
    <div className="group rounded-xl border border-bg-surface bg-bg-card p-4 transition hover:border-accent/30 hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
          {label}
        </p>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-black text-accent">{value}</p>
    </div>
  )
  if (href) {
    return (
      <Link href={href} className="transition hover:scale-[1.02]">
        {inner}
      </Link>
    )
  }
  return inner
}
