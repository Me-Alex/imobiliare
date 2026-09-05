'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Heart, Scale, Bath, BedDouble, MapPin, CalendarCheck, Maximize2, Rotate3D } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/use-app-store'
import { formatBucharestLocation, formatPrice, formatPricePerSqm } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { useCoinActions } from '@/hooks/use-coin-actions'
import { AuthRequiredDialog } from '@/components/dialogs/auth-required-dialog'
import { toast } from 'sonner'
import type { Property } from '@/lib/types'
import { getPropertyImages } from '@/lib/property-details'

interface PropertyCardProps {
  property: Property
  viewMode?: 'grid' | 'list'
  eagerImage?: boolean
}

const typeLabels: Record<string, string> = {
  APARTMENT: 'Apartament',
  HOUSE: 'Casă',
  VILLA: 'Vilă',
  LAND: 'Teren',
  COMMERCIAL: 'Comercial',
}
const transactionLabels: Record<string, string> = {
  SALE: 'Vânzare',
  RENT: 'Închiriere',
}

function FavoriteButton({ isFav }: { isFav: boolean }) {
  return (
    <span className="inline-flex">
      <Heart className={`h-4 w-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
    </span>
  )
}

function MetricPill({ icon: Icon, value, label }: { icon: React.ElementType; value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[42px]">
      <div className="flex items-center gap-1 text-sm font-medium">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{value}</span>
      </div>
      <span className="text-xs text-muted-foreground leading-5">{label}</span>
    </div>
  )
}

export function PropertyCard({ property, viewMode = 'grid', eagerImage = false }: PropertyCardProps) {
  const { favorites, compareList, toggleFavorite, toggleCompare, setVizionareProperty, navigateTo } = useAppStore()
  const { user, profile } = useAuth()
  const { onFavorite, onUnfavorite } = useCoinActions()
  const [authOpen, setAuthOpen] = useState(false)
  const isFav = favorites.includes(property.id)
  const isCompare = compareList.includes(property.id)
  const coverImage = getPropertyImages(property)[0]
  const propertyHref = `/proprietati/${encodeURIComponent(property.slug)}`

  const handleToggleFavorite = () => {
    const wasFavorite = favorites.includes(property.id)
    toggleFavorite(property.id)
    if (!wasFavorite) void onFavorite(property.id)
    else void onUnfavorite(property.id)
  }

  const handleSchedule = () => {
    if (!user) {
      setAuthOpen(true)
      return
    }
    if (profile && !['CLIENT', 'OWNER'].includes(profile.role)) {
      toast.info('Programările noi sunt disponibile conturilor de client și proprietar.', {
        description: 'Poți administra vizionările existente din spațiul contului tău.',
      })
      navigateTo('vizionarile-mele')
      return
    }
    setVizionareProperty(property.id, property.title)
    sessionStorage.setItem('pm-route-viewing-context', JSON.stringify({
      propertyId: property.id,
      propertyTitle: property.title,
      propertySlug: property.slug,
    }))
    navigateTo('programare-vizionare')
    toast.success('Proprietatea a fost selectată.', {
      description: 'Alege data și ora vizionării. Agentul este alocat automat.',
    })
  }

  const isList = viewMode === 'list'

  return (
    <Card className={`group relative gap-0 overflow-hidden rounded-2xl border py-0 shadow-sm transition-shadow hover:shadow-md ${isList ? 'md:flex-row' : 'h-full'}`}>
      <a href={propertyHref} className="absolute inset-0 z-10 rounded-2xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label={`Vezi detaliile proprietății ${property.title}`}>
        <span className="sr-only">Vezi detaliile proprietății {property.title}</span>
      </a>
      <div className={`relative shrink-0 overflow-hidden bg-muted ${isList ? 'h-56 md:h-auto md:min-h-72 md:w-64' : 'aspect-[4/3]'}`}>
        <Image src={coverImage} alt="" fill loading={eagerImage ? 'eager' : 'lazy'}
          fetchPriority={eagerImage ? 'high' : 'auto'}
          sizes={isList ? '(min-width: 768px) 16rem, 100vw' : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'}
          className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="pointer-events-none absolute left-3 top-3 right-16 flex flex-wrap gap-2">
          <Badge className="border-0 bg-white text-slate-900 shadow-sm">{transactionLabels[property.transaction] || property.transaction}</Badge>
          {Boolean(property.featured) && <Badge className="border-0 bg-emerald-800 text-white">Popular</Badge>}
        </div>
        <Button variant="secondary" size="icon" className="absolute right-3 top-3 z-20 h-10 w-10 rounded-full bg-white text-slate-900 shadow-sm hover:bg-white/90"
          onClick={handleToggleFavorite} aria-pressed={isFav}
          aria-label={isFav ? 'Șterge de la favorite' : 'Adaugă la favorite'}>
          <FavoriteButton isFav={isFav} />
        </Button>
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-2 text-sm font-medium text-white">
          <span>{typeLabels[property.type] || property.type}</span>
          {property.virtualTour && <Badge className="gap-1 border-white/30 bg-black/40 text-white"><Rotate3D className="h-3.5 w-3.5" />{property.virtualTour.isDemo ? 'Tur demo' : 'Tur 360°'}</Badge>}
        </div>
      </div>
      <CardContent className="flex min-w-0 flex-1 flex-col p-5">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <p className="text-2xl font-semibold tracking-tight">{formatPrice(property.price)}{property.transaction === 'RENT' && <span className="ml-1 text-sm font-normal text-muted-foreground">/ lună</span>}</p>
          {Boolean(property.pricePerSqm) && <p className="text-xs text-muted-foreground">{formatPricePerSqm(property.pricePerSqm!)}</p>}
        </div>
        <h3 className="mt-3 line-clamp-2 text-base font-semibold leading-6 transition-colors group-hover:text-primary">{property.title}</h3>
        <p className="mt-1 flex items-start gap-1.5 text-sm leading-6 text-muted-foreground">
          <MapPin className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />{formatBucharestLocation(property.zone, property.sector)}
        </p>
        <div className="my-4 flex flex-wrap items-center gap-6 border-y py-3">
          {property.type !== 'LAND' && <MetricPill icon={BedDouble} value={property.rooms} label="camere" />}
          <MetricPill icon={Maximize2} value={`${property.areaSqm} m²`} label="suprafață" />
          {property.type !== 'LAND' && <MetricPill icon={Bath} value={property.bathrooms} label="băi" />}
        </div>
        <div className="relative z-20 mt-auto flex flex-wrap items-center gap-2">
          <Button variant="outline" className="h-10 flex-1 gap-2" onClick={handleSchedule}><CalendarCheck className="h-4 w-4" />Vizionare</Button>
          <Button variant={isCompare ? 'secondary' : 'ghost'} className="h-10 gap-2" onClick={() => toggleCompare(property.id)} aria-pressed={isCompare}>
            <Scale className="h-4 w-4" />{isCompare ? 'Adăugată' : 'Compară'}
          </Button>
        </div>
      </CardContent>
      <AuthRequiredDialog open={authOpen} onOpenChange={setAuthOpen} actionLabel="Programează o vizionare"
        actionIcon={CalendarCheck} returnPage="programare-vizionare"
        returnContext={{ vizionarePropertyId: property.id, vizionarePropertyTitle: property.title, fromProperty: property.slug }} />
    </Card>
  )
}
