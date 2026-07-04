"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { usePortal } from "@/components/portal/PortalContext"
import type { ReactNode } from "react"

export const PORTAL_TABS = [
  { key: "profil", route: "profile", label: "Profil" },
  { key: "favorite", route: "favorites", label: "Favorite" },
  { key: "recomandari", route: "recommendations", label: "Recomandari" },
  { key: "documente", route: "documents", label: "Documente" },
  { key: "oferte", route: "offers", label: "Oferte" },
  { key: "programari", route: "appointments", label: "Programari" },
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
  const { user, documents, favorites, offers, appointments } = usePortal()

  const segment = pathname?.split("/").filter(Boolean)[1] || ""
  const activeTab = routeToTab[String(segment).toLowerCase()] || "profil"
  const score = Math.min(100, 35 + favorites.length * 8 + documents.length * 10 + offers.length * 12)

  async function logout() {
    const { supabase } = await import("@/lib/supabase")
    await supabase.auth.signOut()
    router.push("/portal")
  }

  return (
    <section className="border-y border-bg-surface bg-bg-secondary">
      <div className="sticky top-0 z-30 border-b border-bg-surface bg-bg-secondary/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-black tracking-tight text-text-primary">
            HQS<span className="text-accent">.</span>
          </Link>
          <div className="flex items-center gap-4">
            {user?.email && (
              <span className="hidden text-sm text-text-muted sm:inline">{user.email}</span>
            )}
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-bg-surface px-3 py-1.5 text-xs font-bold text-text-muted transition hover:border-accent hover:text-accent"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-8">
        <div className="mb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-accent">Cont client</span>
          <h1 className="mt-2 text-3xl font-black text-text-primary md:text-4xl">Workspace personal</h1>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          <Stat label="Scor pregatire" value={`${score}/100`} />
          <Stat label="Favorite" value={favorites.length} href="/portal/favorites" />
          <Stat label="Documente" value={documents.length} href="/portal/documents" />
          <Stat label="Oferte" value={offers.length} href="/portal/offers" />
          <Stat label="Programari" value={appointments.length} href="/portal/appointments" />
        </div>

        <nav className="mb-6 -mx-4 overflow-x-auto px-4" aria-label="Portal navigare">
          <div className="flex gap-2">
            {PORTAL_TABS.map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <Link
                  key={tab.key}
                  href={tab.key === "profil" ? "/portal/profile" : `/portal/${tab.route}`}
                  className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-black transition ${
                    isActive
                      ? "border-accent bg-accent text-bg-primary"
                      : "border-bg-surface text-text-muted hover:border-accent hover:text-accent"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>
        </nav>

        <div>{children}</div>
      </div>
    </section>
  )
}

function Stat({ label, value, href }: { label: string; value: string | number; href?: string }) {
  const inner = (
    <div className="rounded-lg border border-bg-surface bg-bg-card p-4">
      <p className="text-xs font-bold uppercase text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-black text-accent">{value}</p>
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
