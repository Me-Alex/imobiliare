"use client"

import Link from "next/link"

const items = [
  ["Dashboard", "/admin/dashboard"],
  ["Proprietati", "/admin/proprietati"],
  ["Lead-uri", "/admin/leaduri"],
  ["Clienti", "/admin/clienti"],
  ["Programari", "/admin/programari"],
  ["Agenti", "/admin/agenti"],
  ["SEO", "/admin/seo"],
  ["Analytics", "/admin/analytics"],
  ["Setari", "/admin/setari"],
  ["Continut", "/admin/continut"],
]

export function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-2 border-r border-bg-surface bg-bg-secondary p-4 shadow-[0_0_40px_rgba(0,0,0,0.18)] lg:flex">
      <div className="mb-4 rounded-2xl border border-bg-surface bg-gradient-to-br from-bg-primary to-bg-secondary p-4">
        <div className="text-lg font-semibold">HQS Admin</div>
        <div className="text-xs text-text-muted">Premium control panel</div>
        <div className="mt-3 flex gap-2 text-[11px]">
          <span className="rounded-full border border-bg-surface px-2 py-1">Live</span>
          <span className="rounded-full border border-bg-surface px-2 py-1">CRM</span>
          <span className="rounded-full border border-bg-surface px-2 py-1">Ops</span>
        </div>
      </div>
      {items.map(([label, href]) => (
        <Link key={href} href={href} className="rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-bg-primary/70">
          {label}
        </Link>
      ))}
    </aside>
  )
}
