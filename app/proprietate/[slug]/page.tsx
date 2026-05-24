import Link from "next/link"
import BackButton from "@/components/BackButton"
import type { Metadata } from "next"
import type { ReactNode } from "react"
import { notFound } from "next/navigation"
import { ArrowLeft, Bath, BedDouble, CalendarDays, Car, FileCheck2, Home, MapPin, Ruler, ShieldCheck, Tag, TrendingUp } from "lucide-react"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import ContactDetaliu from "@/components/ContactDetaliu"
import OfferSubmissionPanel from "@/components/OfferSubmissionPanel"
import PropertyDecisionPanel from "@/components/PropertyDecisionPanel"
import ProprietateCard from "@/components/ProprietateCard"
import SmartPropertyImage from "@/components/SmartPropertyImage"
import PropertyGallery from "@/components/PropertyGallery"
import { supabase, type Property } from "@/lib/supabase"
import { documentChecklist, estimateMonthlyPayment, zoneProfiles } from "@/lib/experience"
import { buildOfferDraft, buildViewingSlots, calculateValuation } from "@/lib/complexity"
import { getPropertyMedia } from "@/lib/property-media"
import { loadMarketData } from "@/lib/market-data"


const TIP_LABEL: Record<string, string> = {
  APARTMENT: "Apartament",
  HOUSE: "Casa",
  VILLA: "Vila",
  LAND: "Teren",
  COMMERCIAL: "Comercial",
}

type PropertyPageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PropertyPageProps): Promise<Metadata> {
  const { slug } = await params
  const { data } = await supabase
    .from("properties")
    .select("title,description,city,slug,status,cover_image_url,gallery_urls")
    .eq("slug", slug)
    .maybeSingle()
  if (!data || data.status !== "PUBLISHED") {
    return {
      title: "Proprietate negasita",
      robots: { index: false, follow: false },
    }
  }
  const image = data.cover_image_url || (Array.isArray(data.gallery_urls) ? data.gallery_urls[0] : null) || "/images/hqs-hero.png"
  const description = data.description?.slice(0, 160) || `Proprietate in ${data.city}`
  return {
    title: `${data.title} | HQS Imobiliare`,
    description,
    alternates: { canonical: `/proprietate/${data.slug}` },
    openGraph: {
      title: `${data.title} | HQS Imobiliare`,
      description,
      url: `/proprietate/${data.slug}`,
      images: [{ url: image, width: 1200, height: 630, alt: data.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${data.title} | HQS Imobiliare`,
      description,
      images: [image],
    },
  }
}

export default async function PaginaProprietate({ params }: PropertyPageProps) {
  const { slug } = await params
  const { data } = await supabase.from("properties").select("*").eq("slug", slug).single()
  if (!data) notFound()

  const p = data as Property
  const { data: similare } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "PUBLISHED")
    .eq("city", p.city)
    .neq("id", p.id)
    .limit(3)

  const media = getPropertyMedia(p)
  const galerie = media.gallery
  const pret = `EUR ${p.price.toLocaleString("ro-RO")}`
  const pricePerMeter = p.area_sqm > 0 && p.price > 0 ? Math.round(p.price / p.area_sqm).toLocaleString("ro-RO") : null
  const estimatedMonthly = p.price > 0 ? estimateMonthlyPayment(p.price).toLocaleString("ro-RO") : null
  const matchScore = Math.min(98, 62 + (p.featured ? 12 : 0) + (p.parking_spots > 0 ? 8 : 0) + (p.rooms >= 3 ? 8 : 0))
  const zone = zoneProfiles.find((item) => p.city?.toLowerCase().includes(item.name.toLowerCase().split(" ")[0]))
  const marketRows = await loadMarketData()
  const valuation = calculateValuation(
    { area: p.area_sqm || 80, rooms: p.rooms || 2, zone: p.city || "Bucuresti Nord", condition: p.featured ? "premium" : "bun", parking: p.parking_spots || 0 },
    marketRows,
  )
  const offer = buildOfferDraft({ propertyTitle: p.title, listPrice: p.price, clientBudget: p.price, advancePercent: 20, closingDays: 30, riskLevel: valuation.market.risk as "scazut" | "mediu" | "ridicat" })
  const fallbackSlots = buildViewingSlots("normal")
  const nowIso = new Date().toISOString()
  const { data: nextSlot } = await supabase
    .from("appointment_slots")
    .select("starts_at, agent_email")
    .eq("status", "AVAILABLE")
    .eq("property_id", p.id)
    .gte("starts_at", nowIso)
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  const viewingValue = nextSlot?.starts_at
    ? new Date(nextSlot.starts_at).toLocaleString("ro-RO")
    : fallbackSlots[0]?.label
  const viewingText = nextSlot?.starts_at
    ? `Slot disponibil real${nextSlot.agent_email ? ` (${nextSlot.agent_email})` : ""}.`
    : `Slot recomandat automat, scor ${fallbackSlots[0]?.score ?? 0}%.`
  const siteBase = process.env.NEXT_PUBLIC_SITE_URL || "https://hqsimobiliare.ro"
  const jsonLdResidence = {
    "@context": "https://schema.org",
    "@type": "Residence",
    name: p.title,
    address: `${p.address}, ${p.city}`,
    floorSize: { "@type": "QuantitativeValue", value: p.area_sqm, unitCode: "MTK" },
    numberOfRooms: p.rooms,
    offers: { "@type": "Offer", price: p.price, priceCurrency: p.currency || "EUR", availability: "https://schema.org/InStock" },
  }
  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "HQS Imobiliare", item: siteBase },
      { "@type": "ListItem", position: 2, name: "Proprietati", item: `${siteBase}/proprietati` },
      { "@type": "ListItem", position: 3, name: p.city, item: `${siteBase}/proprietati?zone=${encodeURIComponent(p.city)}` },
      { "@type": "ListItem", position: 4, name: p.title, item: `${siteBase}/proprietate/${p.slug}` },
    ],
  }

  return (
    <main id="continut">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdResidence) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />
      <Header />

      <section className="border-b border-bg-surface bg-bg-primary px-4 py-8 md:py-12">
        <div className="mx-auto max-w-7xl">
          {/* Breadcrumbs vizuale */}
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-text-muted">
            <Link href="/" className="hover:text-accent transition-colors">Acasa</Link>
            <span aria-hidden>/</span>
            <Link href="/proprietati" className="hover:text-accent transition-colors">Proprietati</Link>
            <span aria-hidden>/</span>
            <Link href={`/proprietati?zone=${encodeURIComponent(p.city)}`} className="hover:text-accent transition-colors">{p.city}</Link>
            <span aria-hidden>/</span>
            <span className="text-text-primary font-semibold line-clamp-1 max-w-[200px]">{p.title}</span>
          </nav>
          <BackButton defaultHref="/proprietati" label="Inapoi la rezultate" className="mb-4" />

          <div className="grid gap-8 lg:grid-cols-[1fr_390px] lg:items-end">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-black text-bg-primary">De vanzare</span>
                <span className="rounded-full border border-bg-surface bg-bg-card px-3 py-1 text-xs font-bold text-text-muted">{TIP_LABEL[p.type] || p.type}</span>
                {p.featured && <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-black text-accent">Selectata HQS</span>}
              </div>
              <h1 className="max-w-4xl text-3xl font-black leading-tight text-text-primary md:text-5xl">{p.title}</h1>
              <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-text-muted md:text-base">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden />
                {p.address}, {p.city}, {p.county}
              </p>
            </div>

            <div className="rounded-2xl border border-bg-surface bg-bg-card p-5 shadow-[var(--shadow-card)]">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">Pret listare</p>
              <p className="mt-2 text-4xl font-black text-accent">{pret}</p>
              {pricePerMeter && <p className="mt-2 text-sm text-text-muted">Aproximativ EUR {pricePerMeter} / mp</p>}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div>
            <PropertyGallery
              cover={media.cover}
              fallbackCover={media.fallbackCover}
              gallery={galerie}
              title={p.title}
              totalCount={galerie.length + 1}
            />

            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Fact icon={<Ruler className="h-5 w-5" />} label="Suprafata" value={`${p.area_sqm} mp`} />
              <Fact icon={<BedDouble className="h-5 w-5" />} label="Camere" value={p.rooms > 0 ? String(p.rooms) : "-"} />
              <Fact icon={<Bath className="h-5 w-5" />} label="Bai" value={p.bathrooms > 0 ? String(p.bathrooms) : "-"} />
              <Fact icon={<Car className="h-5 w-5" />} label="Parcare" value={p.parking_spots > 0 ? String(p.parking_spots) : "-"} />
            </div>

            {p.description && (
              <section className="mt-8 rounded-3xl border border-bg-surface bg-bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
                <div className="flex items-center gap-3">
                  <Home className="h-5 w-5 text-accent" aria-hidden />
                  <h2 className="text-xl font-black text-text-primary">Descriere</h2>
                </div>
                <p className="mt-5 whitespace-pre-line text-sm leading-7 text-text-muted md:text-base">{p.description}</p>
              </section>
            )}

            <section className="mt-8 grid gap-4 md:grid-cols-3">
              <Insight icon={<ShieldCheck className="h-5 w-5" />} title="Verificare" text="Discutam actele si contextul proprietatii inainte de vizionare." />
              <Insight icon={<TrendingUp className="h-5 w-5" />} title="Comparatie" text="Comparam pretul cu zona, suprafata si alternativele active." />
              <Insight icon={<CalendarDays className="h-5 w-5" />} title="Urmatorul pas" text="Stabilim vizionare, oferta sau evaluare, fara presiune inutila." />
            </section>

            <section className="mt-8 rounded-3xl border border-bg-surface bg-bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">Analiza rapida</p>
                  <h2 className="mt-2 text-2xl font-black text-text-primary">Context pentru decizie</h2>
                </div>
                <p className="text-sm text-text-muted">Date orientative pentru shortlist si discutia de vizionare.</p>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <Metric title="Scor potrivire" value={String(matchScore)} text="Calcul dupa selectie HQS, camere, parcare si pozitionare." />
                <Metric title="Checklist acte" value={`${documentChecklist.length} pasi`} text="Verificare documente inainte de oferta sau avans." />
                <Metric title="Zona" value={zone?.name || p.city} text={zone ? `Pret mediu zona: EUR ${zone.avgPrice}/mp` : "Analiza locala disponibila la cerere."} />
              </div>
            </section>

            <section className="mt-8 rounded-3xl border border-bg-surface bg-bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
              <div className="flex items-center gap-3">
                <FileCheck2 className="h-5 w-5 text-accent" aria-hidden />
                <h2 className="text-xl font-black text-text-primary">Documente si risc</h2>
              </div>
              <div className="mt-5 grid gap-2 md:grid-cols-2">
                {documentChecklist.map((item) => (
                  <span key={item} className="rounded-xl border border-bg-surface bg-bg-secondary px-3 py-2 text-sm text-text-muted">{item}</span>
                ))}
              </div>
            </section>

            <section className="mt-8 grid gap-4 lg:grid-cols-3">
              <Metric title="Evaluare HQS" value={`EUR ${valuation.mid.toLocaleString("ro-RO")}`} text={`Interval realist: EUR ${valuation.low.toLocaleString("ro-RO")} - EUR ${valuation.high.toLocaleString("ro-RO")}.`} />
              <Metric title="Oferta recomandata" value={`EUR ${offer.recommended.toLocaleString("ro-RO")}`} text={`Avans orientativ: EUR ${offer.advance.toLocaleString("ro-RO")}.`} />
              <Metric title="Vizionare" value={viewingValue} text={viewingText} />
            </section>
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-3xl border border-bg-surface bg-bg-card p-6 shadow-[var(--shadow-card)]">
                <div className="flex items-start gap-3">
                  <Tag className="mt-1 h-5 w-5 text-accent" aria-hidden />
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">Pret</p>
                    <p className="mt-1 text-3xl font-black text-accent">{pret}</p>
                    <p className="mt-2 text-sm text-text-muted">{p.city}, {p.county}</p>
                  </div>
                </div>
                {estimatedMonthly && (
                  <div className="mt-5 rounded-2xl border border-bg-surface bg-bg-secondary p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-text-muted">Rata orientativa</p>
                    <p className="mt-2 text-xl font-black text-text-primary">EUR {estimatedMonthly}/luna</p>
                    <p className="mt-2 text-xs leading-5 text-text-muted">Calcul rapid: 20% avans, 25 ani, fara costuri bancare incluse.</p>
                  </div>
                )}
              </div>
              <PropertyDecisionPanel property={p} />
              <ContactDetaliu proprietate={p.title} propertyId={p.id} />
              <OfferSubmissionPanel propertyId={p.id} propertyTitle={p.title} listPrice={Number(p.price || 0)} />
            </div>
          </aside>
        </div>

        {similare && similare.length > 0 && (
          <section className="mt-16 border-t border-bg-surface pt-10">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">Alternative</p>
                <h2 className="mt-2 text-2xl font-black text-text-primary">Proprietati similare in {p.city}</h2>
                <p className="mt-2 text-sm text-text-muted">Alternative apropiate, utile pentru comparatie inainte de vizionare.</p>
              </div>
              <Link href="/proprietati" className="text-sm font-black text-accent">Vezi tot portofoliul</Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(similare as Property[]).map((item) => <ProprietateCard key={item.id} proprietate={item} />)}
            </div>
          </section>
        )}
      </div>
      <Footer />
    </main>
  )
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-bg-surface bg-bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="text-accent">{icon}</div>
      <p className="mt-3 text-2xl font-black text-text-primary">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-text-muted">{label}</p>
    </div>
  )
}

function Insight({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-bg-surface bg-bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="text-accent">{icon}</div>
      <h3 className="mt-4 font-black text-text-primary">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-text-muted">{text}</p>
    </div>
  )
}

function Metric({ title, value, text }: { title: string; value: string; text: string }) {
  return (
    <div className="rounded-2xl border border-bg-surface bg-bg-card p-5 shadow-[var(--shadow-card)]">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-text-muted">{title}</p>
      <p className="mt-3 text-2xl font-black text-accent">{value}</p>
      <p className="mt-2 text-sm leading-6 text-text-muted">{text}</p>
    </div>
  )
}
