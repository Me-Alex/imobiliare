'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Loader2, MapPin, Ruler, BedDouble, Bath, Calendar,
  ArrowLeft, User, Check, List, Rotate3D, ImageIcon, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { EditPropertyDialog } from '@/components/property/edit-property-dialog'
import { PageHero } from '@/components/layout/page-hero'
import { PageContainer, PageShell } from '@/components/layout/page-shell'
import { MyPropertiesList } from '@/components/property/my-properties-list'
import { PropertyForm } from '@/components/property/property-form'
import { VirtualTourViewer } from '@/components/property/virtual-tour-viewer'
import type { PropertyFormData } from '@/components/property/property-form'
import type { UserProperty } from '@/lib/types'
import { RoleAccessDenied } from '@/components/account/role-access-denied'
import { getMapEmbedUrl } from '@/lib/property-details'
import { uploadListingImages, submitVirtualTour } from '@/lib/virtual-tour-publishing'
import { parseExternalTourUrl, type VirtualTour } from '@/lib/virtual-tours'
import {
  archiveManagedProperty,
  fetchManagedProperties,
  toSupabasePropertyType,
  userPropertyCacheKey,
} from '@/lib/managed-properties'

const MANAGED_ROLES = ['OWNER', 'AGENT', 'ADMIN'] as const

function isManagedRole(role: string): role is (typeof MANAGED_ROLES)[number] {
  return (MANAGED_ROLES as readonly string[]).includes(role)
}

function generateSlug(title: string): string {
  const roMap: Record<string, string> = {
    'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ț': 't',
    'Ă': 'a', 'Â': 'a', 'Î': 'i', 'Ș': 's', 'Ț': 't',
  }
  return title
    .toLowerCase()
    .split('')
    .map((c) => roMap[c] || c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Date.now().toString(36)
}

function PropertyPreviewDialog({
  open,
  onOpenChange,
  form,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: PropertyFormData | null
}) {
  const parsedPreviewTour = form?.virtualTour.mode === 'EXTERNAL'
    ? parseExternalTourUrl(form.virtualTour.externalUrl)
    : null
  const previewTour: VirtualTour | null = form?.virtualTour.mode === 'NATIVE'
    ? {
        provider: 'NATIVE',
        title: `Tur virtual · ${form.title || 'Proprietate'}`,
        entrySceneId: form.virtualTour.entrySceneId,
        scenes: form.virtualTour.scenes,
      }
    : parsedPreviewTour
      ? {
          provider: parsedPreviewTour.provider,
          title: `Tur virtual · ${form?.title || 'Proprietate'}`,
          externalUrl: parsedPreviewTour.embedUrl,
          scenes: [],
        }
      : null
  const isLandPreview = /teren/i.test(form?.type ?? '')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[94vh] max-w-[min(96vw,1040px)] overflow-y-auto p-0 sm:max-w-5xl"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Previzualizarea anunțului</DialogTitle>
          <DialogDescription>
            Verifică modul în care va arăta proprietatea înainte de publicare.
          </DialogDescription>
        </DialogHeader>

        <DialogClose asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute right-3 top-3 z-30 h-10 w-10 rounded-full border-white/70 bg-background/95 shadow-lg backdrop-blur hover:bg-background"
            aria-label="Închide previzualizarea"
            title="Închide previzualizarea"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogClose>

        <div className="overflow-hidden rounded-2xl bg-card">
          <div className="relative aspect-[16/8] min-h-52 overflow-hidden bg-[radial-gradient(circle_at_top_right,var(--primary),transparent_45%),linear-gradient(135deg,var(--muted),var(--background))] sm:min-h-80">
            {form?.galleryUrls[0] ? (
              <img
                src={form.galleryUrls[0]}
                alt={form.title || 'Coperta proprietății'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl border bg-background/75 shadow-sm backdrop-blur">
                  <ImageIcon className="h-7 w-7 text-primary" />
                </span>
                <p className="text-sm font-medium">Adaugă o fotografie pentru copertă</p>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
              <Badge className="bg-white/95 text-slate-900 hover:bg-white/95">
                {form?.transaction === 'INCHIRIERE' ? 'Închiriere' : 'Vânzare'}
              </Badge>
              <Badge variant="secondary" className="bg-white/90 text-slate-900">
                {form?.type || 'Tip nespecificat'}
              </Badge>
              {form?.featured ? (
                <Badge className="border-0 bg-amber-500 text-white hover:bg-amber-500">Evidențiat</Badge>
              ) : null}
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Previzualizare anunț</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  {form?.title || 'Titlul proprietății'}
                </h2>
                <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{[form?.address, form?.zone, form?.sector].filter(Boolean).join(', ') || 'Localizarea va apărea aici'}</span>
                </p>
              </div>
              <p className="shrink-0 text-2xl font-bold text-primary sm:text-right">
                {form?.price
                  ? `${Number(form.price).toLocaleString('ro-RO')} ${form.currency}`
                  : 'Preț nesetat'}
                {form?.transaction === 'INCHIRIERE' && form.price ? (
                  <span className="block text-xs font-medium text-muted-foreground">pe lună</span>
                ) : null}
              </p>
            </div>

            <div className={`grid grid-cols-2 gap-3 rounded-2xl border bg-muted/20 p-4 ${isLandPreview ? '' : 'sm:grid-cols-4'}`}>
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Ruler className="h-3.5 w-3.5" /> Suprafață</p>
                <p className="mt-1 text-sm font-semibold">{form?.areaSqm ? `${form.areaSqm} m²` : '—'}</p>
              </div>
              {isLandPreview ? (
                <div>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><ImageIcon className="h-3.5 w-3.5" /> Fotografii</p>
                  <p className="mt-1 text-sm font-semibold">{form?.galleryUrls.length || '—'}</p>
                </div>
              ) : (
                <>
                  <div>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><BedDouble className="h-3.5 w-3.5" /> Camere</p>
                    <p className="mt-1 text-sm font-semibold">{form?.rooms || '—'}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Bath className="h-3.5 w-3.5" /> Băi</p>
                    <p className="mt-1 text-sm font-semibold">{form?.bathrooms || '—'}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> Construcție</p>
                    <p className="mt-1 text-sm font-semibold">{form?.yearBuilt || '—'}</p>
                  </div>
                </>
              )}
            </div>

            <div>
              <h3 className="text-base font-semibold">Descriere</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                {form?.description || 'Descrierea proprietății va apărea aici.'}
              </p>
            </div>

            {previewTour ? (
              <div className="space-y-3 border-t pt-6">
                <h3 className="flex items-center gap-2 text-base font-semibold">
                  <Rotate3D className="h-4 w-4 text-primary" /> Tur virtual
                </h3>
                <div className="overflow-hidden rounded-2xl border bg-slate-950">
                  <VirtualTourViewer
                    tour={previewTour}
                    className="h-[min(56vw,480px)] min-h-72"
                    title={`Tur virtual pentru ${form?.title || 'proprietate'}`}
                  />
                </div>
              </div>
            ) : null}

            {form?.lat !== null && form?.lat !== undefined && form.lng !== null && form.lng !== undefined ? (
              <div className="space-y-3 border-t pt-6">
                <h3 className="flex items-center gap-2 text-base font-semibold">
                  <MapPin className="h-4 w-4 text-primary" /> Localizare
                </h3>
                <div className="overflow-hidden rounded-2xl border">
                  <iframe
                    title="Poziția proprietății pe hartă"
                    src={getMapEmbedUrl(form.lat, form.lng)}
                    className="h-72 w-full"
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AdaugaProprietatePage() {
  const { user, profile, loading: authLoading } = useAuth()
  const navigateTo = useAppStore((s) => s.navigateTo)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [submittedCount, setSubmittedCount] = useState(0)
  const [myProperties, setMyProperties] = useState<Array<UserProperty>>([])
  const [showMyProps, setShowMyProps] = useState(false)
  const [editProperty, setEditProperty] = useState<UserProperty | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [previewData, setPreviewData] = useState<PropertyFormData | null>(null)

  const loadMyProperties = useCallback(async () => {
    if (!user || !profile || !isManagedRole(profile.role)) {
      setMyProperties([])
      return
    }

    try {
      const properties = await fetchManagedProperties({
        userId: user.id,
        role: profile.role,
      })
      setMyProperties(properties)
    } catch (error) {
      console.warn('Managed properties unavailable:', error)
      setMyProperties([])
    }
  }, [profile, user])

  useEffect(() => {
    const frame = requestAnimationFrame(() => { void loadMyProperties() })
    return () => cancelAnimationFrame(frame)
  }, [loadMyProperties])

  const deleteProperty = useCallback(async (id: string) => {
    try {
      await archiveManagedProperty(id)
      await loadMyProperties()
      toast.success('Proprietate arhivata', {
        description: 'Anunțul nu mai este vizibil public, iar istoricul său rămâne disponibil.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Eroare necunoscută'
      toast.error('Proprietatea nu a putut fi arhivata', { description: message })
    }
  }, [loadMyProperties])

  const handleFormSubmit = async (form: PropertyFormData) => {
    if (!user || !profile || !isManagedRole(profile.role)) return

    setIsSubmitting(true)
    try {
      const slug = generateSlug(form.title)
      const propertyId = crypto.randomUUID()
      const pricePerSqm = form.price && form.areaSqm
        ? (parseFloat(form.price) / parseFloat(form.areaSqm)).toFixed(0)
        : null

      const hasSupabaseConfig = isSupabaseConfigured
      if (!hasSupabaseConfig) {
        throw new Error('Publicarea proprietăților nu este configurată. Verifică setările Supabase.')
      }
      let publishedGalleryUrls = form.galleryUrls
      let remotePropertySaved = false
      let submittedTour: VirtualTour | null = null

      if (hasSupabaseConfig && form.galleryUrls.some((url) => url.startsWith('data:'))) {
        try {
          publishedGalleryUrls = await uploadListingImages({
            userId: user.id,
            propertyId,
            urls: form.galleryUrls,
          })
        } catch (error) {
          console.warn('Listing image upload skipped:', error)
          toast.warning('Fotografiile nu au ajuns în cloud', {
            description: 'Publicarea a fost oprită. Verifică conexiunea și reîncearcă.',
          })
        }
      }

      if (publishedGalleryUrls.some((url) => url.startsWith('data:'))) {
        throw new Error('Fotografiile nu au putut fi încărcate. Anunțul nu a fost publicat.')
      }

      if (hasSupabaseConfig && publishedGalleryUrls.every((url) => !url.startsWith('data:'))) {
        const supabaseData = {
          id: propertyId,
          title: form.title,
          slug,
          description: form.description,
          price: parseFloat(form.price) || 0,
          currency: form.currency,
          type: toSupabasePropertyType(form.type),
          status: 'PUBLISHED',
          city: 'București',
          address: form.address,
          zone: form.zone,
          sector: form.sector,
          lat: form.lat,
          lng: form.lng,
          area_sqm: parseFloat(form.areaSqm) || 0,
          rooms: parseInt(form.rooms) || 0,
          bathrooms: parseInt(form.bathrooms) || 0,
          featured: form.featured,
          agent_id: profile.role === 'OWNER' ? null : user.id,
          agent_email: profile.role === 'OWNER' ? null : user.email || null,
          owner_id: profile.role === 'OWNER' ? user.id : null,
          owner_email: profile.role === 'OWNER' ? user.email || null : null,
          floor: form.floor ? parseInt(form.floor) : null,
          total_floors: form.totalFloors ? parseInt(form.totalFloors) : null,
          year_built: form.yearBuilt ? parseInt(form.yearBuilt) : null,
          cover_image_url: publishedGalleryUrls[0] || form.coverUrl || null,
          gallery_urls: publishedGalleryUrls,
          transaction_type: form.transaction,
          published_at: new Date().toISOString(),
        }

        const { error: propertyError } = await supabase.from('properties').insert([supabaseData])
        if (propertyError) {
          console.warn('Supabase property save skipped:', propertyError.message)
          toast.warning('Anunțul nu a fost publicat', {
            description: propertyError.message,
          })
          throw new Error(propertyError.message)
        } else {
          remotePropertySaved = true
          if (form.virtualTour.mode !== 'NONE') {
            try {
              submittedTour = await submitVirtualTour({
                propertyId,
                propertyTitle: form.title,
                userId: user.id,
                draft: form.virtualTour,
              })
            } catch (error) {
              console.warn('Virtual tour submission skipped:', error)
              toast.warning('Proprietatea a fost publicată fără tur', {
                description: error instanceof Error ? error.message : 'Turul virtual nu a putut fi trimis la verificare.',
              })
            }
          }
        }
      }

      const parsedExternalTour = form.virtualTour.mode === 'EXTERNAL'
        ? parseExternalTourUrl(form.virtualTour.externalUrl)
        : null
      const localTour: VirtualTour | null = submittedTour
        ? submittedTour.provider === 'NATIVE'
          ? { ...submittedTour, scenes: [] }
          : submittedTour
        : parsedExternalTour
          ? {
              provider: parsedExternalTour.provider,
              status: remotePropertySaved ? 'IN_REVIEW' : 'DRAFT',
              title: `Tur virtual · ${form.title}`,
              externalUrl: parsedExternalTour.embedUrl,
              scenes: [],
            }
          : null

      const newProp: UserProperty = {
        id: propertyId,
        title: form.title,
        slug,
        description: form.description,
        type: form.type,
        transaction: form.transaction,
        price: parseFloat(form.price) || 0,
        currency: form.currency,
        area_sqm: parseFloat(form.areaSqm) || 0,
        rooms: parseInt(form.rooms) || 0,
        bathrooms: parseInt(form.bathrooms) || 0,
        floor: form.floor ? parseInt(form.floor) : null,
        total_floors: form.totalFloors ? parseInt(form.totalFloors) : null,
        year_built: form.yearBuilt ? parseInt(form.yearBuilt) : null,
        address: form.address,
        zone: form.zone,
        sector: form.sector,
        city: 'București',
        lat: form.lat,
        lng: form.lng,
        featured: form.featured,
        cover_url: publishedGalleryUrls[0] || form.coverUrl || '',
        gallery_urls: JSON.stringify(publishedGalleryUrls),
        price_per_sqm: pricePerSqm ? parseFloat(pricePerSqm) : null,
        status: 'PUBLISHED' as const,
        user_id: user.id,
        user_email: user.email || '',
        user_name: user.user_metadata?.full_name || user.email || '',
        created_at: new Date().toISOString(),
        virtual_tour: localTour,
      }

      let stored: UserProperty[] = []
      try {
        stored = JSON.parse(localStorage.getItem(userPropertyCacheKey(user.id)) || '[]')
        if (!Array.isArray(stored)) stored = []
      } catch {
        // Corrupted data — reset
        stored = []
      }
      stored.push(newProp)
      try {
        localStorage.setItem(userPropertyCacheKey(user.id), JSON.stringify(stored))
      } catch {
        console.warn('Managed property cache could not be updated')
      }

      toast.success('Proprietate publicată cu succes!', {
        description: submittedTour
          ? `"${form.title}" este publică, iar turul a fost trimis administratorului pentru verificare.`
          : `"${form.title}" este acum publică pe platformă.`,
      })
      setSubmittedCount((c) => c + 1)
      void loadMyProperties()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Eroare necunoscută'
      console.error('Submit error:', err)
      toast.error('Eroare la salvare', { description: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Auth guard
  if (!authLoading && !user) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8 text-center max-w-md"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
            <User className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold mb-2">Autentifică-te</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Autentifică-te pentru a publica și gestiona proprietăți.
          </p>
          <Button onClick={() => navigateTo('login')} className="gap-2">
            Autentifică-te
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </Button>
        </motion.div>
      </div>
    )
  }

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (profile && !['OWNER', 'AGENT', 'ADMIN'].includes(profile.role)) {
    return <RoleAccessDenied currentRole={profile.role} allowedRoles={['OWNER', 'AGENT', 'ADMIN']} />
  }

  return (
    <PageShell>
      <PageHero
        variant="border"
        icon={Plus}
        title={profile?.role === 'OWNER' ? 'Publică proprietatea' : 'Adaugă o proprietate în portofoliu'}
        description="Completează detaliile, poziționează proprietatea pe hartă și verifică anunțul înainte de publicare."
        breadcrumb={[{ label: 'Acasă', page: 'acasa' }, { label: 'Publică proprietatea' }]}
      >
        <div className="flex flex-wrap items-center gap-2">
          {myProperties.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowMyProps(true)} className="gap-1.5">
              <List className="h-4 w-4" />
              Proprietățile mele
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 justify-center px-1.5 text-[10px]">
                {myProperties.length}
              </Badge>
            </Button>
          )}
          {submittedCount > 0 && (
            <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Check className="h-3 w-3" />
              {submittedCount} publicate
            </Badge>
          )}
        </div>
      </PageHero>

      <PageContainer className="py-6 sm:py-8">
        <PropertyForm
          key={submittedCount}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          onPreview={(data) => {
            setPreviewData(data)
            setPreviewMode(true)
          }}
        />
      </PageContainer>

      <MyPropertiesList
        properties={myProperties}
        visible={showMyProps}
        onVisibleChange={setShowMyProps}
        label={profile?.role === 'ADMIN' ? 'Proprietăți administrate' : 'Proprietățile tale'}
        onEdit={(prop) => { setEditProperty(prop); setEditOpen(true) }}
        onDelete={deleteProperty}
      />

      <PropertyPreviewDialog
        open={previewMode}
        onOpenChange={setPreviewMode}
        form={previewData}
      />

      <EditPropertyDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        property={editProperty}
        onSaved={() => { void loadMyProperties(); setEditProperty(null) }}
      />
    </PageShell>
  )
}
