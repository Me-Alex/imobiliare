import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import ContactDetaliu from "@/components/ContactDetaliu"
import Link from "next/link"
import type { Metadata } from "next"

export const runtime = "edge"

const TIP_LABEL: Record<string, string> = {
  APARTMENT: "Apartament",
  HOUSE: "Casa",
  VILLA: "Vila",
  LAND: "Teren",
  COMMERCIAL: "Comercial",
}

const DEFAULT_IMAGES: Record<string, string[]> = {
  VILLA: [
    "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=900&q=80",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=900&q=80",
  ],
  HOUSE: [
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=900&q=80",
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900&q=80",
  ],
  APARTMENT: [
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900&q=80",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&q=80",
  ],
  LAND: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80"],
  COMMERCIAL: ["https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80"],
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data } = await supabase.from("properties").select("title,description,city").eq("slug", params.slug).single()
  if (!data) return { title: "Proprietate negasita" }
  return {
    title: `${data.title} | HQS Imobiliare`,
    description: data.description?.slice(0, 160) || `Proprietate in ${data.city}`,
  }
}

export default async function PaginaProprietate({ params }: { params: { slug: string } }) {
  const { data: p } = await supabase.from("properties").select("*").eq("slug", params.slug).single()
  if (!p) notFound()

  const galerie = DEFAULT_IMAGES[p.type] || DEFAULT_IMAGES.APARTMENT
  const pret = `EUR ${p.price.toLocaleString("ro-RO")}`
  const pricePerMeter = p.area_sqm > 0 && p.price > 0 ? Math.round(p.price / p.area_sqm).toLocaleString("ro-RO") : null

  return (
    <main>
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <Link href="/proprietati" className="inline-flex items-center gap-2 text-text-muted text-sm hover:text-accent transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Inapoi la proprietati
        </Link>
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <div className="relative rounded-lg overflow-hidden h-80 md:h-[460px] mb-3 bg-bg-card">
              <img src={galerie[0]} alt={p.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="bg-accent text-bg-primary text-xs font-bold px-3 py-1 rounded-full">De vanzare</span>
                <span className="bg-black/55 text-white text-xs px-3 py-1 rounded-full border border-white/15">
                  {TIP_LABEL[p.type] || p.type}
                </span>
              </div>
            </div>
            {galerie.length > 1 && (
              <div className="flex gap-2 mb-8">
                {galerie.map((img: string, i: number) => (
                  <div key={i} className="h-16 w-24 rounded-lg overflow-hidden border border-bg-surface opacity-75 hover:opacity-100 transition-opacity">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">{p.title}</h1>
            <p className="text-text-muted text-sm flex items-center gap-1 mb-6">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657 13.414 20.9a2 2 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              {p.address}, {p.city}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { label: "Suprafata", val: `${p.area_sqm} mp` },
                { label: "Camere", val: p.rooms > 0 ? p.rooms : "-" },
                { label: "Bai", val: p.bathrooms > 0 ? p.bathrooms : "-" },
                { label: "Parcare", val: p.parking_spots > 0 ? p.parking_spots : "-" },
              ].map((item) => (
                <div key={item.label} className="bg-bg-card border border-bg-surface rounded-lg p-4 text-center">
                  <div className="text-lg font-bold text-accent">{item.val}</div>
                  <div className="text-text-muted text-xs mt-1">{item.label}</div>
                </div>
              ))}
            </div>
            {p.description && (
              <div className="bg-bg-card border border-bg-surface rounded-lg p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-3">Descriere</h2>
                <p className="text-text-muted leading-relaxed text-sm whitespace-pre-line">{p.description}</p>
              </div>
            )}
          </div>
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-bg-card border border-bg-surface rounded-lg p-6 mb-4">
                <div className="text-3xl font-bold text-accent mb-1">{pret}</div>
                <div className="text-text-muted text-sm">{p.city}, {p.county}</div>
                {pricePerMeter && (
                  <div className="text-text-muted text-xs mt-1">
                    Aproximativ EUR {pricePerMeter} / mp
                  </div>
                )}
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
