"use client"

import { AppShell } from "@/components/admin/app-shell"

const settings = [
  ["Brand", "Nume, contact, promisiune si zone principale"],
  ["Publicare", "Checklist pentru proprietati complete"],
  ["Notificari", "Email, SMS si remindere pentru vizionari"],
  ["Securitate", "Roluri admin si audit operational"],
]

export default function AdminSettingsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl border border-bg-surface bg-gradient-to-br from-bg-secondary via-bg-secondary to-bg-primary p-6">
          <h1 className="text-3xl font-semibold">Setari</h1>
          <p className="mt-2 max-w-2xl text-text-muted">Configuratie pentru brand, reguli de publicare, notificari si securitate.</p>
        </section>
        <section className="grid gap-4 md:grid-cols-2">
          {settings.map(([title, text]) => <div key={title} className="rounded-2xl border border-bg-surface bg-bg-secondary p-5"><h2 className="text-lg font-semibold">{title}</h2><p className="mt-2 text-sm text-text-muted">{text}</p><button className="mt-4 rounded-xl border border-bg-surface px-4 py-2 text-sm text-text-muted">Configureaza</button></div>)}
        </section>
      </div>
    </AppShell>
  )
}
