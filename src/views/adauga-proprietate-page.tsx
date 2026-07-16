'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Loader2, MapPin, Ruler, BedDouble, Bath, Calendar,
  ArrowLeft, Eye, EyeOff, User, Check, List,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { EditPropertyDialog } from '@/components/property/edit-property-dialog'
import { PageHero } from '@/components/layout/page-hero'
import { MyPropertiesList } from '@/components/property/my-properties-list'
import { PropertyForm } from '@/components/property/property-form'
import type { PropertyFormData } from '@/components/property/property-form'
import type { UserProperty } from '@/lib/types'
import { LS_KEYS } from '@/lib/constants'
import { RoleAccessDenied } from '@/components/account/role-access-denied'
import { getMapEmbedUrl } from '@/lib/property-details'

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

function toSupabasePropertyType(type: string): string {
  const normalized = type.toLocaleLowerCase('ro-RO')
  if (normalized.includes('teren')) return 'LAND'
  if (normalized.includes('birou')) return 'OFFICE'
  if (normalized.includes('comercial') || normalized.includes('depozit')) return 'COMMERCIAL'
  if (normalized.includes('vil') || normalized.includes('pensiune')) return 'VILLA'
  if (normalized.includes('cas')) return 'HOUSE'
  return 'APARTMENT'
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
  const previewDataRef = useRef<PropertyFormData | null>(null)
  const [previewData, setPreviewData] = useState<PropertyFormData | null>(null)

  const loadMyProperties = useCallback(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(LS_KEYS.USER_PROPERTIES) || '[]')
      setMyProperties(stored)
    } catch { setMyProperties([]) }
  }, [])

  useEffect(() => {
    const frame = requestAnimationFrame(loadMyProperties)
    return () => cancelAnimationFrame(frame)
  }, [loadMyProperties])

  const deleteProperty = useCallback((id: string) => {
    const stored = JSON.parse(localStorage.getItem(LS_KEYS.USER_PROPERTIES) || '[]')
    const filtered = stored.filter((p: UserProperty) => p.id !== id)
    localStorage.setItem(LS_KEYS.USER_PROPERTIES, JSON.stringify(filtered))
    setMyProperties(filtered)
    toast.success('Proprietate stearsa')
  }, [])

  const handleFormSubmit = async (form: PropertyFormData) => {
    if (!user || !profile || !['OWNER', 'AGENT', 'ADMIN'].includes(profile.role)) return

    setIsSubmitting(true)
    try {
      const slug = generateSlug(form.title)
      const pricePerSqm = form.price && form.areaSqm
        ? (parseFloat(form.price) / parseFloat(form.areaSqm)).toFixed(0)
        : null

      // Separate base64 images from URL images
      const base64Images = form.galleryUrls.filter(u => u.startsWith('data:'))

      const newProp: UserProperty = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
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
        city: 'Bucuresti',
        lat: form.lat,
        lng: form.lng,
        featured: form.featured,
        cover_url: form.galleryUrls[0] || form.coverUrl || '',
        gallery_urls: JSON.stringify(form.galleryUrls),
        price_per_sqm: pricePerSqm ? parseFloat(pricePerSqm) : null,
        status: 'PUBLISHED' as const,
        user_id: user.id,
        user_email: user.email || '',
        user_name: user.user_metadata?.full_name || user.email || '',
        created_at: new Date().toISOString(),
      }

      // Save to localStorage FIRST (always works, instant)
      let stored: UserProperty[] = []
      try {
        stored = JSON.parse(localStorage.getItem(LS_KEYS.USER_PROPERTIES) || '[]')
        if (!Array.isArray(stored)) stored = []
      } catch {
        // Corrupted data — reset
        stored = []
      }
      stored.push(newProp)
      try {
        localStorage.setItem(LS_KEYS.USER_PROPERTIES, JSON.stringify(stored))
      } catch {
        toast.error('Spatiu de stocare plin', {
          description: 'Imaginile sunt prea mari. Incearca cu mai putine imagini sau imagini mai mici.',
        })
        setIsSubmitting(false)
        return
      }

      // Try Supabase in background (only if configured AND no base64 images to avoid payload limits)
      const hasSupabaseConfig = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      if (hasSupabaseConfig && base64Images.length === 0) {
        const supabaseData = {
          id: newProp.id,
          title: form.title,
          slug,
          description: form.description,
          price: parseFloat(form.price) || 0,
          currency: form.currency,
          type: toSupabasePropertyType(form.type),
          status: 'PUBLISHED',
          city: 'Bucuresti',
          address: form.address,
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
          year_built: form.yearBuilt ? parseInt(form.yearBuilt) : null,
          cover_image_url: form.galleryUrls[0] || form.coverUrl || null,
          gallery_urls: form.galleryUrls,
          transaction_type: form.transaction,
        }

        void (async () => {
          try {
            const { error } = await supabase.from('properties').insert([supabaseData])
            if (error) console.warn('Supabase save skipped:', error.message)
          } catch {
            // localStorage already contains the listing
          }
        })()
      }

      toast.success('Proprietate adaugata cu succes!', {
        description: `"${form.title}" este acum publica pe platforma.`,
      })
      setSubmittedCount((c) => c + 1)
      loadMyProperties()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Eroare necunoscuta'
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
          <h2 className="text-xl font-bold mb-2">Autentifica-te</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Trebuie sa fii autentificat pentru a adauga proprietati.
          </p>
          <Button onClick={() => navigateTo('login')} className="gap-2">
            Autentifica-te
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

  if (previewMode) {
    const form = previewData
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setPreviewMode(false)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Inapoi la formular
          </button>
          <Button variant="outline" size="sm" onClick={() => setPreviewMode(false)}>
            <EyeOff className="h-4 w-4 mr-1.5" />
            Ascunde Preview
          </Button>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl overflow-hidden"
        >
          {form?.galleryUrls.length ? (
            <div className="h-64 sm:h-80 bg-muted">
              <img src={form.galleryUrls[0]} alt={form.title} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="h-48 bg-muted/50 flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Nicio imagine adaugata</p>
            </div>
          )}
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex gap-2 mb-2">
                  <Badge variant="outline">{form?.type || 'Tip ne_specificat'}</Badge>
                  <Badge>{form?.transaction === 'INCHIRIERE' ? 'Inchiriere' : 'Vanzare'}</Badge>
                  {form?.featured && <Badge className="bg-amber-500 text-white border-0">Featured</Badge>}
                </div>
                <h2 className="text-xl font-bold">{form?.title || 'Titlu proprietate'}</h2>
              </div>
              <p className="text-2xl font-bold text-primary whitespace-nowrap">
                {form?.price ? `${parseFloat(form.price).toLocaleString('ro-RO')} ${form.currency}` : 'Pret nesetat'}
                {form?.transaction === 'INCHIRIERE' && form.price ? '/luna' : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {form?.areaSqm && <span className="flex items-center gap-1"><Ruler className="h-4 w-4" />{form.areaSqm} m²</span>}
              {form?.rooms && <span className="flex items-center gap-1"><BedDouble className="h-4 w-4" />{form.rooms} camere</span>}
              {form?.bathrooms && <span className="flex items-center gap-1"><Bath className="h-4 w-4" />{form.bathrooms} bai</span>}
              {form?.yearBuilt && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{form.yearBuilt}</span>}
            </div>
            <Separator />
            <p className="text-sm text-muted-foreground leading-relaxed">
              {form?.description || 'Descriere ne specificata...'}
            </p>
            <div className="flex flex-wrap gap-2">
              {form?.zone && <Badge variant="secondary" className="gap-1"><MapPin className="h-3 w-3" />{form.zone}</Badge>}
              {form?.sector && <Badge variant="secondary">{form.sector}</Badge>}
              {form?.address && <Badge variant="secondary">{form.address}</Badge>}
            </div>
            {form?.lat !== null && form?.lat !== undefined && form.lng !== null && form.lng !== undefined && (
              <div className="overflow-hidden rounded-xl border">
                <iframe
                  title="Poziția proprietății pe hartă"
                  src={getMapEmbedUrl(form.lat, form.lng)}
                  className="h-64 w-full"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <PageHero
        variant="border"
        icon={Plus}
        title={profile?.role === 'OWNER' ? 'Publica proprietatea ta' : 'Adauga Proprietate'}
        description={`${profile?.role === 'OWNER' ? 'Gestioneaza direct anuntul proprietatii tale' : 'Adauga o proprietate in portofoliul profesional'}${user ? ` (${user.email})` : ''}`}
        breadcrumb={[{ label: 'Acasa', page: 'acasa' }, { label: 'Adauga Proprietate' }]}
      >
        <div className="flex items-center gap-2">
          {myProperties.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowMyProps(!showMyProps)} className="gap-1.5">
              <List className="h-4 w-4" />
              Proprietatile Mele ({myProperties.length})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPreviewData(previewDataRef.current)
              setPreviewMode(true)
            }}
          >
            <Eye className="h-4 w-4 mr-1.5" />
            Preview
          </Button>
          {submittedCount > 0 && (
            <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Check className="h-3 w-3" />
              {submittedCount} publicate
            </Badge>
          )}
        </div>
      </PageHero>

      <MyPropertiesList
        properties={myProperties}
        visible={showMyProps}
        onEdit={(prop) => { setEditProperty(prop); setEditOpen(true) }}
        onDelete={deleteProperty}
      />

      <PropertyForm
        key={submittedCount}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        onFormChange={(data) => { previewDataRef.current = data }}
      />

      <EditPropertyDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        property={editProperty}
        onSaved={() => { loadMyProperties(); setEditProperty(null) }}
      />
    </div>
  )
}
