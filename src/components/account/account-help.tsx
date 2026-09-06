import type { ReactNode } from 'react'

/** Secondary explanations stay available without preceding the user's task. */
export function AccountHelp({ title, children }: { title: string; children: ReactNode }) {
  return <details className="mb-6 rounded-xl border bg-background">
    <summary className="min-h-12 cursor-pointer rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{title}</summary>
    <div className="border-t p-4 sm:p-5">{children}</div>
  </details>
}
