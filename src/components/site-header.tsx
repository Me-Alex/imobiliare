'use client'

import { useTheme } from 'next-themes'
import { Building2, Heart, Menu, Moon, Sun } from 'lucide-react'
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
import { useAppStore } from '@/store/use-app-store'

const navItems = [
  { label: 'Acasa', href: '#' },
  { label: 'Proprietati', href: '#proprietati' },
  { label: 'Analiza', href: '#analiza' },
  { label: 'Zone', href: '#zone' },
]

export function SiteHeader() {
  const { setTheme, resolvedTheme } = useTheme()
  const favorites = useAppStore((s) => s.favorites)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Prop<span className="gradient-text">Market</span>
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Navigare principala">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground rounded-md hover:bg-accent"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Favorites */}
          <Button variant="ghost" size="icon" className="relative" aria-label="Favorite">
            <Heart className="h-5 w-5" />
            {favorites.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center bg-primary text-primary-foreground border-0">
                {favorites.length}
              </Badge>
            )}
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
          <Sheet>
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
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex items-center rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
              <Separator className="my-4" />
              <div className="flex items-center justify-between px-3">
                <span className="text-sm text-muted-foreground">Favorite</span>
                <Badge variant="secondary">{favorites.length} proprietati</Badge>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}