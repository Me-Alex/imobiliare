"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Building2, FileText, ClipboardList, LogOut, MapPin, ArrowUpRight } from "lucide-react"
import PortalAuthGateway from "@/components/PortalAuthGateway"
import { supabase } from "@/lib/supabase"
import {
  PageHeader,
  Card,
  StatCard,
  Badge,
  Button,
  LoadingState,
  EmptyState,
} from "@/components/admin/ui"

type OwnerData = {
  owner: { email: string }
  properties: Record<string, any>[]
  reports: Record<string, any>[]
  documents: Record<string, any>[]
}

function formatEur(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num || 0)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-"
  try {
    return new Date(dateStr).toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

function statusVariant(status?: string): "default" | "success" | "warning" | "danger" {
  if (!status) return "default"
  const s = status.toUpperCase()
  if (["ACTIV", "ACTIVE", "PUBLICAT", "PUBLISHED", "FINALIZAT", "COMPLETAT", "SEMNAT", "APROBAT"].includes(s))
    return "success"
  if (["PENDING", "IN_LUCRU", "IN_PROGRESS", "REVIEW", "DRAFT", "EXPEDIAT", "GENERAT", "TRIMIS"].includes(s))
    return "warning"
  if (["EXPIRAT", "RESPINS", "ANULAT", "ERECOARE", "ESUAT", "REFUZAT"].includes(s)) return "danger"
  return "default"
}

export default function OwnerPortal() {
  const [token, setToken] = useState("")
  const [data, setData] = useState<OwnerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const accessToken = data.session?.access_token || ""
      setToken(accessToken)
      if (accessToken) void load(accessToken)
      else setLoading(false)
    })
  }, [])

  async function load(accessToken: string) {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/owner/dashboard", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "Portalul proprietar nu s-a incarcat.")
      setData(body)
    } catch (err: any) {
      setError(err?.message || "Portalul proprietar nu s-a incarcat.")
    } finally {
      setLoading(false)
    }
  }

  /* ---------- Auth gate ---------- */
  if (!token)
    return (
      <PortalAuthGateway
        redirectTo="/owner"
        onAuthenticated={(accessToken) => {
          setToken(accessToken)
          void load(accessToken)
        }}
      />
    )

  /* ---------- Loading ---------- */
  if (loading) return <LoadingState message="Se incarca portalul proprietar..." />

  /* ---------- Error (data fetch failed) ---------- */
  if (error) {
    return (
      <section className="border-y border-bg-surface bg-bg-secondary px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
            <p className="text-sm font-bold text-rose-500">{error}</p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => load(token)}
            >
              Reincearca
            </Button>
          </div>
        </div>
      </section>
    )
  }

  const properties = data?.properties || []
  const reports = data?.reports || []
  const documents = data?.documents || []

  return (
    <section className="border-y border-bg-surface bg-bg-secondary px-4 py-12">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ---------- Header ---------- */}
        <PageHeader
          eyebrow="Portal proprietar"
          title="Portal Proprietar"
          subtitle={data?.owner.email ? `Conectat ca ${data.owner.email}` : undefined}
          actions={
            <Button
              variant="secondary"
              onClick={() =>
                supabase.auth.signOut().then(() => {
                  setToken("")
                  setData(null)
                })
              }
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          }
        />

        {/* ---------- Stats ---------- */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Proprietati"
            value={properties.length}
            hint="Total proprietati administrate"
          />
          <StatCard
            label="Rapoarte"
            value={reports.length}
            hint="Rapoarte si evaluari"
          />
          <StatCard
            label="Documente"
            value={documents.length}
            hint="Documente si mandate"
          />
        </div>

        {/* ---------- Properties ---------- */}
        <Card title="Proprietati administrate">
          {properties.length === 0 ? (
            <div className="py-10 text-center text-text-muted">
              Nu exista proprietati asociate acestui cont.
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-bg-surface">
              {properties.map((property) => {
                const slug = property.slug
                const wrapper = slug
                  ? (children: React.ReactNode) => (
                      <Link
                        href={`/proprietate/${slug}`}
                        className="group flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0 transition-colors hover:bg-bg-primary/40 -mx-2 px-2 rounded-lg"
                      >
                        {children}
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    )
                  : (children: React.ReactNode) => (
                      <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                        {children}
                      </div>
                    )

                return wrapper(
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-text-primary truncate">
                        {property.title || "Fara titlu"}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-muted">
                        {(property.city || property.zone) && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {property.city || property.zone}
                          </span>
                        )}
                        <span className="font-semibold text-accent">
                          {formatEur(property.price || 0)}
                        </span>
                      </div>
                    </div>
                    <Badge variant={statusVariant(property.status)}>
                      {property.status || "DRAFT"}
                    </Badge>
                  </>
                )
              })}
            </div>
          )}
        </Card>

        {/* ---------- Reports ---------- */}
        <Card title="Rapoarte proprietar">
          {reports.length === 0 ? (
            <div className="py-10 text-center text-text-muted">
              Nu exista rapoarte publicate.
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-bg-surface">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-text-primary">
                      {report.title || "Fara titlu"}
                    </p>
                    <p className="mt-1 text-sm text-text-muted">
                      {report.summary || "Fara sumar."}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {report.created_at && (
                      <span className="text-xs text-text-muted">
                        {formatDate(report.created_at)}
                      </span>
                    )}
                    <Badge variant={statusVariant(report.status)}>
                      {report.status || "DRAFT"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ---------- Documents ---------- */}
        <Card title="Documente si mandate">
          {documents.length === 0 ? (
            <div className="py-10 text-center text-text-muted">
              Nu exista documente asociate acestui cont.
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-bg-surface">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-text-primary">
                      {doc.title || "Fara titlu"}
                    </p>
                    <p className="mt-1 text-sm text-text-muted">
                      {doc.file_url
                        ? doc.file_url.split("/").pop() || "document"
                        : doc.docusign_envelope_id
                          ? "DocuSign"
                          : "document privat"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {doc.type && (
                      <span className="text-xs text-text-muted">{doc.type}</span>
                    )}
                    <Badge variant={statusVariant(doc.status)}>
                      {doc.status || "DRAFT"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </section>
  )
}
