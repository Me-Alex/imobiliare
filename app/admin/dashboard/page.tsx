"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/admin/app-shell"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    properties: 0,
    leads: 0,
    appointments: 0,
  })
  const [recentLeads, setRecentLeads] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      const [propertiesRes, leadsRes, appointmentsRes, recentLeadsRes] = await Promise.all([
        supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "PUBLISHED"),
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id, name, status, created_at").order("created_at", { ascending: false }).limit(5)
      ])

      setStats({
        properties: propertiesRes.count || 0,
        leads: leadsRes.count || 0,
        appointments: appointmentsRes.count || 0,
      })

      setRecentLeads(recentLeadsRes.data || [])
    }

    fetchData()
  }, [])

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl border border-bg-surface bg-gradient-to-br from-bg-secondary via-bg-secondary to-bg-primary p-6 shadow-[0_0_40px_rgba(0,0,0,0.12)]">
          <div>
            <div className="text-sm text-text-muted">Dashboard</div>
            <h1 className="text-3xl font-semibold">Bun venit in Control Panel</h1>
            <p className="mt-2 max-w-2xl text-sm text-text-muted">Iata o privire de ansamblu asupra performantei platformei HQS in acest moment.</p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-bg-surface bg-bg-secondary p-6 shadow-[0_0_24px_rgba(0,0,0,0.08)]">
            <div className="text-sm font-bold uppercase tracking-widest text-text-muted">Proprietati Active</div>
            <div className="mt-2 text-4xl font-semibold">{stats.properties}</div>
            <div className="mt-4"><Link href="/admin/proprietati" className="text-sm text-accent hover:underline">Vezi proprietatile →</Link></div>
          </div>
          <div className="rounded-2xl border border-bg-surface bg-bg-secondary p-6 shadow-[0_0_24px_rgba(0,0,0,0.08)]">
            <div className="text-sm font-bold uppercase tracking-widest text-text-muted">Lead-uri Totale</div>
            <div className="mt-2 text-4xl font-semibold">{stats.leads}</div>
            <div className="mt-4"><Link href="/admin/leaduri" className="text-sm text-accent hover:underline">Vezi lead-urile →</Link></div>
          </div>
          <div className="rounded-2xl border border-bg-surface bg-bg-secondary p-6 shadow-[0_0_24px_rgba(0,0,0,0.08)]">
            <div className="text-sm font-bold uppercase tracking-widest text-text-muted">Programari</div>
            <div className="mt-2 text-4xl font-semibold">{stats.appointments}</div>
            <div className="mt-4"><Link href="/admin/programari" className="text-sm text-accent hover:underline">Vezi programarile →</Link></div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-bg-surface bg-bg-secondary shadow-[0_0_24px_rgba(0,0,0,0.08)]">
          <div className="p-4 border-b border-bg-surface">
            <h2 className="text-lg font-semibold">Lead-uri recente</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-bg-primary/50">
                <tr>
                  <th className="px-4 py-3 text-left">Nume</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Data</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="border-t border-bg-surface hover:bg-bg-primary/40">
                    <td className="px-4 py-3 font-semibold">{lead.name}</td>
                    <td className="px-4 py-3"><span className="inline-flex rounded-full border border-bg-surface px-2 py-1 text-xs">{lead.status}</span></td>
                    <td className="px-4 py-3 text-text-muted">{new Date(lead.created_at).toLocaleDateString("ro-RO")}</td>
                  </tr>
                ))}
                {!recentLeads.length && (
                  <tr><td colSpan={3} className="px-4 py-10 text-center text-text-muted">Nu exista lead-uri recente.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-bg-surface text-center">
            <Link href="/admin/leaduri" className="text-sm text-accent hover:underline">Vezi toate lead-urile →</Link>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
