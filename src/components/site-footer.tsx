'use client'

import { useState, type FormEvent } from 'react'
import { Building2, Mail, Phone, MapPin, Facebook, Instagram, Linkedin, Send, ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function SiteFooter() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')

  const handleNewsletterSubmit = (e: FormEvent) => {
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
    toast.success('Multumim pentru abonare!', {
      description: 'Vei primi noutatile pe ' + email,
    })
    setEmail('')
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer id="contact" className="mt-auto border-t bg-muted/30 relative overflow-hidden">
      {/* Watermark text */}
      <span className="footer-watermark select-none" aria-hidden="true">
        propmarket
      </span>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Company info */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                Prop<span className="gradient-text">Market</span>
              </span>
            </div>
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
                <span>contact@propmarket.ro</span>
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
              {['Acasa', 'Proprietati', 'Analiza Piata', 'Zone', 'Despre Noi', 'Contact'].map((link) => (
                <li key={link}>
                  <a href="#" className="link-underline text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Property types */}
          <div className="transition-colors duration-300">
            <h3 className="font-semibold mb-4">Tipuri Proprietati</h3>
            <ul className="space-y-2.5">
              {['Apartamente', 'Case', 'Vile', 'Terenuri', 'Spatii Comerciale', 'Garsoniere'].map((link) => (
                <li key={link}>
                  <a href="#" className="link-underline text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link}
                  </a>
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
                >
                  <Send className="h-3.5 w-3.5" />
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
          <p>&copy; {new Date().getFullYear()} PropMarket. Toate drepturile rezervate.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="link-underline hover:text-foreground transition-colors">Termeni si conditii</a>
            <a href="#" className="link-underline hover:text-foreground transition-colors">Politica de confidentialitate</a>
            <a href="#" className="link-underline hover:text-foreground transition-colors">Cookies</a>
            <Separator orientation="vertical" className="hidden sm:block h-4" />
            <button
              type="button"
              onClick={scrollToTop}
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