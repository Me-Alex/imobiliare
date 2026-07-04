"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, Badge, Button, Input, Select, StatCard } from "@/components/admin/ui"
import { usePortal } from "./PortalContext"

/* ─────────────────── helpers ─────────────────── */

function formatBudget(val: number) {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`
  return String(val)
}

function calcScore(p: Record<string, any>): number {
  let s = 0
  if (p.full_name) s += 20
  if (p.phone) s += 20
  if (p.budget && p.budget > 0) s += 15
  if (p.preferred_zones?.length) s += 15
  if (p.rooms) s += 10
  if (p.purpose) s += 10
  if (p.financing_status) s += 10
  return s
}

const PURPOSE_OPTIONS = [
  { value: "", label: "Selectează..." },
  { value: "locuire", label: "Locuire" },
  { value: "investitie", label: "Investiție" },
  { value: "chirii", label: "Chirie" },
]

const FINANCING_OPTIONS = [
  { value: "", label: "Selectează..." },
  { value: "pre_aprobat", label: "Pre-aprobat" },
  { value: "in_asteptare", label: "În așteptare" },
  { value: "nevoie_finantare", label: "Necesită finanțare" },
  { value: "cash", label: "Cash" },
]

/* ─────────────────── component ─────────────────── */

export default function ProfileTab() {
  const { profile, user, setMessage, headers, refresh } = usePortal()

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    budget: 150_000,
    preferred_zones: "",
    rooms: 3,
    purpose: "",
    financing_status: "",
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm((prev) => ({
        ...prev,
        full_name: profile.full_name ?? "",
        phone: profile.phone ?? "",
        budget: profile.budget ?? 150_000,
        preferred_zones: (profile.preferred_zones ?? []).join(", "),
        rooms: profile.rooms ?? 3,
        purpose: profile.purpose ?? "",
        financing_status: profile.financing_status ?? "",
      }))
    }
  }, [profile])

  const update = (key: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const zones = form.preferred_zones
        .split(",")
        .map((z) => z.trim())
        .filter(Boolean)

      const res = await fetch("/api/client/account", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify({
          full_name: form.full_name,
          phone: form.phone,
          budget: form.budget,
          preferred_zones: zones,
          rooms: form.rooms,
          purpose: form.purpose,
          financing_status: form.financing_status,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      await refresh()
      setMessage("Profilul a fost salvat cu succes.")
    } catch (e) {
      setMessage("Eroare la salvarea profilului.")
    } finally {
      setSaving(false)
    }
  }, [form, headers, refresh, setMessage])

  const score = calcScore(form)

  const scoreColor =
    score >= 80 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-rose-500"

  const scoreLabel =
    score >= 80 ? "Pregătire excelentă" : score >= 50 ? "Pregătire medie" : "Necesită completare"

  return (
    <div className="space-y-6">
      {/* ── Score ── */}
      <StatCard
        label="Scor de pregătire"
        value={<span className={scoreColor}>{score}%</span>}
        hint={scoreLabel}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Personal Info ── */}
        <Card title="Informații personale">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-muted">
                Nume complet
              </label>
              <Input
                value={form.full_name}
                onChange={(e) => update("full_name", e.target.value)}
                placeholder="Ion Popescu"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-muted">
                Telefon
              </label>
              <Input
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+40 7XX XXX XXX"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-muted">
                Email
              </label>
              <Input
                value={user?.email ?? ""}
                readOnly
                className="cursor-not-allowed opacity-60"
              />
              <p className="mt-1 text-xs text-text-muted">
                Emailul nu poate fi modificat aici.
              </p>
            </div>
          </div>
        </Card>

        {/* ── Financial Profile ── */}
        <Card title="Profil financiar">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-muted">
                Buget: {formatBudget(form.budget)} EUR
              </label>
              <input
                type="range"
                min={75_000}
                max={1_000_000}
                step={5_000}
                value={form.budget}
                onChange={(e) => update("budget", Number(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="mt-1 flex justify-between text-xs text-text-muted">
                <span>75K</span>
                <span>1M</span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-muted">
                Zone preferate (separate prin virgulă)
              </label>
              <Input
                value={form.preferred_zones}
                onChange={(e) => update("preferred_zones", e.target.value)}
                placeholder="Centru, Pipera, Militari"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-muted">
                Număr camere
              </label>
              <Input
                type="number"
                min={0}
                max={10}
                value={form.rooms}
                onChange={(e) => update("rooms", Number(e.target.value))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-muted">
                  Scop
                </label>
                <Select
                  value={form.purpose}
                  onChange={(e) => update("purpose", e.target.value)}
                  className="w-full"
                >
                  {PURPOSE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-muted">
                  Status finanțare
                </label>
                <Select
                  value={form.financing_status}
                  onChange={(e) => update("financing_status", e.target.value)}
                  className="w-full"
                >
                  {FINANCING_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Save ── */}
      <div className="flex justify-end">
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? "Se salvează..." : "Salvează profilul"}
        </Button>
      </div>
    </div>
  )
}
