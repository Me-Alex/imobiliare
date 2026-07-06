'use client'

import { useState, useRef, type FormEvent, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, ChevronRight, Plus, Loader2, MapPin, Building2, Ruler,
  BedDouble, Bath, Calendar, Euro, Tag, ImagePlus, X, Check,
  ArrowLeft, Eye, EyeOff, Upload, User, Trash2, Clock, List, Camera, Pencil
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { EditPropertyDialog } from '@/components/edit-property-dialog'

const PROPERTY_TYPES = [
  'Apartament', 'Garsoniera', 'Casa', 'Vila', 'Teren', 'Spatiu Comercial',
  'Birou', 'Depozit', 'Pensiune', 'Apartament Nou', 'Studio',
]

const TYPE_MAP: Record<string, string> = {
  'Apartament': 'APARTMENT',
  'Garsoniera': 'APARTMENT',
  'Casa': 'HOUSE',
  'Vila': 'VILLA',
  'Teren': 'LAND',
  'Spatiu Comercial': 'COMMERCIAL',
  'Birou': 'COMMERCIAL',
  'Depozit': 'COMMERCIAL',
  'Pensiune': 'HOUSE',
  'Apartament Nou': 'APARTMENT',
  'Studio': 'APARTMENT',
}
const TRANSACTIONS = [
  { value: 'VANZARE', label: 'Vanzare' },
  { value: 'INCHIRIERE', label: 'Inchiriere' },
]
const CURRENCIES = ['EUR', 'RON', 'USD']
const SECTOARE = ['Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5', 'Sector 6']
const ZONES = [
  'Dorobanti', 'Victoriei', 'Floreasca', 'Aviatorilor', 'Primaverii',
  'Herastrau', 'Baneasa', 'Pipera', 'Barbu Vacarescu', 'Romană',
  'Universitate', 'Unirii', 'Centru Civic', 'Parlament',
  'Vitan', 'Titan', 'Pantelimon', 'Colentina', 'Obor',
  'Militari', 'Drumul Taberei', 'Ghencea', 'Rahova', 'Crangasi',
  'Grozavesti', 'Politehnica', 'Iancului', 'Mihai Bravu',
]

interface PropertyFormData {
  title: string
  description: string
  type: string
  transaction: string
  price: string
  currency: string
  areaSqm: string
  rooms: string
  bathrooms: string
  floor: string
  totalFloors: string
  yearBuilt: string
  address: string
  zone: string
  sector: string
  featured: boolean
  coverUrl: string
  galleryUrls: string[]
}

function ImageUploader({ urls, onChange }: { urls: string[]; onChange: (urls: string[]) => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isReading, setIsReading] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB raw input
  const MAX_IMAGES = 15
  const MAX_DIMENSION = 1280 // max width/height in px
  const JPEG_QUALITY = 0.75

  const compressImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = Math.round((height * MAX_DIMENSION) / width)
              width = MAX_DIMENSION
            } else {
              width = Math.round((width * MAX_DIMENSION) / height)
              height = MAX_DIMENSION
            }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) { reject(new Error('Canvas not supported')); return }
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }, [])

  const readFilesAsDataUrls = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    if (urls.length + fileArray.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} imagini permise`)
      return
    }
    for (const file of fileArray) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" depaseste 10MB`)
        return
      }
    }
    setIsReading(true)
    try {
      const results = await Promise.all(
        fileArray.map(async (file) => {
          try {
            return await compressImage(file)
          } catch {
            toast.error(`Eroare la procesarea "${file.name}"`)
            return null
          }
        })
      )
      const validResults = results.filter((r): r is string => r !== null)
      if (validResults.length > 0) {
        onChange([...urls, ...validResults])
      }
    } finally {
      setIsReading(false)
    }
  }, [urls, onChange, compressImage])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      readFilesAsDataUrls(files)
    }
  }, [readFilesAsDataUrls])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      readFilesAsDataUrls(files)
    }
    e.target.value = ''
  }, [readFilesAsDataUrls])

  const addUrl = () => {
    const trimmed = urlInput.trim()
    if (trimmed && !urls.includes(trimmed)) {
      if (urls.length >= MAX_IMAGES) {
        toast.error(`Maximum ${MAX_IMAGES} imagini permise`)
        return
      }
      onChange([...urls, trimmed])
      setUrlInput('')
    }
  }

  const removeUrl = (index: number) => {
    onChange(urls.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef?.click() }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 transition-all cursor-pointer select-none
          ${isDragging
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
          }
          ${isReading ? 'pointer-events-none opacity-70' : ''}
        `}
      >
        {isReading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-2"
          >
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Se proceseaza...</span>
          </motion.div>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Camera className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Trage fotografii aici</p>
              <p className="text-xs text-muted-foreground mt-0.5">sau</p>
            </div>
            <Button type="button" variant="outline" size="sm" className="pointer-events-none">
              <Upload className="h-4 w-4 mr-2" />
              Alege Fotografii
            </Button>
            <p className="text-[11px] text-muted-foreground">PNG, JPG, WebP — max 10MB/fisier, {MAX_IMAGES} imagini. Imaginile sunt redimensionate automat.</p>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Thumbnail grid */}
      <AnimatePresence>
        {urls.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex flex-wrap gap-2">
              {urls.map((url, i) => (
                <motion.div
                  key={`${url.slice(0, 60)}-${i}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative group"
                >
                  <div className="h-20 w-20 rounded-lg overflow-hidden border border-border">
                    <img
                      src={url}
                      alt={`Poza ${i + 1}`}
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeUrl(i)}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Sterge poza ${i + 1}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {i === 0 && (
                    <Badge className="absolute bottom-0.5 left-0.5 text-[8px] px-1 h-3.5 bg-primary">Cover</Badge>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* URL fallback */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => setShowUrlInput((v) => !v)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          <ImagePlus className="h-3 w-3" />
          {showUrlInput ? 'Ascunde' : 'sau adauga prin link'}
        </button>
      </div>

      <AnimatePresence>
        {showUrlInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ImagePlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="https://exemplu.ro/imagine.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl() } }}
                  className="pl-10 h-10"
                />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addUrl} disabled={!urlInput.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-xs text-muted-foreground">Prima imagine va fi folosita ca coperta.</p>
    </div>
  )
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
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Date.now().toString(36)
}

export function AdaugaProprietatePage() {
  const { user, loading: authLoading } = useAuth()
  const navigateTo = useAppStore((s) => s.navigateTo)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [submittedCount, setSubmittedCount] = useState(0)
  const [myProperties, setMyProperties] = useState<Array<Record<string, unknown>>>([])
  const [showMyProps, setShowMyProps] = useState(false)
  const [editProperty, setEditProperty] = useState<Record<string, unknown> | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const [form, setForm] = useState<PropertyFormData>({
    title: '', description: '', type: '', transaction: 'VANZARE',
    price: '', currency: 'EUR', areaSqm: '', rooms: '', bathrooms: '',
    floor: '', totalFloors: '', yearBuilt: '', address: '',
    zone: '', sector: '', featured: false, coverUrl: '', galleryUrls: [],
  })

  const updateField = useCallback(<K extends keyof PropertyFormData>(key: K, value: PropertyFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  const loadMyProperties = useCallback(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('hqs_user_properties') || '[]')
      setMyProperties(stored)
    } catch { setMyProperties([]) }
  }, [])

  useEffect(() => { loadMyProperties() }, [loadMyProperties])

  const deleteProperty = useCallback((id: string) => {
    const stored = JSON.parse(localStorage.getItem('hqs_user_properties') || '[]')
    const filtered = stored.filter((p: Record<string, unknown>) => p.id !== id)
    localStorage.setItem('hqs_user_properties', JSON.stringify(filtered))
    setMyProperties(filtered)
    toast.success('Proprietate stearsa')
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)
    try {
      const slug = generateSlug(form.title)
      const pricePerSqm = form.price && form.areaSqm
        ? (parseFloat(form.price) / parseFloat(form.areaSqm)).toFixed(0)
        : null

      const mappedType = TYPE_MAP[form.type] || form.type.toUpperCase().replace(/\s+/g, '_')
      const txType = form.transaction === 'INCHIRIERE' ? 'rent' : 'sale'

      // Separate base64 images from URL images
      const base64Images = form.galleryUrls.filter(u => u.startsWith('data:'))

      const newProp = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: form.title,
        slug,
        description: form.description,
        type: mappedType,
        transaction_type: txType,
        price: parseFloat(form.price) || 0,
        currency: form.currency,
        area_sqm: parseFloat(form.areaSqm) || 0,
        rooms: parseInt(form.rooms) || 0,
        bathrooms: parseInt(form.bathrooms) || 0,
        floor: form.floor ? parseInt(form.floor) : null,
        year_built: form.yearBuilt ? parseInt(form.yearBuilt) : null,
        address: form.address,
        zone: form.zone,
        sector: form.sector,
        city: 'Bucuresti',
        county: 'Bucuresti',
        featured: form.featured,
        cover_image_url: form.galleryUrls[0] || form.coverUrl || '',
        gallery_urls: form.galleryUrls.filter(u => !u.startsWith('data:')),
        amenities: [],
        status: 'PUBLISHED' as const,
        owner_email: user.email || '',
      }

      // Save to localStorage FIRST (always works, instant)
      let stored: Record<string, unknown>[] = []
      try {
        stored = JSON.parse(localStorage.getItem('hqs_user_properties') || '[]')
        if (!Array.isArray(stored)) stored = []
      } catch {
        // Corrupted data — reset
        stored = []
      }
      stored.push(newProp)
      try {
        localStorage.setItem('hqs_user_properties', JSON.stringify(stored))
      } catch {
        toast.error('Spatiu de stocare plin', {
          description: 'Imaginile sunt prea mari. Incearca cu mai putine imagini sau imagini mai mici.',
        })
        setIsSubmitting(false)
        return
      }

      // Try Supabase in background (only if configured AND no base64 images)
      const hasSupabaseConfig = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      if (hasSupabaseConfig && base64Images.length === 0) {
        // Remove zone/sector as the Supabase table doesn't have these columns;
        // zone info is extracted from address field by the read layer
        const { zone: _zone, sector: _sector, ...supabaseData } = newProp as Record<string, unknown>
        supabase.from('properties').insert([supabaseData]).then(({ error }) => {
          if (error) console.warn('Supabase save skipped:', error.message)
        }).catch(() => {
          // Silently ignore — localStorage already saved
        })
      }

      toast.success('Proprietate adaugata cu succes!', {
        description: `"${form.title}" este acum publica pe platforma.`,
      })
      setSubmittedCount((c) => c + 1)
      loadMyProperties()
      // Reset form
      setForm({
        title: '', description: '', type: '', transaction: 'VANZARE',
        price: '', currency: 'EUR', areaSqm: '', rooms: '', bathrooms: '',
        floor: '', totalFloors: '', yearBuilt: '', address: '',
        zone: '', sector: '', featured: false, coverUrl: '', galleryUrls: [],
      })
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

  if (previewMode) {
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
          {form.galleryUrls.length > 0 ? (
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
                  <Badge variant="outline">{form.type || 'Tip ne_specificat'}</Badge>
                  <Badge>{form.transaction === 'INCHIRIERE' ? 'Inchiriere' : 'Vanzare'}</Badge>
                  {form.featured && <Badge className="bg-amber-500 text-white border-0">Featured</Badge>}
                </div>
                <h2 className="text-xl font-bold">{form.title || 'Titlu proprietate'}</h2>
              </div>
              <p className="text-2xl font-bold text-primary whitespace-nowrap">
                {form.price ? `${parseFloat(form.price).toLocaleString('ro-RO')} ${form.currency}` : 'Pret nesetat'}
                {form.transaction === 'INCHIRIERE' && form.price ? '/luna' : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {form.areaSqm && <span className="flex items-center gap-1"><Ruler className="h-4 w-4" />{form.areaSqm} m²</span>}
              {form.rooms && <span className="flex items-center gap-1"><BedDouble className="h-4 w-4" />{form.rooms} camere</span>}
              {form.bathrooms && <span className="flex items-center gap-1"><Bath className="h-4 w-4" />{form.bathrooms} bai</span>}
              {form.yearBuilt && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{form.yearBuilt}</span>}
            </div>
            <Separator />
            <p className="text-sm text-muted-foreground leading-relaxed">
              {form.description || 'Descriere ne specificata...'}
            </p>
            <div className="flex flex-wrap gap-2">
              {form.zone && <Badge variant="secondary" className="gap-1"><MapPin className="h-3 w-3" />{form.zone}</Badge>}
              {form.sector && <Badge variant="secondary">{form.sector}</Badge>}
              {form.address && <Badge variant="secondary">{form.address}</Badge>}
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
              <Home className="h-4 w-4" />
              <span>Acasa</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium">Adauga Proprietate</span>
            </nav>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Plus className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Adauga Proprietate</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Publica o proprietate noua pe HQS Imobiliare
                    {user && <span className="text-xs ml-2">({user.email})</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {myProperties.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setShowMyProps(!showMyProps)} className="gap-1.5">
                    <List className="h-4 w-4" />
                    Proprietatile Mele ({myProperties.length})
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setPreviewMode(true)}>
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
            </div>
          </motion.div>
        </div>
      </section>

      {/* My Properties List */}
      <AnimatePresence>
        {showMyProps && myProperties.length > 0 && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
              <div className="glass-card rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Proprietatile tale ({myProperties.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {myProperties.map((prop) => (
                    <div key={prop.id as string} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-12 w-12 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 overflow-hidden">
                          {prop.cover_url ? (
                            <img src={prop.cover_url as string} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Building2 className="h-5 w-5 text-primary/50" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{prop.title as string}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{prop.zone as string}{prop.sector ? `, ${prop.sector}` : ''}</span>
                            <span>·</span>
                            <span className="font-semibold text-foreground">
                              {Number(prop.price).toLocaleString('ro-RO')} {prop.currency as string}
                            </span>
                            {prop.transaction === 'INCHIRIERE' && <span>/luna</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge variant="outline" className="text-[10px]">{prop.type as string}</Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(prop.created_at as string).toLocaleDateString('ro-RO')}
                        </span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary" onClick={() => { setEditProperty(prop); setEditOpen(true) }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive" onClick={() => deleteProperty(prop.id as string)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Form */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form - 2 columns */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Info */}
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                Informatii de Baza
              </h2>

              <div className="space-y-2">
                <Label htmlFor="title">Titlu *</Label>
                <Input
                  id="title"
                  placeholder="Apartament 3 camere in Dorobanti, decomandat"
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descriere *</Label>
                <Textarea
                  id="description"
                  placeholder="Descrie proprietatea detaliat: finisaje, dotari, vecinatate, acces transport etc."
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="min-h-[120px] resize-y"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tip Proprietate *</Label>
                  <Select value={form.type} onValueChange={(v) => updateField('type', v)} required>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecteaza tipul" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tranzactie *</Label>
                  <Select value={form.transaction} onValueChange={(v) => updateField('transaction', v)}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSACTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.section>

            {/* Pricing & Size */}
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Euro className="h-5 w-5 text-primary" />
                Pret si Dimensiuni
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Pret *</Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="95000"
                      value={form.price}
                      onChange={(e) => updateField('price', e.target.value)}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Moneda</Label>
                  <Select value={form.currency} onValueChange={(v) => updateField('currency', v)}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area">Suprafata (m²) *</Label>
                  <div className="relative">
                    <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="area"
                      type="number"
                      min="1"
                      placeholder="75"
                      value={form.areaSqm}
                      onChange={(e) => updateField('areaSqm', e.target.value)}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>
              </div>

              {form.price && form.areaSqm && parseFloat(form.price) > 0 && parseFloat(form.areaSqm) > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <span className="text-sm text-muted-foreground">Pret/mp:</span>
                  <span className="text-sm font-semibold text-primary">
                    {Math.round(parseFloat(form.price) / parseFloat(form.areaSqm)).toLocaleString('ro-RO')} {form.currency}/m²
                  </span>
                </div>
              )}
            </motion.section>

            {/* Rooms & Details */}
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Detalii Imobil
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rooms">Camere *</Label>
                  <div className="relative">
                    <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="rooms"
                      type="number"
                      min="0"
                      placeholder="3"
                      value={form.rooms}
                      onChange={(e) => updateField('rooms', e.target.value)}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bai</Label>
                  <div className="relative">
                    <Bath className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="bathrooms"
                      type="number"
                      min="0"
                      placeholder="1"
                      value={form.bathrooms}
                      onChange={(e) => updateField('bathrooms', e.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="floor">Etaj</Label>
                  <Input
                    id="floor"
                    type="number"
                    min="0"
                    placeholder="3"
                    value={form.floor}
                    onChange={(e) => updateField('floor', e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearBuilt">An Constructie</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="yearBuilt"
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      placeholder="2020"
                      value={form.yearBuilt}
                      onChange={(e) => updateField('yearBuilt', e.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Location */}
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Locatie
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sector *</Label>
                  <Select value={form.sector} onValueChange={(v) => updateField('sector', v)} required>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecteaza sectorul" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTOARE.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Zona *</Label>
                  <Select value={form.zone} onValueChange={(v) => updateField('zone', v)} required>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecteaza zona" />
                    </SelectTrigger>
                    <SelectContent>
                      {ZONES.map((z) => (
                        <SelectItem key={z} value={z}>{z}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresa exacta</Label>
                <Input
                  id="address"
                  placeholder="Str. Example nr. 10, Bl. A3, Sc. 2, Et. 4, Ap. 12"
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className="h-11"
                />
              </div>
            </motion.section>

            {/* Images */}
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Imagini
              </h2>
              <ImageUploader
                urls={form.galleryUrls}
                onChange={(urls) => updateField('galleryUrls', urls)}
              />
            </motion.section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Submit Card */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 sticky top-24">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Proprietate Evidentiata</span>
                  <Switch
                    checked={form.featured}
                    onCheckedChange={(v) => updateField('featured', v)}
                    aria-label="Marcheaza ca featured"
                  />
                </div>
                {form.featured && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-lg p-2.5">
                    Proprietatile evidensiate apar primele in rezultate si pe pagina principala.
                  </p>
                )}

                <Separator />

                {/* Quick summary */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pret</span>
                    <span className="font-semibold">
                      {form.price ? `${parseFloat(form.price).toLocaleString('ro-RO')} ${form.currency}` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Suprafata</span>
                    <span>{form.areaSqm ? `${form.areaSqm} m²` : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Camere</span>
                    <span>{form.rooms || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Zona</span>
                    <span className="text-right truncate max-w-[150px]">{form.zone || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Imagini</span>
                    <span>{form.galleryUrls.length > 0 ? `${form.galleryUrls.length} adaugate` : '—'}</span>
                  </div>
                </div>

                <Separator />

                <Button type="submit" className="w-full h-12 gap-2 text-base" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      Publica Proprietatea
                    </>
                  )}
                </Button>

                <p className="text-[11px] text-center text-muted-foreground">
                  Prin publicare confirmi ca informatiile sunt corecte
                  si ai dreptul de a publica aceasta proprietate.
                </p>
              </div>
            </motion.div>

            {/* Tips */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                💡 Sfaturi
              </h3>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li className="flex gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Adauga poze clare si luminoase — proprietatile cu poze primesc de 3x mai multe vizualizari
                </li>
                <li className="flex gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Scrie o descriere detaliata — include finisaje, dotari, vecinatate
                </li>
                <li className="flex gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Seteaza un pret realist — verifica preturile similare din zona
                </li>
                <li className="flex gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Completeaza adresa exacta pentru cautari mai precise
                </li>
              </ul>
            </motion.div>
          </div>
        </form>
      </div>
      <EditPropertyDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        property={editProperty}
        onSaved={() => { loadMyProperties(); setEditProperty(null) }}
      />
    </div>
  )
}