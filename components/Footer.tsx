import Link from "next/link"
import { Mail, MapPin, Phone } from "lucide-react"

const nav = [
  { href: "/proprietati", label: "Proprietati" },
  { href: "/zone", label: "Zone" },
  { href: "/despre", label: "Despre" },
  { href: "/contact", label: "Contact" },
]

export default function Footer() {
  return (
    <footer className="border-t border-bg-surface bg-bg-card px-4 py-12">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
        <div>
          <Link href="/" className="inline-block" aria-label="HQS Imobiliare acasa">
            <span className="block text-3xl font-black leading-none text-accent">HQS</span>
            <span className="block text-xs font-bold uppercase tracking-[0.24em] text-text-primary">Imobiliare</span>
          </Link>
          <p className="mt-5 max-w-md text-sm leading-7 text-text-muted">
            Proprietati verificate si consultanta clara pentru decizii imobiliare in Bucuresti si Ilfov.
          </p>
        </div>

        <nav className="grid gap-2 text-sm font-bold text-text-muted sm:grid-cols-2">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-md px-0 py-1 transition-colors hover:text-accent">
              {item.label}
            </Link>
          ))}
          <Link href="/login" className="rounded-md px-0 py-1 transition-colors hover:text-accent">Cont client</Link>
          <Link href="/favorite" className="rounded-md px-0 py-1 transition-colors hover:text-accent">Favorite</Link>
        </nav>

        <div className="grid gap-3 text-sm text-text-muted">
          <a href="tel:+40711993512" className="inline-flex items-center gap-3 font-bold hover:text-accent">
            <Phone className="h-4 w-4 text-accent" aria-hidden />
            +40711993512
          </a>
          <a href="mailto:hqs.imobiliare@gmail.com" className="inline-flex items-center gap-3 font-bold hover:text-accent">
            <Mail className="h-4 w-4 text-accent" aria-hidden />
            hqs.imobiliare@gmail.com
          </a>
          <p className="inline-flex items-center gap-3 font-bold">
            <MapPin className="h-4 w-4 text-accent" aria-hidden />
            Bucuresti, Romania
          </p>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-bg-surface pt-5 text-xs font-semibold uppercase tracking-[0.16em] text-text-muted md:flex-row md:items-center md:justify-between">
        <p>&copy; {new Date().getFullYear()} HQS Imobiliare. Toate drepturile rezervate.</p>
        <a href="https://wa.me/40711993512" className="hover:text-accent">WhatsApp</a>
      </div>
    </footer>
  )
}
