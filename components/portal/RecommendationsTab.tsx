"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, Button, Badge, EmptyState, LoadingState } from "@/components/admin/ui"
import { usePortal } from "./PortalContext"

/* ─────────────────── helpers ─────────────────── */

function formatPrice(p: number) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(p)
}

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='260' fill='%23e4e4e7'%3E%3Crect width='400' height='260'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2371717a' font-size='14'%3EFără imagine%3C/text%3E%3C/svg%3E"

function scoreVariant(score: number): "success" | "warning" | "danger" | "default" {
  if (score >= 85) return "success"
  if (score >= 60) return "warning"
  if (score >= 40) return "default"
  return "danger"
}

/* ─────────────────── component ─────────────────── */

export default function RecommendationsTab() {
  const { recommendations, profile, setMessage, headers, refresh } = usePortal()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify(profile),
      })
      if (!res.ok) throw new Error()
      await refresh()
    } catch {
      setMessage("Nu s-au putut încărca recomandările.")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (trackId: string, propertyId: string) => {
    setSaving(trackId)
    try {
      const res = await fetch("/api/client/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify({ property_id: propertyId }),
      })
      if (!res.ok) throw new Error()
      await refresh()
      setMessage("Proprietatea a fost adăugată la favorite.")
    } catch {
      setMessage("Nu s-a putut adăuga la favorite.")
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <LoadingState message="Se generează recomandări..." />

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button variant="primary" onClick={handleRefresh}>
            Generează recomandări
          </Button>
        </div>
        <div className="rounded-2xl border border-bg-surface bg-bg-secondary p-10 shadow-[0_0_24px_rgba(0,0,0,0.06)]">
          <EmptyState message="Nu există recomandări încă. Completează-ți profilul pentru a primi sugestii personalizate." colSpan={1} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          {recommendations.length} proprietăți recomandate pentru tine
        </p>
        <Button variant="secondary" onClick={handleRefresh} disabled={loading}>
          ↻ Actualizează
        </Button>
      </div>

      {/* ── Grid ── */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((rec) => {
          const p = rec.property
          const slug = p.slug ?? p.id ?? ""

          return (
            <div
              key={p.id ?? slug}
              className="rounded-2xl border border-bg-surface bg-bg-secondary shadow-[0_0_24px_rgba(0,0,0,0.06)] overflow-hidden"
            >
              {/* Image + Score */}
              <div className="relative aspect-[16/10] bg-bg-primary">
                <Image
                  src={p.cover_image || PLACEHOLDER}
                  alt={p.title ?? "Proprietate"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <span className="absolute top-2 right-2 backdrop-blur">
                  <Badge
                    variant={scoreVariant(rec.score)}
                  >
                    {Math.round(rec.score)}% potrivire
                  </Badge>
                </span>
              </div>

              {/* Body */}
              <div className="p-4 space-y-2.5">
                <Link href={`/proprietate/${slug}`}>
                  <h3 className="font-semibold leading-tight hover:text-accent transition-colors line-clamp-1">
                    {p.title ?? "Proprietate"}
                  </h3>
                </Link>

                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <span>📍 {p.city ?? "—"}</span>
                  {p.rooms && <span>· {p.rooms} camere</span>}
                  {p.area && <span>· {p.area} m²</span>}
                </div>

                {p.price != null && (
                  <p className="text-lg font-bold text-accent">
                    {formatPrice(p.price)}
                  </p>
                )}

                {/* Reasons */}
                {Array.isArray(rec.reasons) && rec.reasons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {rec.reasons.map((r, i) => (
                      <Badge key={i} variant="default">
                        {r}
                      </Badge>
                    ))}
                  </div>
                )}

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => handleSave(p.id ?? "", p.id ?? "")}
                  disabled={saving === (p.id ?? "")}
                >
                  {saving === (p.id ?? "") ? "..." : "❤️ Salvează la favorite"}
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
