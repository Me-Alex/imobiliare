'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Heart, Scale, MapPin, BedDouble, Maximize2, Bath, Building,
  Calendar, Phone, ChevronLeft, ChevronRight,
  Home, CalendarCheck,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store/use-app-store'
import { useProperty } from '@/hooks/use-properties'
import { useCoinActions } from '@/hooks/use-coin-actions'
import { useQuery } from '@tanstack/react-query'
import { getProperties } from '@/lib/api'
import { formatBucharestLocation, formatPrice, formatPricePerSqm } from '@/lib/utils'
import type { Property } from '@/lib/types'
import { PropertyCard } from '@/components/property/property-card'
import { PropertyShareButtons } from '@/components/property/property-share-buttons'
import { AuthRequiredDialog } from '@/components/dialogs/auth-required-dialog'
import { useAuth } from '@/contexts/auth-context'


const typeLabels: Record<string, string> = {
  APARTMENT: 'Apartament', HOUSE: 'Casa', VILLA: 'Vila', LAND: 'Teren', COMMERCIAL: 'Comercial',
}

interface PropertyDetailDialogProps {
  onContact?: (propertyTitle: string) => void
}

export function PropertyDetailDialog({ onContact }: PropertyDetailDialogProps) {
  const { selectedPropertySlug, setSelectedPropertySlug, favorites, compareList, toggleFavorite, toggleCompare, setLightbox, setVizionareProperty, navigateTo, currentPage } = useAppStore()
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const { user } = useAuth()
  const { data: property, isLoading } = useProperty(selectedPropertySlug)
  const { onViewProperty, onFavorite, onBookViewing } = useCoinActions()

  const open = !!selectedPropertySlug && currentPage !== 'proprietate'
  const { selectedPropertySlug, setSelectedPropertySlug, favorites, compareList, toggleFavorite, toggleCompare, setLightbox, setVizionareProperty, navigateTo } = useAppStore()
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const { user } = useAuth()
  const { data: property, isLoading } = useProperty(selectedPropertySlug)
  const { onViewProperty, onFavorite, onBookViewing } = useCoinActions()

  const open = !!selectedPropertySlug

  const handleOpenChange = useCallback((v: boolean) => {
    if (!v) setSelectedPropertySlug(null)
  }, [setSelectedPropertySlug])

  // Earn coins for viewing property (once per session per property)
  useEffect(() => {
    if (property) {
      onViewProperty(property.id, property.title)
    }
  }, [property?.id])

  if (!open) return null

  if (isLoading || !property) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <Skeleton className="h-80 w-full" />
          <div className="p-6 space-y-4">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const gallery: string[] = property.galleryUrls ? JSON.parse(property.galleryUrls) : []
  const coverImage = property.coverUrl || gallery[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80'
  const images = [coverImage, ...gallery.filter((u) => u !== coverImage)]
  const isFav = favorites.includes(property.id)
  const isCompare = compareList.includes(property.id)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 sm:p-0 gap-0">
        {/* Image Gallery - key resets state on property change */}
        <ImageGallery key={property.id} images={images} title={property.title} onExpand={(idx) => setLightbox(images, idx)} />

        {/* Content */}
        <div className="p-6 space-y-6 section-dark-overlay relative">
          <DialogHeader className="text-left space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{typeLabels[property.type] || property.type}</Badge>
              <Badge variant="secondary">{property.transaction === 'SALE' ? 'Vanzare' : 'Inchiriere'}</Badge>
              {property.featured && <Badge className="bg-amber-500 text-white border-0">Popular</Badge>}
            </div>
            <DialogTitle className="text-2xl">{property.title}</DialogTitle>
            <DialogDescription className="flex items-center gap-1.5 text-base">
              <MapPin className="h-4 w-4" />
              {property.address}, {formatBucharestLocation(property.zone, property.sector)}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-4">
            <div className="text-3xl font-bold text-primary">{formatPrice(property.price)}</div>
            {property.pricePerSqm && (
              <div className="text-muted-foreground">{formatPricePerSqm(property.pricePerSqm)}</div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricCard icon={BedDouble} label="Camere" value={String(property.rooms)} />
            <MetricCard icon={Maximize2} label="Suprafata" value={`${property.areaSqm} m²`} />
            <MetricCard icon={Bath} label="Bai" value={String(property.bathrooms)} />
            <MetricCard icon={Building} label="Etaj" value={property.floor ? `Etaj ${property.floor}` : '-'} />
          </div>

          {property.yearBuilt && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              An constructie: {property.yearBuilt}
            </div>
          )}

          <Separator />

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Descriere</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant={isFav ? 'default' : 'outline'}
              onClick={() => {
                const wasFav = favorites.includes(property.id)
                toggleFavorite(property.id)
                if (!wasFav) onFavorite(property.title)
              }}
              className="gap-2"
            >
              <Heart className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
              {isFav ? 'Salvat la favorite' : 'Salveaza'}
            </Button>
            <Button
              variant={isCompare ? 'default' : 'outline'}
              onClick={() => toggleCompare(property.id)}
              className="gap-2"
            >
              <Scale className="h-4 w-4" />
              {isCompare ? 'In comparatie' : 'Compara'}
            </Button>
            <Button
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                if (!user) {
                  setAuthDialogOpen(true)
                  return
                }
                setVizionareProperty(property.id, property.title)
                setSelectedPropertySlug(null)
                navigateTo('programare-vizionare')
                onBookViewing(property.title)
              }}
            >
              <CalendarCheck className="h-4 w-4" />
              Programeaza Vizionare
            </Button>
            <Button
              variant="outline"
              className="gap-2 ml-auto"
              onClick={() => onContact?.(property.title)}
            >
              <Phone className="h-4 w-4" />
              Contacteaza
            </Button>
          </div>

          {/* Share buttons */}
          <PropertyShareButtons property={property} />

          {/* Similar properties section */}
          <SimilarProperties currentId={property.id} zone={property.zone} type={property.type} price={property.price} onSelect={setSelectedPropertySlug} />
        </div>
      </DialogContent>
      <AuthRequiredDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        actionLabel="Programeaza o Vizionare"
        actionIcon={CalendarCheck}
        description="Pentru a programa o vizionare la aceasta proprietate, trebuie sa fii autentificat."
        returnPage="programare-vizionare"
        returnContext={{
          vizionarePropertyId: property.id,
          vizionarePropertyTitle: property.title,
          fromProperty: property.slug,
        }}
      />
    </Dialog>
  )
}

function ImageGallery({ images, title, onExpand }: { images: string[]; title: string; onExpand: (index: number) => void }) {
  const [currentImage, setCurrentImage] = useState(0)
  const coverImage = images[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80'

  const nextImage = () => {
    setCurrentImage((p) => (p + 1) % Math.max(images.length, 1))
  }

  const prevImage = () => {
    setCurrentImage((p) => (p - 1 + Math.max(images.length, 1)) % Math.max(images.length, 1))
  }

  return (
    <div className="relative bg-muted">
      <div
        className="aspect-video sm:aspect-[16/9] relative overflow-hidden cursor-zoom-in"
        onClick={() => onExpand(currentImage)}
        role="button"
        tabIndex={0}
        aria-label="Expandeaza galeria"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onExpand(currentImage) } }}
      >
        <img
          src={images[currentImage] || coverImage}
          alt={`${title} - Imaginea ${currentImage + 1}`}
          className="w-full h-full object-cover transition-opacity duration-300"
        />
        {/* Expand button */}
        <button
          className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-sm border-0 hover:bg-white dark:hover:bg-black/80 transition-colors shadow-sm"
          onClick={(e) => { e.stopPropagation(); onExpand(currentImage) }}
          aria-label="Expandeaza"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 bg-white/80 dark:bg-black/60 backdrop-blur-sm rounded-full border-0 hover:bg-white dark:hover:bg-black/80 transition-colors"
              onClick={prevImage}
              aria-label="Imaginea anterioara"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 bg-white/80 dark:bg-black/60 backdrop-blur-sm rounded-full border-0 hover:bg-white dark:hover:bg-black/80 transition-colors"
              onClick={nextImage}
              aria-label="Imaginea urmatoare"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
            {currentImage + 1} / {images.length}
          </div>
        )}
      </div>
      {/* Gallery dot indicators */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-3">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentImage(i)}
              className={`transition-all duration-300 rounded-full ${
                i === currentImage
                  ? 'w-6 h-2 bg-primary'
                  : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Imaginea ${i + 1}`}
            />
          ))}
        </div>
      )}
      {images.length > 1 && (
        <div className="flex gap-2 px-3 pb-3 overflow-x-auto scrollbar-thin">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrentImage(i)}
              className={`shrink-0 w-16 h-12 rounded-md overflow-hidden border-2 transition-all duration-200 ${i === currentImage ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-70 hover:opacity-100'}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MetricCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <div className="text-sm font-medium">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}

function SimilarProperties({ currentId, zone, type, price, onSelect }: { currentId: string; zone: string; type: string; price: number; onSelect: (slug: string) => void }) {
  const priceMargin = price * 0.3
  const minPrice = Math.max(0, Math.round(price - priceMargin))
  const maxPrice = Math.round(price + priceMargin)

  // Primary query: same zone + type + similar price range
  const { data: zoneTypeResults, isLoading: loadingPrimary } = useQuery({
    queryKey: ['similar-zone-type', zone, type, minPrice, maxPrice, currentId],
    queryFn: () => getProperties({ zone, type, minPrice, maxPrice }),
    staleTime: 30_000,
  })

  // Fallback query: same zone only (no type filter) — enabled when primary doesn't yield enough
  const primaryFiltered = (zoneTypeResults ?? []).filter((p) => p.id !== currentId)
  const needFallback = !loadingPrimary && primaryFiltered.length < 3

  const { data: zoneOnlyResults, isLoading: loadingFallback } = useQuery({
    queryKey: ['similar-zone-only', zone, minPrice, maxPrice, currentId],
    queryFn: () => getProperties({ zone, minPrice, maxPrice }),
    staleTime: 30_000,
    enabled: needFallback,
  })

  const isLoading = loadingPrimary || (needFallback && loadingFallback)

  // Merge results: prefer zone+type, fill from zone-only, deduplicate, limit to 4
  const zoneOnlyFiltered = (zoneOnlyResults ?? []).filter(
    (p) => p.id !== currentId && !primaryFiltered.some((pp) => pp.id === p.id),
  )
  const similar = [...primaryFiltered, ...zoneOnlyFiltered].slice(0, 4)

  // Don't render anything while loading — but we do show the section with skeletons
  // Hide entire section if still loading and not yet resolved
  // Show skeletons while loading, hide section if no results after loading

  return (
    <>
      <Separator className="my-6" />
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Home className="h-5 w-5 text-primary" />
        Proprietati Similare
      </h3>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : similar.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {similar.map((prop) => (
            <PropertyCard key={prop.id} property={prop} onSelect={onSelect} />
          ))}
        </div>
      ) : null}
    </>
  )
}
