"use client"

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex min-w-0 items-center justify-between gap-3 border-b border-bg-surface bg-bg-secondary/95 px-4 py-3 backdrop-blur">
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-[0.18em] text-text-muted">HQS Imobiliare</div>
        <div className="truncate font-semibold">Admin panel</div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden rounded-lg border border-bg-surface px-3 py-2 text-xs text-text-muted sm:inline-flex">Cloudflare ready</span>
        <span className="rounded-lg border border-bg-surface px-3 py-2 text-xs text-text-muted">Secure</span>
      </div>
    </header>
  )
}
