"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { usePortal } from "@/components/portal/PortalContext"
import { LoadingState } from "@/components/admin/ui"
import type { ReactNode } from "react"

export const PORTAL_TABS = [
  { key: "profil", route: "profile", label: "Profil" },
  { key: "favorite", route: "favorites", label: "Favorite" },
  { key: "recomandari", route: "recommendations", label: "Recomandări" },
  { key: "documente", route: "documents", label: "Documente" },
  { key: "oferte", route: "offers", label: "Oferte" },
  { key: "programari", route: "appointments", label: "Programări" },
  { key: "activitate", route: "activity", label: "Activitate" },
  { key: "securitate", route: "security", label: "Securitate" },
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

export default function PortalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, documents, favorites, offers, appointments, loading, message } = usePortal()
  const [toastVisible, setToastVisible] = useState(false)

  const segment = pathname?.split("/").filter(Boolean)[1] || ""
  const activeTab = routeToTab[String(segment).toLowerCase()] || "profil"


  const firstName = user?.email
    ? user.email.split("@")[0].charAt(0).toUpperCase() + user.email.split("@")[0].slice(1)
    : null
  const displayName = firstName || user?.email || ""

  async function logout() {
    const { supabase } = await import("@/lib/supabase")
    await supabase.auth.signOut()
    router.push("/portal")
  }

  // Toast auto-dismiss
  useEffect(() => {
    if (message) {
      setToastVisible(true)
      const t = setTimeout(() => setToastVisible(false), 4500)
      return () => clearTimeout(t)
    }
    setToastVisible(false)
  }, [message])

  const isLoading = loading

  return (
    <div className="relative min-h-screen bg-bg-primary">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* ── Toast ── */}
        {toastVisible && message && (
          <div className="absolute right-4 top-6 z-50 animate-in fade-in slide-in-from-top-2 rounded-xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm font-medium text-accent backdrop-blur-sm">
            {message}
          </div>
        )}

        {/* ── Top bar ── */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-lg font-black tracking-tight text-text-primary">
            HQS<span className="text-accent">.</span>
          </Link>
          <div className="flex items-center gap-3">
            {user?.email && (
              <span className="max-w-[160px] truncate text-sm text-text-muted sm:max-w-xs">
                {user.email}
              </span>
            )}
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-bg-surface px-3 py-1.5 text-xs font-bold text-text-muted transition hover:border-accent hover:text-accent"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">Deconectare</span>
            </button>
          </div>
        </div>

        {/* ── Welcome header ── */}
        <div className="mb-6">
          <span className="inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
            Cont client
          </span>
          <h1 className="mt-2 text-2xl font-black text-text-primary sm:text-3xl">
            Bun venit, {displayName}!
          </h1>
          <p className="mt-1 text-sm text-text-muted">Workspace-ul tău personal HQS</p>
        </div>

        {/* ── Stats row ── */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Favorite"
            value={favorites.length}
            href="/portal/favorites"
          />
          <StatCard
            label="Documente"
            value={documents.length}
            href="/portal/documents"
          />
          <StatCard
            label="Oferte"
            value={offers.length}
            href="/portal/offers"
          />
          <StatCard
            label="Programări"
            value={appointments.length}
            href="/portal/appointments"
          />
        </div>

        {/* ── Tab navigation ── */}
        <nav className="-mx-4 mb-6 overflow-x-auto px-4" aria-label="Portal navigare">
          <div className="flex gap-2">
            {PORTAL_TABS.map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <Link
                  key={tab.key}
                  href={tab.key === "profil" ? "/portal/profile" : `/portal/${tab.route}`}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                    isActive
                      ? "bg-accent text-bg-primary"
                      : "bg-bg-card text-text-muted hover:bg-bg-surface"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* ── Content area ── */}
        {isLoading ? (
          <LoadingState message="Se încarcă datele..." />
        ) : (
          <div>{children}</div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string
  value: string | number
  href?: string
}) {
  const inner = (
    <div className="rounded-xl border border-bg-surface bg-bg-card p-3.5">
      <p className="text-xs font-bold uppercase text-text-muted">{label}</p>
      <p className="mt-1 text-xl font-black text-accent">{value}</p>
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
