"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { AppShell } from "@/components/admin/app-shell"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "")

export default function AdminHome(){
  const [stats, setStats] = useState({properties: 0, leads: 0, clients: 0, appointments: 0})
  const [recentLeads, setRecentLeads] = useState<any[]>([])
  const [monthlyLeads, setMonthlyLeads] = useState<{ month: string; total: number }[]>([])
  useEffect(() => {
    Promise.all([
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "PUBLISHED"),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "NEW"),
      supabase.from("clients").select("id", { count: "exact", head: true }),
      supabase.from("appointments").select("id", { count: "exact", head: true }).gte("start_at", new Date().toISOString()),
      supabase.from("leads").select("id, name, source, status, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("leads").select("created_at").order("created_at", { ascending: false }).limit(200),
    ]).then(([p,l,c,a,rl,ml]) => {
      setStats({ properties: p.count || 0, leads: l.count || 0, clients: c.count || 0, appointments: a.count || 0 })
      setRecentLeads((rl.data || []) as any[])
      const rows = (ml.data || []) as { created_at: string }[]
      const months: Record<string, number> = {}
      rows.forEach(row => { const key = new Date(row.created_at).toLocaleString('ro-RO', { month: 'short', year: '2-digit' }); months[key] = (months[key] || 0) + 1 })
      setMonthlyLeads(Object.entries(months).map(([month, total]) => ({ month, total })))
    })
  }, [])

  const cards = [
    ["Proprietăți active", stats.properties],
    ["Lead-uri noi", stats.leads],
    ["Clienți activi", stats.clients],
    ["Vizionări", stats.appointments],
  ] as const

  return <AppShell><div className="space-y-6"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="rounded-2xl border border-bg-surface bg-bg-secondary p-4"><div className="text-sm text-text-muted">{label}</div><div className="mt-2 text-3xl font-semibold">{value}</div></div>)}</div><div className="grid gap-4 xl:grid-cols-3"><div className="rounded-2xl border border-bg-surface bg-bg-secondary p-4 xl:col-span-2"><div className="font-semibold">Lead-uri pe lună</div><div className="mt-4 space-y-3">{monthlyLeads.map(item => <div key={item.month} className="flex items-center gap-3"><div className="w-20 text-xs text-text-muted">{item.month}</div><div className="h-2 flex-1 rounded-full bg-bg-primary overflow-hidden"><div className="h-full bg-accent" style={{ width: `${Math.min(100, item.total * 12)}%` }} /></div><div className="w-8 text-right text-xs">{item.total}</div></div>)}</div></div><div className="rounded-2xl border border-bg-surface bg-bg-secondary p-4"><div className="font-semibold">Activitate recentă</div><div className="mt-3 space-y-3 text-sm">{recentLeads.map(lead => <div key={lead.id} className="rounded-lg border border-bg-surface bg-bg-primary p-3"><div className="font-medium">{lead.name}</div><div className="text-xs text-text-muted">{lead.source || '-'} · {lead.status}</div></div>)}</div></div></div></div></AppShell>}
