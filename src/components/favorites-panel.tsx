'use client'

import { useState, useEffect } from 'react'
import { Heart, MapPin, BedDouble, Maximize2, Trash2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store/use-app-store'
import { getPropertiesByIds, formatPrice, type Property } from '@/lib/api'

interface FavoritesPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FavoritesPanel({ open, onOpenChange }: FavoritesPanelProps) {
  const { favorites, toggleFavorite, setSelectedPropertySlug } = useAppStore()
  const [properties, setProperties] = useState<Property[] | null>(null)

  // Fetch property data when favorites change and sheet is open
  useEffect(() => {
    if (!open || favorites.length === 0) {
      return
    }

    let cancelled = false

    getPropertiesByIds(favorites)
      .then((props) => {
        if (!cancelled) {
          setProperties(props)
        }
      })
      .catch(() => {
        if (!cancelled) setProperties([])
      })

    return () => {
      cancelled = true
    }
  }, [open, favorites])

  const loading = open && favorites.length > 0 && properties === null
  const displayProperties = !open ? [] : (properties ?? [])

  const handleViewDetails = (slug: string) => {
    setSelectedPropertySlug(slug)
    onOpenChange(false)
  }

  const handleRemove = (id: string) => {
    toggleFavorite(id)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Heart className="h-5 w-5 text-primary fill-primary" />
            Favorite
          </SheetTitle>
          <SheetDescription>
            {favorites.length === 0
              ? 'Nu ai salvat nicio proprietate inca.'
              : `${favorites.length} ${favorites.length === 1 ? 'proprietate' : 'proprietati'} salvate`}
          </SheetDescription>
        </SheetHeader>

        <Separator className="mt-2" />

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="px-6 py-4 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-32 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : displayProperties.length === 0 ? (
            <EmptyState />
          ) : (
            <ScrollArea className="h-full">
              <div className="px-6 py-4 space-y-4">
                {displayProperties.map((property) => (
                  <FavoriteItem
                    key={property.id}
                    property={property}
                    onViewDetails={() => handleViewDetails(property.slug)}
                    onRemove={() => handleRemove(property.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function FavoriteItem({
  property,
  onViewDetails,
  onRemove,
}: {
  property: Property
  onViewDetails: () => void
  onRemove: () => void
}) {
  const gallery: string[] = property.galleryUrls ? JSON.parse(property.galleryUrls) : []
  const coverImage = property.coverUrl || gallery[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=60'

  return (
    <div className="group rounded-xl border bg-card overflow-hidden transition-all hover:shadow-md">
      <div className="flex flex-col sm:flex-row">
        {/* Cover image */}
        <div className="relative sm:w-32 h-36 sm:h-auto shrink-0">
          <img
            src={coverImage}
            alt={property.title}
            className="w-full h-full object-cover"
          />
          <Badge className="absolute top-2 left-2 text-xs bg-primary text-primary-foreground border-0">
            {formatPrice(property.price)}
          </Badge>
        </div>

        {/* Content */}
        <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between gap-2">
          <div>
            <h3 className="font-semibold text-sm line-clamp-1">{property.title}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="line-clamp-1">{property.zone}{property.sector ? `, Sector ${property.sector}` : ''}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <BedDouble className="h-3 w-3" />
              <span>{property.rooms} camere</span>
            </div>
            <div className="flex items-center gap-1">
              <Maximize2 className="h-3 w-3" />
              <span>{property.areaSqm} m²</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="flex-1 h-8 text-xs gap-1"
              onClick={onViewDetails}
            >
              Vezi detalii
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onRemove}
            >
              <Trash2 className="h-3 w-3" />
              Sterge
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
        <Heart className="h-8 w-8 text-primary" />
      </div>
      <h3 className="font-semibold text-lg mb-1">Nu ai favorite inca</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Apasa pe iconita de inima de pe orice proprietate pentru a o salva aici.
      </p>
    </div>
  )
}
