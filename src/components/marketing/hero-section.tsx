'use client'

import { useState, type KeyboardEvent } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowRight, Building2, Loader2, MapPin, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageContainer } from '@/components/layout/page-shell'
import { useAppStore } from '@/store/use-app-store'
import { useSearchSuggestions, useZones } from '@/hooks/use-properties'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import type { SearchSuggestion } from '@/lib/types'

const propertyTypes = [
  { value: 'APARTMENT', label: 'Apartament' },
  { value: 'HOUSE', label: 'Casă' },
  { value: 'VILLA', label: 'Vilă' },
  { value: 'LAND', label: 'Teren' },
  { value: 'COMMERCIAL', label: 'Spațiu comercial' },
]

export function HeroSection() {
  const router = useRouter()
  const { searchQuery, selectedZone, selectedType, transaction, setSearchQuery,
    setSelectedZone, setSelectedType, setTransaction, navigateTo } = useAppStore()
  const [query, setQuery] = useState(searchQuery)
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debouncedQuery = useDebouncedValue(query.trim())
  const { data: zones } = useZones()
  const { data: suggestions = [], isFetching } = useSearchSuggestions(debouncedQuery)
  const items = query.trim() === debouncedQuery ? suggestions : []
  const showSuggestions = suggestionsOpen && query.trim().length >= 2
    && (items.length > 0 || isFetching)

  function search() {
    setSearchQuery(query.trim())
    setSuggestionsOpen(false)
    navigateTo('proprietati')
  }

  function selectSuggestion(suggestion: SearchSuggestion) {
    setSuggestionsOpen(false)
    if (suggestion.type === 'property') {
      router.push(`/proprietati/${encodeURIComponent(suggestion.slug)}`)
      return
    }
    setSelectedZone(suggestion.name)
    setSearchQuery('')
    navigateTo('proprietati')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setSuggestionsOpen(false)
      setActiveIndex(-1)
    } else if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && items.length) {
      event.preventDefault()
      setSuggestionsOpen(true)
      const direction = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((previous) => (previous + direction + items.length) % items.length)
    } else if (event.key === 'Enter' && showSuggestions && items[activeIndex]) {
      event.preventDefault()
      selectSuggestion(items[activeIndex])
    }
  }

  return (
    <section className="border-b bg-muted/30">
      <PageContainer className="py-6 sm:py-10 lg:py-12">
        <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          <div className="relative z-10 min-w-0">
            <p className="mb-4 flex items-center gap-2 text-sm font-medium text-primary">
              <MapPin className="h-4 w-4" aria-hidden="true" /> București și împrejurimi
            </p>
            <h1 className="max-w-xl text-3xl font-semibold leading-[1.12] tracking-tight sm:text-5xl">
              Următorul tău loc.<br /><span className="text-primary">Mai aproape de acasă.</span>
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
              Caută proprietăți, compară ofertele și programează o vizionare în ritmul tău.
            </p>
            <form className="mt-6 rounded-2xl border bg-card p-4 shadow-sm sm:p-5"
              onSubmit={(event) => { event.preventDefault(); search() }} role="search" aria-label="Caută o proprietate">
              <div className="mb-4 flex flex-wrap gap-1 rounded-lg bg-muted p-1" role="group" aria-label="Tipul tranzacției">
                {[{ value: '', label: 'Toate' }, { value: 'SALE', label: 'Cumpăr' }, { value: 'RENT', label: 'Închiriez' }].map((item) => (
                  <Button key={item.value} type="button" variant="ghost" aria-pressed={transaction === item.value}
                    className="h-10 flex-1 px-3 aria-pressed:bg-card aria-pressed:text-primary aria-pressed:shadow-sm"
                    onClick={() => setTransaction(item.value)}>{item.label}</Button>
                ))}
              </div>
              <div className="relative" onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setSuggestionsOpen(false)
              }}>
                <Label htmlFor="home-search" className="mb-2 block">Ce proprietate cauți?</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="home-search" value={query} placeholder="Zonă, adresă sau cuvânt cheie"
                    className="h-12 pl-10 pr-10" autoComplete="off" role="combobox"
                    aria-expanded={showSuggestions} aria-controls={showSuggestions ? 'home-suggestions' : undefined}
                    aria-autocomplete="list" aria-activedescendant={showSuggestions && items[activeIndex] ? `home-suggestion-${activeIndex}` : undefined}
                    onChange={(event) => { setQuery(event.target.value); setActiveIndex(-1); setSuggestionsOpen(true) }}
                    onFocus={() => setSuggestionsOpen(true)} onKeyDown={handleKeyDown} />
                  {isFetching && <Loader2 aria-label="Se caută sugestii" className="absolute right-3 top-4 h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                {showSuggestions && (
                  <ul id="home-suggestions" role="listbox" aria-label="Sugestii de proprietăți și zone"
                    className="absolute inset-x-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border bg-popover p-1 shadow-xl">
                    {items.map((item, index) => (
                      <li key={item.type === 'zone' ? item.name : item.slug} id={`home-suggestion-${index}`}
                        role="option" aria-selected={activeIndex === index}>
                        <button type="button" tabIndex={-1}
                          className={`flex w-full items-center gap-3 rounded-lg p-3 text-left text-sm ${activeIndex === index ? 'bg-accent' : 'hover:bg-accent'}`}
                          onMouseEnter={() => setActiveIndex(index)} onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectSuggestion(item)}>
                          {item.type === 'zone' ? <MapPin className="h-4 w-4 shrink-0 text-primary" /> : <Building2 className="h-4 w-4 shrink-0 text-primary" />}
                          <span className="min-w-0"><span className="block truncate font-medium">{item.name}</span>
                            <span className="text-xs text-muted-foreground">{item.type === 'zone' ? 'Vezi ofertele din această zonă' : item.zone}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                    {isFetching && items.length === 0 && <li role="presentation" className="p-3 text-sm text-muted-foreground">Se caută sugestii…</li>}
                  </ul>
                )}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="min-w-0">
                  <Label htmlFor="home-zone" className="mb-2 block">Zonă</Label>
                  <Select value={selectedZone || 'all'} onValueChange={(value) => setSelectedZone(value === 'all' ? '' : value)}>
                    <SelectTrigger id="home-zone" className="h-11 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="all">Toate zonele</SelectItem>
                      {zones?.map((zone) => <SelectItem key={zone.id} value={zone.name}>{zone.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-0">
                  <Label htmlFor="home-type" className="mb-2 block">Tip proprietate</Label>
                  <Select value={selectedType || 'all'} onValueChange={(value) => setSelectedType(value === 'all' ? '' : value)}>
                    <SelectTrigger id="home-type" className="h-11 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="all">Toate tipurile</SelectItem>
                      {propertyTypes.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="mt-4 h-12 w-full text-base">Caută proprietăți <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
            </form>
          </div>
          <div className="relative hidden aspect-[4/5] max-h-[570px] overflow-hidden rounded-[2rem] bg-muted lg:block">
            <Image src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80"
              alt="Casă contemporană cu grădină și terasă" fill sizes="(min-width: 1024px) 42vw, 1px"
              className="object-cover" loading="eager" />
          </div>
        </div>
      </PageContainer>
    </section>
  )
}
