"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { Heart, Menu, Phone, Scale, Search, UserRound, X } from "lucide-react"
import ThemeToggle from "./ThemeToggle"
import { COMPARE_KEY, FAVORITES_KEY, readStoredIds, subscribeClientPreferences } from "@/lib/client-preferences"
import { siteConfig } from "@/lib/site-config"
import { supabase } from "@/lib/supabase"

const links = [
  { href: "/", label: "Acasa" },
  { href: "/proprietati", label: "Proprietati" },
  { href: "/zone", label: "Zone" },
  { href: "/despre", label: "Despre" },
  { href: "/contact", label: "Contact" },
]

function labelWithCount(href: string, label: string, favoriteCount: number, compareCount: number) {
  if (href === "/favorite") return favoriteCount > 0 ? `${label} (${favoriteCount})` : label
  if (href === "/comparare") return compareCount > 0 ? `${label} (${compareCount})` : label
  return label
}

export default function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [compareCount, setCompareCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const sync = () => {
      setFavoriteCount(readStoredIds(FAVORITES_KEY).length)
      setCompareCount(readStoredIds(COMPARE_KEY).length)
    }
    sync()
    return subscribeClientPreferences(sync)
  }, [])

  useEffect(() => {
    let cancelled = false

    const load = async (accessToken = "") => {
      if (cancelled) return
      if (!accessToken) {
        setUnreadCount(0)
        return
      }

      const response = await fetch("/api/client/notifications?unread=1", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => null)

      if (!response?.ok) return
      const body = await response.json().catch(() => ({}))
      if (!cancelled) setUnreadCount(Number(body.unread || 0))
    }

    supabase.auth.getSession().then(({ data }) => load(data.session?.access_token || ""))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => load(session?.access_token || ""))

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-bg-surface/80 bg-bg-card/92 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-5 px-4 py-3">
        <Link href="/" className="group shrink-0" aria-label="HQS Imobiliare acasa">
          <span className="block text-2xl font-black leading-none tracking-normal text-accent">HQS</span>
          <span className="block text-xs font-bold uppercase tracking-[0.24em] text-text-primary">Imobiliare</span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 text-sm font-bold text-text-muted lg:flex">
          {links.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                className={`rounded-md px-3 py-2 transition-colors ${active ? "bg-bg-secondary text-text-primary" : "hover:bg-bg-secondary hover:text-text-primary"}`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <ThemeToggle />
          <IconLink href="/proprietati" label="Cauta proprietati" icon={<Search className="h-4 w-4" aria-hidden />} />
          <IconLink href="/comparare" label={`Comparare${compareCount > 0 ? ` (${compareCount})` : ""}`} icon={<Scale className="h-4 w-4" aria-hidden />} />
          <IconLink href="/favorite" label={`Favorite${favoriteCount > 0 ? ` (${favoriteCount})` : ""}`} icon={<Heart className="h-4 w-4" aria-hidden />} />
          <IconLink href="/portal" label="Portal Client" icon={<UserRound className="h-4 w-4" aria-hidden />} badge={unreadCount} />
          <a
            href="/owner"
            className="hidden xl:inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md border border-bg-surface px-3 py-2 text-xs font-black text-text-muted transition hover:border-accent hover:text-accent"
            title="Portal Proprietar — statusul listingului tau"
          >
            Portal Proprietar
          </a>
          <Link
            href={siteConfig.contact.phoneHref}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-black text-bg-primary transition hover:opacity-90"
          >
            <Phone className="h-4 w-4" aria-hidden />
            Solicita apel
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-bg-surface bg-bg-card text-text-primary"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Inchide meniul" : "Deschide meniul"}
          >
            {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-bg-surface bg-bg-card px-4 py-4 text-sm lg:hidden">
          <nav className="grid gap-2">
            {[...links, { href: "/comparare", label: "Comparare" }, { href: "/favorite", label: "Favorite" }].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                className="rounded-md px-3 py-2 font-bold text-text-muted hover:bg-bg-secondary hover:text-text-primary"
                onClick={() => setMenuOpen(false)}
              >
                {labelWithCount(link.href, link.label, favoriteCount, compareCount)}
              </Link>
            ))}
          </nav>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              href="/portal"
              prefetch={false}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-bg-surface font-black text-text-primary"
              onClick={() => setMenuOpen(false)}
            >
              <UserRound className="h-4 w-4" aria-hidden />
              Cont client
            </Link>
            <Link href={siteConfig.contact.phoneHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent font-black text-bg-primary">
              <Phone className="h-4 w-4" aria-hidden />
              Apel
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

function IconLink({ href, label, icon, badge }: { href: string; label: string; icon: ReactNode; badge?: number }) {
  return (
    <Link
      href={href}
      prefetch={false}
      title={label}
      aria-label={label}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-bg-surface bg-bg-card text-text-primary transition-colors hover:border-accent hover:text-accent"
    >
      {icon}
      {badge && badge > 0 && (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  )
}
