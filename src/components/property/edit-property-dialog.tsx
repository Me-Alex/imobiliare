'use client'

import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Tag, Euro, Building2, MapPin, Ruler, BedDouble, Bath, Calendar,
  ImagePlus, Plus, Loader2, X, Pencil,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { loadFromLS, saveToLS } from '@/lib/storage'
import { PROPERTY_TYPES, TRANSACTIONS, CURRENCIES, SECTOARE, ZONES, LS_KEYS } from '@/lib/constants'
import type { UserProperty } from '@/lib/types'
import { toast } from 'sonner'

/* ─── Form data (camelCase for UI) ─── */

interface EditFormData {
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
  galleryUrls: string[]
}

function emptyForm(): EditFormData {
  return {
    title: '', description: '', type: '', transaction: 'VANZARE',
    price: '', currency: 'EUR', areaSqm: '', rooms: '', bathrooms: '',
    floor: '', totalFloors: '', yearBuilt: '', address: '',
    zone: '', sector: '', featured: false, galleryUrls: [],
  }
}

function propertyToForm(prop: UserProperty): EditFormData {
  let galleryUrls: string[] = []
  try {
    const raw = prop.gallery_urls
    if (typeof raw === 'string' && raw) {
      galleryUrls = JSON.parse(raw)
    } else if (Array.isArray(raw)) {
      galleryUrls = raw as string[]
    }
  } catch {
    galleryUrls = []
  }

  // Ensure cover_url is first in the gallery
  const coverUrl = (prop.cover_url as string) || ''
  if (coverUrl && !galleryUrls.includes(coverUrl)) {
    galleryUrls.unshift(coverUrl)
  }

  return {
    title: (prop.title as string) || '',
    description: (prop.description as string) || '',
    type: (prop.type as string) || '',
    transaction: (prop.transaction as string) || 'VANZARE',
    price: prop.price != null ? String(prop.price) : '',
    currency: (prop.currency as string) || 'EUR',
    areaSqm: prop.area_sqm != null ? String(prop.area_sqm) : '',
    rooms: prop.rooms != null ? String(prop.rooms) : '',
    bathrooms: prop.bathrooms != null ? String(prop.bathrooms) : '',
    floor: prop.floor != null ? String(prop.floor) : '',
    totalFloors: prop.total_floors != null ? String(prop.total_floors) : '',
    yearBuilt: prop.year_built != null ? String(prop.year_built) : '',
    address: (prop.address as string) || '',
    zone: (prop.zone as string) || '',
    sector: (prop.sector as string) || '',
    featured: !!(prop.featured),
    galleryUrls,
  }
}

/* ─── Image Editor (URL-based, simplified for dialog) ─── */

function ImageEditor({
  urls,
  onChange,
}: {
  urls: string[]
  onChange: (urls: string[]) => void
}) {
  const [urlInput, setUrlInput] = useState('')
  const [erroredIndices, setErroredIndices] = useState<Set<number>>(new Set())
  const MAX_IMAGES = 15

  const addUrl = () => {
    const trimmed = urlInput.trim()
    if (!trimmed) return
    if (urls.length >= MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} imagini permise`)
      return
    }
    if (urls.includes(trimmed)) {
      toast.error('Aceasta imagine este deja adaugata')
      return
    }
    onChange([...urls, trimmed])
    setUrlInput('')
  }

  const removeUrl = (index: number) => {
    onChange(urls.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {/* Existing thumbnails */}
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
                  key={`${url.slice(0, 80)}-${i}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative group"
                >
                  <div className="h-20 w-20 rounded-lg overflow-hidden border border-border">
                    {erroredIndices.has(i) ? (
                      <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground text-[10px]">
                        Eroare
                      </div>
                    ) : (
                      <img
                        src={url}
                        alt={`Poza ${i + 1}`}
                        className="h-full w-full object-cover"
                        onError={() => {
                          setErroredIndices(prev => new Set(prev).add(i))
                        }}
                      />
                    )}
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
                    <Badge className="absolute bottom-0.5 left-0.5 text-[8px] px-1 h-3.5 bg-primary">
                      Cover
                    </Badge>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* URL input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <ImagePlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="https://exemplu.ro/imagine.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addUrl()
              }
            }}
            className="pl-10 h-10"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addUrl}
          disabled={!urlInput.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Prima imagine va fi folosita ca coperta.
      </p>
    </div>
  )
}

/* ─── Main Component ─── */

export interface EditPropertyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  property: UserProperty | null
  onSaved: () => void
}

export function EditPropertyDialog({
  open,
  onOpenChange,
  property,
  onSaved,
}: EditPropertyDialogProps) {
  const [form, setForm] = useState<EditFormData>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // When property changes, populate the form
  useEffect(() => {
    if (!open) {
      // Reset when closed
      setForm(emptyForm())
      setInitialized(false)
      return
    }
    if (property) {
      setForm(propertyToForm(property))
      setInitialized(true)
    }
  }, [open, property])

  const updateField = useCallback(
    <K extends keyof EditFormData>(key: K, value: EditFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!property) return

    const price = parseFloat(form.price)
    const areaSqm = parseFloat(form.areaSqm)

    if (!form.title.trim()) {
      toast.error('Titlul este obligatoriu')
      return
    }
    if (!form.description.trim()) {
      toast.error('Descrierea este obligatorie')
      return
    }
    if (isNaN(price) || price <= 0) {
      toast.error('Pretul trebuie sa fie un numar pozitiv')
      return
    }
    if (isNaN(areaSqm) || areaSqm <= 0) {
      toast.error('Suprafata trebuie sa fie un numar pozitiv')
      return
    }

    setIsSaving(true)
    try {
      const properties = loadFromLS<UserProperty[]>(LS_KEYS.USER_PROPERTIES, [])
      const idx = properties.findIndex((p) => p.id === property.id)
      if (idx === -1) {
        toast.error('Proprietatea nu a fost gasita in localStorage')
        setIsSaving(false)
        return
      }

      // Recalculate price_per_sqm
      const pricePerSqm = price > 0 && areaSqm > 0 ? Math.round(price / areaSqm) : null

      // Build updated property object preserving original fields we don't edit
      const updated: UserProperty = {
        ...properties[idx],
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        transaction: form.transaction,
        price,
        currency: form.currency,
        area_sqm: areaSqm,
        rooms: parseInt(form.rooms) || 0,
        bathrooms: parseInt(form.bathrooms) || 0,
        floor: form.floor !== '' ? parseInt(form.floor) : null,
        total_floors: form.totalFloors !== '' ? parseInt(form.totalFloors) : null,
        year_built: form.yearBuilt !== '' ? parseInt(form.yearBuilt) : null,
        address: form.address.trim(),
        zone: form.zone,
        sector: form.sector,
        featured: form.featured,
        cover_url: form.galleryUrls[0] || '',
        gallery_urls: JSON.stringify(form.galleryUrls),
        price_per_sqm: pricePerSqm,
      }

      properties[idx] = updated
      saveToLS(LS_KEYS.USER_PROPERTIES, properties)

      toast.success('Proprietate actualizata cu succes!', {
        description: `"${form.title}" a fost salvata.`,
      })
      onSaved()
      onOpenChange(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Eroare necunoscuta'
      console.error('Edit save error:', err)
      toast.error('Eroare la salvare', { description: msg })
    } finally {
      setIsSaving(false)
    }
  }

  // Compute live price/sqm for display
  const priceVal = parseFloat(form.price)
  const areaVal = parseFloat(form.areaSqm)
  const showPricePerSqm = !isNaN(priceVal) && priceVal > 0 && !isNaN(areaVal) && areaVal > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Pencil className="h-4.5 w-4.5" />
            </div>
            Editeaza Proprietatea
          </DialogTitle>
          <DialogDescription>
            Modifica detaliile proprietatii si salveaza schimbarile.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable form body */}
        {initialized && (
          <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
            <div className="max-h-[70vh] overflow-y-auto px-6 py-4 space-y-6">
              {/* ── Basic Info ── */}
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border bg-muted/20 p-4 space-y-4"
              >
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  Informatii de Baza
                </h3>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-title" className="text-xs">
                    Titlu <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-title"
                    placeholder="Apartament 3 camere in Dorobanti, decomandat"
                    value={form.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="h-10"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-description" className="text-xs">
                    Descriere <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Descrie proprietatea detaliat..."
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    className="min-h-[100px] resize-y text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Tip Proprietate <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={form.type}
                      onValueChange={(v) => updateField('type', v)}
                      required
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecteaza tipul" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Tranzactie</Label>
                    <Select
                      value={form.transaction}
                      onValueChange={(v) => updateField('transaction', v)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRANSACTIONS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.section>

              {/* ── Pricing & Size ── */}
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 }}
                className="rounded-xl border bg-muted/20 p-4 space-y-4"
              >
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Euro className="h-4 w-4 text-primary" />
                  Pret si Dimensiuni
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-price" className="text-xs">
                      Pret <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        id="edit-price"
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="95000"
                        value={form.price}
                        onChange={(e) => updateField('price', e.target.value)}
                        className="pl-9 h-10 text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Moneda</Label>
                    <Select
                      value={form.currency}
                      onValueChange={(v) => updateField('currency', v)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-area" className="text-xs">
                      Suprafata (m²) <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        id="edit-area"
                        type="number"
                        min="1"
                        placeholder="75"
                        value={form.areaSqm}
                        onChange={(e) => updateField('areaSqm', e.target.value)}
                        className="pl-9 h-10 text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                {showPricePerSqm && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                    <span className="text-xs text-muted-foreground">Pret/mp:</span>
                    <span className="text-xs font-semibold text-primary">
                      {Math.round(priceVal / areaVal).toLocaleString('ro-RO')}{' '}
                      {form.currency}/m²
                    </span>
                  </div>
                )}
              </motion.section>

              {/* ── Rooms & Details ── */}
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="rounded-xl border bg-muted/20 p-4 space-y-4"
              >
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Detalii Imobil
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-rooms" className="text-xs">
                      Camere <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        id="edit-rooms"
                        type="number"
                        min="0"
                        placeholder="3"
                        value={form.rooms}
                        onChange={(e) => updateField('rooms', e.target.value)}
                        className="pl-9 h-10 text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-bathrooms" className="text-xs">Bai</Label>
                    <div className="relative">
                      <Bath className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        id="edit-bathrooms"
                        type="number"
                        min="0"
                        placeholder="1"
                        value={form.bathrooms}
                        onChange={(e) => updateField('bathrooms', e.target.value)}
                        className="pl-9 h-10 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-floor" className="text-xs">Etaj</Label>
                    <Input
                      id="edit-floor"
                      type="number"
                      min="0"
                      placeholder="3"
                      value={form.floor}
                      onChange={(e) => updateField('floor', e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-totalFloors" className="text-xs">
                      Etaje Total
                    </Label>
                    <Input
                      id="edit-totalFloors"
                      type="number"
                      min="1"
                      placeholder="8"
                      value={form.totalFloors}
                      onChange={(e) => updateField('totalFloors', e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-yearBuilt" className="text-xs">
                      An Constructie
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        id="edit-yearBuilt"
                        type="number"
                        min="1900"
                        max={new Date().getFullYear()}
                        placeholder="2020"
                        value={form.yearBuilt}
                        onChange={(e) => updateField('yearBuilt', e.target.value)}
                        className="pl-9 h-10 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-end pb-1">
                    <div className="flex items-center justify-between w-full gap-3">
                      <Label className="text-xs">Proprietate Evidentiata</Label>
                      <Switch
                        checked={form.featured}
                        onCheckedChange={(v) => updateField('featured', v)}
                        aria-label="Marcheaza ca featured"
                      />
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* ── Location ── */}
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="rounded-xl border bg-muted/20 p-4 space-y-4"
              >
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Locatie
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Sector</Label>
                    <Select
                      value={form.sector}
                      onValueChange={(v) => updateField('sector', v)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecteaza sectorul" />
                      </SelectTrigger>
                      <SelectContent>
                        {SECTOARE.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Zona</Label>
                    <Select
                      value={form.zone}
                      onValueChange={(v) => updateField('zone', v)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecteaza zona" />
                      </SelectTrigger>
                      <SelectContent>
                        {ZONES.map((z) => (
                          <SelectItem key={z} value={z}>
                            {z}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-address" className="text-xs">
                    Adresa exacta
                  </Label>
                  <Input
                    id="edit-address"
                    placeholder="Str. Example nr. 10, Bl. A3, Sc. 2, Et. 4, Ap. 12"
                    value={form.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
              </motion.section>

              {/* ── Images ── */}
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
                className="rounded-xl border bg-muted/20 p-4 space-y-4"
              >
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <ImagePlus className="h-4 w-4 text-primary" />
                  Imagini ({form.galleryUrls.length})
                </h3>
                <ImageEditor
                  urls={form.galleryUrls}
                  onChange={(urls) => updateField('galleryUrls', urls)}
                />
              </motion.section>
            </div>

            {/* ── Footer ── */}
            <Separator />
            <DialogFooter className="px-6 py-4 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Anuleaza
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2 min-w-[140px]">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Se salveaza...
                  </>
                ) : (
                  <>
                    <Pencil className="h-4 w-4" />
                    Salveaza Modificarile
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}