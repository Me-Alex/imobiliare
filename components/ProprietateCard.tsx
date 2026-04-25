import { Proprietate } from "@/lib/proprietati"
import Link from "next/link"

export default function ProprietateCard({ proprietate: p }: { proprietate: Proprietate }) {
  const pretFormatat = p.tranzactie === "inchiriere"
    ? `€${p.pret.toLocaleString("ro-RO")}/lună`
    : `€${p.pret.toLocaleString("ro-RO")}`

  return (
    <div className="bg-bg-card border border-bg-surface rounded-2xl overflow-hidden hover:border-accent/50 transition-all duration-300 group">
      <div className="relative h-52 overflow-hidden">
        <img src={p.imagineUrl} alt={p.titlu}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/60 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${p.tranzactie === "vanzare" ? "bg-accent text-bg-primary" : "bg-bg-surface text-text-primary border border-accent/30"}`}>
            {p.tranzactie === "vanzare" ? "De vânzare" : "De închiriat"}
          </span>
          <span className="bg-bg-primary/80 text-text-muted text-xs font-medium px-3 py-1 rounded-full border border-bg-surface capitalize">{p.tip}</span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-text-primary text-base mb-1 line-clamp-1">{p.titlu}</h3>
        <p className="text-text-muted text-sm mb-4 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {p.zona}, București
        </p>
        <div className="flex gap-4 text-sm text-text-muted mb-4">
          <span>{p.camere} camere</span>
          <span className="text-bg-surface">|</span>
          <span>{p.suprafata} mp</span>
          <span className="text-bg-surface">|</span>
          <span>{p.bai} băi</span>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-bg-surface">
          <span className="text-xl font-bold text-accent">{pretFormatat}</span>
          <Link href={`/proprietate/${p.id}`}
            className="bg-accent/10 text-accent border border-accent/30 text-sm px-4 py-2 rounded-lg hover:bg-accent hover:text-bg-primary transition-all font-medium">
            Vezi detalii
          </Link>
        </div>
      </div>
    </div>
  )
}
