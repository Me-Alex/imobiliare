'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Heart, Scale, Bath, BedDouble, MapPin, Star, CalendarCheck, Maximize2, Rotate3D } from 'lucide-react'
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
  VILLA: 'Vila',
  LAND: 'Teren',
  COMMERCIAL: 'Comercial',
}
const typeColors: Record<string, string> = {
  APARTMENT: 'bg-primary/15 text-primary border-primary/20',
  HOUSE: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
  VILLA: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20',
  LAND: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/20',
  COMMERCIAL: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20',
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
      <span className="text-[10px] text-muted-foreground leading-none">{label}</span>
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
      description: 'Alege agentul, data și ora vizionării.',
    })
  }

  if (viewMode === 'list') {
    return (
      <Card
        className={`card-hover relative overflow-hidden cursor-pointer group py-0 gap-0 press-scale border-l-[3px] ${property.transaction === 'RENT' ? 'border-l-amber-400' : 'border-l-emerald-500'}`}
      >
        <a href={propertyHref} className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" aria-label={`Vezi detaliile proprietății ${property.title}`}>
          <span className="sr-only">Vezi detaliile proprietății {property.title}</span>
        </a>
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="relative sm:w-72 h-48 sm:h-auto overflow-hidden shrink-0 card-shimmer">
            <Image
              src={coverImage}
              alt=""
              fill
              loading={eagerImage ? 'eager' : 'lazy'}
              fetchPriority={eagerImage ? 'high' : 'auto'}
              sizes="(min-width: 640px) 18rem, 100vw"
              className="absolute inset-0 h-full w-full object-cover img-zoom"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <div className="pointer-events-none absolute top-3 left-3 z-10 flex flex-wrap gap-2">
              <Badge className={typeColors[property.type] || 'bg-secondary'}>{typeLabels[property.type] || property.type}</Badge>
              <Badge className="bg-white/90 dark:bg-black/70 text-foreground backdrop-blur-sm border-0">
                {transactionLabels[property.transaction] || property.transaction}
              </Badge>
              {Boolean(property.featured) && (
                <Badge className="bg-amber-500 text-white border-0 gap-1">
                  <Star className="h-3 w-3" /> Popular
                </Badge>
              )}
              {property.virtualTour && (
                <Badge className="gap-1 border-0 bg-violet-600 text-white">
                  <Rotate3D className="h-3 w-3" /> {property.virtualTour.isDemo ? 'Tur demo' : 'Tur 360°'}
                </Badge>
              )}
            </div>
          </div>
          {/* Content */}
          <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-1">
                    {property.title}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                    <MapPin className="h-3.5 w-3.5" />
                    {formatBucharestLocation(property.zone, property.sector)}
                  </div>
                </div>
                <div className="text-right shrink-0 pl-4 border-l-2 border-primary/30">
                  <div className="text-xl font-bold text-primary">{formatPrice(property.price)}</div>
                  {property.pricePerSqm && (
                    <div className="text-xs text-muted-foreground">{formatPricePerSqm(property.pricePerSqm)}</div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-2">
                <MetricPill icon={BedDouble} value={property.rooms} label="camere" />
                <MetricPill icon={Maximize2} value={`${property.areaSqm} m²`} label="suprafață" />
                <MetricPill icon={Bath} value={property.bathrooms} label="băi" />
                {property.floor !== null && property.floor !== undefined && (
                  <div className="flex flex-col items-center gap-0.5 min-w-[42px]">
                    <span className="text-sm font-medium">Et.{property.floor}</span>
                    <span className="text-[10px] text-muted-foreground leading-none">etaj</span>
                  </div>
                )}
              </div>
            </div>
            <div className="relative z-20 flex items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={(e) => { e.stopPropagation(); handleToggleFavorite() }}
              >
                <FavoriteButton isFav={isFav} />
                  <span className="ml-1">{isFav ? 'Salvat' : 'Salvează'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={(e) => { e.stopPropagation(); toggleCompare(property.id) }}
              >
                <Scale className={`h-4 w-4 mr-1 ${isCompare ? 'text-primary' : ''}`} />
                {isCompare ? 'În comparație' : 'Compară'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSchedule()
                }}
              >
                <CalendarCheck className="h-4 w-4" />
                Vizionare
              </Button>
            </div>
          </div>
        </div>
        <AuthRequiredDialog
          open={authOpen}
          onOpenChange={setAuthOpen}
          actionLabel="Programează o vizionare"
          actionIcon={CalendarCheck}
          returnPage="programare-vizionare"
          returnContext={{
            vizionarePropertyId: property.id,
            vizionarePropertyTitle: property.title,
            fromProperty: property.slug,
          }}
        />
      </Card>
    )
  }

  return (
    <Card
      className={`card-hover overflow-hidden cursor-pointer group py-0 gap-0 relative press-scale border-l-[3px] ${property.transaction === 'RENT' ? 'border-l-amber-400' : 'border-l-emerald-500'}`}
    >
      <a href={propertyHref} className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" aria-label={`Vezi detaliile proprietății ${property.title}`}>
        <span className="sr-only">Vezi detaliile proprietății {property.title}</span>
      </a>
      {/* Image */}
      <div className="relative h-52 overflow-hidden card-shimmer">
        <Image
          src={coverImage}
          alt=""
          fill
          loading={eagerImage ? 'eager' : 'lazy'}
          fetchPriority={eagerImage ? 'high' : 'auto'}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="absolute inset-0 h-full w-full object-cover img-zoom"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Badges */}
        <div className="pointer-events-none absolute top-3 left-3 z-10 flex flex-wrap gap-2">
          <Badge className={typeColors[property.type] || 'bg-secondary'}>{typeLabels[property.type] || property.type}</Badge>
          <Badge className="bg-white/90 dark:bg-black/70 text-foreground backdrop-blur-sm border-0">
            {transactionLabels[property.transaction] || property.transaction}
          </Badge>
          {Boolean(property.featured) && (
            <Badge className="bg-amber-500 text-white border-0 gap-1">
              <Star className="h-3 w-3" /> Popular
            </Badge>
          )}
          {property.virtualTour && (
            <Badge className="gap-1 border-0 bg-violet-600 text-white">
              <Rotate3D className="h-3 w-3" /> {property.virtualTour.isDemo ? 'Tur demo' : 'Tur 360°'}
            </Badge>
          )}
        </div>

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex gap-1.5 z-20">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-white/90 dark:bg-black/60 backdrop-blur-sm border-0 shadow-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
            onClick={(e) => {
              e.stopPropagation()
              handleSchedule()
            }}
            aria-label="Programează vizionarea"
          >
            <CalendarCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-white/90 dark:bg-black/60 backdrop-blur-sm border-0 shadow-sm hover:bg-white dark:hover:bg-black/80"
            onClick={(e) => { e.stopPropagation(); handleToggleFavorite() }}
            aria-label={isFav ? 'Șterge de la favorite' : 'Adaugă la favorite'}
          >
            <FavoriteButton isFav={isFav} />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-white/90 dark:bg-black/60 backdrop-blur-sm border-0 shadow-sm hover:bg-white dark:hover:bg-black/80"
            onClick={(e) => { e.stopPropagation(); toggleCompare(property.id) }}
            aria-label={isCompare ? 'Șterge din comparație' : 'Adaugă la comparație'}
          >
            <Scale className={`h-4 w-4 ${isCompare ? 'text-primary' : ''}`} />
          </Button>
        </div>

        {/* Price */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-10">
          <div className="price-tag-animated absolute inset-0 rounded-lg -z-10" />
          <div className="text-xl font-bold text-white drop-shadow-lg">{formatPrice(property.price)}</div>
          {property.pricePerSqm && (
            <div className="text-xs text-white/80 drop-shadow">{formatPricePerSqm(property.pricePerSqm)}</div>
          )}
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <h3 className="font-semibold leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-1">
          {property.title}
        </h3>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1">{formatBucharestLocation(property.zone, property.sector)}</span>
        </div>
        <div className="flex items-center gap-4 pt-3 border-t border-border/50">
          <MetricPill icon={BedDouble} value={property.rooms} label="camere" />
          <MetricPill icon={Maximize2} value={`${property.areaSqm} m²`} label="suprafață" />
          <MetricPill icon={Bath} value={property.bathrooms} label="băi" />
        </div>
      </CardContent>
      <AuthRequiredDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        actionLabel="Programează o vizionare"
        actionIcon={CalendarCheck}
        returnPage="programare-vizionare"
        returnContext={{
          vizionarePropertyId: property.id,
          vizionarePropertyTitle: property.title,
          fromProperty: property.slug,
        }}
      />
    </Card>
  )
}
