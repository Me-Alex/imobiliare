"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/admin/app-shell"
import { supabase } from "@/lib/supabase"

type Appointment = { id: string; start_at: string; end_at: string; status: string }

export default function AdminAppointmentsPage() {
  const [rows, setRows] = useState<Appointment[]>([])

  useEffect(() => {
    supabase
      .from("appointments")
      .select("id, start_at, end_at, status")
      .order("start_at", { ascending: false })
      .then(({ data }) => setRows((data || []) as Appointment[]))
  }, [])

  const upcoming = rows.filter((row) => new Date(row.start_at).getTime() >= Date.now())

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl border border-bg-surface bg-gradient-to-br from-bg-secondary via-bg-secondary to-bg-primary p-6">
          <h1 className="text-3xl font-semibold">Programari</h1>
          <p className="mt-2 max-w-2xl text-text-muted">Calendar operational pentru vizionari, confirmari si follow-up dupa intalnire.</p>
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          <Metric label="Total" value={rows.length} />
          <Metric label="Urmeaza" value={upcoming.length} />
          <Metric label="Confirmate" value={rows.filter((row) => row.status === "CONFIRMED" || row.status === "BOOKED").length} />
        </section>
        <section className="overflow-hidden rounded-2xl border border-bg-surface bg-bg-secondary">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-bg-primary/50">
                <tr><th className="px-4 py-3 text-left">Start</th><th className="px-4 py-3 text-left">End</th><th className="px-4 py-3 text-left">Status</th></tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-bg-surface">
                    <td className="px-4 py-3">{new Date(row.start_at).toLocaleString("ro-RO")}</td>
                    <td className="px-4 py-3">{new Date(row.end_at).toLocaleString("ro-RO")}</td>
                    <td className="px-4 py-3">{row.status}</td>
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={3} className="px-4 py-10 text-center text-text-muted">Nu exista programari inca.</td></tr>}
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
