"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/admin/app-shell"
import { supabase } from "@/lib/supabase"
type A = { id: string; start_at: string; end_at: string; status: string }
export default function AdminAppointmentsPage(){ const [rows, setRows] = useState<A[]>([]); useEffect(() => { supabase.from("appointments").select("id, start_at, end_at, status").order("start_at", { ascending: false }).then(({ data }) => setRows((data || []) as A[])) }, []); return <AppShell><div className="rounded-3xl border border-bg-surface bg-gradient-to-br from-bg-secondary via-bg-secondary to-bg-primary p-6"><h1 className="text-3xl font-semibold">Programări</h1><p className="text-text-muted mt-1">Calendar și vizionări.</p></div><div className="mt-6 rounded-2xl border border-bg-surface bg-bg-secondary overflow-hidden"><table className="w-full text-sm"><thead className="bg-bg-primary/50"><tr><th className="px-4 py-3 text-left">Start</th><th className="px-4 py-3 text-left">End</th><th className="px-4 py-3 text-left">Status</th></tr></thead><tbody>{rows.map(r => <tr key={r.id} className="border-t border-bg-surface"><td className="px-4 py-3">{new Date(r.start_at).toLocaleString('ro-RO')}</td><td className="px-4 py-3">{new Date(r.end_at).toLocaleString('ro-RO')}</td><td className="px-4 py-3">{r.status}</td></tr>)}</tbody></table></div></AppShell>}
