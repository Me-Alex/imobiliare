"use client"

import { useEffect, useState, useCallback } from "react"
import { AppShell } from "@/components/admin/app-shell"
import { PageHeader, Card, Button, Input, Select, Badge, LoadingState } from "@/components/admin/ui"
import { apiJson, statusLabel, date } from "@/components/admin/admin-shared"
import { supabase } from "@/lib/supabase"

type CmsEntry = {
  id: string
  key: string
  title: string
  section: string
  status: string
  content: any
  seo: { meta_title?: string; meta_description?: string } | null
  created_at: string
  updated_at: string
}

const emptyEntry: CmsEntry = {
  id: "",
  key: "",
  title: "",
  section: "general",
  status: "DRAFT",
  content: "",
  seo: null,
  created_at: "",
  updated_at: "",
}

export default function AdminContinutPage() {
  const [entries, setEntries] = useState<CmsEntry[]>([])
  const [selected, setSelected] = useState<CmsEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  const fetchEntries = useCallback(async () => {
    try {
      const { data, error: err } = await supabase
        .from("cms_entries")
        .select("*")
        .order("updated_at", { ascending: false })
      if (err) throw err
      setEntries(data || [])
    } catch {
      setError("Nu s-au putut incarca datele CMS.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  useEffect(() => {
    if (entries.length > 0 && !selected) {
      setSelected(entries[0])
    }
  }, [entries, selected])

  const sections = Array.from(new Set(entries.map((e) => e.section).filter(Boolean)))

  const filteredEntries = entries.filter((e) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      e.title.toLowerCase().includes(q) ||
      e.key.toLowerCase().includes(q) ||
      e.section.toLowerCase().includes(q)
    )
  })

  function handleFieldChange(field: keyof CmsEntry, value: string) {
    setSelected((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  function handleSeoField(field: "meta_title" | "meta_description", value: string) {
    setSelected((prev) =>
      prev
        ? { ...prev, seo: { ...(prev.seo || {}), [field]: value } }
        : prev
    )
  }

  function handleContentChange(value: string) {
    setSelected((prev) => {
      if (!prev) return prev
      try {
        return { ...prev, content: JSON.parse(value) }
      } catch {
        return { ...prev, content: value }
      }
    })
  }

  function formatContent(content: any): string {
    if (typeof content === "string") return content
    return JSON.stringify(content, null, 2)
  }

  function isJsonContent(content: any): boolean {
    return content !== null && typeof content === "object"
  }

  async function saveEntry() {
    if (!selected) return
    setSaving(true)
    setError("")
    try {
      await apiJson("/api/admin/platform", {
        method: "POST",
        body: JSON.stringify({
          type: "cms",
          id: selected.id || undefined,
          key: selected.key,
          title: selected.title,
          section: selected.section,
          status: selected.status,
          content: selected.content,
          seo: selected.seo,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      fetchEntries()
    } catch (err: any) {
      setError(err.message || "Eroare la salvare.")
    } finally {
      setSaving(false)
    }
  }

  function createNew() {
    const newEntry: CmsEntry = { ...emptyEntry, id: crypto.randomUUID() }
    setSelected(newEntry)
    setEntries((prev) => [newEntry, ...prev])
  }

  if (loading) return <AppShell><LoadingState message="Se incarca continutul..." /></AppShell>

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Continut CMS"
          title="Editare continut public"
          subtitle="Administreaza sectiunile publice ale site-ului."
          actions={<Button onClick={createNew}>+ Continut nou</Button>}
        />

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
            {error}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <Card>
            <Input
              placeholder="Cauta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-3"
            />
            <nav className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto">
              {filteredEntries.length === 0 && (
                <p className="py-6 text-center text-sm text-text-muted">
                  {search ? "Niciun rezultat." : "Nu exista continut CMS."}
                </p>
              )}
              {sections.map((section) => (
                <div key={section}>
                  <div className="px-3 pt-3 pb-1 text-xs font-bold uppercase tracking-widest text-text-muted">
                    {section}
                  </div>
                  {filteredEntries
                    .filter((e) => e.section === section)
                    .map((entry) => (
                      <button
                        key={entry.id}
                        onClick={() => setSelected(entry)}
                        className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                          selected?.id === entry.id
                            ? "bg-accent/10 font-semibold text-accent"
                            : "hover:bg-bg-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate">{entry.title || entry.key}</span>
                          <Badge variant={entry.status === "PUBLISHED" ? "success" : entry.status === "DRAFT" ? "default" : "warning"}>
                            {statusLabel(entry.status)}
                          </Badge>
                        </div>
                        {entry.updated_at && (
                          <span className="mt-0.5 block text-xs text-text-muted">
                            {date(entry.updated_at)}
                          </span>
                        )}
                      </button>
                    ))}
                </div>
              ))}
            </nav>
          </Card>

          {/* Editor */}
          {selected ? (
            <Card title={selected.title || "Continut nou"}>
              <div className="space-y-4">
                {/* Key */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">
                    Cheie (slug)
                  </label>
                  <Input
                    value={selected.key}
                    onChange={(e) => handleFieldChange("key", e.target.value)}
                    placeholder="ex: hero-section"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">
                    Titlu
                  </label>
                  <Input
                    value={selected.title}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                    placeholder="Titlu sectiune"
                  />
                </div>

                {/* Section + Status row */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">
                      Sectiune
                    </label>
                    <Input
                      value={selected.section}
                      onChange={(e) => handleFieldChange("section", e.target.value)}
                      placeholder="ex: homepage"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">
                      Status
                    </label>
                    <Select
                      value={selected.status}
                      onChange={(e) => handleFieldChange("status", e.target.value)}
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Publicat</option>
                      <option value="ARCHIVED">Arhivat</option>
                    </Select>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-text-muted">
                    Continut {isJsonContent(selected.content) ? "(JSON)" : ""}
                  </label>
                  <textarea
                    value={formatContent(selected.content || "")}
                    onChange={(e) => handleContentChange(e.target.value)}
                    rows={isJsonContent(selected.content) ? 16 : 6}
                    className="w-full rounded-xl border border-bg-surface bg-bg-secondary px-3 py-2.5 font-mono text-sm outline-none transition-colors focus:border-accent"
                    placeholder="Scrie continutul aici..."
                  />
                </div>

                {/* SEO fields */}
                <div className="rounded-xl border border-bg-surface p-4">
                  <h3 className="mb-3 text-sm font-semibold text-text-muted uppercase tracking-widest">
                    SEO
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">
                        Meta Title
                      </label>
                      <Input
                        value={selected.seo?.meta_title || ""}
                        onChange={(e) => handleSeoField("meta_title", e.target.value)}
                        placeholder="Meta title..."
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-text-muted">
                        Meta Description
                      </label>
                      <textarea
                        value={selected.seo?.meta_description || ""}
                        onChange={(e) => handleSeoField("meta_description", e.target.value)}
                        rows={2}
                        className="w-full rounded-xl border border-bg-surface bg-bg-secondary px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent"
                        placeholder="Meta description..."
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <Button onClick={saveEntry} disabled={saving}>
                    {saving ? "Se salveaza..." : "Salveaza"}
                  </Button>
                  {saved && <span className="text-sm text-emerald-500">✓ Salvat cu succes</span>}
                </div>

                {selected.updated_at && (
                  <p className="text-xs text-text-muted">
                    Ultima modificare: {date(selected.updated_at, true)}
                  </p>
                )}
              </div>
            </Card>
          ) : (
            <Card>
              <div className="flex flex-col items-center justify-center py-16 text-text-muted">
                <div className="mb-3 text-4xl">📄</div>
                <p className="text-sm">Selecteaza un continut din lista sau creeaza unul nou.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  )
}
