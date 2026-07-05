'use client'

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

export function PropertyCard({ property, onSelect, viewMode = 'grid' }: PropertyCardProps) {
  const { favorites, compareList, toggleFavorite, toggleCompare } = useAppStore()
  const isFav = favorites.includes(property.id)
  const isCompare = compareList.includes(property.id)
  const gallery: string[] = property.galleryUrls ? JSON.parse(property.galleryUrls) : []
  const coverImage = property.coverUrl || gallery[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=75'

  if (viewMode === 'list') {
    return (
      <Card
        className="card-hover overflow-hidden cursor-pointer group py-0 gap-0"
        onClick={() => onSelect(property.slug)}
      >
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="relative sm:w-72 h-48 sm:h-auto overflow-hidden shrink-0">
            <div
              className="absolute inset-0 bg-cover bg-center img-zoom"
              style={{ backgroundImage: `url(${coverImage})` }}
            />
            <div className="absolute top-3 left-3 flex gap-2">
              <Badge className={typeColors[property.type] || 'bg-secondary'}>{typeLabels[property.type] || property.type}</Badge>
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
                    {property.zone}, {property.sector && `Sector ${property.sector}, `}Bucuresti
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xl font-bold text-primary">{formatPrice(property.price)}</div>
                  {property.pricePerSqm && (
                    <div className="text-xs text-muted-foreground">{formatPricePerSqm(property.pricePerSqm)}</div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><BedDouble className="h-4 w-4" />{property.rooms} camere</span>
                <span className="flex items-center gap-1.5"><Maximize2 className="h-4 w-4" />{property.areaSqm} m²</span>
                <span className="flex items-center gap-1.5"><Bath className="h-4 w-4" />{property.bathrooms} bai</span>
                {property.floor && <span>Etaj {property.floor}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={(e) => { e.stopPropagation(); toggleFavorite(property.id) }}
              >
                <Heart className={`h-4 w-4 mr-1 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                {isFav ? 'Salvat' : 'Salveaza'}
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
      className="card-hover overflow-hidden cursor-pointer group py-0 gap-0"
      onClick={() => onSelect(property.slug)}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center img-zoom"
          style={{ backgroundImage: `url(${coverImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className={typeColors[property.type] || 'bg-secondary'}>{typeLabels[property.type] || property.type}</Badge>
          {property.featured && (
            <Badge className="bg-amber-500 text-white border-0 gap-1">
              <Star className="h-3 w-3" /> Popular
            </Badge>
          )}
        </div>

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-white/90 dark:bg-black/60 backdrop-blur-sm border-0 shadow-sm hover:bg-white dark:hover:bg-black/80"
            onClick={(e) => { e.stopPropagation(); toggleFavorite(property.id) }}
            aria-label={isFav ? 'Sterge de la favorite' : 'Adauga la favorite'}
          >
            <Heart className={`h-4 w-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
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
        <div className="absolute bottom-3 left-3">
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
          <span className="line-clamp-1">{property.zone}, {property.sector && `Sector ${property.sector}, `}Bucuresti</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground pt-3 border-t border-border/50">
          <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{property.rooms}</span>
          <span className="flex items-center gap-1"><Maximize2 className="h-3.5 w-3.5" />{property.areaSqm} m²</span>
          <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{property.bathrooms}</span>
        </div>
      </CardContent>
    </Card>
  )
}