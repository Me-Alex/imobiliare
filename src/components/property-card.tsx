'use client'

import { useState } from 'react'
import { Heart, Scale, Maximize2, Bath, BedDouble, MapPin, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/use-app-store'
import { formatPrice, formatPricePerSqm, type Property } from '@/lib/api'

interface PropertyCardProps {
  property: Property
  onSelect: (slug: string) => void
  viewMode?: 'grid' | 'list'
}

const typeLabels: Record<string, string> = {
  APARTMENT: 'Apartament',
  HOUSE: 'Casa',
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
  SALE: 'Vanzare',
  RENT: 'Inchiriere',
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

export function PropertyCard({ property, onSelect, viewMode = 'grid' }: PropertyCardProps) {
  const { favorites, compareList, toggleFavorite, toggleCompare } = useAppStore()
  const isFav = favorites.includes(property.id)
  const isCompare = compareList.includes(property.id)
  const gallery: string[] = property.galleryUrls ? JSON.parse(property.galleryUrls) : []
  const coverImage = property.coverUrl || gallery[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=75'

  if (viewMode === 'list') {
    return (
      <Card
        className={`card-hover overflow-hidden cursor-pointer group py-0 gap-0 press-scale border-l-[3px] ${property.transaction === 'RENT' ? 'border-l-amber-400' : 'border-l-emerald-500'}`}
        onClick={() => onSelect(property.slug)}
      >
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="relative sm:w-72 h-48 sm:h-auto overflow-hidden shrink-0 card-shimmer">
            <div
              className="absolute inset-0 bg-cover bg-center img-zoom"
              style={{ backgroundImage: `url(${coverImage})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <div className="absolute top-3 left-3 flex gap-2 z-10">
              <Badge className={typeColors[property.type] || 'bg-secondary'}>{typeLabels[property.type] || property.type}</Badge>
              <Badge className="bg-white/90 dark:bg-black/70 text-foreground backdrop-blur-sm border-0">
                {transactionLabels[property.transaction] || property.transaction}
              </Badge>
              {property.featured && (
                <Badge className="bg-amber-500 text-white border-0 gap-1">
                  <Star className="h-3 w-3" /> Popular
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
                    {property.zone}{property.sector ? `, Sector ${property.sector}` : ''}, Bucuresti
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
                <MetricPill icon={Maximize2} value={`${property.areaSqm} m²`} label="suprafata" />
                <MetricPill icon={Bath} value={property.bathrooms} label="bai" />
                {property.floor && (
                  <div className="flex flex-col items-center gap-0.5 min-w-[42px]">
                    <span className="text-sm font-medium">Et.{property.floor}</span>
                    <span className="text-[10px] text-muted-foreground leading-none">etaj</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={(e) => { e.stopPropagation(); toggleFavorite(property.id) }}
              >
                <FavoriteButton isFav={isFav} />
                <span className="ml-1">{isFav ? 'Salvat' : 'Salveaza'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={(e) => { e.stopPropagation(); toggleCompare(property.id) }}
              >
                <Scale className={`h-4 w-4 mr-1 ${isCompare ? 'text-primary' : ''}`} />
                {isCompare ? 'In comparatie' : 'Compara'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className={`card-hover overflow-hidden cursor-pointer group py-0 gap-0 relative press-scale border-l-[3px] ${property.transaction === 'RENT' ? 'border-l-amber-400' : 'border-l-emerald-500'}`}
      onClick={() => onSelect(property.slug)}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden card-shimmer">
        <div
          className="absolute inset-0 bg-cover bg-center img-zoom"
          style={{ backgroundImage: `url(${coverImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2 z-10">
          <Badge className={typeColors[property.type] || 'bg-secondary'}>{typeLabels[property.type] || property.type}</Badge>
          <Badge className="bg-white/90 dark:bg-black/70 text-foreground backdrop-blur-sm border-0">
            {transactionLabels[property.transaction] || property.transaction}
          </Badge>
          {property.featured && (
            <Badge className="bg-amber-500 text-white border-0 gap-1">
              <Star className="h-3 w-3" /> Popular
            </Badge>
          )}
        </div>

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex gap-1.5 z-10">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-white/90 dark:bg-black/60 backdrop-blur-sm border-0 shadow-sm hover:bg-white dark:hover:bg-black/80"
            onClick={(e) => { e.stopPropagation(); toggleFavorite(property.id) }}
            aria-label={isFav ? 'Sterge de la favorite' : 'Adauga la favorite'}
          >
            <FavoriteButton isFav={isFav} />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-white/90 dark:bg-black/60 backdrop-blur-sm border-0 shadow-sm hover:bg-white dark:hover:bg-black/80"
            onClick={(e) => { e.stopPropagation(); toggleCompare(property.id) }}
            aria-label={isCompare ? 'Sterge din comparatie' : 'Adauga la comparatie'}
          >
            <Scale className={`h-4 w-4 ${isCompare ? 'text-primary' : ''}`} />
          </Button>
        </div>

        {/* Price */}
        <div className="absolute bottom-3 left-3 z-10">
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
          <span className="line-clamp-1">{property.zone}{property.sector ? `, Sector ${property.sector}` : ''}, Bucuresti</span>
        </div>
        <div className="flex items-center gap-4 pt-3 border-t border-border/50">
          <MetricPill icon={BedDouble} value={property.rooms} label="camere" />
          <MetricPill icon={Maximize2} value={`${property.areaSqm} m²`} label="suprafata" />
          <MetricPill icon={Bath} value={property.bathrooms} label="bai" />
        </div>
      </CardContent>
    </Card>
  )
}