"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Menu, UserRound, X } from "lucide-react"
import ThemeToggle from "./ThemeToggle"
import { COMPARE_KEY, FAVORITES_KEY, readStoredIds, subscribeClientPreferences } from "@/lib/client-preferences"

const links = [
  { href: "/", label: "Acasa" },
  { href: "/proprietati", label: "Proprietati" },
  { href: "/despre", label: "Despre" },
  { href: "/zone", label: "Zone" },
  { href: "/contact", label: "Contact" },
  { href: "/comparare", label: "Comparare" },
  { href: "/favorite", label: "Favorite" },
  { href: "/portal", label: "Portal" },
]

function labelWithCount(href: string, label: string, favoriteCount: number, compareCount: number) {
  if (href === "/favorite") return favoriteCount > 0 ? `${label} (${favoriteCount})` : label
  if (href === "/comparare") return compareCount > 0 ? `${label} (${compareCount})` : label
  return label
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [compareCount, setCompareCount] = useState(0)

  useEffect(() => {
    const sync = () => {
      setFavoriteCount(readStoredIds(FAVORITES_KEY).length)
      setCompareCount(readStoredIds(COMPARE_KEY).length)
    }
    sync()
    return subscribeClientPreferences(sync)
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-bg-surface bg-bg-secondary/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4">
        <Link href="/" className="shrink-0 text-xl font-bold tracking-tight">
          <span className="text-accent">HQS</span><span className="text-text-primary">imobiliare</span>
        </Link>

        <nav className="hidden flex-1 justify-center gap-6 text-sm font-medium text-text-muted lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} prefetch={false} className="hover:text-accent transition-colors">
              {labelWithCount(link.href, link.label, favoriteCount, compareCount)}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <ThemeToggle />
          <Link href="/login" prefetch={false} className="inline-flex items-center gap-2 rounded-xl border border-bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-all hover:border-accent hover:text-accent">
            <UserRound className="h-4 w-4" aria-hidden />
            Login portal
          </Link>
          <Link href="/proprietati" prefetch={false} className="rounded-xl border border-bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-all hover:border-accent hover:text-accent">
            Vezi oferte
          </Link>
          <Link href="/comparare" prefetch={false} className="rounded-xl border border-bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-all hover:border-accent hover:text-accent">
            Comparare {compareCount > 0 ? `(${compareCount})` : ""}
          </Link>
          <a href="tel:+40700000000" className="rounded-xl border border-accent px-4 py-2 text-sm font-medium text-accent transition-all hover:bg-accent hover:text-bg-primary">
            Suna acum
          </a>
          <Link href="/favorite" prefetch={false} className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-bg-primary transition-opacity hover:opacity-90">
            Favorite {favoriteCount > 0 ? `(${favoriteCount})` : ""}
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button className="text-text-primary" onClick={() => setMenuOpen(!menuOpen)} aria-label="Deschide meniul">
            {menuOpen ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="flex flex-col gap-4 border-t border-bg-surface bg-bg-card px-4 py-4 text-sm lg:hidden">
          {links.map((link) => (
            <Link key={link.href} href={link.href} prefetch={false} className="text-text-muted hover:text-accent" onClick={() => setMenuOpen(false)}>
              {labelWithCount(link.href, link.label, favoriteCount, compareCount)}
            </Link>
          ))}
          <Link href="/contact" prefetch={false} className="rounded-xl bg-accent py-2 text-center font-semibold text-bg-primary" onClick={() => setMenuOpen(false)}>
            Contact
          </Link>
          <Link href="/login" prefetch={false} className="rounded-xl border border-bg-surface py-2 text-center font-semibold text-text-primary" onClick={() => setMenuOpen(false)}>
            Login portal
          </Link>
        </div>
      )}
    </header>
  )
}
