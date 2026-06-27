import Link from "next/link"
import Image from "next/image"
import { ArrowRight, BadgeCheck, Building2, MapPin, Search, ShieldCheck } from "lucide-react"
import type { Property } from "@/lib/supabase"
import { formatCurrency } from "@/lib/format"
import { getPropertyMedia } from "@/lib/property-media"

type CmsEntry = {
  content?: {
    body?: string
    primary_cta?: string
    secondary_cta?: string
    stats?: { num: string; label: string }[]
  }
}

const heroImage = "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=78"

const zones = ["Toate zonele", "Bucuresti", "Floreasca", "Baneasa", "Pipera", "Dorobanti", "Aviatorilor", "Corbeanca"]
const propertyTypes = [
  { value: "toate", label: "Toate tipurile" },
  { value: "APARTMENT", label: "Apartament" },
  { value: "HOUSE", label: "Casa" },
  { value: "VILLA", label: "Vila" },
  { value: "LAND", label: "Teren" },
  { value: "COMMERCIAL", label: "Comercial" },
]

export default function Hero({ entry, properties = [] }: { entry?: CmsEntry | null; properties?: Property[] }) {
  const preview = [...properties].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 3)
  const stats = entry?.content?.stats || [
    { num: String(Math.max(properties.length, 12)), label: "proprietati analizate" },
    { num: "24h", label: "raspuns operational" },
    { num: "1:1", label: "consultanta dedicata" },
  ]

  return (
    <section className="relative isolate overflow-hidden bg-bg-primary">
      <div className="relative min-h-[760px] px-4 pb-12 pt-14 md:pt-20">
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,12,10,0.9),rgba(8,12,10,0.7)_34%,rgba(8,12,10,0.18)_72%)]" />
          <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-bg-primary via-bg-primary/70 to-transparent" />
        </div>

        <div className="relative mx-auto flex min-h-[690px] max-w-7xl flex-col justify-between gap-10">
          <div className="max-w-3xl pt-8 text-white md:pt-14">
            <h1 className="text-5xl font-black leading-[0.96] tracking-normal md:text-7xl lg:text-8xl">HQS Imobiliare</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/82 md:text-xl">
              {entry?.content?.body ||
                "Proprietati verificate, context de piata si consultanta clara pentru cumparatori, vanzatori si investitori din Bucuresti."}
            </p>

            <div className="mt-7 grid max-w-2xl gap-3 text-sm font-bold text-white/86 sm:grid-cols-3">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-accent" aria-hidden />
                Verificare acte
              </span>
              <span className="inline-flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-accent" aria-hidden />
                Pret explicat
              </span>
              <span className="inline-flex items-center gap-2">
                <Building2 className="h-5 w-5 text-accent" aria-hidden />
                Portofoliu curat
              </span>
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/proprietati"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-black text-bg-primary shadow-[0_18px_36px_rgb(12_100_66/0.28)] transition hover:opacity-90"
              >
                {entry?.content?.primary_cta || "Vezi proprietati"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/contact"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/28 bg-white/10 px-6 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white hover:text-text-primary"
              >
                {entry?.content?.secondary_cta || "Vorbeste cu un consultant"}
              </Link>
            </div>
          </div>

          <div className="grid gap-5">
            <form action="/proprietati" className="border border-bg-surface bg-bg-card p-4 shadow-card md:p-5">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_190px_170px_180px]">
                <label htmlFor="hero-search" className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
                  Cauta dupa zona
                  <input id="hero-search" name="q" className="h-12 border border-bg-surface bg-bg-primary px-3 text-sm font-semibold normal-case tracking-normal text-text-primary outline-none focus:border-accent" placeholder="Herestrau, Pipera, Dorobanti..." />
                </label>
                <label htmlFor="hero-zone" className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
                  Zona
                  <select id="hero-zone" name="zone" className="h-12 border border-bg-surface bg-bg-primary px-3 text-sm font-semibold normal-case tracking-normal text-text-primary outline-none focus:border-accent">
                    {zones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
                  </select>
                </label>
                <label htmlFor="hero-type" className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
                  Tip
                  <select id="hero-type" name="tip" className="h-12 border border-bg-surface bg-bg-primary px-3 text-sm font-semibold normal-case tracking-normal text-text-primary outline-none focus:border-accent">
                    {propertyTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                </label>
                <label htmlFor="hero-budget" className="grid gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
                  Buget
                  <select id="hero-budget" name="budget" className="h-12 border border-bg-surface bg-bg-primary px-3 text-sm font-semibold normal-case tracking-normal text-text-primary outline-none focus:border-accent">
                    <option value="">Fara limita</option>
                    <option value="150000">sub 150k</option>
                    <option value="250000">sub 250k</option>
                    <option value="500000">sub 500k</option>
                    <option value="1000000">sub 1M</option>
                  </select>
                </label>
                <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 self-end rounded-md bg-accent px-5 py-3 text-sm font-black text-bg-primary transition hover:opacity-90">
                  <Search className="h-4 w-4" aria-hidden />
                  Cauta
                </button>
              </div>
            </form>

            <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
              <div className="grid grid-cols-3 border border-bg-surface bg-bg-card shadow-card">
                {stats.map(({ num, label }) => (
                  <div key={label} className="border-r border-bg-surface px-4 py-4 last:border-r-0">
                    <div className="text-2xl font-black text-accent md:text-3xl">{num}</div>
                    <div className="mt-1 text-xs font-bold uppercase leading-5 tracking-[0.12em] text-text-muted">{label}</div>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {preview.length ? preview.map((property) => <HeroProperty key={property.id} property={property} />) : (
                  <div className="border border-bg-surface bg-bg-card p-4 shadow-card md:col-span-3">
                    <p className="text-sm font-black text-text-primary">Portofoliul se incarca</p>
                    <p className="mt-1 text-sm text-text-muted">Proprietatile publicate apar aici imediat dupa sincronizarea Supabase.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function HeroProperty({ property }: { property: Property }) {
  const media = getPropertyMedia(property)

  return (
    <Link href={`/proprietate/${property.slug}`} className="group grid grid-cols-[96px_1fr] overflow-hidden border border-bg-surface bg-bg-card shadow-card transition hover:border-accent">
      <div className="relative min-h-[118px] bg-bg-secondary">
        <img src={media.cover} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" decoding="async" />
      </div>
      <div className="p-4">
        <p className="line-clamp-2 text-sm font-black leading-5 text-text-primary">{property.title}</p>
        <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-text-muted">
          <MapPin className="h-3.5 w-3.5 text-accent" aria-hidden />
          {property.city || "Bucuresti"}
        </p>
        <p className="mt-3 text-base font-black text-accent">{formatCurrency(property.price)}</p>
      </div>
    </Link>
  )
}
