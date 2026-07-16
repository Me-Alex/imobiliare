'use client'

import { useState, useCallback, useEffect, useRef, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Loader2, MapPin, Building2, Ruler,
  BedDouble, Bath, Calendar, Euro, Tag, Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { PROPERTY_TYPES, TRANSACTIONS, CURRENCIES, SECTOARE, ZONES } from '@/lib/constants'
import { ImageGalleryUploader } from '@/components/property/image-gallery-uploader'
import { AiDescriptionGenerator } from '@/components/property/ai-description-generator'

export interface PropertyFormData {
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

const INITIAL_FORM: PropertyFormData = {
  title: '', description: '', type: '', transaction: 'VANZARE',
  price: '', currency: 'EUR', areaSqm: '', rooms: '', bathrooms: '',
  floor: '', totalFloors: '', yearBuilt: '', address: '',
  zone: '', sector: '', featured: false, coverUrl: '', galleryUrls: [],
}

interface PropertyFormProps {
  onSubmit: (data: PropertyFormData) => void
  isSubmitting: boolean
  onFormChange?: (data: PropertyFormData) => void
}

export function PropertyForm({ onSubmit, isSubmitting, onFormChange }: PropertyFormProps) {
  const [form, setForm] = useState<PropertyFormData>(INITIAL_FORM)
  const onFormChangeRef = useRef(onFormChange)
  useEffect(() => { onFormChangeRef.current = onFormChange })

  const updateField = useCallback(<K extends keyof PropertyFormData>(key: K, value: PropertyFormData[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      onFormChangeRef.current?.(next)
      return next
    })
  }, [])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Label htmlFor="description">Descriere *</Label>
                  <p className="mt-1 text-xs text-muted-foreground">Scrie manual sau pornește de la trei variante adaptate proprietății.</p>
                </div>
                <AiDescriptionGenerator
                  form={form}
                  onApply={({ title, description }) => {
                    setForm((previous) => {
                      const next = { ...previous, title, description }
                      onFormChangeRef.current?.(next)
                      return next
                    })
                  }}
                />
              </div>
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

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
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
                <Label htmlFor="totalFloors">Total etaje</Label>
                <Input
                  id="totalFloors"
                  type="number"
                  min="0"
                  placeholder="8"
                  value={form.totalFloors}
                  onChange={(e) => updateField('totalFloors', e.target.value)}
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
            <ImageGalleryUploader
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
  )
}
