"use client"

import { useEffect, useState, useCallback } from "react"
import { AppShell } from "@/components/admin/app-shell"
import { PageHeader, Card, Button, Input, Select, Badge, LoadingState } from "@/components/admin/ui"
import { apiJson } from "@/components/admin/admin-shared"

type IntegrationStatus = {
  provider: string
  status: string
  message?: string
  tested_at?: string
}

export default function AdminSetariPage() {
  const [settings, setSettings] = useState({
    agency: "HQS Imobiliare",
    commission: 3,
    target: 500000,
    vat: 19,
    theme: "system",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([])
  const [loadingIntegrations, setLoadingIntegrations] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      const data = await apiJson<{ settings: Record<string, any> }>("/api/admin/modules")
      if (data?.settings) {
        setSettings((prev) => ({
          agency: data.settings.agency ?? prev.agency,
          commission: Number(data.settings.commission ?? prev.commission),
          target: Number(data.settings.target ?? prev.target),
          vat: Number(data.settings.vat ?? prev.vat),
          theme: data.settings.theme ?? prev.theme,
        }))
      }
    } catch {
      // use defaults
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchIntegrations = useCallback(async () => {
    setLoadingIntegrations(true)
    try {
      const data = await apiJson<{ integrations?: IntegrationStatus[] }>("/api/admin/integrations/test")
      setIntegrations(data?.integrations || [])
    } catch {
      setIntegrations([])
    } finally {
      setLoadingIntegrations(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
    fetchIntegrations()
  }, [fetchSettings, fetchIntegrations])

  function updateField(field: string, value: string | number) {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  async function saveSettings() {
    setSaving(true)
    setError("")
    try {
      await apiJson("/api/admin/modules", {
        method: "POST",
        body: JSON.stringify({ type: "settings", ...settings }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      setError(err.message || "Eroare la salvare.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AppShell><LoadingState message="Se incarca setarile..." /></AppShell>

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Setari"
          title="Configuratie platforma"
          subtitle="Parametri generali ai agentiei si tema vizuala."
          actions={
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? "Se salveaza..." : "Salveaza setari"}
            </Button>
          }
        />

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
            {error}
          </div>
        )}
        {saved && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">
            ✓ Setarile au fost salvate cu succes.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {/* Agency settings */}
          <Card title="Agentie">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">
                  Nume agentie
                </label>
                <Input
                  value={settings.agency}
                  onChange={(e) => updateField("agency", e.target.value)}
                  placeholder="Numele agentiei"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">
                    Comision (%)
                  </label>
                  <Input
                    type="number"
                    value={settings.commission}
                    onChange={(e) => updateField("commission", Number(e.target.value))}
                    placeholder="3"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">
                    TVA (%)
                  </label>
                  <Input
                    type="number"
                    value={settings.vat}
                    onChange={(e) => updateField("vat", Number(e.target.value))}
                    placeholder="19"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">
                  Tinta lunara (EUR)
                </label>
                <Input
                  type="number"
                  value={settings.target}
                  onChange={(e) => updateField("target", Number(e.target.value))}
                  placeholder="500000"
                />
              </div>
            </div>
          </Card>

          {/* Theme */}
          <Card title="Tema vizuala">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">
                  Mod afisare
                </label>
                <Select
                  value={settings.theme}
                  onChange={(e) => updateField("theme", e.target.value)}
                  className="w-full"
                >
                  <option value="system">System (automat)</option>
                  <option value="light">Luminos</option>
                  <option value="dark">Intunecat</option>
                </Select>
              </div>
              <div className="rounded-xl border border-bg-surface p-4">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateField("theme", "light")}
                      className={`h-8 w-8 rounded-full border-2 bg-white ${
                        settings.theme === "light" ? "border-accent" : "border-bg-surface"
                      }`}
                    />
                    <button
                      onClick={() => updateField("theme", "dark")}
                      className={`h-8 w-8 rounded-full border-2 bg-neutral-800 ${
                        settings.theme === "dark" ? "border-accent" : "border-bg-surface"
                      }`}
                    />
                    <button
                      onClick={() => updateField("theme", "system")}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 bg-gradient-to-br from-white to-neutral-800 ${
                        settings.theme === "system" ? "border-accent" : "border-bg-surface"
                      }`}
                    >
                      <span className="text-[10px] font-bold text-text-muted">A</span>
                    </button>
                  </div>
                  <span className="text-sm text-text-muted">
                    {settings.theme === "system"
                      ? "Urmareste setarile sistemului"
                      : settings.theme === "light"
                      ? "Tema luminous activata"
                      : "Tema intunecat activata"}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Integrations */}
        <Card
          title="Integrari"
          actions={
            <Button variant="secondary" onClick={fetchIntegrations} disabled={loadingIntegrations}>
              {loadingIntegrations ? "Verific..." : "Verifica conexiuni"}
            </Button>
          }
        >
          {integrations.length === 0 && !loadingIntegrations ? (
            <p className="py-6 text-center text-sm text-text-muted">
              Apasa &quot;Verifica conexiuni&quot; pentru a testa integrarile active.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {integrations.map((integ) => (
                <div
                  key={integ.provider}
                  className="flex items-center gap-3 rounded-xl border border-bg-surface bg-bg-primary/30 p-4"
                >
                  <div
                    className={`h-3 w-3 rounded-full ${
                      integ.status === "VALID" || integ.status === "ACTIVE"
                        ? "bg-emerald-500"
                        : integ.status === "PENDING"
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{integ.provider}</p>
                    {integ.message && (
                      <p className="text-xs text-text-muted">{integ.message}</p>
                    )}
                  </div>
                  <Badge
                    variant={
                      integ.status === "VALID" || integ.status === "ACTIVE"
                        ? "success"
                        : integ.status === "PENDING"
                        ? "warning"
                        : "danger"
                    }
                  >
                    {integ.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  )
}
