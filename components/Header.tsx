"use client"
import { useState } from "react"
import Link from "next/link"

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <header className="bg-bg-secondary border-b border-bg-surface sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="text-accent">HQS</span><span className="text-text-primary">imobiliare</span>
        </Link>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-text-muted">
          <Link href="/" className="hover:text-accent transition-colors">Acasă</Link>
          <Link href="#proprietati" className="hover:text-accent transition-colors">Proprietăți</Link>
          <Link href="#contact" className="hover:text-accent transition-colors">Contact</Link>
        </nav>
        <div className="hidden md:flex gap-3">
          <a href="#proprietati" className="border border-bg-surface text-text-primary px-4 py-2 rounded-lg text-sm font-medium hover:border-accent hover:text-accent transition-all">
            Proprietăți
          </a>
          <a href="#contact" className="bg-accent text-bg-primary px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-400 transition-colors">
            Contact
          </a>
        </div>
        <button className="md:hidden text-text-primary" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-bg-card border-t border-bg-surface px-4 py-4 flex flex-col gap-4 text-sm">
          <Link href="/" className="text-text-muted hover:text-accent" onClick={() => setMenuOpen(false)}>Acasă</Link>
          <Link href="#proprietati" className="text-text-muted hover:text-accent" onClick={() => setMenuOpen(false)}>Proprietăți</Link>
          <Link href="#contact" className="text-text-muted hover:text-accent" onClick={() => setMenuOpen(false)}>Contact</Link>
          <a href="#contact" className="bg-accent text-bg-primary text-center py-2 rounded-lg font-semibold">Contact</a>
        </div>
      )}
    </header>
  )
}
