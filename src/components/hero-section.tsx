'use client'

import { useState, useEffect, useCallback, useRef, useMemo, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, Home, TrendingUp, Users, ArrowRight, Sparkles, Clock, Building2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/store/use-app-store'
import { useZones, useSearchSuggestions } from '@/hooks/use-properties'
import { formatPrice, type SearchSuggestion } from '@/lib/api'

function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setInView(true), 300)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!inView) return
    let start = 0
    const duration = 2000
    const stepTime = 20
    const steps = duration / stepTime
    const increment = target / steps

    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, stepTime)
    return () => clearInterval(timer)
  }, [inView, target])

  return (
    <span>
      {prefix}
      {count.toLocaleString('ro-RO')}
      {suffix}
    </span>
  )
}

const stats = [
  { icon: Home, label: 'Proprietati', value: 248, suffix: '+' },
  { icon: TrendingUp, label: 'Pret mediu/m²', value: 2850, prefix: '€', suffix: '' },
  { icon: MapPin, label: 'Zone acoperite', value: 12, suffix: '' },
  { icon: Users, label: 'Clienti multumiti', value: 1450, suffix: '+' },
]

const typeLabels: Record<string, string> = {
  APARTMENT: 'Apartament',
  HOUSE: 'Casa',
  VILLA: 'Vila',
  LAND: 'Teren',
  COMMERCIAL: 'Comercial',
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

function useReducedMotion(): boolean {
  const subscribe = useCallback((callback: () => void) => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    mq.addEventListener('change', callback)
    return () => mq.removeEventListener('change', callback)
  }, [])
  const getSnapshot = useCallback(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])
  const getServerSnapshot = useCallback(() => false, [])
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function HeroSection() {
  const {
    searchQuery,
    setSearchQuery,
    selectedZone,
    setSelectedZone,
    selectedType,
    setSelectedType,
    setSelectedPropertySlug,
    navigateTo,
  } = useAppStore()
  const { data: zones } = useZones()
  const bgRef = useRef<HTMLDivElement>(null)
  const [offsetY, setOffsetY] = useState(0)
  const reducedMotion = useReducedMotion()

  const [localQuery, setLocalQuery] = useState(searchQuery)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedQuery = useDebounce(localQuery, 300)

  // Sync local state with store on external changes
  useEffect(() => {
    setLocalQuery(searchQuery)
  }, [searchQuery])

  const { data: suggestions, isLoading: suggestionsLoading } = useSearchSuggestions(debouncedQuery)

  // Separate suggestions by type
  const zoneSuggestions = useMemo(
    () => (suggestions ?? []).filter((s): s is SearchSuggestion & { type: 'zone' } => s.type === 'zone'),
    [suggestions]
  )
  const propertySuggestions = useMemo(
    () => (suggestions ?? []).filter((s): s is SearchSuggestion & { type: 'property' } => s.type === 'property'),
    [suggestions]
  )

  const allItems = useMemo(() => [...zoneSuggestions, ...propertySuggestions], [zoneSuggestions, propertySuggestions])

  // Reset active index when suggestions change
  useEffect(() => {
    setActiveIndex(-1)
  }, [suggestions])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Show dropdown when there are suggestions or loading
  useEffect(() => {
    if (debouncedQuery.length >= 2 && (suggestionsLoading || allItems.length > 0)) {
      setIsOpen(true)
    }
  }, [debouncedQuery, suggestionsLoading, allItems.length])

  // Parallax
  useEffect(() => {
    if (reducedMotion) return
    const onScroll = () => {
      setOffsetY(window.scrollY * 0.3)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [reducedMotion])

  const scrollToProperties = useCallback(() => {
    setSearchQuery(localQuery)
    navigateTo('proprietati')
  }, [localQuery, setSearchQuery, navigateTo])

  const handleSelectSuggestion = useCallback((suggestion: SearchSuggestion) => {
    if (suggestion.type === 'zone') {
      setSelectedZone(suggestion.name)
      setLocalQuery('')
      setSearchQuery('')
      setIsOpen(false)
      navigateTo('proprietati')
    } else {
      setSelectedPropertySlug(suggestion.slug)
      setIsOpen(false)
    }
  }, [setSelectedZone, setSelectedPropertySlug, setSearchQuery, navigateTo])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || allItems.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault()
        scrollToProperties()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((prev) => (prev < allItems.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : allItems.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < allItems.length) {
          handleSelectSuggestion(allItems[activeIndex])
        } else {
          scrollToProperties()
        }
        break
      case 'Escape':
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }, [isOpen, allItems, activeIndex, handleSelectSuggestion, scrollToProperties])

  return (
    <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center overflow-hidden noise-overlay">
      {/* Background image with parallax */}
      <div
        ref={bgRef}
        className="absolute inset-0 bg-cover bg-center will-change-transform"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80)',
          transform: `translateY(${offsetY}px)`,
        }}
      />
      <div className="hero-gradient absolute inset-0" />

      {/* Floating Particles */}
      <div className="particle h-2 w-2 bg-white/20 z-[1]" style={{ top: '15%', left: '10%', '--duration': '5s', '--delay': '0s' } as React.CSSProperties} />
      <div className="particle h-3 w-3 bg-emerald-400/20 z-[1]" style={{ top: '25%', left: '75%', '--duration': '7s', '--delay': '1s' } as React.CSSProperties} />
      <div className="particle h-1.5 w-1.5 bg-white/10 z-[1]" style={{ top: '60%', left: '20%', '--duration': '4s', '--delay': '2s' } as React.CSSProperties} />
      <div className="particle h-2.5 w-2.5 bg-emerald-400/15 z-[1]" style={{ top: '70%', left: '85%', '--duration': '6s', '--delay': '0.5s' } as React.CSSProperties} />
      <div className="particle h-2 w-2 bg-white/15 z-[1]" style={{ top: '40%', left: '50%', '--duration': '8s', '--delay': '3s' } as React.CSSProperties} />
      <div className="particle h-1.5 w-1.5 bg-emerald-400/20 z-[1]" style={{ top: '80%', left: '40%', '--duration': '5.5s', '--delay': '1.5s' } as React.CSSProperties} />
      <div className="particle h-2 w-2 bg-white/10 z-[1]" style={{ top: '10%', left: '90%', '--duration': '6.5s', '--delay': '2.5s' } as React.CSSProperties} />

      {/* Floating "Date actualizate" badge */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute top-6 right-6 z-20 hidden sm:flex"
      >
        <div className="flex items-center gap-2 rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 px-4 py-2 shadow-lg">
          <span className="pulse-dot relative flex h-2.5 w-2.5">
            <span className="absolute inset-0 rounded-full bg-emerald-400" />
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </span>
          <span className="text-sm text-white/90 font-medium">Date actualizate</span>
          <Clock className="h-3.5 w-3.5 text-white/60" />
        </div>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="max-w-3xl"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary-foreground backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Analiza imobiliara in timp real
            </span>
          </motion.div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4">
            Proprietati{' '}
            <span className="text-primary">Premium</span>
            <br />
            in Bucuresti
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-xl">
            Descopera proprietati verificate, analize de pret si tendinte de piata pentru cele mai cautate zone din Bucuresti.
          </p>

          {/* Search bar — glassmorphism */}
          <div className="flex flex-col sm:flex-row gap-3 mb-12">
            <div ref={containerRef} className="relative flex-1 rounded-xl bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 shadow-2xl z-10">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 z-10" />
              {suggestionsLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 animate-spin z-10" />
              )}
              <Input
                ref={inputRef}
                placeholder="Cauta dupa titlu, adresa sau zona..."
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                onFocus={() => {
                  if (debouncedQuery.length >= 2 && allItems.length > 0) setIsOpen(true)
                }}
                onKeyDown={handleKeyDown}
                className="pl-10 pr-9 h-12 bg-transparent border-0 text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                role="combobox"
                aria-expanded={isOpen}
                aria-autocomplete="list"
                aria-controls="search-suggestions-list"
              />

              {/* Autocomplete Dropdown */}
              <AnimatePresence>
                {isOpen && (allItems.length > 0 || suggestionsLoading) && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl border bg-popover shadow-xl overflow-hidden"
                  >
                    <div
                      id="search-suggestions-list"
                      role="listbox"
                      className="max-h-80 overflow-y-auto overscroll-contain p-1"
                    >
                      {zoneSuggestions.length > 0 && (
                        <div className="mb-1">
                          <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                            Zone
                          </div>
                          {zoneSuggestions.map((s, idx) => (
                            <button
                              key={`zone-${s.name}`}
                              role="option"
                              aria-selected={activeIndex === idx}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors cursor-pointer ${
                                activeIndex === idx
                                  ? 'bg-accent text-accent-foreground'
                                  : 'hover:bg-accent/50'
                              }`}
                              onClick={() => handleSelectSuggestion(s)}
                              onMouseEnter={() => setActiveIndex(idx)}
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <MapPin className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{s.name}</div>
                                {s.sector && (
                                  <div className="text-xs text-muted-foreground">{s.sector}</div>
                                )}
                              </div>
                              {s.avgPriceSqm != null && (
                                <div className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatPrice(s.avgPriceSqm)}/m²
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      {propertySuggestions.length > 0 && zoneSuggestions.length > 0 && (
                        <div className="border-t my-1" />
                      )}

                      {propertySuggestions.length > 0 && (
                        <div>
                          <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                            Proprietati
                          </div>
                          {propertySuggestions.map((s, idx) => {
                            const globalIdx = zoneSuggestions.length + idx
                            return (
                              <button
                                key={`property-${s.slug}`}
                                role="option"
                                aria-selected={activeIndex === globalIdx}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors cursor-pointer ${
                                  activeIndex === globalIdx
                                    ? 'bg-accent text-accent-foreground'
                                    : 'hover:bg-accent/50'
                                }`}
                                onClick={() => handleSelectSuggestion(s)}
                                onMouseEnter={() => setActiveIndex(globalIdx)}
                              >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                  <Building2 className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{s.name}</div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {s.zone} · {typeLabels[s.propertyType] || s.propertyType} · {s.areaSqm}m²
                                  </div>
                                </div>
                                <div className="text-sm font-semibold text-primary whitespace-nowrap">
                                  {formatPrice(s.price)}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {suggestionsLoading && allItems.length === 0 && (
                        <div className="flex items-center justify-center py-6 text-sm text-muted-foreground gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Se cauta...
                        </div>
                      )}

                      {!suggestionsLoading && allItems.length === 0 && debouncedQuery.length >= 2 && (
                        <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                          Nu s-au gasit rezultate pentru &ldquo;{debouncedQuery}&rdquo;
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="rounded-xl bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 shadow-2xl">
              <Select value={selectedZone || 'all'} onValueChange={(v) => setSelectedZone(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-12 w-full sm:w-44 bg-transparent border-0 text-white focus:ring-0 focus:ring-offset-0 shadow-none">
                  <SelectValue placeholder="Toate zonele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate zonele</SelectItem>
                  {zones?.map((z) => (
                    <SelectItem key={z.id} value={z.name}>
                      {z.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-xl bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 shadow-2xl">
              <Select value={selectedType || 'all'} onValueChange={(v) => setSelectedType(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-12 w-full sm:w-40 bg-transparent border-0 text-white focus:ring-0 focus:ring-offset-0 shadow-none">
                  <SelectValue placeholder="Tip" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate tipurile</SelectItem>
                  <SelectItem value="APARTMENT">Apartament</SelectItem>
                  <SelectItem value="HOUSE">Casa</SelectItem>
                  <SelectItem value="VILLA">Vila</SelectItem>
                  <SelectItem value="LAND">Teren</SelectItem>
                  <SelectItem value="COMMERCIAL">Comercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* CTA button with animated gradient border */}
            <div className="cta-gradient-border">
              <Button
                size="lg"
                className="h-12 px-8 rounded-[var(--radius)] relative z-10"
                onClick={scrollToProperties}
              >
                Cauta
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center sm:text-left">
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  <AnimatedCounter
                    target={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                  />
                </div>
                <div className="text-sm text-white/60 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}