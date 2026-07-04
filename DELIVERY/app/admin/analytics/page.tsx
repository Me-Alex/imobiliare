"use client"

import { useEffect, useState, useCallback } from "react"
import { AppShell } from "@/components/admin/app-shell"
import { PageHeader, StatCard, Card, DataTable, TableRow, Badge, Button, LoadingState } from "@/components/admin/ui"
import { apiJson, money } from "@/components/admin/admin-shared"

type Lead = { id: string; name: string; status: string; source: string; created_at: string; property_id?: string }
type Property = { id: string; title: string; status: string; price: number; type: string; city: string }
type Appointment = { id: string; status: string; created_at: string; lead_id?: string }

export default function AdminAnalyticsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const data = await apiJson<{
        leads: Lead[]
        properties: Property[]
        appointments: Appointment[]
      }>("/api/admin/data")
      setLeads(data?.leads || [])
      setProperties(data?.properties || [])
      setAppointments(data?.appointments || [])
    } catch {
      // fallback: try direct supabase
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Computed stats
  const totalProperties = properties.length
  const publishedProperties = properties.filter((p) => p.status === "PUBLISHED").length
  const publishedPercent = totalProperties > 0 ? Math.round((publishedProperties / totalProperties) * 100) : 0
  const avgPrice =
    totalProperties > 0
      ? Math.round(properties.reduce((s, p) => s + (p.price || 0), 0) / totalProperties)
      : 0

  const totalLeads = leads.length
  const closedLeads = leads.filter((l) => l.status === "CLOSED").length
  const conversionRate = totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0

  const totalAppointments = appointments.length
  const completedAppointments = appointments.filter((a) => a.status === "DONE").length
  const completedPercent = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0

  // Breakdowns
  const leadsBySource = leads.reduce<Record<string, number>>((acc, l) => {
    const src = l.source || "Necunoscut"
    acc[src] = (acc[src] || 0) + 1
    return acc
  }, {})

  const propsByStatus = properties.reduce<Record<string, number>>((acc, p) => {
    const st = p.status || "Necunoscut"
    acc[st] = (acc[st] || 0) + 1
    return acc
  }, {})

  const statusVariant = (status: string) => {
    switch (status) {
      case "PUBLISHED":
      case "CLOSED":
      case "DONE":
      case "ACTIVE":
        return "success"
      case "DRAFT":
      case "NEW":
      case "REQUESTED":
      case "PENDING":
        return "warning"
      case "SOLD":
      case "RENTED":
      case "LOST":
      case "CANCELLED":
        return "danger"
      default:
        return "default"
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch("/api/admin/export?format=csv", { credentials: "same-origin" })
      if (!res.ok) throw new Error("Export esuat")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `hqs-export-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silent fail
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <AppShell><LoadingState message="Se incarca analiticele..." /></AppShell>

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Analytics"
          title="Trafic si performanta"
          subtitle="Indicatori in timp real bazati pe datele platformei."
          actions={
            <Button variant="secondary" onClick={handleExport} disabled={exporting}>
              {exporting ? "Se exporta..." : "Export CSV"}
            </Button>
          }
        />

        {/* Main KPIs */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Proprietati"
            value={totalProperties}
            hint={`${publishedPercent}% publicate`}
          />
          <StatCard
            label="Pret mediu"
            value={money(avgPrice)}
            hint="Pe toata oferta"
          />
          <StatCard
            label="Lead-uri totale"
            value={totalLeads}
            hint={`${conversionRate}% rata conversie`}
          />
          <StatCard
            label="Rata conversie"
            value={`${conversionRate}%`}
            hint={`${closedLeads} din ${totalLeads} lead-uri inchise`}
          />
          <StatCard
            label="Programari"
            value={totalAppointments}
            hint={`${completedPercent}% finalizate`}
          />
          <StatCard
            label="Finalizate"
            value={completedAppointments}
            hint={`${totalAppointments - completedAppointments} restante`}
          />
        </section>

        {/* Breakdowns */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Leads by source */}
          <Card title="Lead-uri dupa sursa">
            {Object.keys(leadsBySource).length === 0 ? (
              <p className="py-6 text-center text-sm text-text-muted">Nu exista date despre surse.</p>
            ) : (
              <DataTable columns={[{ label: "Sursa" }, { label: "Total" }, { label: "%" }]} minWidth={400}>
                {Object.entries(leadsBySource)
                  .sort((a, b) => b[1] - a[1])
                  .map(([source, count]) => (
                    <TableRow key={source}>
                      <td className="px-4 py-3 font-semibold">{source}</td>
                      <td className="px-4 py-3">{count}</td>
                      <td className="px-4 py-3 text-text-muted">
                        {totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0}%
                      </td>
                    </TableRow>
                  ))}
              </DataTable>
            )}
          </Card>

          {/* Properties by status */}
          <Card title="Proprietati dupa status">
            {Object.keys(propsByStatus).length === 0 ? (
              <p className="py-6 text-center text-sm text-text-muted">Nu exista proprietati.</p>
            ) : (
              <DataTable columns={[{ label: "Status" }, { label: "Total" }, { label: "%" }]} minWidth={400}>
                {Object.entries(propsByStatus)
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => (
                    <TableRow key={status}>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(status)}>{status}</Badge>
                      </td>
                      <td className="px-4 py-3">{count}</td>
                      <td className="px-4 py-3 text-text-muted">
                        {totalProperties > 0 ? Math.round((count / totalProperties) * 100) : 0}%
                      </td>
                    </TableRow>
                  ))}
              </DataTable>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
