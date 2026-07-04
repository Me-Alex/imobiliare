"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/admin/app-shell"
import { PageHeader, StatCard, Card, DataTable, TableRow, Badge, EmptyState, LoadingState } from "@/components/admin/ui"
import { supabase, type Property } from "@/lib/supabase"
import Link from "next/link"

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ properties: 0, leads: 0, appointments: 0 })
  const [recentLeads, setRecentLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [propertiesRes, leadsRes, appointmentsRes, recentLeadsRes] = await Promise.all([
        supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "PUBLISHED"),
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id, name, status, created_at").order("created_at", { ascending: false }).limit(5),
      ])

      setStats({
        properties: propertiesRes.count || 0,
        leads: leadsRes.count || 0,
        appointments: appointmentsRes.count || 0,
      })
      setRecentLeads(recentLeadsRes.data || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Dashboard"
          title="Bun venit in Control Panel"
          subtitle="Iata o privire de ansamblu asupra performantei platformei HQS in acest moment."
        />

        {loading ? (
          <LoadingState />
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <StatCard label="Proprietati Active" value={stats.properties} href="/admin/proprietati" />
              <StatCard label="Lead-uri Totale" value={stats.leads} href="/admin/leaduri" />
              <StatCard label="Programari" value={stats.appointments} href="/admin/programari" />
            </section>

            <Card title="Lead-uri recente">
              {recentLeads.length === 0 ? (
                <p className="py-8 text-center text-text-muted">Nu exista lead-uri recente.</p>
              ) : (
                <DataTable columns={[{ label: "Nume" }, { label: "Status" }, { label: "Data" }]} minWidth={600}>
                  {recentLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <td className="px-4 py-3 font-semibold">{lead.name}</td>
                      <td className="px-4 py-3"><Badge>{lead.status}</Badge></td>
                      <td className="px-4 py-3 text-text-muted">{new Date(lead.created_at).toLocaleDateString("ro-RO")}</td>
                    </TableRow>
                  ))}
                </DataTable>
              )}
              <div className="mt-4 text-center">
                <Link href="/admin/leaduri" className="text-sm text-accent hover:underline">Vezi toate lead-urile →</Link>
              </div>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  )
}
