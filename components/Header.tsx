"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import ThemeToggle from "./ThemeToggle"

const links = [
  { href: "/", label: "Acasa" },
  { href: "/proprietati", label: "Proprietati" },
  { href: "/despre", label: "Despre" },
  { href: "/contact", label: "Contact" },
  { href: "/comparare", label: "Comparare" },
  { href: "/favorite", label: "Favorite" },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [compareCount, setCompareCount] = useState(0)

  useEffect(() => {
    const sync = () => {
      try {
        setFavoriteCount(JSON.parse(localStorage.getItem("hq-favorites") || "[]").length)
        setCompareCount(JSON.parse(localStorage.getItem("hq-compare") || "[]").length)
      } catch {
        setFavoriteCount(0)
        setCompareCount(0)
      }
    }
    sync()
    window.addEventListener("storage", sync)
    return () => window.removeEventListener("storage", sync)
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-bg-surface bg-bg-secondary/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="text-accent">HQS</span><span className="text-text-primary">imobiliare</span>
        </Link>

        <nav className="hidden md:flex gap-8 text-sm font-medium text-text-muted">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-accent transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Link href="/proprietati" className="border border-bg-surface text-text-primary px-4 py-2 rounded-lg text-sm font-medium hover:border-accent hover:text-accent transition-all">
            Vezi oferte
          </Link>
          <Link href="/comparare" className="border border-bg-surface text-text-primary px-4 py-2 rounded-lg text-sm font-medium hover:border-accent hover:text-accent transition-all">
            Comparare {compareCount > 0 ? `(${compareCount})` : ''}
          </Link>
          <a href="tel:+40700000000" className="border border-accent text-accent px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent hover:text-bg-primary transition-all">
            Sună acum
          </a>
          <Link href="/contact" className="bg-accent text-bg-primary px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
            Contact {favoriteCount > 0 ? `(${favoriteCount})` : ''}
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button className="text-text-primary" onClick={() => setMenuOpen(!menuOpen)} aria-label="Deschide meniul">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-bg-card border-t border-bg-surface px-4 py-4 flex flex-col gap-4 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-text-muted hover:text-accent" onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Link href="/contact" className="bg-accent text-bg-primary text-center py-2 rounded-lg font-semibold" onClick={() => setMenuOpen(false)}>
            Contact
          </Link>
        </div>
      )}
    </header>
  )
}
