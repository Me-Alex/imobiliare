import Link from 'next/link'
import { ArrowRight, CalendarDays, ShieldCheck } from 'lucide-react'

type CmsEntry = {
  content?: {
    headline?: string
    body?: string
    primary_cta?: string
    secondary_cta?: string
    stats?: { num: string; label: string }[]
  }
}

const heroImage = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1800&q=82'

export default function Hero({ entry }: { entry?: CmsEntry | null }) {
  const stats = entry?.content?.stats || [
    { num: '2+', label: 'Oferte verificate' },
    { num: '24h', label: 'Raspuns rapid' },
    { num: '1:1', label: 'Discutie directa' },
    { num: '0', label: 'Presiune inutila' },
  ]

  return (
    <section className="relative isolate min-h-[760px] overflow-hidden bg-bg-primary px-4">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt=""
          className="h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,9,10,0.88),rgba(5,9,10,0.58)_44%,rgba(5,9,10,0.2))]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-bg-primary to-transparent" />
      </div>

      <div className="relative mx-auto flex min-h-[760px] max-w-7xl flex-col justify-between pb-10 pt-28">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-end">
          <div className="max-w-4xl">
            <h1 className="max-w-4xl text-4xl font-black leading-[0.98] text-white md:text-6xl lg:text-7xl">
              {entry?.content?.headline || 'Proprietati alese cu grija, pentru decizii luate in liniste.'}
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/78 md:text-xl">
              {entry?.content?.body || 'Selectam ofertele care merita vazute, verificam detaliile importante si discutam deschis despre pret, zona si pasii urmatori.'}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/proprietati"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-black text-bg-primary shadow-[0_18px_40px_rgb(64_218_138/0.22)] transition-transform hover:-translate-y-0.5"
              >
                {entry?.content?.primary_cta || 'Vezi proprietati'}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/contact"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/8 px-6 py-3 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white hover:text-black"
              >
                {entry?.content?.secondary_cta || 'Cere o recomandare'}
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/12 bg-white/10 p-5 text-white shadow-[var(--shadow-card)] backdrop-blur-xl">
            <div className="flex items-start gap-3 border-b border-white/12 pb-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-accent" aria-hidden />
              <div>
                <p className="text-sm font-black">Curatoriat HQS</p>
                <p className="mt-1 text-sm leading-6 text-white/68">Fiecare proprietate este prezentata cu context de pret, zona si pas urmator.</p>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-5 w-5 text-accent" aria-hidden />
              <div>
                <p className="text-sm font-black">Vizionari fara presiune</p>
                <p className="mt-1 text-sm leading-6 text-white/68">Confirmam rapid disponibilitatea si explicam ce merita verificat inainte.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map(({ num, label }) => (
            <div key={label} className="rounded-2xl border border-white/12 bg-bg-card/92 p-5 text-left shadow-[var(--shadow-card)] backdrop-blur">
              <div className="text-2xl font-black text-accent md:text-3xl">{num}</div>
              <div className="mt-1 text-sm leading-5 text-text-muted">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
