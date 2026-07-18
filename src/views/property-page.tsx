'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building,
  CalendarCheck,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileText,
  GraduationCap,
  Heart,
  ImageIcon,
  Info,
  Mail,
  MapPin,
  Maximize2,
  MessageSquare,
  Scale,
  SearchX,
  ShieldCheck,
  ShoppingBag,
  Play,
  Rotate3D,
  Star,
  TrainFront,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAppStore } from '@/store/use-app-store'
import { useAuth } from '@/contexts/auth-context'
import { useCoinActions } from '@/hooks/use-coin-actions'
import { useProperties, useProperty } from '@/hooks/use-properties'
import { PropertyShareButtons } from '@/components/property/property-share-buttons'
import { PropertyCard } from '@/components/property/property-card'
import { VirtualTourViewer } from '@/components/property/virtual-tour-viewer'
import { ContactFormDialog } from '@/components/dialogs/contact-form-dialog'
import { AuthRequiredDialog } from '@/components/dialogs/auth-required-dialog'
import { formatBucharestLocation, formatPrice, formatPricePerSqm } from '@/lib/utils'
import {
  formatPropertyUpdatedAt,
  getMapEmbedUrl,
  getNearbySearchUrl,
  getPropertyFeatures,
  getPropertyImages,
  getRelatedProperties,
  PROPERTY_TYPE_LABELS,
  TRANSACTION_LABELS,
} from '@/lib/property-details'
import type { Property } from '@/lib/types'
import { virtualTourProviderLabel } from '@/lib/virtual-tours'
import { recordPropertyView } from '@/lib/transaction-workspace'

interface PropertyPageProps {
  initialSlug?: string
  initialProperty?: Property
  standalone?: boolean
}

type ContactIntent = 'general' | 'documents'

export function PropertyPage({ initialSlug, initialProperty, standalone = false }: PropertyPageProps = {}) {
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
  const { user, profile } = useAuth()
  const { onFavorite, onUnfavorite, onViewProperty } = useCoinActions()
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [contactIntent, setContactIntent] = useState<ContactIntent>('general')
  const [virtualTourOpen, setVirtualTourOpen] = useState(false)

  const slug = initialSlug || selectedPropertySlug
  const { data: property, isLoading, isError } = useProperty(slug, initialProperty)
  const { data: candidateProperties = [] } = useProperties()

  useEffect(() => {
    if (property) {
      void onViewProperty(property.id, property.title)
      void recordPropertyView(property.id)
    }
  }, [onViewProperty, property])

  const relatedProperties = useMemo(
    () => property ? getRelatedProperties(property, candidateProperties) : [],
    [candidateProperties, property],
  )

  if (isLoading) return <PropertyPageSkeleton />
  if (isError || !property) return <PropertyUnavailable standalone={standalone} />

  const isFav = favorites.includes(property.id)
  const isCompare = compareList.includes(property.id)
  const typeLabel = PROPERTY_TYPE_LABELS[property.type] || property.type
  const transactionLabel = TRANSACTION_LABELS[property.transaction] || property.transaction
  const features = getPropertyFeatures(property)

  const handleBack = () => {
    setSelectedPropertySlug(null)
    if (standalone) {
      window.location.assign('/?page=proprietati')
      return
    }
    navigateTo('proprietati')
  }

  const handleToggleFavorite = () => {
    const wasFavorite = favorites.includes(property.id)
    toggleFavorite(property.id)
    if (!wasFavorite) void onFavorite(property.id, property.title)
    else void onUnfavorite(property.id)
  }

  const handleSchedule = () => {
    if (!user) {
      setAuthDialogOpen(true)
      return
    }

    setVizionareProperty(property.id, property.title)
    sessionStorage.setItem('pm-route-viewing-context', JSON.stringify({
      propertyId: property.id,
      propertyTitle: property.title,
      propertySlug: property.slug,
    }))
    navigateTo('programare-vizionare')
  }

  const openContact = (intent: ContactIntent = 'general') => {
    setContactIntent(intent)
    setContactOpen(true)
  }

  const contactMessage = contactIntent === 'documents'
    ? `Bună ziua, doresc planul proprietății și informații despre documentele disponibile pentru „${property.title}”.`
    : `Bună ziua, sunt interesat(ă) de proprietatea „${property.title}” și doresc mai multe detalii.`

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-20 lg:pb-0">
      <PropertyGallery
        key={property.id}
        property={property}
        onLightbox={(images, index) => setLightbox(images, index)}
        onBack={handleBack}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-8">
            <motion.header
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{typeLabel}</Badge>
                <Badge variant="secondary">{transactionLabel}</Badge>
                {property.featured && (
                  <Badge className="gap-1 border-0 bg-amber-500 text-white">
                    <Star className="h-3 w-3" /> Recomandată
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1 border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> Anunț activ
                </Badge>
                {property.virtualTour ? (
                  <Badge className="gap-1 border-0 bg-violet-600 text-white">
                    <Rotate3D className="h-3 w-3" /> {property.virtualTour.isDemo ? 'Tur virtual demo' : 'Tur virtual'}
                  </Badge>
                ) : null}
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">{property.title}</h1>
              <div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground sm:text-base">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{property.address}, {formatBucharestLocation(property.zone, property.sector)}</span>
              </div>
            </motion.header>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="flex flex-wrap items-end gap-x-4 gap-y-1"
            >
              <div>
                <div className="text-3xl font-bold text-primary sm:text-4xl">
                  {formatPrice(property.price, property.currency)}
                </div>
                {property.transaction === 'RENT' || property.transaction === 'INCHIRIERE' || property.transaction === 'Inchiriere' ? (
                  <p className="mt-1 text-xs text-muted-foreground">pe lună, dacă anunțul nu precizează altfel</p>
                ) : null}
              </div>
              {property.pricePerSqm ? (
                <div className="pb-1 text-sm text-muted-foreground">{formatPricePerSqm(property.pricePerSqm)}</div>
              ) : null}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12 }}
              className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              <MetricCard icon={BedDouble} label="Camere" value={property.rooms ? String(property.rooms) : '—'} />
              <MetricCard icon={Maximize2} label="Suprafață utilă" value={`${property.areaSqm} m²`} />
              <MetricCard icon={Bath} label="Băi" value={property.bathrooms ? String(property.bathrooms) : '—'} />
              <MetricCard icon={Building} label="Etaj" value={property.floor === null ? '—' : String(property.floor)} />
            </motion.div>

            <div className="grid gap-2 sm:grid-cols-2 lg:hidden">
              <Button className="h-11 gap-2 bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleSchedule}>
                <CalendarCheck className="h-4 w-4" /> Programează vizionare
              </Button>
              <Button variant="outline" className="h-11 gap-2" onClick={() => openContact()}>
                <MessageSquare className="h-4 w-4" /> Întreabă agentul
              </Button>
            </div>

            <Section title="Descriere">
              <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground sm:text-base">
                {property.description}
              </p>
            </Section>

            {property.virtualTour ? (
              <Section title="Explorează proprietatea de oriunde" icon={Rotate3D}>
                <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-violet-600 via-primary to-emerald-600 p-6 text-white shadow-lg sm:p-8">
                  <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
                  <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="max-w-xl">
                      <Badge className="border-white/20 bg-white/15 text-white hover:bg-white/15">
                        {property.virtualTour.isDemo ? 'Demonstrație 360°' : virtualTourProviderLabel(property.virtualTour.provider)}
                      </Badge>
                      <h3 className="mt-3 text-xl font-bold sm:text-2xl">
                        {property.virtualTour.isDemo ? 'Tur virtual demonstrativ' : 'Tur virtual interactiv'}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/80">
                        {property.virtualTour.isDemo
                          ? 'Deplasează-te între camere într-un tur 360° complet. Imaginile sunt sintetice și nu reprezintă interiorul real al proprietății.'
                          : 'Parcurge camerele în format 360°, verifică spațiul și pregătește întrebările înainte de vizionarea fizică.'}
                      </p>
                      {property.virtualTour.provider === 'NATIVE' ? (
                        <p className="mt-2 text-xs text-white/70">
                          {property.virtualTour.isDemo
                            ? `${property.virtualTour.scenes.length} camere demonstrative conectate`
                            : `${property.virtualTour.scenes.length} camere conectate`}
                        </p>
                      ) : null}
                    </div>
                    <Button type="button" size="lg" variant="secondary" className="shrink-0 gap-2 bg-white text-slate-950 hover:bg-white/90" onClick={() => setVirtualTourOpen(true)}>
                      <Play className="h-4 w-4 fill-current" /> Pornește turul
                    </Button>
                  </div>
                </div>
              </Section>
            ) : null}

            <Section title="Dotări și facilități" icon={Wrench}>
              {features.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {features.map((feature) => (
                    <div key={feature.label} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        {feature.category === 'Acces' ? <Car className="h-4 w-4 text-primary" /> : <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{feature.label}</p>
                        <p className="text-[11px] text-muted-foreground">{feature.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <InfoBox text="Dotările exacte nu sunt încă structurate în anunț. Solicită agentului lista completă înainte de programare." />
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Facilitățile de mai sus sunt extrase din descrierea publicată și se reconfirmă la vizionare.
              </p>
            </Section>

            <Section title="Detalii, costuri și verificări" icon={ShieldCheck}>
              <div className="grid gap-4 md:grid-cols-2">
                <DetailGroup title="Caracteristici">
                  <DetailRow label="An construcție" value={property.yearBuilt ? String(property.yearBuilt) : 'Nespecificat'} />
                  <DetailRow label="Tip proprietate" value={typeLabel} />
                  <DetailRow label="Tranzacție" value={transactionLabel} />
                  <DetailRow label="Disponibilitate" value="Se confirmă la programare" />
                </DetailGroup>
                <DetailGroup title="Costuri și documente">
                  <DetailRow label="Comision" value="Se precizează în oferta/contractul de intermediere" />
                  <DetailRow label="Costuri lunare" value="Disponibile la cerere" />
                  <DetailRow label="Clasă energetică" value="Certificatul se solicită agentului" />
                  <DetailRow label="Ultima actualizare" value={formatPropertyUpdatedAt(property.updatedAt)} />
                </DetailGroup>
              </div>
              <InfoBox text="Informațiile juridice, cadastrale și costurile finale se validează documentar înainte de semnarea unei tranzacții. Publicarea anunțului nu reprezintă o garanție juridică." />
            </Section>

            <Section title={`Localizare în ${property.zone}`} icon={MapPin}>
              {property.lat !== null && property.lng !== null ? (
                <div className="overflow-hidden rounded-2xl border bg-muted">
                  <iframe
                    title={`Hartă orientativă pentru ${property.title}`}
                    src={getMapEmbedUrl(property.lat, property.lng)}
                    className="h-72 w-full border-0 sm:h-96"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              ) : (
                <div className="flex h-56 items-center justify-center rounded-2xl border bg-muted/40 text-center">
                  <div>
                    <MapPin className="mx-auto h-7 w-7 text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium">Poziția exactă nu este publicată</p>
                    <p className="mt-1 text-xs text-muted-foreground">Agentul o confirmă înainte de vizionare.</p>
                  </div>
                </div>
              )}
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <NearbyLink icon={TrainFront} label="Transport în apropiere" href={getNearbySearchUrl('transport public', property)} />
                <NearbyLink icon={GraduationCap} label="Școli în apropiere" href={getNearbySearchUrl('școli', property)} />
                <NearbyLink icon={ShoppingBag} label="Magazine în apropiere" href={getNearbySearchUrl('magazine', property)} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Poziția și rezultatele externe sunt orientative. Adresa și timpii de deplasare se verifică înainte de vizionare.
              </p>
            </Section>

            <Section title="Planuri și documente" icon={FileText}>
              <div className="grid gap-3 sm:grid-cols-3">
                <DocumentStatus icon={ImageIcon} title="Plan proprietate" status="La cerere" />
                <DocumentStatus icon={FileCheck2} title="Certificat energetic" status="De confirmat" />
                <DocumentStatus icon={ShieldCheck} title="Acte și cadastru" status="Verificare înainte de tranzacție" />
              </div>
              <Button variant="outline" className="mt-4 gap-2" onClick={() => openContact('documents')}>
                <Mail className="h-4 w-4" /> Solicită documentele disponibile
              </Button>
            </Section>

            <Separator />
            <PropertyShareButtons property={property} />
          </div>

          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="hidden lg:block"
          >
            <Card className="sticky top-24 overflow-hidden">
              <CardContent className="space-y-5 p-5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border">
                    <AvatarFallback className="bg-primary/10 font-semibold text-primary">HQS</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold">Echipa HQS Imobiliare</p>
                    <p className="text-xs text-muted-foreground">Consultanță pentru această proprietate</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  <Clock3 className="h-4 w-4 shrink-0 text-primary" />
                  Răspuns în timpul programului agenției
                </div>
                <div className="space-y-2">
                  <Button className="h-11 w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleSchedule}>
                    <CalendarCheck className="h-4 w-4" /> Programează vizionare
                  </Button>
                  <Button variant="outline" className="h-11 w-full gap-2" onClick={() => openContact()}>
                    <MessageSquare className="h-4 w-4" /> Contactează agentul
                  </Button>
                  <a
                    href="mailto:contact@hqsimobiliare.ro"
                    className="flex h-10 items-center justify-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Mail className="h-4 w-4" /> contact@hqsimobiliare.ro
                  </a>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2">
                  <Button variant={isFav ? 'default' : 'outline'} onClick={handleToggleFavorite} className="gap-2">
                    <Heart className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
                    {isFav ? 'Salvat' : 'Salvează'}
                  </Button>
                  <Button variant={isCompare ? 'default' : 'outline'} onClick={() => toggleCompare(property.id)} className="gap-2">
                    <Scale className="h-4 w-4" /> {isCompare ? 'Adăugat' : 'Compară'}
                  </Button>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <DetailRow label="ID anunț" value={property.id.slice(0, 8).toUpperCase()} />
                  <DetailRow label="Zonă" value={property.zone} />
                  {property.sector ? <DetailRow label="Sector" value={property.sector} /> : null}
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs leading-relaxed text-muted-foreground">
                  <div className="mb-1 flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                    <ShieldCheck className="h-4 w-4" /> Proces transparent
                  </div>
                  Programarea, documentele și semnăturile sunt urmărite în contul tău HQS.
                </div>
              </CardContent>
            </Card>
          </motion.aside>
        </div>

        {relatedProperties.length > 0 ? (
          <section className="mt-14 border-t pt-10" aria-labelledby="similar-properties-title">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-primary">Alternative relevante</p>
                <h2 id="similar-properties-title" className="mt-1 text-2xl font-bold">Proprietăți similare</h2>
              </div>
              <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => standalone ? window.location.assign('/?page=proprietati') : navigateTo('proprietati')}>
                Vezi toate
              </Button>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {relatedProperties.map((item) => <PropertyCard key={item.id} property={item} />)}
            </div>
          </section>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-[1fr_auto] gap-2">
          <Button className="h-11 gap-2 bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleSchedule}>
            <CalendarCheck className="h-4 w-4" /> Programează vizionare
          </Button>
          <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => openContact()} aria-label="Trimite mesaj agentului">
            <MessageSquare className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <ContactFormDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        propertyTitle={property.title}
        propertyId={property.id}
        initialName={profile?.fullName || user?.user_metadata?.full_name || ''}
        initialEmail={user?.email || ''}
        initialPhone={profile?.phone || ''}
        initialMessage={contactMessage}
      />
      <Dialog open={virtualTourOpen} onOpenChange={setVirtualTourOpen}>
        <DialogContent className="h-[min(92vh,900px)] max-w-[min(96vw,1440px)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden p-0">
          <DialogHeader className="border-b px-5 py-4 pr-14">
            <DialogTitle className="flex items-center gap-2">
              <Rotate3D className="h-5 w-5 text-primary" /> {property.virtualTour?.title || 'Tur virtual'}
            </DialogTitle>
            <DialogDescription>
              {property.virtualTour?.isDemo
                ? 'Demonstrație cu 4 camere sintetice conectate; deplasează-te prin uși sau folosește selectorul de camere.'
                : 'Navighează prin proprietate și folosește modul ecran complet pentru o experiență imersivă.'}
            </DialogDescription>
          </DialogHeader>
          {virtualTourOpen && property.virtualTour ? (
            <VirtualTourViewer tour={property.virtualTour} className="h-full min-h-0" title={`Tur virtual pentru ${property.title}`} />
          ) : null}
        </DialogContent>
      </Dialog>
      <AuthRequiredDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        actionLabel="Programează o vizionare"
        actionIcon={CalendarCheck}
        description="Pentru a programa o vizionare și a primi documentele aferente, trebuie să fii autentificat(ă)."
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

function PropertyGallery({
  property,
  onLightbox,
  onBack,
}: {
  property: Property
  onLightbox: (images: string[], index: number) => void
  onBack: () => void
}) {
  const [currentImage, setCurrentImage] = useState(0)
  const images = getPropertyImages(property)
  const nextImage = () => setCurrentImage((index) => (index + 1) % images.length)
  const previousImage = () => setCurrentImage((index) => (index - 1 + images.length) % images.length)

  return (
    <section className="relative bg-muted" aria-label="Galerie foto proprietate">
      <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[16/8] lg:aspect-[21/7]">
        <motion.img
          key={currentImage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          src={images[currentImage]}
          alt={`${property.title} — fotografia ${currentImage + 1} din ${images.length}`}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />

        <button type="button" onClick={onBack} className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-2 text-sm font-medium text-slate-900 shadow-sm backdrop-blur-sm transition-colors hover:bg-white">
          <ArrowLeft className="h-4 w-4" /> Înapoi
        </button>

        <div className="absolute right-4 top-4 z-10 rounded-full bg-black/65 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
          {currentImage + 1} / {images.length}
        </div>

        {images.length > 1 ? (
          <>
            <Button type="button" variant="secondary" size="icon" className="absolute left-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border-0 bg-white/85 text-slate-900 hover:bg-white" onClick={previousImage} aria-label="Fotografia precedentă">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button type="button" variant="secondary" size="icon" className="absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border-0 bg-white/85 text-slate-900 hover:bg-white" onClick={nextImage} aria-label="Fotografia următoare">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        ) : null}

        <button type="button" onClick={() => onLightbox(images, currentImage)} className="absolute bottom-4 right-4 z-10 flex h-10 items-center justify-center gap-2 rounded-full bg-white/90 px-3 text-sm font-medium text-slate-900 shadow-sm backdrop-blur-sm transition-colors hover:bg-white" aria-label={`Deschide galeria cu ${images.length} fotografii`}>
          <Maximize2 className="h-4 w-4" />
          <span className="hidden sm:inline">Vezi toate fotografiile</span>
        </button>
      </div>

      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto border-b bg-background px-4 py-3">
          {images.map((image, index) => (
            <button key={`${image}-${index}`} type="button" onClick={() => setCurrentImage(index)} aria-label={`Afișează fotografia ${index + 1}`} aria-current={index === currentImage} className={`h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-all ${index === currentImage ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-65 hover:opacity-100'}`}>
              <img src={image} alt={`${property.title} — miniatura ${index + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="border-t pt-8">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
        {Icon ? <Icon className="h-5 w-5 text-primary" /> : null}
        {title}
      </h2>
      {children}
    </section>
  )
}

function MetricCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border bg-card p-3 sm:p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{value}</div>
        <div className="truncate text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}

function DetailGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

function InfoBox({ text }: { text: string }) {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-sm leading-relaxed text-muted-foreground">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
      <p>{text}</p>
    </div>
  )
}

function NearbyLink({ icon: Icon, label, href }: { icon: React.ElementType; label: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-2 rounded-xl border bg-card p-3 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-accent">
      <span className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" />{label}</span>
      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
    </a>
  )
}

function DocumentStatus({ icon: Icon, title, status }: { icon: React.ElementType; title: string; status: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{status}</p>
    </div>
  )
}

function PropertyUnavailable({ standalone }: { standalone: boolean }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <SearchX className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Proprietatea nu este disponibilă</h1>
        <p className="mt-2 text-sm text-muted-foreground">Anunțul nu există, a fost retras sau nu mai este publicat.</p>
        <Button className="mt-6" onClick={() => standalone ? window.location.assign('/?page=proprietati') : useAppStore.getState().navigateTo('proprietati')}>
          Vezi proprietățile active
        </Button>
      </div>
    </div>
  )
}

function PropertyPageSkeleton() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <Skeleton className="aspect-[4/3] w-full sm:aspect-[16/8] lg:aspect-[21/7]" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-8">
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-12 w-56" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-20 w-full" />)}
            </div>
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
          <Skeleton className="hidden h-[520px] w-full lg:block" />
        </div>
      </div>
    </div>
  )
}
