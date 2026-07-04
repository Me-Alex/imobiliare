"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, Button, Badge, EmptyState } from "@/components/admin/ui"
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

/* ─────────────────── component ─────────────────── */

export default function FavoritesTab() {
  const { favorites, setMessage, headers, refresh } = usePortal()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [removing, setRemoving] = useState<string | null>(null)

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 3) next.add(id)
      return next
    })
  }

  const handleRemove = async (id: string) => {
    const fav = favorites.find((f) => f.id === id)
    if (!fav) return
    const propId = fav.property_id || fav.property?.id || id
    setRemoving(id)
    try {
      const res = await fetch(`/api/client/favorites?property_id=${propId}`, {
        method: "DELETE",
        headers: { Authorization: headers().Authorization },
      })
      if (!res.ok) throw new Error()
      await refresh()
    } catch {
      setMessage("Nu s-a putut elimina proprietatea.")
    } finally {
      setRemoving(null)
    }
  }

  if (!favorites || favorites.length === 0) {
    return (
      <div className="rounded-2xl border border-bg-surface bg-bg-secondary p-10 shadow-[0_0_24px_rgba(0,0,0,0.06)]">
        <EmptyState message="Nu ai salvat nicio proprietate încă. Explorează ofertele și apasă ❤️ pentru a salva." colSpan={1} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Compare bar ── */}
      {selected.size >= 2 && (
        <Card className="flex items-center justify-between">
          <p className="text-sm text-text-muted">
            {selected.size} proprietăți selectate pentru comparare
          </p>
          <Link
            href={`/comparare?ids=${Array.from(selected).join(",")}`}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-bg-primary hover:opacity-90"
          >
            Compară →
          </Link>
        </Card>
      )}

      {/* ── Grid ── */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {favorites.map((fav) => {
          const p = fav.property ?? {}
          const slug = p.slug || p.id || fav.property_id || ""
          const isSelected = selected.has(fav.id)

          return (
            <div
              key={fav.id}
              className={`rounded-2xl border bg-bg-secondary shadow-[0_0_24px_rgba(0,0,0,0.06)] overflow-hidden transition-all ${
                isSelected ? "border-accent ring-2 ring-accent/30" : "border-bg-surface"
              }`}
            >
              {/* Image */}
              <div className="relative aspect-[16/10] bg-bg-primary">
                <Image
                  src={p.cover_image || PLACEHOLDER}
                  alt={p.title ?? "Proprietate"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {fav.notes && (
                  <span className="absolute bottom-2 left-2 rounded-full bg-bg-primary/80 px-2 py-1 text-xs text-text-muted backdrop-blur">
                    📝 {fav.notes}
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="p-4 space-y-2.5">
                <Link href={`/proprietate/${slug}`} className="block">
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

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => toggleSelect(fav.id)}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                      isSelected
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-bg-surface text-text-muted hover:border-accent"
                    }`}
                  >
                    {isSelected ? "✓ Selectat" : "Compară"}
                  </button>
                  <Button
                    variant="secondary"
                    onClick={() => handleRemove(fav.id)}
                    disabled={removing === fav.id}
                    className="px-3 text-xs"
                  >
                    {removing === fav.id ? "..." : "✕"}
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
