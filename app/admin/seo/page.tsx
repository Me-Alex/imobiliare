"use client"

import { useEffect, useState, useCallback } from "react"
import { AppShell } from "@/components/admin/app-shell"
import { PageHeader, Card, DataTable, TableRow, Badge, Button, Input, LoadingState } from "@/components/admin/ui"
import { supabase } from "@/lib/supabase"
import { date } from "@/components/admin/admin-shared"

type SeoPage = {
  id: string
  page_key: string
  meta_title: string | null
  meta_description: string | null
  noindex: boolean | null
  og_title: string | null
  og_description: string | null
  canonical_url: string | null
  created_at: string
  updated_at: string
}

export default function AdminSeoPage() {
  const [pages, setPages] = useState<SeoPage[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<SeoPage>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  const fetchPages = useCallback(async () => {
    try {
      const { data, error: err } = await supabase.from("seo_pages").select("*").order("page_key")
      if (err) throw err
      setPages(data || [])
    } catch {
      setError("Nu s-au putut incarca paginile SEO.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPages()
  }, [fetchPages])

  // SEO Health
  const totalPages = pages.length
  const withTitle = pages.filter((p) => p.meta_title && p.meta_title.trim()).length
  const withDescription = pages.filter((p) => p.meta_description && p.meta_description.trim()).length
  const noindexPages = pages.filter((p) => p.noindex === true).length

  const filteredPages = pages.filter((p) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      p.page_key.toLowerCase().includes(q) ||
      (p.meta_title || "").toLowerCase().includes(q)
    )
  })

  function startEdit(page: SeoPage) {
    setEditing(page.id)
    setEditForm({
      meta_title: page.meta_title || "",
      meta_description: page.meta_description || "",
      noindex: page.noindex || false,
      og_title: page.og_title || "",
      og_description: page.og_description || "",
      canonical_url: page.canonical_url || "",
    })
  }

  function cancelEdit() {
    setEditing(null)
    setEditForm({})
  }

  async function saveEdit() {
    if (!editing) return
    setSaving(true)
    setError("")
    try {
      const { error: err } = await supabase
        .from("seo_pages")
        .update({
          meta_title: editForm.meta_title || null,
          meta_description: editForm.meta_description || null,
          noindex: editForm.noindex || false,
          og_title: editForm.og_title || null,
          og_description: editForm.og_description || null,
          canonical_url: editForm.canonical_url || null,
        })
        .eq("id", editing)
      if (err) throw err
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      cancelEdit()
      fetchPages()
    } catch (err: any) {
      setError(err.message || "Eroare la salvare.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AppShell><LoadingState message="Se incarca datele SEO..." /></AppShell>

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="SEO"
          title="Optimizare pentru motoare de cautare"
          subtitle="Meta date, indexare si sanatate SEO per pagina."
        />

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
            {error}
          </div>
        )}
        {saved && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">
            ✓ Salvat cu succes.
          </div>
        )}

        {/* SEO Health Overview */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Pagini totale</p>
            <p className="mt-2 text-3xl font-black text-accent">{totalPages}</p>
          </Card>
          <Card>
            <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Cu Meta Title</p>
            <div className="mt-2 flex items-end gap-2">
              <p className="text-3xl font-black text-emerald-500">{withTitle}</p>
              <p className="mb-1 text-sm text-text-muted">/ {totalPages}</p>
            </div>
          </Card>
          <Card>
            <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Cu Description</p>
            <div className="mt-2 flex items-end gap-2">
              <p className="text-3xl font-black text-emerald-500">{withDescription}</p>
              <p className="mb-1 text-sm text-text-muted">/ {totalPages}</p>
            </div>
          </Card>
          <Card>
            <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Noindex</p>
            <p className="mt-2 text-3xl font-black text-rose-500">{noindexPages}</p>
            <p className="mt-1 text-xs text-text-muted">pagini excluse din index</p>
          </Card>
        </section>

        {/* Search + Table */}
        <Card
          title="Pagini SEO"
          actions={
            <Input
              placeholder="Cauta pagina..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48"
            />
          }
        >
          {filteredPages.length === 0 ? (
            <p className="py-10 text-center text-sm text-text-muted">
              {search ? "Niciun rezultat." : "Nu exista pagini SEO inregistrate."}
            </p>
          ) : (
            <DataTable
              columns={[
                { label: "Pagina" },
                { label: "Meta Title" },
                { label: "Description" },
                { label: "Index" },
                { label: "Modificat" },
                { label: "" },
              ]}
              minWidth={800}
            >
              {filteredPages.map((page) => (
                <TableRow key={page.id}>
                  {editing === page.id ? (
                    <>
                      <td className="px-4 py-3">
                        <span className="font-semibold">{page.page_key}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={editForm.meta_title || ""}
                          onChange={(e) => setEditForm((p) => ({ ...p, meta_title: e.target.value }))}
                          placeholder="Meta title..."
                          className="w-full"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={editForm.meta_description || ""}
                          onChange={(e) => setEditForm((p) => ({ ...p, meta_description: e.target.value }))}
                          placeholder="Description..."
                          className="w-full"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editForm.noindex || false}
                            onChange={(e) => setEditForm((p) => ({ ...p, noindex: e.target.checked }))}
                            className="h-4 w-4 rounded border-bg-surface accent-accent"
                          />
                          <span className="text-xs text-text-muted">Noindex</span>
                        </label>
                      </td>
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button onClick={saveEdit} disabled={saving}>
                            {saving ? "..." : "Salveaza"}
                          </Button>
                          <Button variant="ghost" onClick={cancelEdit}>
                            Anuleaza
                          </Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3">
                        <span className="font-semibold">{page.page_key}</span>
                      </td>
                      <td className="px-4 py-3">
                        {page.meta_title ? (
                          <span className="text-sm">{page.meta_title}</span>
                        ) : (
                          <Badge variant="warning">Lipsa</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {page.meta_description ? (
                          <span className="line-clamp-2 max-w-xs text-sm text-text-muted">
                            {page.meta_description}
                          </span>
                        ) : (
                          <Badge variant="warning">Lipsa</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={page.noindex ? "danger" : "success"}>
                          {page.noindex ? "Noindex" : "Indexat"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-muted">
                        {date(page.updated_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" onClick={() => startEdit(page)}>
                          Editeaza
                        </Button>
                      </td>
                    </>
                  )}
                </TableRow>
              ))}
            </DataTable>
          )}
        </Card>
      </div>
    </AppShell>
  )
}
