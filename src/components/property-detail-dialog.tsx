'use client'

import { useState, useCallback } from 'react'
import {
  Heart, Scale, MapPin, BedDouble, Maximize2, Bath, Building,
  Calendar, Phone, ChevronLeft, ChevronRight,
  Share2, MessageCircle, Link, Check,
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
import { useProperty, useProperties } from '@/hooks/use-properties'
import { formatPrice, formatPricePerSqm, type Property } from '@/lib/api'
import { toast } from 'sonner'
import { PropertyCard } from '@/components/property-card'

const typeLabels: Record<string, string> = {
  APARTMENT: 'Apartament', HOUSE: 'Casa', VILLA: 'Vila', LAND: 'Teren', COMMERCIAL: 'Comercial',
}

interface PropertyDetailDialogProps {
  onContact?: (propertyTitle: string) => void
}

export function PropertyDetailDialog({ onContact }: PropertyDetailDialogProps) {
  const { selectedPropertySlug, setSelectedPropertySlug, favorites, compareList, toggleFavorite, toggleCompare } = useAppStore()
  const [copied, setCopied] = useState(false)
  const { data: property, isLoading } = useProperty(selectedPropertySlug)

  const open = !!selectedPropertySlug

  const handleOpenChange = useCallback((v: boolean) => {
    if (!v) setSelectedPropertySlug(null)
  }, [setSelectedPropertySlug])

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
        <ImageGallery key={property.id} images={images} title={property.title} />

        {/* Content */}
        <div className="p-6 space-y-6">
          <DialogHeader className="text-left space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{typeLabels[property.type] || property.type}</Badge>
              <Badge variant="secondary">{property.transaction === 'SALE' ? 'Vanzare' : 'Inchiriere'}</Badge>
              {property.featured && <Badge className="bg-amber-500 text-white border-0">Popular</Badge>}
            </div>
            <DialogTitle className="text-2xl">{property.title}</DialogTitle>
            <DialogDescription className="flex items-center gap-1.5 text-base">
              <MapPin className="h-4 w-4" />
              {property.address}, {property.zone}{property.sector ? `, Sector ${property.sector}` : ''}, Bucuresti
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
              onClick={() => toggleFavorite(property.id)}
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
              className="gap-2 ml-auto"
              onClick={() => onContact?.(property.title)}
            >
              <Phone className="h-4 w-4" />
              Contacteaza
            </Button>
          </div>

          {/* Share buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Share2 className="h-4 w-4" />
              Distribuie
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs"
                onClick={() => {
                  const text = `Proprietate: ${property.title} - ${formatPrice(property.price)} - ${window.location.origin}`
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
                }}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs"
                onClick={() => {
                  const link = `${window.location.origin}?property=${property.slug}`
                  navigator.clipboard.writeText(link).then(() => {
                    setCopied(true)
                    toast.success('Link copiat!', { description: 'Link-ul a fost copiat in clipboard.' })
                    setTimeout(() => setCopied(false), 2000)
                  }).catch(() => {
                    toast.error('Eroare', { description: 'Nu am putut copia link-ul.' })
                  })
                }}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Link className="h-3.5 w-3.5" />
                )}
                {copied ? 'Copiat' : 'Copiaza link'}
              </Button>
            </div>
          </div>

          {/* Similar properties section */}
          <Separator />
          <div>
            <h3 className="font-semibold mb-4">Proprietati similare</h3>
            <SimilarProperties currentId={property.id} zone={property.zone} type={property.type} onSelect={setSelectedPropertySlug} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ImageGallery({ images, title }: { images: string[]; title: string }) {
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
      <div className="aspect-video sm:aspect-[16/9] relative overflow-hidden">
        <img
          src={images[currentImage] || coverImage}
          alt={title}
          className="w-full h-full object-cover"
        />
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 bg-white/80 dark:bg-black/60 backdrop-blur-sm rounded-full border-0"
              onClick={prevImage}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 bg-white/80 dark:bg-black/60 backdrop-blur-sm rounded-full border-0"
              onClick={nextImage}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            {currentImage + 1} / {images.length}
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 p-3 overflow-x-auto scrollbar-thin">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrentImage(i)}
              className={`shrink-0 w-16 h-12 rounded-md overflow-hidden border-2 transition-colors ${i === currentImage ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'}`}
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

function SimilarProperties({ currentId, zone, type, onSelect }: { currentId: string; zone: string; type: string; onSelect: (slug: string) => void }) {
  const { data: properties } = useProperties({ zone, type, sort: 'newest' })
  const similar = properties?.filter((p) => p.id !== currentId).slice(0, 3)

  if (!similar || similar.length === 0) {
    return <p className="text-sm text-muted-foreground">Nu am gasit proprietati similare.</p>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {similar.map((p: Property) => (
        <PropertyCard key={p.id} property={p} onSelect={onSelect} />
      ))}
    </div>
  )
}