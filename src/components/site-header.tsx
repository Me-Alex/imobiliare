'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { Bell, Building2, Heart, Menu, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { useAppStore, type PageKey } from '@/store/use-app-store'
import { cn } from '@/lib/utils'

const navItems: { label: string; page: PageKey }[] = [
  { label: 'Acasa', page: 'acasa' },
  { label: 'Proprietati', page: 'proprietati' },
  { label: 'Analiza', page: 'analiza' },
  { label: 'Zone', page: 'zone' },
  { label: 'De Ce Noi', page: 'de-ce-noi' },
  { label: 'Calculator', page: 'calculator' },
]

interface SiteHeaderProps {
  onOpenFavorites?: () => void
  onOpenPriceAlerts?: () => void
}

export function SiteHeader({ onOpenFavorites, onOpenPriceAlerts }: SiteHeaderProps) {
  const { setTheme, resolvedTheme } = useTheme()
  const { favorites, currentPage, navigateTo } = useAppStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleMobileNav = (page: PageKey) => {
    navigateTo(page)
    setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <button
          onClick={() => navigateTo('acasa')}
          className="flex items-center gap-2 group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Prop<span className="gradient-text">Market</span>
          </span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Navigare principala">
          {navItems.map((item) => {
            const isActive = currentPage === item.page
            return (
              <button
                key={item.page}
                onClick={() => navigateTo(item.page)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 relative',
                  isActive
                    ? 'text-foreground bg-accent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-primary" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Favorites */}
          <Button variant="ghost" size="icon" className="relative" aria-label="Favorite" onClick={onOpenFavorites}>
            <Heart className="h-5 w-5" />
            {favorites.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center bg-primary text-primary-foreground border-0">
                {favorites.length}
              </Badge>
            )}
          </Button>

          {/* Price Alerts */}
          <Button variant="ghost" size="icon" className="relative" aria-label="Alerte pret" onClick={onOpenPriceAlerts}>
            <Bell className="h-5 w-5" />
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Schimba tema"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Meniu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  PropMarket
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 mt-4" aria-label="Navigare mobila">
                {navItems.map((item) => {
                  const isActive = currentPage === item.page
                  return (
                    <button
                      key={item.page}
                      onClick={() => handleMobileNav(item.page)}
                      className={cn(
                        'flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-accent text-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                    >
                      {item.label}
                      {isActive && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </button>
                  )
                })}
              </nav>
              <Separator className="my-4" />
              <div className="flex items-center justify-between px-3">
                <span className="text-sm text-muted-foreground">Favorite</span>
                <Badge variant="secondary">{favorites.length} proprietati</Badge>
              </div>
              <button
                type="button"
                className="flex items-center justify-between w-full rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground mt-1"
                onClick={() => {
                  setMobileMenuOpen(false)
                  onOpenPriceAlerts?.()
                }}
              >
                <span className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Alerte Pret
                </span>
              </button>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}