'use client'

import { useState, type FormEvent } from 'react'
import { Building2, Mail, Phone, MapPin, Facebook, Instagram, Linkedin, Send, ArrowUp, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useAppStore, type PageKey } from '@/store/use-app-store'
import { isValidEmail } from '@/lib/validators'
import { useCoinActions } from '@/hooks/use-coin-actions'
import { LS_KEYS } from '@/lib/constants'



const quickLinks: { label: string; page: PageKey }[] = [
  { label: 'Acasa', page: 'acasa' },
  { label: 'Proprietati', page: 'proprietati' },
  { label: 'Analiza Piata', page: 'analiza' },
  { label: 'Zone', page: 'zone' },
  { label: 'Servicii', page: 'servicii' },
  { label: 'Calculator Ipotecar', page: 'calculator' },
  { label: 'Despre Noi', page: 'de-ce-noi' },
]

const propertyTypes = ['Apartamente', 'Case', 'Vile', 'Terenuri', 'Spatii Comerciale', 'Garsoniere']

const searchTerms = [
  { label: 'Apartamente 2 camere', type: 'APARTMENT', rooms: 2 },
  { label: 'Garsoniere Pipera', type: 'APARTMENT', rooms: 1, zone: 'Pipera' },
  { label: 'Case Militari', type: 'HOUSE', zone: 'Militari' },
  { label: 'Vile Nord', type: 'VILLA', query: 'Nord' },
  { label: 'Terenuri Pipera', type: 'LAND', zone: 'Pipera' },
  { label: 'Inchiriere Floreasca', transaction: 'RENT', zone: 'Floreasca' },
  { label: 'Apartamente 3 camere', type: 'APARTMENT', rooms: 3 },
  { label: 'Spatii Comerciale', type: 'COMMERCIAL' },
  { label: 'Vanzare Dorobanti', transaction: 'SALE', zone: 'Dorobanti' },
] as const

export function SiteFooter() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    navigateTo,
    setSelectedType,
    setSelectedZone,
    setSearchQuery,
    setRooms,
    setTransaction,
  } = useAppStore()
  const { onNewsletter } = useCoinActions()

  const handleNewsletterSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setEmailError('Te rog introdu o adresa de email.')
      return
    }
    if (!isValidEmail(email)) {
      setEmailError('Te rog introdu o adresa de email valida.')
      return
    }
    setEmailError('')
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Eroare la abonare.')
      }
      const data = await res.json()
      toast.success(data.message || 'Multumim pentru abonare!', {
        description: 'Vei primi noutatile pe ' + email,
      })
      setEmail('')
      // Earn coins for newsletter
      void onNewsletter()
    } catch (error) {
      toast.error('Eroare', {
        description: error instanceof Error ? error.message : 'Va rugam incercati din nou.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePropertyTypeClick = (type: string) => {
    const typeMap: Record<string, string> = {
      'Apartamente': 'APARTMENT',
      'Case': 'HOUSE',
      'Vile': 'VILLA',
      'Terenuri': 'LAND',
      'Spatii Comerciale': 'COMMERCIAL',
      'Garsoniere': 'APARTMENT',
    }
    const mappedType = typeMap[type] || ''
    setSelectedType(mappedType)
    setRooms(type === 'Garsoniere' ? 1 : 0)
    setSelectedZone('')
    setSearchQuery('')
    setTransaction('')
    navigateTo('proprietati')
  }

  const handleSearchTermClick = (term: (typeof searchTerms)[number]) => {
    setSelectedType('type' in term ? term.type : '')
    setSelectedZone('zone' in term ? term.zone : '')
    setSearchQuery('query' in term ? term.query : '')
    setRooms('rooms' in term ? term.rooms : 0)
    setTransaction('transaction' in term ? term.transaction : '')
    navigateTo('proprietati')
  }

  const handleContactClick = () => {
    navigateTo('acasa')
    window.requestAnimationFrame(() => {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
    })
  }

  const handleCookiePreferences = () => {
    localStorage.removeItem(LS_KEYS.COOKIES_ACCEPTED)
    window.dispatchEvent(new StorageEvent('storage', { key: LS_KEYS.COOKIES_ACCEPTED }))
  }

  return (
    <footer id="contact" className="mt-auto border-t bg-muted/30 relative overflow-hidden">
      {/* Decorative gradient line at the very top */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{
        background: 'linear-gradient(90deg, transparent 0%, oklch(0.527 0.14 160 / 40%) 30%, oklch(0.65 0.17 140 / 40%) 50%, oklch(0.527 0.14 160 / 40%) 70%, transparent 100%)',
      }} />
      {/* Watermark text */}
      <span className="footer-watermark select-none" aria-hidden="true">
        hqsimobiliare
      </span>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Company info */}
          <div className="sm:col-span-2 lg:col-span-1">
            <button
              onClick={() => navigateTo('acasa')}
              className="flex items-center gap-2 mb-4 group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                HQS <span className="gradient-text">Imobiliare</span>
              </span>
            </button>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Platforma de analiza imobiliara pentru Bucuresti. Date verificate, tendinte de piata si proprietati premium intr-un singur loc.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+40 21 123 4567</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>contact@hqsimobiliare.ro</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Bucuresti, Romania</span>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="transition-colors duration-300">
            <h3 className="font-semibold mb-4">Legaturi Rapide</h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => navigateTo(link.page)}
                    className="link-underline text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:pl-1 text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={handleContactClick}
                  className="link-underline text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:pl-1 text-left"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Cautare Rapida - popular search terms */}
          <div className="transition-colors duration-300">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              Cautare Rapida
            </h3>
            <div className="flex flex-wrap gap-2">
              {searchTerms.map((term) => (
                <button
                  key={term.label}
                  type="button"
                  onClick={() => handleSearchTermClick(term)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 hover:pl-4"
                >
                  {term.label}
                </button>
              ))}
            </div>
          </div>

          {/* Property types */}
          <div className="transition-colors duration-300">
            <h3 className="font-semibold mb-4">Tipuri Proprietati</h3>
            <ul className="space-y-2.5">
              {propertyTypes.map((link) => (
                <li key={link}>
                  <button
                    onClick={() => handlePropertyTypeClick(link)}
                    className="link-underline text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:pl-1 text-left"
                  >
                    {link}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold mb-4">Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Primeste cele mai noi tendinte si oferte direct in inbox-ul tau.
            </p>
            <form onSubmit={handleNewsletterSubmit} noValidate>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="email"
                  placeholder="adresa@email.ro"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailError) setEmailError('')
                  }}
                  className="h-10 pl-10 pr-12"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 shrink-0 rounded-lg"
                  aria-label="Aboneaza-te"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </Button>
              </div>
              {emailError && (
                <p className="mt-1.5 text-xs text-destructive">{emailError}</p>
              )}
            </form>
            <div className="flex gap-3 mt-6">
              <Button variant="ghost" size="icon" className="h-9 w-9 transition-transform hover:scale-110 hover:text-[#1877F2]" aria-label="Facebook">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 transition-transform hover:scale-110 hover:text-[#E4405F]" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 transition-transform hover:scale-110 hover:text-[#0A66C2]" aria-label="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p className="animate-[fadeInUp_0.6s_ease-out_forwards]">&copy; {new Date().getFullYear()} HQS Imobiliare. Toate drepturile rezervate.</p>
          <div className="flex items-center gap-4">
            <a href="/confidentialitate" className="link-underline hover:text-foreground transition-colors">Politica de confidentialitate</a>
            <button type="button" onClick={handleCookiePreferences} className="link-underline hover:text-foreground transition-colors">Preferinte cookies</button>
            <Separator orientation="vertical" className="hidden sm:block h-4" />
            <button
              type="button"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Inapoi sus"
            >
              <ArrowUp className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Sus</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
