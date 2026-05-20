"use client"

import { AppShell } from "@/components/admin/app-shell"

const cards = [
  ["Conversii", "28%", "Lead-uri care ajung la vizionare"],
  ["Timp raspuns", "24h", "Obiectiv operational pentru lead-uri noi"],
  ["Inventar premium", "12", "Proprietati active in portofoliu"],
]

export default function AdminAnalyticsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl border border-bg-surface bg-gradient-to-br from-bg-secondary via-bg-secondary to-bg-primary p-6">
          <h1 className="text-3xl font-semibold">Analytics</h1>
          <p className="mt-2 max-w-2xl text-text-muted">Trafic, conversii si performanta comerciala. Acest ecran este pregatit pentru conectarea la rapoartele live.</p>
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          {cards.map(([label, value, text]) => <div key={label} className="rounded-2xl border border-bg-surface bg-bg-secondary p-5"><p className="text-xs font-bold uppercase tracking-widest text-text-muted">{label}</p><p className="mt-2 text-3xl font-black text-accent">{value}</p><p className="mt-2 text-sm text-text-muted">{text}</p></div>)}
        </section>
        <section className="rounded-2xl border border-bg-surface bg-bg-secondary p-5">
          <h2 className="text-xl font-semibold">Urmatoarele rapoarte</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {["Lead source attribution", "Top zone dupa cerere", "Performanta agenti", "Owner reports"].map((item) => <div key={item} className="rounded-xl bg-bg-primary p-4 text-sm text-text-muted">{item}</div>)}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
