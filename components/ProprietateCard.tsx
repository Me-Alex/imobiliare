"use client"

import Link from "next/link"
import { ArrowUpRight, Bath, BedDouble, Heart, MapPin, Ruler, Scale } from "lucide-react"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { Property, supabase } from "@/lib/supabase"
import { COMPARE_KEY, FAVORITES_KEY, readStoredIds, subscribeClientPreferences, toggleStoredId } from "@/lib/client-preferences"
import { getPropertyMedia } from "@/lib/property-media"
import SmartPropertyImage from "./SmartPropertyImage"

const TIP_LABEL: Record<string, string> = {
  APARTMENT: "Apartament",
  HOUSE: "Casa",
  VILLA: "Vila",
  LAND: "Teren",
  COMMERCIAL: "Comercial",
}

export default function ProprietateCard({ proprietate: p, matchScore, matchReasons = [] }: { proprietate: Property; matchScore?: number; matchReasons?: string[] }) {
  const media = getPropertyMedia(p)
  const pret = `EUR ${p.price.toLocaleString("ro-RO")}`
  const [favorite, setFavorite] = useState(false)
  const [compare, setCompare] = useState(false)

  useEffect(() => {
    const sync = () => {
      const favorites = readStoredIds(FAVORITES_KEY)
      const compared = readStoredIds(COMPARE_KEY)
      setFavorite(favorites.includes(p.id))
      setCompare(compared.includes(p.id))
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
    <article className="group overflow-hidden rounded-2xl border border-bg-surface/80 bg-bg-card shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-accent/45">
      <div className="relative aspect-[4/3] overflow-hidden bg-bg-secondary">
        <SmartPropertyImage
          src={media.cover}
          fallbackSrc={media.fallbackCover}
          alt={p.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="pointer-events-none object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/72 to-transparent" />
        <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-black text-bg-primary">De vanzare</span>
          <span className="rounded-full border border-white/20 bg-black/45 px-3 py-1 text-xs font-bold text-white backdrop-blur">
            {TIP_LABEL[p.type] || p.type}
          </span>
        </div>
        {p.featured && (
          <span className="absolute right-4 top-4 z-10 rounded-full bg-white px-3 py-1 text-xs font-black text-black shadow-lg">
            Selectata
          </span>
        )}
        {typeof matchScore === "number" && (
          <span className="absolute bottom-4 left-4 z-10 rounded-full border border-white/18 bg-black/55 px-3 py-1 text-xs font-black text-white backdrop-blur">
            Scor {matchScore}
          </span>
        )}
        <div className="absolute bottom-4 right-4 z-10 flex gap-2">
          <button
            type="button"
            onClick={() => toggleStored(FAVORITES_KEY)}
            className={`grid h-10 w-10 place-items-center rounded-xl border border-white/25 backdrop-blur transition-all ${favorite ? "bg-accent text-bg-primary" : "bg-black/45 text-white hover:bg-white hover:text-black"}`}
            title={favorite ? "Scoate de la favorite" : "Adauga la favorite"}
            aria-label={favorite ? "Scoate de la favorite" : "Adauga la favorite"}
          >
            <Heart className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => toggleStored(COMPARE_KEY)}
            className={`grid h-10 w-10 place-items-center rounded-xl border border-white/25 backdrop-blur transition-all ${compare ? "bg-accent text-bg-primary" : "bg-black/45 text-white hover:bg-white hover:text-black"}`}
            title={compare ? "Scoate din comparatie" : "Compara proprietatea"}
            aria-label={compare ? "Scoate din comparatie" : "Compara proprietatea"}
          >
            <Scale className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">{p.city || "HQS"}</p>
            <h3 className="mt-2 line-clamp-2 text-lg font-black leading-snug text-text-primary">{p.title}</h3>
          </div>
          <Link
            href={`/proprietate/${p.slug}`}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-bg-surface text-text-primary transition-colors hover:border-accent hover:text-accent"
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
              <span key={reason} className="rounded-full border border-bg-surface bg-bg-secondary px-3 py-1 text-xs font-semibold text-text-muted">
                {reason}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-end justify-between gap-4 border-t border-bg-surface pt-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-muted">Pret</p>
            <p className="mt-1 text-2xl font-black text-accent">{pret}</p>
          </div>
          <Link
            href={`/proprietate/${p.slug}`}
            className="rounded-xl bg-accent/10 px-4 py-2.5 text-sm font-black text-accent transition-colors hover:bg-accent hover:text-bg-primary"
          >
            Detalii
          </Link>
        </div>
      </div>
    </article>
  )
}

function Metric({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-xl border border-bg-surface bg-bg-secondary px-3 py-2">
      <div className="flex items-center gap-1.5 text-text-primary">
        <span className="text-accent">{icon}</span>
        <span className="font-black">{value}</span>
      </div>
      <p className="mt-1 text-xs text-text-muted">{label}</p>
    </div>
  )
}
