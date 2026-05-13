"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"

type Slot = {
  id?: string
  label?: string
  value?: string
  starts_at?: string
  ends_at?: string
  agent_email?: string | null
  property?: { title?: string; city?: string } | null
}

type Appointment = {
  id: string
  property_title?: string | null
  client_email?: string | null
  starts_at?: string | null
  requested_at?: string | null
  status?: string | null
  agent_email?: string | null
  notes?: string | null
}

export default function PortalAppointmentsConsole() {
  const [token, setToken] = useState("")
  const [slots, setSlots] = useState<Slot[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedSlot, setSelectedSlot] = useState("")
  const [notes, setNotes] = useState("As dori o vizionare si confirmare telefonica.")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const selected = useMemo(() => slots.find((slot) => slot.id === selectedSlot || slot.value === selectedSlot), [slots, selectedSlot])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const accessToken = data.session?.access_token || ""
      setToken(accessToken)
      load(accessToken)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const accessToken = session?.access_token || ""
      setToken(accessToken)
      load(accessToken)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function load(accessToken = token) {
    setLoading(true)
    try {
      const slotRequest = fetch("/api/calendar-slots").then((res) => res.json()).catch(() => ({}))
      const appointmentRequest = accessToken
        ? fetch("/api/client/appointments", { headers: { Authorization: `Bearer ${accessToken}` } }).then((res) => res.json()).catch(() => ({}))
        : Promise.resolve({})

      const [slotData, appointmentData] = await Promise.all([slotRequest, appointmentRequest])
      const nextSlots = slotData.slots || []
      setSlots(nextSlots)
      setAppointments(appointmentData.appointments || [])
      setSelectedSlot((current) => current || nextSlots[0]?.id || nextSlots[0]?.value || "")
    } finally {
      setLoading(false)
    }
  }

  async function requestAppointment() {
    if (!token || !selected) {
      setMessage("Autentifica-te in portal inainte de a solicita o programare.")
      return
    }

    setLoading(true)
    setMessage("")
    try {
      const response = await fetch("/api/client/appointments", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          slot_id: selected.id || null,
          requested_at: selected.starts_at || selected.value,
          notes,
        }),
      })
      const body = await response.json().catch(() => ({}))
      setMessage(response.ok ? "Programarea a fost trimisa catre echipa HQS." : body.error || "Programarea nu a putut fi trimisa.")
      if (response.ok) await load()
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="border-y border-bg-surface bg-bg-primary px-4 py-12">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[380px_1fr]">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-accent">Calendar client</span>
          <h2 className="mt-2 text-3xl font-black text-text-primary">Programari si sloturi disponibile</h2>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            Clientul vede sloturile disponibile, trimite cererea de vizionare, iar adminul o confirma sau o respinge din CRM.
          </p>
          <button onClick={() => load()} disabled={loading} className="mt-5 rounded-lg border border-bg-surface px-4 py-2 text-sm font-black text-text-primary disabled:opacity-50">
            Refresh calendar
          </button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-bg-surface bg-bg-card p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-black text-text-primary">Sloturi pentru vizionari</h3>
              <span className="text-xs font-bold uppercase text-text-muted">{slots.length} disponibile</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {slots.slice(0, 8).map((slot) => {
                const value = slot.id || slot.value || ""
                const active = value === selectedSlot
                return (
                  <button
                    key={value || `${slot.starts_at}-${slot.label}`}
                    onClick={() => setSelectedSlot(value)}
                    className={`rounded-lg border p-4 text-left transition ${active ? "border-accent bg-accent/10" : "border-bg-surface bg-bg-secondary hover:border-accent"}`}
                  >
                    <p className="font-black text-text-primary">{slot.label || formatDate(slot.starts_at || slot.value)}</p>
                    <p className="mt-1 text-sm text-text-muted">{slot.property?.title || "Vizionare HQS"}{slot.property?.city ? `, ${slot.property.city}` : ""}</p>
                    <p className="mt-3 text-xs font-bold uppercase text-accent">{slot.agent_email || "agent disponibil"}</p>
                  </button>
                )
              })}
            </div>
            {!slots.length && <p className="text-sm text-text-muted">Nu exista sloturi disponibile momentan.</p>}
          </div>

          <div className="rounded-lg border border-bg-surface bg-bg-card p-5">
            <h3 className="font-black text-text-primary">Solicita vizionare</h3>
            <p className="mt-2 text-sm text-text-muted">{selected ? `${selected.label || formatDate(selected.starts_at || selected.value)} - ${selected.agent_email || "agent disponibil"}` : "Alege un slot disponibil."}</p>
            <textarea className="form-input mt-4 min-h-28" value={notes} onChange={(event) => setNotes(event.target.value)} />
            <button onClick={requestAppointment} disabled={loading || !selectedSlot} className="mt-4 w-full rounded-lg bg-accent px-4 py-3 text-sm font-black text-bg-primary disabled:opacity-50">
              Trimite programarea
            </button>
            {message && <p className="mt-3 text-sm text-text-muted">{message}</p>}
          </div>
        </div>

        <div className="lg:col-start-2">
          <div className="rounded-lg border border-bg-surface bg-bg-card p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-black text-text-primary">Programarile mele</h3>
              <span className="text-xs font-bold uppercase text-text-muted">{appointments.length} active</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="rounded-lg border border-bg-surface bg-bg-secondary p-4">
                  <p className="font-black text-text-primary">{appointment.property_title || "Vizionare HQS"}</p>
                  <p className="mt-1 text-sm text-text-muted">{formatDate(appointment.starts_at || appointment.requested_at)}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs font-bold uppercase">
                    <span className="text-accent">{appointment.status || "REQUESTED"}</span>
                    <span className="text-text-muted">{appointment.agent_email || "neatribuit"}</span>
                  </div>
                </div>
              ))}
            </div>
            {!token && <p className="text-sm text-text-muted">Autentifica-te in portal pentru a vedea istoricul programarilor tale.</p>}
            {token && !appointments.length && <p className="text-sm text-text-muted">Nu ai programari active in acest moment.</p>}
          </div>
        </div>
      </div>
    </section>
  )
}

function formatDate(value?: string | null) {
  if (!value) return "Data de confirmat"
  return new Date(value).toLocaleString("ro-RO", { dateStyle: "medium", timeStyle: "short" })
}
