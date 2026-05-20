"use client"

import { AppShell } from "@/components/admin/app-shell"

const agents = [
  ["Broker senior", "Listari premium, negociere, owner updates"],
  ["Buyer consultant", "Shortlist, vizionari, comparatii"],
  ["Marketing", "SEO, social, portaluri si continut"],
]

export default function AdminAgentsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl border border-bg-surface bg-gradient-to-br from-bg-secondary via-bg-secondary to-bg-primary p-6">
          <h1 className="text-3xl font-semibold">Agenti</h1>
          <p className="mt-2 max-w-2xl text-text-muted">Roluri, permisiuni si responsabilitati pentru echipa HQS.</p>
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          {agents.map(([role, text]) => <div key={role} className="rounded-2xl border border-bg-surface bg-bg-secondary p-5"><h2 className="text-lg font-semibold">{role}</h2><p className="mt-2 text-sm text-text-muted">{text}</p><button className="mt-4 rounded-xl border border-bg-surface px-4 py-2 text-sm text-text-muted">Invita agent</button></div>)}
        </section>
      </div>
    </AppShell>
  )
}
