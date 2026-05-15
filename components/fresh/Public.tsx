import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Heart,
  Home,
  KeyRound,
  MapPin,
  Ruler,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import type { Property } from "@/lib/supabase"
import {
  formatCurrency,
  getAllZones,
  navItems,
  pricePerSqm,
  propertyGallery,
  propertyImage,
  propertyTypeLabels,
  servicePillars,
  workflowSteps,
  zoneGuides,
} from "@/lib/fresh-data"
import { ThemeToggle } from "@/components/ThemeToggle"
import { ContactLeadForm, HeroSearch, OfferAndViewing, ValuationLab } from "@/components/fresh/Workflow"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/94 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-3" aria-label="HQS Imobiliare">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-white text-sm font-black text-slate-950">HQS</span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-sm font-black tracking-normal text-white">HQS Imobiliare</span>
            <span className="block text-xs font-semibold text-slate-400">Bucuresti si Ilfov</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigatie principala">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-md px-3 py-2 text-sm font-extrabold text-slate-300 transition hover:bg-white/10 hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/admin/dashboard" prefetch={false} className="hidden rounded-md border border-white/15 px-3 py-2 text-sm font-extrabold text-slate-300 transition hover:border-white hover:text-white md:inline-flex">
            Admin
          </Link>
          <Link href="/proprietati" className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700">
            Cauta
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-12 dark:border-white/10 dark:bg-slate-950">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-slate-950 text-sm font-black text-white dark:bg-white dark:text-slate-950">HQS</span>
            <p className="text-lg font-black text-slate-950 dark:text-white">HQS Imobiliare</p>
          </div>
          <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-400">
            Platforma imobiliara reconstruita pentru cautare, verificare, ofertare, programari, portal client si administrare operationala.
          </p>
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Navigatie</p>
          <div className="mt-4 grid gap-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-bold text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300">{item.label}</Link>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Contact</p>
          <div className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <p>contact@hqsimobiliare.ro</p>
            <p>+40 700 000 000</p>
            <p>Bucuresti, Romania</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export function HomePageFresh({ properties }: { properties: Property[] }) {
  return (
    <main id="continut">
      <SiteHeader />
      <HeroSection properties={properties} />
      <ServiceSection />
      <FeaturedProperties properties={properties.slice(0, 6)} />
      <DecisionSection properties={properties} />
      <ZoneSection />
      <WorkflowSection />
      <ContactSection />
      <SiteFooter />
    </main>
  )
}

export function HeroSection({ properties }: { properties: Property[] }) {
  const featured = properties.find((item) => item.featured) || properties[0]

  return (
    <section className="relative isolate overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0">
        <img src="/images/hqs-hero-redesign.png" alt="" className="h-full w-full object-cover opacity-52" loading="eager" decoding="async" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.94),rgba(2,6,23,0.74)_42%,rgba(2,6,23,0.32))]" />
      </div>
      <div className="relative mx-auto grid min-h-[720px] max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[1fr_440px] lg:items-end">
        <div className="max-w-3xl pb-4">
          <h1 className="text-5xl font-black leading-[0.96] tracking-normal md:text-7xl lg:text-8xl">HQS Imobiliare</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-white/82 md:text-xl">
            Website reconstruit pentru decizii imobiliare clare: proprietati verificate, cautare rapida, comparare, programari, oferte si portal client.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/proprietati" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-emerald-500 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400">
              Vezi proprietatile
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/portal" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/24 bg-white/10 px-6 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white hover:text-slate-950">
              Intra in portal
            </Link>
          </div>
          <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
            {[
              ["24h", "raspuns pentru cereri"],
              [String(Math.max(properties.length, 6)), "proprietati active"],
              ["1:1", "consultanta dedicata"],
            ].map(([value, label]) => (
              <div key={label} className="border-l border-emerald-400/50 pl-4">
                <p className="text-3xl font-black text-emerald-300">{value}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-white/62">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4">
          <HeroSearch zones={getAllZones(properties)} />
          {featured ? <HeroProperty property={featured} /> : null}
        </div>
      </div>
    </section>
  )
}

function HeroProperty({ property }: { property: Property }) {
  return (
    <Link href={`/proprietate/${property.slug}`} className="group grid grid-cols-[128px_1fr] overflow-hidden rounded-md border border-white/12 bg-white text-slate-950 shadow-2xl transition hover:-translate-y-1 dark:bg-slate-900 dark:text-white">
      <img src={propertyImage(property)} alt="" className="h-full min-h-[150px] w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" decoding="async" />
      <div className="p-5">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">{propertyTypeLabels[property.type]}</p>
        <p className="mt-2 line-clamp-2 text-lg font-black leading-6">{property.title}</p>
        <p className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400"><MapPin className="h-4 w-4" />{property.city}</p>
        <p className="mt-4 text-2xl font-black text-emerald-700 dark:text-emerald-300">{formatCurrency(property.price, property.currency)}</p>
      </div>
    </Link>
  )
}

export function ServiceSection() {
  const icons = [ShieldCheck, BarChart3, ClipboardCheck, KeyRound]
  return (
    <section className="bg-white px-4 py-20 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <h2 className="text-4xl font-black tracking-normal text-slate-950 dark:text-white md:text-5xl">Functionalitati construite ca un produs complet</h2>
          <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-400">
            Fiecare flux are o suprafata vizibila in website si o actiune reala in spate: cautare, lead, programare, oferta, evaluare, favorite, comparare si administrare.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {servicePillars.map((service, index) => {
            const Icon = icons[index]
            return (
              <article key={service.title} className="rounded-md border border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:bg-white/[0.03]">
                <Icon className="h-7 w-7 text-emerald-700 dark:text-emerald-300" aria-hidden />
                <h3 className="mt-5 text-xl font-black text-slate-950 dark:text-white">{service.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{service.text}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function FeaturedProperties({ properties }: { properties: Property[] }) {
  return (
    <section className="bg-slate-100 px-4 py-20 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl">
        <SectionHead title="Selectii active" text="Proprietati prezentate cu pret, zona, suprafata, parcare si detaliile care conteaza inainte de vizionare." href="/proprietati" action="Toate proprietatile" />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => <PropertyCard key={property.id} property={property} />)}
        </div>
      </div>
    </section>
  )
}

export function PropertyCard({ property }: { property: Property }) {
  return (
    <article className="group overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-slate-950">
      <Link href={`/proprietate/${property.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-200 dark:bg-slate-800">
          <img src={propertyImage(property)} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" decoding="async" />
          <div className="absolute left-4 top-4 rounded-md bg-white/92 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-950">{propertyTypeLabels[property.type]}</div>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-black leading-6 text-slate-950 dark:text-white">{property.title}</h3>
              <p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400"><MapPin className="h-4 w-4" />{property.city}</p>
            </div>
            <Heart className="h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300" aria-hidden />
          </div>
          <p className="mt-5 text-2xl font-black text-emerald-700 dark:text-emerald-300">{formatCurrency(property.price, property.currency)}</p>
          <div className="mt-5 grid grid-cols-3 gap-2 text-sm font-extrabold text-slate-700 dark:text-slate-300">
            <span className="rounded-md bg-slate-100 px-3 py-2 dark:bg-white/5">{property.area_sqm} mp</span>
            <span className="rounded-md bg-slate-100 px-3 py-2 dark:bg-white/5">{property.rooms || "-"} cam.</span>
            <span className="rounded-md bg-slate-100 px-3 py-2 dark:bg-white/5">{property.parking_spots} parc.</span>
          </div>
        </div>
      </Link>
    </article>
  )
}

export function DecisionSection({ properties }: { properties: Property[] }) {
  return (
    <section className="bg-white px-4 py-20 dark:bg-slate-950">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <h2 className="text-4xl font-black tracking-normal text-slate-950 dark:text-white md:text-5xl">Instrumente pentru decizie, nu doar prezentare</h2>
          <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-400">
            Evaluarea, recomandarea si oferta sunt interactive. Clientul primeste un raspuns imediat, iar echipa poate continua din CRM.
          </p>
          <div className="mt-8 grid gap-3">
            {["Evaluare estimativa", "Oferta negociabila", "Recomandari dupa buget", "Programare vizionare"].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm font-black text-slate-800 dark:text-slate-200">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />
                {item}
              </div>
            ))}
          </div>
        </div>
        <ValuationLab properties={properties} />
      </div>
    </section>
  )
}

export function ZoneSection() {
  return (
    <section className="bg-slate-950 px-4 py-20 text-white">
      <div className="mx-auto max-w-7xl">
        <SectionHead title="Zone explicate operational" text="Fiecare zona are pret mediu, cerere, risc, avantaje si recomandari pentru cumparatori." href="/zone" action="Vezi toate zonele" dark />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {zoneGuides.map((zone) => (
            <Link key={zone.slug} href={`/zone/${zone.slug}`} className="rounded-md border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:border-emerald-300">
              <p className="text-2xl font-black">{zone.name}</p>
              <p className="mt-3 text-sm leading-7 text-white/68">{zone.summary}</p>
              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm font-black">
                <span>{zone.avgPrice} EUR/mp</span>
                <span className="text-emerald-300">{zone.demand}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export function WorkflowSection() {
  return (
    <section className="bg-white px-4 py-20 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <SectionHead title="Flux complet, de la cautare la contract" text="Website-ul nu se opreste la formular. Fiecare interactiune lasa o urma operationala pentru client si echipa." />
        <div className="mt-10 grid gap-4 lg:grid-cols-5">
          {workflowSteps.map((step, index) => (
            <article key={step.title} className="rounded-md border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">0{index + 1}</p>
              <h3 className="mt-5 text-xl font-black text-slate-950 dark:text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ContactSection({ property }: { property?: Property }) {
  return (
    <section className="bg-slate-100 px-4 py-20 dark:bg-slate-900">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <h2 className="text-4xl font-black tracking-normal text-slate-950 dark:text-white md:text-5xl">Spune-ne ce cauti</h2>
          <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-400">
            Formularul trimite lead-ul in fluxul operational HQS, cu sursa, buget, intentie si proprietatea asociata cand exista.
          </p>
          <div className="mt-8 grid gap-4 text-sm font-extrabold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-3"><CalendarDays className="h-5 w-5 text-emerald-600" />Raspuns rapid pentru vizionari</span>
            <span className="flex items-center gap-3"><FileText className="h-5 w-5 text-emerald-600" />Checklist acte si risc</span>
            <span className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-emerald-600" />Recomandari personalizate</span>
          </div>
        </div>
        <ContactLeadForm property={property} />
      </div>
    </section>
  )
}

export function PropertyDetailFresh({ property, similar }: { property: Property; similar: Property[] }) {
  const gallery = propertyGallery(property)
  return (
    <main id="continut">
      <SiteHeader />
      <section className="bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <Link href="/proprietati" className="inline-flex items-center gap-2 text-sm font-black text-emerald-300"><ArrowRight className="h-4 w-4 rotate-180" />Inapoi la proprietati</Link>
            <h1 className="mt-6 text-4xl font-black leading-tight tracking-normal md:text-6xl">{property.title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/72">{property.description}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <InfoPill icon={MapPin} label={property.city} />
              <InfoPill icon={Ruler} label={`${property.area_sqm} mp`} />
              <InfoPill icon={Home} label={`${property.rooms || "-"} camere`} />
              <InfoPill icon={Building2} label={propertyTypeLabels[property.type]} />
            </div>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-white/50">Pret listat</p>
            <p className="mt-3 text-4xl font-black text-emerald-300">{formatCurrency(property.price, property.currency)}</p>
            <p className="mt-2 text-sm text-white/62">{pricePerSqm(property).toLocaleString("ro-RO")} EUR/mp estimat</p>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center text-sm font-black">
              <span className="rounded-md bg-white/10 p-3">{property.bathrooms} bai</span>
              <span className="rounded-md bg-white/10 p-3">{property.parking_spots} parc.</span>
              <span className="rounded-md bg-white/10 p-3">{property.featured ? "HQS" : "Activ"}</span>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-white px-4 py-8 dark:bg-slate-950">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <img src={gallery[0]} alt="" className="h-[520px] w-full rounded-md object-cover" loading="eager" decoding="async" />
          <div className="grid gap-4">
            {gallery.slice(1, 3).map((image) => <img key={image} src={image} alt="" className="h-[252px] w-full rounded-md object-cover" loading="lazy" decoding="async" />)}
          </div>
        </div>
      </section>
      <section className="bg-white px-4 py-16 dark:bg-slate-950">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <h2 className="text-3xl font-black text-slate-950 dark:text-white">Analiza proprietatii</h2>
            {[
              ["Pret/mp", `${pricePerSqm(property).toLocaleString("ro-RO")} EUR/mp`],
              ["Zona", property.city],
              ["Potrivire", property.featured ? "prioritate HQS" : "lista activa"],
              ["Documente", "verificare recomandata inainte de oferta"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-md border border-slate-200 p-4 text-sm dark:border-white/10">
                <span className="font-extrabold text-slate-500 dark:text-slate-400">{label}</span>
                <span className="font-black text-slate-950 dark:text-white">{value}</span>
              </div>
            ))}
          </div>
          <OfferAndViewing property={property} />
        </div>
      </section>
      <FeaturedProperties properties={similar} />
      <SiteFooter />
    </main>
  )
}

export function ZoneIndexFresh() {
  return (
    <main id="continut">
      <SiteHeader />
      <section className="bg-white px-4 py-20 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-5xl font-black tracking-normal text-slate-950 dark:text-white md:text-7xl">Zone imobiliare</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-400">Ghiduri scurte pentru zonele unde HQS lucreaza activ: pret/mp, cerere, risc si argumente de decizie.</p>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {zoneGuides.map((zone) => <ZoneCard key={zone.slug} zone={zone} />)}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}

export function ZoneDetailFresh({ slug }: { slug: string }) {
  const zone = zoneGuides.find((item) => item.slug === slug) || zoneGuides[0]
  return (
    <main id="continut">
      <SiteHeader />
      <section className="bg-slate-950 px-4 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-5xl font-black tracking-normal md:text-7xl">{zone.name}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">{zone.headline}. {zone.summary}</p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Metric label="Pret mediu" value={`${zone.avgPrice} EUR/mp`} />
            <Metric label="Cerere" value={zone.demand} />
            <Metric label="Risc" value={zone.risk} />
          </div>
        </div>
      </section>
      <section className="bg-white px-4 py-16 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-black text-slate-950 dark:text-white">Puncte forte</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {zone.strengths.map((strength) => <div key={strength} className="rounded-md border border-slate-200 p-5 text-sm font-black text-slate-800 dark:border-white/10 dark:text-slate-200">{strength}</div>)}
          </div>
        </div>
      </section>
      <ContactSection />
      <SiteFooter />
    </main>
  )
}

export function AboutFresh() {
  return (
    <main id="continut">
      <SiteHeader />
      <section className="bg-white px-4 py-20 dark:bg-slate-950">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <h1 className="text-5xl font-black leading-tight tracking-normal text-slate-950 dark:text-white md:text-7xl">Agentie imobiliara operata ca un produs digital</h1>
            <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-400">HQS combina consultanta imobiliara cu date, automatizari, portal client si CRM intern. Reconstruirea website-ului face aceste fluxuri vizibile si usor de folosit.</p>
          </div>
          <div className="grid gap-4">
            {servicePillars.map((item) => <div key={item.title} className="rounded-md border border-slate-200 p-6 dark:border-white/10"><h2 className="text-xl font-black text-slate-950 dark:text-white">{item.title}</h2><p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{item.text}</p></div>)}
          </div>
        </div>
      </section>
      <WorkflowSection />
      <SiteFooter />
    </main>
  )
}

export function ContactFresh() {
  return (
    <main id="continut">
      <SiteHeader />
      <ContactSection />
      <SiteFooter />
    </main>
  )
}

function ZoneCard({ zone }: { zone: (typeof zoneGuides)[number] }) {
  return (
    <Link href={`/zone/${zone.slug}`} className="rounded-md border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.03]">
      <h2 className="text-2xl font-black text-slate-950 dark:text-white">{zone.name}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{zone.summary}</p>
      <div className="mt-5 flex items-center justify-between text-sm font-black text-slate-700 dark:text-slate-300">
        <span>{zone.avgPrice} EUR/mp</span>
        <span className="text-emerald-700 dark:text-emerald-300">{zone.demand}</span>
      </div>
    </Link>
  )
}

function SectionHead({ title, text, href, action, dark = false }: { title: string; text: string; href?: string; action?: string; dark?: boolean }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <h2 className={`text-4xl font-black tracking-normal md:text-5xl ${dark ? "text-white" : "text-slate-950 dark:text-white"}`}>{title}</h2>
        <p className={`mt-4 text-base leading-8 ${dark ? "text-white/68" : "text-slate-600 dark:text-slate-400"}`}>{text}</p>
      </div>
      {href && action ? <Link href={href} className={`inline-flex items-center gap-2 text-sm font-black ${dark ? "text-emerald-300" : "text-emerald-700 dark:text-emerald-300"}`}>{action}<ArrowRight className="h-4 w-4" /></Link> : null}
    </div>
  )
}

function InfoPill({ icon: Icon, label }: { icon: typeof MapPin; label: string }) {
  return <span className="inline-flex items-center gap-2 rounded-md border border-white/12 bg-white/10 px-3 py-2 text-sm font-black text-white"><Icon className="h-4 w-4 text-emerald-300" />{label}</span>
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-6">
      <p className="text-sm font-black uppercase tracking-[0.16em] text-white/50">{label}</p>
      <p className="mt-3 text-3xl font-black text-emerald-300">{value}</p>
    </div>
  )
}
