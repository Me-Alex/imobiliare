"use client"

import { useState } from "react"
import { Sidebar } from "./sidebar"

export function Topbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-30 flex min-w-0 items-center justify-between gap-3 border-b border-bg-surface bg-bg-secondary/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg border border-bg-surface p-2 lg:hidden"
            aria-label="Open menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.18em] text-text-muted">HQS Imobiliare</div>
            <div className="truncate font-semibold">Admin panel</div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden rounded-lg border border-bg-surface px-3 py-2 text-xs text-text-muted sm:inline-flex">Cloudflare ready</span>
          <span className="rounded-lg border border-bg-surface px-3 py-2 text-xs text-text-muted">Secure</span>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
