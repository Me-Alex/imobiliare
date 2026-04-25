"use client"
import { useEffect, useState } from "react"
import { supabase, Property } from "@/lib/supabase"
import { notFound } from "next/navigation"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import ContactDetaliu from "@/components/ContactDetaliu"
import Link from "next/link"

const TIP_LABEL: Record<string, string> = { APARTMENT: "Apartament", HOUSE: "Casă", VILLA: "Vilă", LAND: "Teren", COMMERCIAL: "Comercial" }
const DEFAULT_IMAGES: Record<string, string[]> = {
  VILLA: ["https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80","https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80"],
  HOUSE: ["https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80","https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"],
  APARTMENT: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80","https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80"],
  LAND: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80"],
  COMMERCIAL: ["https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80"],
}

export default function PaginaProprietate({ params }: { params: { slug: string } }) {
  const [p, setP] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [imgActiva, setImgActiva] = useState(0)

  useEffect(() => {
    supabase.from("properties").select("*").eq("slug", params.slug).single()
      .then(({ data }) => { setP(data); setLoading(false) })
  }, [params.slug])

  if (loading) return (
    <main><Header />
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    <Footer /></main>
  )
  if (!p) return notFound()

  const galerie = DEFAULT_IMAGES[p.type] || DEFAULT_IMAGES.APARTMENT
  const pret = `€${p.price.toLocaleString("ro-RO")}`

  return (
    <main>
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <Link href="/#proprietati" className="inline-flex items-center gap-2 text-text-muted text-sm hover:text-accent transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Înapoi la proprietăți
        </Link>

        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <div className="relative rounded-2xl overflow-hidden h-80 md:h-[460px] mb-3 bg-bg-card">
              <img src={galerie[imgActiva]} alt={p.title} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="bg-accent text-bg-primary text-xs font-bold px-3 py-1 rounded-full">De vânzare</span>
                <span className="bg-bg-primary/80 text-text-muted text-xs px-3 py-1 rounded-full border border-bg-surface">{TIP_LABEL[p.type]}</span>
              </div>
            </div>
            {galerie.length > 1 && (
              <div className="flex gap-2 mb-8">
                {galerie.map((img, i) => (
                  <button key={i} onClick={() => setImgActiva(i)}
                    className={`h-16 w-24 rounded-xl overflow-hidden border-2 transition-all ${i === imgActiva ? "border-accent" : "border-bg-surface opacity-60 hover:opacity-100"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">{p.title}</h1>
            <p className="text-text-muted text-sm flex items-center gap-1 mb-6">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {p.address}, {p.city}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { label: "Suprafață", val: `${p.area_sqm} mp` },
                { label: "Camere", val: p.rooms > 0 ? p.rooms : "—" },
                { label: "Băi", val: p.bathrooms > 0 ? p.bathrooms : "—" },
                { label: "Parcare", val: p.parking_spots > 0 ? p.parking_spots : "—" },
              ].map(item => (
                <div key={item.label} className="bg-bg-card border border-bg-surface rounded-xl p-4 text-center">
                  <div className="text-lg font-bold text-accent">{item.val}</div>
                  <div className="text-text-muted text-xs mt-1">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-bg-card border border-bg-surface rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-3">Descriere</h2>
              <p className="text-text-muted leading-relaxed text-sm whitespace-pre-line">{p.description}</p>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-bg-card border border-bg-surface rounded-2xl p-6 mb-4">
                <div className="text-3xl font-bold text-accent mb-1">{pret}</div>
                <div className="text-text-muted text-sm">{p.city}, {p.county}</div>
              </div>
              <ContactDetaliu proprietate={p.title} propertyId={p.id} />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
