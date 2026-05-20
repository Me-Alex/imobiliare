"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/admin/app-shell"
import { supabase } from "@/lib/supabase"

type Client = { id: string; full_name: string; email?: string | null; phone?: string | null; status: string; created_at: string }

export default function AdminClientsPage() {
  const [rows, setRows] = useState<Client[]>([])

  useEffect(() => {
    supabase
      .from("clients")
      .select("id, full_name, email, phone, status, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows((data || []) as Client[]))
  }, [])

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl border border-bg-surface bg-gradient-to-br from-bg-secondary via-bg-secondary to-bg-primary p-6">
          <h1 className="text-3xl font-semibold">Clienti</h1>
          <p className="mt-2 max-w-2xl text-text-muted">Profiluri, preferinte si status pentru clientii din portal.</p>
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          <Metric label="Total clienti" value={rows.length} />
          <Metric label="Activi" value={rows.filter((row) => row.status === "ACTIVE" || row.status === "CLIENT").length} />
          <Metric label="Cu email" value={rows.filter((row) => row.email).length} />
        </section>
        <section className="overflow-hidden rounded-2xl border border-bg-surface bg-bg-secondary">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-bg-primary/50"><tr><th className="px-4 py-3 text-left">Nume</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Telefon</th><th className="px-4 py-3 text-left">Status</th></tr></thead>
              <tbody>
                {rows.map((row) => <tr key={row.id} className="border-t border-bg-surface"><td className="px-4 py-3 font-semibold">{row.full_name}</td><td className="px-4 py-3">{row.email || "-"}</td><td className="px-4 py-3">{row.phone || "-"}</td><td className="px-4 py-3">{row.status}</td></tr>)}
                {!rows.length && <tr><td colSpan={4} className="px-4 py-10 text-center text-text-muted">Nu exista clienti inca.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-bg-surface bg-bg-secondary p-4"><p className="text-xs font-bold uppercase tracking-widest text-text-muted">{label}</p><p className="mt-2 text-3xl font-black text-accent">{value}</p></div>
}
