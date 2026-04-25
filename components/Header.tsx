'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <header className="bg-[#1a3c5e] text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          <span className="text-[#c9a84c]">HQS</span> Imobiliare
        </Link>
        <nav className="hidden md:flex gap-8 text-sm font-medium">
          <Link href="/" className="hover:text-[#c9a84c] transition-colors">Acasă</Link>
          <Link href="#proprietati" className="hover:text-[#c9a84c] transition-colors">Proprietăți</Link>
          <Link href="#contact" className="hover:text-[#c9a84c] transition-colors">Contact</Link>
        </nav>
        <a href="tel:+40700000000" className="hidden md:block bg-[#c9a84c] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#b8963e] transition-colors">
          Sună acum
        </a>
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-[#1a3c5e] border-t border-[#2a5c8e] px-4 py-4 flex flex-col gap-4 text-sm font-medium">
          <Link href="/" onClick={() => setMenuOpen(false)}>Acasă</Link>
          <Link href="#proprietati" onClick={() => setMenuOpen(false)}>Proprietăți</Link>
          <Link href="#contact" onClick={() => setMenuOpen(false)}>Contact</Link>
          <a href="tel:+40700000000" className="bg-[#c9a84c] text-center py-2 rounded-lg font-semibold">Sună acum</a>
        </div>
      )}
    </header>
  )
}
