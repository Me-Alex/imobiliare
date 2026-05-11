"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { AppShell } from "@/components/admin/app-shell"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "")

export default function AdminHome(){
  const [stats, setStats] = useState({properties: 0, leads: 0, clients: 0, appointments: 0})
  useEffect(() => {
    Promise.all([
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "PUBLISHED"),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "NEW"),
      supabase.from("clients").select("id", { count: "exact", head: true }),
      supabase.from("appointments").select("id", { count: "exact", head: true }).gte("start_at", new Date().toISOString()),
    ]).then(([p,l,c,a]) => setStats({ properties: p.count || 0, leads: l.count || 0, clients: c.count || 0, appointments: a.count || 0 }))
  }, [])

  const cards = [
    ["Proprietăți active", stats.properties],
    ["Lead-uri noi", stats.leads],
    ["Clienți activi", stats.clients],
    ["Vizionări", stats.appointments],
  ] as const

  return <AppShell><div className="space-y-6"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="rounded-2xl border border-bg-surface bg-bg-secondary p-4"><div className="text-sm text-text-muted">{label}</div><div className="mt-2 text-3xl font-semibold">{value}</div></div>)}</div><div className="rounded-2xl border border-bg-surface bg-bg-secondary p-4"><div className="font-semibold">Activitate recentă</div><div className="mt-3 text-sm text-text-muted">Urmează conectarea pe lead-uri, proprietăți și programări.</div></div></div></AppShell>}
