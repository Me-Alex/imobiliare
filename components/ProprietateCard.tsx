"use client"

import Link from "next/link"
import { ArrowUpRight, Bath, BedDouble, Camera, Heart, MapPin, Ruler, Scale } from "lucide-react"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { Property, supabase } from "@/lib/supabase"
import { COMPARE_KEY, FAVORITES_KEY, readStoredIds, subscribeClientPreferences, toggleStoredId } from "@/lib/client-preferences"
import { getPropertyMedia } from "@/lib/property-media"
import { formatCurrency } from "@/lib/format"
import SmartPropertyImage from "./SmartPropertyImage"

const TIP_LABEL: Record<string, string> = {
  APARTMENT: "Apartament",
  HOUSE: "Casa",
  VILLA: "Vila",
  LAND: "Teren",
  COMMERCIAL: "Comercial",
}

export default function ProprietateCard({ proprietate: p, matchScore, matchReasons = [], priorityImage = false }: { proprietate: Property; matchScore?: number; matchReasons?: string[]; priorityImage?: boolean }) {
  const media = getPropertyMedia(p)
  const [favorite, setFavorite] = useState(false)
  const [compare, setCompare] = useState(false)

  useEffect(() => {
    const sync = () => {
      setFavorite(readStoredIds(FAVORITES_KEY).includes(p.id))
      setCompare(readStoredIds(COMPARE_KEY).includes(p.id))
    }
    sync()
    return subscribeClientPreferences(sync)
  }, [p.id])

  const toggleStored = async (key: typeof FAVORITES_KEY | typeof COMPARE_KEY) => {
    const { selected } = toggleStoredId(key, p.id, key === COMPARE_KEY ? 3 : undefined)
    if (key === FAVORITES_KEY) setFavorite(selected)
    if (key === COMPARE_KEY) setCompare(selected)
    if (key === FAVORITES_KEY) {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (token) {
        await fetch(`/api/client/favorites${selected ? "" : `?property_id=${p.id}`}`, {
          method: selected ? "POST" : "DELETE",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: selected ? JSON.stringify({ property_id: p.id }) : undefined,
        }).catch(() => null)
      }
    }
  }

  return (
    <article className="group overflow-hidden border border-bg-surface bg-bg-card shadow-card transition hover:-translate-y-0.5 hover:border-accent">
      <div className="relative aspect-[1.35] overflow-hidden bg-bg-secondary">
        <SmartPropertyImage
          src={media.cover}
          fallbackSrc={media.fallbackCover}
          alt={p.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          loading={priorityImage ? "eager" : "lazy"}
          fetchPriority={priorityImage ? "high" : "auto"}
          className="pointer-events-none object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="rounded-md bg-bg-card px-2.5 py-1 text-xs font-black text-text-primary shadow-sm">{TIP_LABEL[p.type] || p.type}</span>
          {p.featured && <span className="rounded-md bg-accent px-2.5 py-1 text-xs font-black text-bg-primary shadow-sm">HQS</span>}
        </div>
        <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md bg-black/58 px-2.5 py-1 text-xs font-black text-white backdrop-blur">
          <Camera className="h-3.5 w-3.5" aria-hidden />
          {matchScore ? `Scor ${matchScore}` : "Verificata"}
        </div>
        <div className="absolute bottom-3 right-3 flex gap-2">
          <CardButton
            active={favorite}
            label={favorite ? "Scoate de la favorite" : "Adauga la favorite"}
            onClick={() => toggleStored(FAVORITES_KEY)}
          >
            <Heart className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} aria-hidden />
          </CardButton>
          <CardButton
            active={compare}
            label={compare ? "Scoate din comparatie" : "Compara proprietatea"}
            onClick={() => toggleStored(COMPARE_KEY)}
          >
            <Scale className="h-4 w-4" aria-hidden />
          </CardButton>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">{p.city || "HQS"}</p>
            <h3 className="mt-2 line-clamp-2 text-lg font-black leading-snug text-text-primary">{p.title}</h3>
          </div>
          <Link
            href={`/proprietate/${p.slug}`}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-bg-surface text-text-primary transition hover:border-accent hover:text-accent"
            aria-label={`Vezi detalii pentru ${p.title}`}
          >
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-text-muted">
          <MapPin className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden />
          <span className="line-clamp-2">{p.address || p.city}, {p.county || "Romania"}</span>
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2 text-sm text-text-muted">
          <Metric icon={<BedDouble className="h-4 w-4" />} value={p.rooms > 0 ? `${p.rooms}` : "-"} label="camere" />
          <Metric icon={<Ruler className="h-4 w-4" />} value={`${p.area_sqm}`} label="mp" />
          <Metric icon={<Bath className="h-4 w-4" />} value={p.bathrooms > 0 ? `${p.bathrooms}` : "-"} label="bai" />
        </div>

        {matchReasons.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {matchReasons.slice(0, 2).map((reason) => (
              <span key={reason} className="rounded-md border border-bg-surface bg-bg-secondary px-2.5 py-1 text-xs font-semibold text-text-muted">
                {reason}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-end justify-between gap-4 border-t border-bg-surface pt-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">Pret</p>
            <p className="mt-1 text-2xl font-black text-accent">{formatCurrency(p.price)}</p>
          </div>
          <Link href={`/proprietate/${p.slug}`} className="rounded-md bg-accent/10 px-4 py-2.5 text-sm font-black text-accent transition hover:bg-accent hover:text-bg-primary">
            Detalii
          </Link>
        </div>
      </div>
    </article>
  )
}

function CardButton({ active, label, onClick, children }: { active: boolean; label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid h-9 w-9 place-items-center rounded-md border border-white/24 backdrop-blur transition ${active ? "bg-accent text-bg-primary" : "bg-black/48 text-white hover:bg-white hover:text-text-primary"}`}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  )
}

function Metric({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="border border-bg-surface bg-bg-secondary px-3 py-2">
      <div className="flex items-center gap-1.5 text-text-primary">
        <span className="text-accent">{icon}</span>
        <span className="font-black">{value}</span>
      </div>
      <p className="mt-1 text-xs text-text-muted">{label}</p>
    </div>
  )
}
