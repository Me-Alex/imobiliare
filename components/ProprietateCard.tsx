import { Property } from "@/lib/supabase"
import Link from "next/link"

const TIP_LABEL: Record<string, string> = { APARTMENT: "Apartament", HOUSE: "Casa", VILLA: "Vila", LAND: "Teren", COMMERCIAL: "Comercial" }

const DEFAULT_IMAGES: Record<string, string> = {
  VILLA: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80",
  HOUSE: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
  APARTMENT: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
  LAND: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
  COMMERCIAL: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
}

export default function ProprietateCard({ proprietate: p, isFavorite, onToggleFavorite }: { proprietate: Property; isFavorite: boolean; onToggleFavorite: () => void }) {
  const img = DEFAULT_IMAGES[p.type] || DEFAULT_IMAGES.APARTMENT
  const pret = `EUR ${p.price.toLocaleString("ro-RO")}`

  return (
    <div className="bg-bg-card border border-bg-surface rounded-lg overflow-hidden hover:border-accent/50 hover:-translate-y-0.5 transition-all duration-300 group">
      <div className="relative h-52 overflow-hidden">
        <img src={img} alt={p.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="bg-accent text-bg-primary text-xs font-bold px-3 py-1 rounded-full">De vanzare</span>
          <span className="bg-black/55 text-white text-xs font-medium px-3 py-1 rounded-full border border-white/15">{TIP_LABEL[p.type] || p.type}</span>
        </div>
        <div className="absolute top-3 right-3 flex gap-2">
          {p.featured && <span className="bg-white text-black text-xs font-bold px-3 py-1 rounded-full">Selectata</span>}
          <button onClick={onToggleFavorite} aria-label={isFavorite ? "Scoate din favorite" : "Adauga la favorite"} className="bg-black/55 text-white text-xs font-medium px-3 py-1 rounded-full border border-white/15 hover:bg-white hover:text-black transition-colors">
            {isFavorite ? "Salvat" : "Favorite"}
          </button>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-text-primary text-base mb-1 line-clamp-1">{p.title}</h3>
        <p className="text-text-muted text-sm mb-4 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657 13.414 20.9a2 2 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          {p.address || p.city}, {p.county || "Romania"}
        </p>
        <div className="flex flex-wrap gap-3 text-sm text-text-muted mb-4">
          {p.rooms > 0 && <span>{p.rooms} camere</span>}
          {p.rooms > 0 && <span className="text-bg-surface">|</span>}
          <span>{p.area_sqm} mp</span>
          {p.bathrooms > 0 && <><span className="text-bg-surface">|</span><span>{p.bathrooms} bai</span></>}
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-bg-surface">
          <span className="text-xl font-bold text-accent">{pret}</span>
          <Link href={`/proprietate/${p.slug}`}
            className="bg-accent/10 text-accent border border-accent/30 text-sm px-4 py-2 rounded-lg hover:bg-accent hover:text-bg-primary transition-all font-medium">
            Vezi detalii
          </Link>
        </div>
      </div>
    </div>
  )
}
