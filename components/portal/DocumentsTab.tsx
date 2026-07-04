"use client"

import { useState, useRef } from "react"
import { Card, Button, Input, Badge, EmptyState } from "@/components/admin/ui"
import { usePortal } from "./PortalContext"

/* ─────────────────── helpers ─────────────────── */

const STATUS_MAP: Record<string, { variant: "warning" | "success" | "danger"; label: string }> = {
  PENDING: { variant: "warning", label: "În așteptare" },
  APPROVED: { variant: "success", label: "Aprobat" },
  REJECTED: { variant: "danger", label: "Respins" },
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/* ─────────────────── component ─────────────────── */

export default function DocumentsTab() {
  const { documents, setMessage, headers, refresh } = usePortal()
  const [title, setTitle] = useState("")
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async () => {
    if (!title.trim()) {
      setMessage("Introdu un titlu pentru document.")
      return
    }
    const file = fileRef.current?.files?.[0]
    if (!file) {
      setMessage("Selectează un fișier.")
      return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("title", title.trim())
      fd.append("file", file)

      const res = await fetch("/api/client/documents", {
        method: "POST",
        headers: { Authorization: headers().Authorization },
        body: fd,
      })
      if (!res.ok) throw new Error()
      setTitle("")
      if (fileRef.current) fileRef.current.value = ""
      await refresh()
      setMessage("Documentul a fost încărcat.")
    } catch {
      setMessage("Nu s-a putut încărca documentul.")
    } finally {
      setUploading(false)
    }
  }

  const statusInfo = (s: string) =>
    STATUS_MAP[s] ?? { variant: "default" as const, label: s }

  if (!documents || documents.length === 0) {
    return (
      <div className="space-y-6">
        <Card title="Încarcă document">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-text-muted">Titlu</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Act identitate" />
            </div>
            <div className="flex-1">
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="block w-full text-sm text-text-muted file:mr-3 file:rounded-xl file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-semibold file:text-bg-primary"
              />
            </div>
            <Button variant="primary" onClick={handleUpload} disabled={uploading}>
              {uploading ? "..." : "Adaugă"}
            </Button>
          </div>
        </Card>
        <div className="rounded-2xl border border-bg-surface bg-bg-secondary p-10 shadow-[0_0_24px_rgba(0,0,0,0.06)]">
          <EmptyState message="Nu ai încărcat niciun document." colSpan={1} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Upload ── */}
      <Card title="Încarcă document">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-text-muted">Titlu</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Act identitate" />
          </div>
          <div className="flex-1">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="block w-full text-sm text-text-muted file:mr-3 file:rounded-xl file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-semibold file:text-bg-primary"
            />
          </div>
          <Button variant="primary" onClick={handleUpload} disabled={uploading}>
            {uploading ? "..." : "Adaugă"}
          </Button>
        </div>
      </Card>

      {/* ── Grid ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => {
          const si = statusInfo(doc.status ?? "")
          return (
            <Card key={doc.id} className="flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-tight line-clamp-2">{doc.title}</h3>
                  <Badge variant={si.variant}>{si.label}</Badge>
                </div>

                {doc.type && (
                  <p className="text-sm text-text-muted">Tip: {doc.type}</p>
                )}

                {doc.created_at && (
                  <p className="text-xs text-text-muted">
                    Încărcat: {formatDate(doc.created_at)}
                  </p>
                )}
              </div>

              {doc.signed_url && (
                <div className="mt-4">
                  <a
                    href={doc.signed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
                  >
                    📥 Descarcă
                  </a>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
