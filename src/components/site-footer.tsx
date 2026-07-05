'use client'

import { Building2, Mail, Phone, MapPin, Facebook, Instagram, Linkedin, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-muted/30 relative overflow-hidden">
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
          <div>
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
          <div>
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
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input placeholder="adresa@email.ro" className="h-10 pl-10 pr-4" />
              <Button size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 shrink-0 rounded-lg">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Facebook">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PropMarket. Toate drepturile rezervate.</p>
          <div className="flex gap-4">
            <a href="#" className="link-underline hover:text-foreground transition-colors">Termeni si conditii</a>
            <a href="#" className="link-underline hover:text-foreground transition-colors">Politica de confidentialitate</a>
            <a href="#" className="link-underline hover:text-foreground transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}