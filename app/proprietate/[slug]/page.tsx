import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import ContactDetaliu from "@/components/ContactDetaliu"
import OfferSubmissionPanel from "@/components/OfferSubmissionPanel"
import PropertyDecisionPanel from "@/components/PropertyDecisionPanel"
import ProprietateCard from "@/components/ProprietateCard"
import Link from "next/link"
import type { Metadata } from "next"
import { documentChecklist, estimateMonthlyPayment, zoneProfiles } from "@/lib/experience"
import { buildOfferDraft, buildViewingSlots, calculateValuation } from "@/lib/complexity"

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

  const { data: similare } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "PUBLISHED")
    .eq("city", p.city)
    .neq("id", p.id)
    .limit(3)

  const galerie = DEFAULT_IMAGES[p.type] || DEFAULT_IMAGES.APARTMENT
  const pret = `EUR ${p.price.toLocaleString("ro-RO")}`
  const pricePerMeter = p.area_sqm > 0 && p.price > 0 ? Math.round(p.price / p.area_sqm).toLocaleString("ro-RO") : null
  const estimatedMonthly = p.price > 0 ? estimateMonthlyPayment(p.price).toLocaleString("ro-RO") : null
  const matchScore = Math.min(98, 62 + (p.featured ? 12 : 0) + (p.parking_spots > 0 ? 8 : 0) + (p.rooms >= 3 ? 8 : 0))
  const zone = zoneProfiles.find((item) => p.city?.toLowerCase().includes(item.name.toLowerCase().split(" ")[0]))
  const valuation = calculateValuation({ area: p.area_sqm || 80, rooms: p.rooms || 2, zone: p.city || "Bucuresti Nord", condition: p.featured ? "premium" : "bun", parking: p.parking_spots || 0 })
  const offer = buildOfferDraft({ propertyTitle: p.title, listPrice: p.price, clientBudget: p.price, advancePercent: 20, closingDays: 30, riskLevel: valuation.market.risk as "scazut" | "mediu" | "ridicat" })
  const slots = buildViewingSlots("normal")
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Residence",
    name: p.title,
    address: `${p.address}, ${p.city}`,
    floorSize: { "@type": "QuantitativeValue", value: p.area_sqm, unitCode: "MTK" },
    numberOfRooms: p.rooms,
    offers: { "@type": "Offer", price: p.price, priceCurrency: p.currency || "EUR", availability: "https://schema.org/InStock" },
  }

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
            <div className="grid gap-4 mt-6 md:grid-cols-3">
              {[
                { title: "Verificare", text: "Discutam actele si contextul proprietatii inainte de vizionare." },
                { title: "Comparatie", text: "Comparam pretul cu zona, suprafata si alternativele active." },
                { title: "Urmatorul pas", text: "Stabilim vizionare, oferta sau evaluare, fara presiune inutila." },
              ].map((item) => (
                <div key={item.title} className="rounded-lg border border-bg-surface bg-bg-card p-5">
                  <h3 className="font-bold text-text-primary">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-bg-surface bg-bg-card p-5">
                <p className="text-xs uppercase tracking-wider text-text-muted">Scor potrivire</p>
                <p className="mt-2 text-4xl font-black text-accent">{matchScore}</p>
                <p className="mt-2 text-sm text-text-muted">Calcul orientativ dupa selectie HQS, camere, parcare si pozitionare.</p>
              </div>
              <div className="rounded-lg border border-bg-surface bg-bg-card p-5">
                <p className="text-xs uppercase tracking-wider text-text-muted">Checklist acte</p>
                <p className="mt-2 text-2xl font-black text-text-primary">{documentChecklist.length} pasi</p>
                <p className="mt-2 text-sm text-text-muted">Verificare documente inainte de oferta sau avans.</p>
              </div>
              <div className="rounded-lg border border-bg-surface bg-bg-card p-5">
                <p className="text-xs uppercase tracking-wider text-text-muted">Zona</p>
                <p className="mt-2 text-2xl font-black text-text-primary">{zone?.name || p.city}</p>
                <p className="mt-2 text-sm text-text-muted">{zone ? `Pret mediu zona: EUR ${zone.avgPrice}/mp` : "Analiza locala disponibila la cerere."}</p>
              </div>
            </div>
            <div className="mt-6 rounded-lg border border-bg-surface bg-bg-card p-6">
              <h2 className="text-lg font-semibold text-text-primary">Documente si risc</h2>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {documentChecklist.map((item) => <span key={item} className="rounded-lg bg-bg-secondary px-3 py-2 text-sm text-text-muted">{item}</span>)}
              </div>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <div className="rounded-lg border border-bg-surface bg-bg-card p-5">
                <p className="text-xs font-bold uppercase text-text-muted">Evaluare HQS</p>
                <p className="mt-2 text-2xl font-black text-accent">EUR {valuation.mid.toLocaleString("ro-RO")}</p>
                <p className="mt-2 text-sm text-text-muted">Interval realist: EUR {valuation.low.toLocaleString("ro-RO")} - EUR {valuation.high.toLocaleString("ro-RO")}.</p>
              </div>
              <div className="rounded-lg border border-bg-surface bg-bg-card p-5">
                <p className="text-xs font-bold uppercase text-text-muted">Oferta recomandata</p>
                <p className="mt-2 text-2xl font-black text-accent">EUR {offer.recommended.toLocaleString("ro-RO")}</p>
                <p className="mt-2 text-sm text-text-muted">Avans orientativ: EUR {offer.advance.toLocaleString("ro-RO")}.</p>
              </div>
              <div className="rounded-lg border border-bg-surface bg-bg-card p-5">
                <p className="text-xs font-bold uppercase text-text-muted">Vizionare</p>
                <p className="mt-2 text-lg font-black text-text-primary">{slots[0].label}</p>
                <p className="mt-2 text-sm text-text-muted">Slot recomandat automat, scor {slots[0].score}%.</p>
              </div>
            </div>
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
                {estimatedMonthly && (
                  <div className="mt-5 rounded-lg bg-bg-secondary p-4">
                    <div className="text-xs uppercase tracking-wider text-text-muted">Rata orientativa</div>
                    <div className="mt-1 text-xl font-black text-text-primary">EUR {estimatedMonthly}/luna</div>
                    <p className="mt-1 text-xs text-text-muted">Calcul rapid: 20% avans, 25 ani, fara costuri bancare incluse.</p>
                  </div>
                )}
              </div>
              <PropertyDecisionPanel property={p} />
              <ContactDetaliu proprietate={p.title} propertyId={p.id} />
              <OfferSubmissionPanel propertyId={p.id} propertyTitle={p.title} listPrice={Number(p.price || 0)} />
            </div>
          </div>
        </div>
        {similare && similare.length > 0 && (
          <section className="mt-14 border-t border-bg-surface pt-10">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-text-primary">Proprietati similare in {p.city}</h2>
                <p className="text-sm text-text-muted">Alternative apropiate, utile pentru comparatie inainte de vizionare.</p>
              </div>
              <Link href="/proprietati" className="text-sm font-bold text-accent">Vezi tot portofoliul</Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {similare.map((item) => <ProprietateCard key={item.id} proprietate={item} />)}
            </div>
          </section>
        )}
      </div>
      <Footer />
    </main>
  )
}
