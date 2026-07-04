"use client"

import { Card, Badge, EmptyState } from "@/components/admin/ui"
import { usePortal } from "./PortalContext"

/* ─────────────────── helpers ─────────────────── */

function formatPrice(p: number) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(p)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

const STATUS_MAP: Record<string, { variant: "warning" | "success" | "danger" | "default"; label: string }> = {
  PENDING: { variant: "warning", label: "În așteptare" },
  ACCEPTED: { variant: "success", label: "Acceptat" },
  REJECTED: { variant: "danger", label: "Respins" },
  COUNTER: { variant: "default", label: "Contraofertă" },
  WITHDRAWN: { variant: "danger", label: "Retras" },
}

function statusInfo(s: string) {
  return STATUS_MAP[s] ?? { variant: "default" as const, label: s }
}

/* ─────────────────── component ─────────────────── */

export default function OffersTab() {
  const { offers } = usePortal()

  if (!offers || offers.length === 0) {
    return (
      <div className="rounded-2xl border border-bg-surface bg-bg-secondary p-10 shadow-[0_0_24px_rgba(0,0,0,0.06)]">
        <EmptyState message="Nu ai trimis nicio ofertă încă." colSpan={1} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {offers.map((offer) => {
        const si = statusInfo(offer.status ?? "")
        const steps = Array.isArray(offer.negotiation_history)
          ? offer.negotiation_history.length
          : 0

        return (
          <Card key={offer.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Left */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{offer.property_title ?? "Proprietate"}</h3>
                  <Badge variant={si.variant}>{si.label}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted">
                  <span className="text-accent font-semibold">
                    Ofertă: {formatPrice(offer.offer_price ?? 0)}
                  </span>
                  {offer.counter_offer != null && (
                    <span>
                      Contraofertă: {formatPrice(offer.counter_offer ?? 0)}
                    </span>
                  )}
                  {steps > 0 && (
                    <span>{steps} etap{steps === 1 ? "ă" : "e"} de negociere</span>
                  )}
                </div>
              </div>

              {/* Right */}
              <p className="shrink-0 text-xs text-text-muted">
                {offer.created_at ? formatDate(offer.created_at) : "—"}
              </p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
