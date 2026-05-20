"use client"

import { AppShell } from "@/components/admin/app-shell"

const tasks = ["Meta title si description", "Open Graph pentru proprietati", "Schema JSON-LD", "Sitemap zone + proprietati"]

export default function AdminSeoPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl border border-bg-surface bg-gradient-to-br from-bg-secondary via-bg-secondary to-bg-primary p-6">
          <h1 className="text-3xl font-semibold">SEO</h1>
          <p className="mt-2 max-w-2xl text-text-muted">Control pentru meta date, pagini programatice pe zone si indexare.</p>
        </section>
        <section className="rounded-2xl border border-bg-surface bg-bg-secondary p-5">
          <h2 className="text-xl font-semibold">Checklist SEO</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {tasks.map((task) => <div key={task} className="rounded-xl bg-bg-primary p-4 text-sm text-text-muted">{task}</div>)}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
