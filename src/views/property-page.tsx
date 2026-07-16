'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Heart,
  Scale,
  MapPin,
  BedDouble,
  Maximize2,
  Bath,
  Building,
  Calendar,
  Phone,
  ChevronLeft,
  ChevronRight,
  Home,
  CalendarCheck,
  Star,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { useAppStore } from '@/store/use-app-store'
import { useAuth } from '@/contexts/auth-context'
import { useCoinActions } from '@/hooks/use-coin-actions'
import { useProperty } from '@/hooks/use-properties'
import { PropertyShareButtons } from '@/components/property/property-share-buttons'
import { AuthRequiredDialog } from '@/components/dialogs/auth-required-dialog'
import { formatBucharestLocation, formatPrice, formatPricePerSqm } from '@/lib/utils'
import { toast } from 'sonner'
import type { Property } from '@/lib/types'

const typeLabels: Record<string, string> = {
  APARTMENT: 'Apartament',
  HOUSE: 'Casa',
  VILLA: 'Vila',
  LAND: 'Teren',
  COMMERCIAL: 'Comercial',
}

export function PropertyPage() {
  const {
    selectedPropertySlug,
    favorites,
    compareList,
    toggleFavorite,
    toggleCompare,
    setVizionareProperty,
    navigateTo,
    setSelectedPropertySlug,
    setLightbox,
  } = useAppStore()
  const { user } = useAuth()
  const { onFavorite } = useCoinActions()
  const [authDialogOpen, setAuthDialogOpen] = useState(false)

  const slug = selectedPropertySlug
  const { data: property, isLoading } = useProperty(slug)

  if (isLoading || !property) {
    return <PropertyPageSkeleton />
  }

  const isFav = favorites.includes(property.id)
  const isCompare = compareList.includes(property.id)

  const handleBack = () => {
    setSelectedPropertySlug(null)
    navigateTo('proprietati')
  }

  const handleToggleFavorite = () => {
    const wasFavorite = favorites.includes(property.id)
    toggleFavorite(property.id)
    if (!wasFavorite) void onFavorite(property.id, property.title)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Gallery with key remounts on property change, resetting image index */}
      <PropertyGallery
        key={property.id}
        property={property}
        onLightbox={(images, idx) => setLightbox(images, idx)}
        onBack={handleBack}
      />

      {/* ── Main Content ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          {/* Left column */}
          <div className="space-y-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="secondary">{typeLabels[property.type] || property.type}</Badge>
                <Badge variant="secondary">{property.transaction === 'SALE' ? 'Vanzare' : 'Inchiriere'}</Badge>
                {property.featured && (
                  <Badge className="bg-amber-500 text-white border-0 gap-1">
                    <Star className="h-3 w-3" /> Popular
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{property.title}</h1>
              <div className="flex items-center gap-1.5 text-muted-foreground mt-2">
                <MapPin className="h-4 w-4" />
                {property.address}, {formatBucharestLocation(property.zone, property.sector)}
              </div>
            </motion.div>

            {/* Price */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-wrap items-center gap-4"
            >
              <div className="text-3xl sm:text-4xl font-bold text-primary">{formatPrice(property.price)}</div>
              {property.pricePerSqm && (
                <div className="text-muted-foreground">{formatPricePerSqm(property.pricePerSqm)}</div>
              )}
            </motion.div>

            {/* Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
              <MetricCard icon={BedDouble} label="Camere" value={String(property.rooms)} />
              <MetricCard icon={Maximize2} label="Suprafata" value={`${property.areaSqm} m²`} />
              <MetricCard icon={Bath} label="Bai" value={String(property.bathrooms)} />
              <MetricCard icon={Building} label="Etaj" value={property.floor ? `Etaj ${property.floor}` : '-'} />
            </motion.div>

            {property.yearBuilt && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Calendar className="h-4 w-4" />
                An constructie: {property.yearBuilt}
              </motion.div>
            )}

            <Separator />

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <h2 className="text-lg font-semibold mb-3">Descriere</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </motion.div>

            <Separator />

            {/* Share */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
            >
              <PropertyShareButtons property={property} />
            </motion.div>
          </div>

          {/* Right sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <Card className="sticky top-24">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold">Actiuni</h3>

                <div className="space-y-2">
                  <Button
                    variant={isFav ? 'default' : 'outline'}
                    onClick={handleToggleFavorite}
                    className="w-full gap-2"
                  >
                    <Heart className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
                    {isFav ? 'Salvat la favorite' : 'Salveaza la favorite'}
                  </Button>

                  <Button
                    variant={isCompare ? 'default' : 'outline'}
                    onClick={() => toggleCompare(property.id)}
                    className="w-full gap-2"
                  >
                    <Scale className="h-4 w-4" />
                    {isCompare ? 'In comparatie' : 'Compara'}
                  </Button>

                  <Button
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      if (!user) {
                        setAuthDialogOpen(true)
                        return
                      }
                      setVizionareProperty(property.id, property.title)
                      navigateTo('programare-vizionare')
                    }}
                  >
                    <CalendarCheck className="h-4 w-4" />
                    Programeaza Vizionare
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => toast.info('Contacteaza agentul', { description: 'Formularul de contact va fi disponibil in curand.' })}
                  >
                    <Phone className="h-4 w-4" />
                    Contacteaza Agentul
                  </Button>
                </div>

                <Separator />

                {/* Quick info */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tip</span>
                    <span className="font-medium">{typeLabels[property.type] || property.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tranzactie</span>
                    <span className="font-medium">{property.transaction === 'SALE' ? 'Vanzare' : 'Inchiriere'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Zona</span>
                    <span className="font-medium">{property.zone}</span>
                  </div>
                  {property.sector && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sector</span>
                      <span className="font-medium">{property.sector}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

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
    </div>
  )
}

// ─── Gallery Component (remounts via key to reset state) ──────────────────────

function PropertyGallery({
  property,
  onLightbox,
  onBack,
}: {
  property: Property
  onLightbox: (images: string[], idx: number) => void
  onBack: () => void
}) {
  const [currentImage, setCurrentImage] = useState(0)

  const gallery: string[] = property.galleryUrls ? JSON.parse(property.galleryUrls) : []
  const coverImage = property.coverUrl || gallery[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80'
  const images = [coverImage, ...gallery.filter((u) => u !== coverImage)]

  const nextImage = () => setCurrentImage((p) => (p + 1) % Math.max(images.length, 1))
  const prevImage = () => setCurrentImage((p) => (p - 1 + Math.max(images.length, 1)) % Math.max(images.length, 1))

  return (
    <div className="relative bg-muted">
      <div className="aspect-[21/9] sm:aspect-[21/8] lg:aspect-[21/7] relative overflow-hidden">
        <motion.img
          key={currentImage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          src={images[currentImage] || coverImage}
          alt={`${property.title} - Imaginea ${currentImage + 1}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-sm px-3 py-1.5 text-sm font-medium text-foreground shadow-sm hover:bg-white dark:hover:bg-black/80 transition-colors z-10"
        >
          <ArrowLeft className="h-4 w-4" />
          Inapoi
        </button>

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm z-10">
            {currentImage + 1} / {images.length}
          </div>
        )}

        {/* Nav arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-white/80 dark:bg-black/60 backdrop-blur-sm rounded-full border-0 hover:bg-white dark:hover:bg-black/80 transition-colors"
              onClick={prevImage}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-white/80 dark:bg-black/60 backdrop-blur-sm rounded-full border-0 hover:bg-white dark:hover:bg-black/80 transition-colors"
              onClick={nextImage}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Expand */}
        <button
          onClick={() => onLightbox(images, currentImage)}
          className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-sm border-0 hover:bg-white dark:hover:bg-black/80 transition-colors shadow-sm z-10"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-thin bg-background border-b">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrentImage(i)}
              className={`shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition-all duration-200 ${
                i === currentImage ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Skeleton Loading ─────────────────────────────────────────────────────────

function PropertyPageSkeleton() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <Skeleton className="aspect-[21/9] sm:aspect-[21/8] lg:aspect-[21/7] w-full" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          <div className="space-y-8">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-12 w-48" />
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function MetricCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-4">
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
