'use client'

import { useRef, useState, type FormEvent } from 'react'
import { writeBrowserPreference } from '@/lib/storage'
import { Building2, Mail, Phone, MapPin, ArrowUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useAppStore } from '@/store/use-app-store'
import { isValidEmail } from '@/lib/validators'
import { LS_KEYS } from '@/lib/constants'
import { PUBLIC_NAVIGATION } from '@/lib/navigation-config'

const propertyTypes = ['Apartamente', 'Case', 'Vile', 'Terenuri', 'Spații comerciale', 'Apartamente 1+ cameră']

const preferredScrollBehavior = (): ScrollBehavior => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'

const searchTerms = [
  { label: 'Apartamente 2+ camere', type: 'APARTMENT', rooms: 2 },
  { label: 'Apartamente 1+ cameră în Pipera', type: 'APARTMENT', rooms: 1, zone: 'Pipera' },
  { label: 'Case Militari', type: 'HOUSE', zone: 'Militari' },
  { label: 'Vile Nord', type: 'VILLA', query: 'Nord' },
  { label: 'Terenuri Pipera', type: 'LAND', zone: 'Pipera' },
  { label: 'Închiriere Floreasca', transaction: 'RENT', zone: 'Floreasca' },
  { label: 'Apartamente 3+ camere', type: 'APARTMENT', rooms: 3 },
  { label: 'Spații comerciale', type: 'COMMERCIAL' },
  { label: 'Vânzare Dorobanți', transaction: 'SALE', zone: 'Dorobanti' },
] as const

export function SiteFooter() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newsletterResult, setNewsletterResult] = useState('')
  const submitting = useRef(false)
  const {
    navigateTo,
    resetFilters,
    setSelectedType,
    setSelectedZone,
    setSearchQuery,
    setRooms,
    setTransaction,
  } = useAppStore()

  const handleNewsletterSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting.current) return
    setNewsletterResult('')
    if (!email.trim()) {
      setEmailError('Te rog introdu o adresă de email.')
      return
    }
    if (!isValidEmail(email.trim())) {
      setEmailError('Te rog introdu o adresă de email validă.')
      return
    }
    setEmailError('')
    submitting.current = true
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
      setNewsletterResult(data.message || 'Mulțumim pentru abonare!')
      toast.success(data.message || 'Mulțumim pentru abonare!', {
        description: 'Vei primi noutățile pe ' + email.trim(),
      })
      setEmail('')
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Abonarea nu a reușit. Încearcă din nou.')
      toast.error('Eroare', {
        description: error instanceof Error ? error.message : 'Te rugăm să încerci din nou.',
      })
    } finally {
      submitting.current = false
      setIsSubmitting(false)
    }
  }

  const handlePropertyTypeClick = (type: string) => {
    const typeMap: Record<string, string> = {
      'Apartamente': 'APARTMENT',
      'Case': 'HOUSE',
      'Vile': 'VILLA',
      'Terenuri': 'LAND',
      'Spații comerciale': 'COMMERCIAL',
      'Apartamente 1+ cameră': 'APARTMENT',
    }
    resetFilters()
    const mappedType = typeMap[type] || ''
    setSelectedType(mappedType)
    setRooms(type === 'Apartamente 1+ cameră' ? 1 : 0)
    setSelectedZone('')
    setSearchQuery('')
    setTransaction('')
    navigateTo('proprietati')
  }

  const handleSearchTermClick = (term: (typeof searchTerms)[number]) => {
    resetFilters()
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
      document.getElementById('contact')?.scrollIntoView({ behavior: preferredScrollBehavior() })
    })
  }

  const handleCookiePreferences = () => {
    writeBrowserPreference(LS_KEYS.COOKIES_ACCEPTED, null)
  }

  return (
    <footer id="contact" className="mt-auto border-t bg-muted/30 relative overflow-hidden">
      <div className="relative mx-auto max-w-7xl px-4 pt-8 pb-24 sm:px-6 lg:px-8 lg:pt-10">
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {/* Company info */}
          <div className="lg:row-span-2">
            <button
              onClick={() => navigateTo('acasa')}
              className="flex min-h-11 items-center gap-2 mb-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                HQS <span>Imobiliare</span>
              </span>
            </button>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Platformă de analiză imobiliară pentru București. Date verificate, tendințe de piață și proprietăți premium într-un singur loc.
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
                <span>București, România</span>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-2">
            <h3 className="font-semibold mb-4">Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Primește tendințe și oferte imobiliare pe email.
            </p>
            <form onSubmit={handleNewsletterSubmit} noValidate aria-busy={isSubmitting}>
              <label htmlFor="footer-newsletter-email" className="mb-2 block text-sm font-medium">Adresa de email</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="footer-newsletter-email"
                  type="email"
                  autoComplete="email"
                  disabled={isSubmitting}
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? 'footer-newsletter-error' : undefined}
                  placeholder="adresa@email.ro"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailError) setEmailError('')
                  }}
                  className="h-11 min-h-11 min-w-0 flex-none sm:flex-1"
                />
                <Button
                  type="submit"
                  className="h-11"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                  {isSubmitting ? 'Se trimite…' : 'Abonează-te'}
                </Button>
              </div>
              {emailError && (
                <p id="footer-newsletter-error" role="alert" className="mt-2 text-sm text-destructive">{emailError}</p>
              )}
              {newsletterResult && <p role="status" className="mt-2 text-sm">{newsletterResult}</p>}
            </form>
        </div>
        </div>

        <div className="mt-7 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Quick links */}
          <details className="border-t pt-1">
            <summary className="min-h-11 cursor-pointer py-3 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">Explorează site-ul</summary>
            <ul className="grid grid-cols-2 gap-x-3 pb-3">
              {PUBLIC_NAVIGATION.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => navigateTo(link.page)}
                    className="min-h-11 text-left text-sm text-muted-foreground hover:text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={handleContactClick}
                  className="min-h-11 text-left text-sm text-muted-foreground hover:text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                >
                  Contact
                </button>
              </li>
            </ul>
          </details>

          {/* Popular search shortcuts */}
          <details className="border-t pt-1">
            <summary className="min-h-11 cursor-pointer py-3 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">Căutări populare</summary>
            <div className="flex flex-wrap gap-2">
              {searchTerms.map((term) => (
                <button
                  key={term.label}
                  type="button"
                  onClick={() => handleSearchTermClick(term)}
                  className="min-h-11 rounded-md px-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {term.label}
                </button>
              ))}
            </div>
          </details>

          {/* Property types */}
          <details className="border-t pt-1">
            <summary className="min-h-11 cursor-pointer py-3 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">Tipuri de proprietăți</summary>
            <ul className="grid grid-cols-2 gap-x-3 pb-3">
              {propertyTypes.map((link) => (
                <li key={link}>
                  <button
                    onClick={() => handlePropertyTypeClick(link)}
                    className="min-h-11 text-left text-sm text-muted-foreground hover:text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    {link}
                  </button>
                </li>
              ))}
            </ul>
          </details>

        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} HQS Imobiliare. Toate drepturile rezervate.</p>
          <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 pr-16 sm:w-auto sm:justify-center sm:pr-0">
            <a href="/confidentialitate" className="inline-flex min-h-11 items-center hover:text-foreground hover:underline">Politica de confidențialitate</a>
            <button type="button" onClick={handleCookiePreferences} className="inline-flex min-h-11 items-center hover:text-foreground hover:underline">Preferințe cookies</button>
            <Separator orientation="vertical" className="hidden sm:block h-4" />
            <button
              type="button"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: preferredScrollBehavior() })
              }}
              className="inline-flex min-h-11 items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Înapoi sus"
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
