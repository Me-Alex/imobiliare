"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

const items: Array<[string, string, string]> = [
  ["Dashboard", "/admin/dashboard", "D"],
  ["Proprietati", "/admin/proprietati", "P"],
  ["Proprietate noua", "/admin/proprietate-noua", "+"],
  ["Lead-uri", "/admin/leaduri", "L"],
  ["Clienti", "/admin/clienti", "C"],
  ["Programari", "/admin/programari", "T"],
  ["Agenti", "/admin/agenti", "A"],
  ["Continut", "/admin/continut", "W"],
  ["SEO", "/admin/seo", "S"],
  ["Analytics", "/admin/analytics", "AN"],
  ["Setari", "/admin/setari", "SET"],
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <aside className="flex w-72 shrink-0 flex-col gap-1 border-r border-bg-surface bg-bg-secondary p-4 shadow-[0_0_40px_rgba(0,0,0,0.18)]">
      <div className="mb-4 rounded-2xl border border-bg-surface bg-gradient-to-br from-bg-primary to-bg-secondary p-4">
        <Link href="/admin/dashboard" className="block" onClick={onNavigate}>
          <div className="text-lg font-semibold">HQS Admin</div>
          <div className="text-xs text-text-muted">Premium control panel</div>
        </Link>
        <div className="mt-3 flex gap-2 text-[11px]">
          <span className="rounded-full border border-bg-surface px-2 py-1">Live</span>
          <span className="rounded-full border border-bg-surface px-2 py-1">CRM</span>
          <span className="rounded-full border border-bg-surface px-2 py-1">Ops</span>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {items.map(([label, href, mark]) => {
          const isActive = pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-accent/10 font-semibold text-accent"
                  : "text-text-primary hover:bg-bg-primary/70"
              }`}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
                isActive ? "bg-accent text-bg-primary" : "bg-bg-primary text-text-muted"
              }`}>
                {mark}
              </span>
              <span className="truncate">{label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="mt-2 rounded-xl border border-bg-surface bg-bg-primary/50 p-3">
        <p className="text-xs text-text-muted">HQS Imobiliare v1.0</p>
        <p className="mt-1 text-[11px] text-text-muted">Conectat la Supabase + Cloudflare</p>
      </div>
    </aside>
  )
}
