"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/admin/app-shell"
import { supabase } from "@/lib/supabase"

type Lead = { id: string; name: string; phone: string; source?: string | null; status: string; created_at: string }

const stages = ["NEW", "CONTACTED", "VISITING", "NEGOTIATION"]

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [status, setStatus] = useState("ALL")

  useEffect(() => {
    supabase
      .from("leads")
      .select("id, name, phone, source, status, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => setLeads((data || []) as Lead[]))
  }, [])

  const filtered = leads.filter((lead) => status === "ALL" || lead.status === status)
  const hotToday = leads.filter((lead) => ["NEW", "CONTACTED"].includes(lead.status)).length

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-3xl border border-bg-surface bg-gradient-to-br from-bg-secondary via-bg-secondary to-bg-primary p-6 shadow-[0_0_40px_rgba(0,0,0,0.12)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm text-text-muted">Lead-uri</div>
              <h1 className="text-3xl font-semibold">Pipeline de vanzari</h1>
              <p className="mt-2 max-w-2xl text-sm text-text-muted">Prioritizeaza lead-urile noi, vizionarile si negocierile care au nevoie de follow-up rapid.</p>
            </div>
            <div className="rounded-2xl border border-bg-surface bg-bg-secondary px-4 py-3 text-sm text-text-muted">
              {hotToday} de verificat azi
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full rounded-xl border border-bg-surface bg-bg-secondary px-3 py-2.5 sm:w-auto">
              <option value="ALL">Toate statusurile</option>
              <option value="NEW">NEW</option>
              <option value="CONTACTED">CONTACTED</option>
              <option value="VISITING">VISITING</option>
              <option value="NEGOTIATION">NEGOTIATION</option>
              <option value="CLIENT">CLIENT</option>
              <option value="LOST">LOST</option>
            </select>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stages.map((stage) => (
            <div key={stage} className="rounded-2xl border border-bg-surface bg-bg-secondary p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-text-muted">{stage}</div>
              <div className="mt-2 text-2xl font-semibold">{leads.filter((lead) => lead.status === stage).length}</div>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-bg-surface bg-bg-secondary shadow-[0_0_24px_rgba(0,0,0,0.08)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-bg-primary/50">
                <tr>
                  <th className="px-4 py-3 text-left">Nume</th>
                  <th className="px-4 py-3 text-left">Telefon</th>
                  <th className="px-4 py-3 text-left">Sursa</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Creat</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <tr key={lead.id} className="border-t border-bg-surface hover:bg-bg-primary/40">
                    <td className="px-4 py-3 font-semibold">{lead.name}</td>
                    <td className="px-4 py-3">{lead.phone}</td>
                    <td className="px-4 py-3">{lead.source || "-"}</td>
                    <td className="px-4 py-3">{lead.status}</td>
                    <td className="px-4 py-3 text-text-muted">{new Date(lead.created_at).toLocaleDateString("ro-RO")}</td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-text-muted">Nu exista lead-uri pentru filtrul ales.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
