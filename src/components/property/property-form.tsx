'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ElementType,
  type FormEvent,
  type ReactNode,
} from 'react'
import {
  AlertTriangle,
  Bath,
  BedDouble,
  Building2,
  Calendar,
  CheckCircle2,
  Circle,
  Clock3,
  Euro,
  Eye,
  ImageIcon,
  Loader2,
  MapPin,
  Navigation,
  Plus,
  Rotate3D,
  Ruler,
  Save,
  ShieldCheck,
  Tag,
  Trash2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'

import { PageSurface } from '@/components/layout/page-shell'
import { AiDescriptionGenerator } from '@/components/property/ai-description-generator'
import { ImageGalleryUploader } from '@/components/property/image-gallery-uploader'
import { PropertyLocationPicker } from '@/components/property/property-location-picker'
import { VirtualTourEditor } from '@/components/property/virtual-tour-editor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { CURRENCIES, PROPERTY_TYPES, SECTOARE, TRANSACTIONS, ZONES } from '@/lib/constants'
import {
  createEmptyPropertyFormData,
  type PropertyFormData,
} from '@/lib/property-form-data'
import {
  clearPropertyPublicationDraft,
  countTransientPropertyAssets,
  loadPropertyPublicationDraft,
  savePropertyPublicationDraft,
  type PropertyPublicationDraft,
} from '@/lib/property-publication-draft'
import {
  getPropertyPublicationReadiness,
} from '@/lib/property-publication-readiness'
import { cn } from '@/lib/utils'
import {
  isVirtualTourDraftValid,
  virtualTourProviderLabel,
} from '@/lib/virtual-tours'

interface PropertyFormProps {
  onSubmit: (data: PropertyFormData) => void
  isSubmitting: boolean
  onPreview: (data: PropertyFormData) => void
  draftStorageKey?: string
}

interface ListingSectionProps {
  id: string
  step: number
  icon: ElementType
  title: string
  description: string
  complete: boolean
  optional?: boolean
  children: ReactNode
}

function ListingSection({
  id,
  step,
  icon,
  title,
  description,
  complete,
  optional = false,
  children,
}: ListingSectionProps) {
  const Icon = icon

  return (
    <div id={id} tabIndex={-1} className="scroll-mt-32 focus:outline-none">
      <PageSurface as="section" className="overflow-hidden rounded-xl" tone="default">
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6">
          <div className="flex min-w-0 gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-semibold sm:text-base">{step}. {title}</h2>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>
            </div>
          </div>
          <span className={cn(
            'inline-flex shrink-0 items-center gap-1.5 pt-1 text-xs',
            complete ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground',
          )}>
            {complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
            {complete ? 'Complet' : optional ? 'Opțional' : 'De completat'}
          </span>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </PageSurface>
    </div>
  )
}

function formatPrice(value: string, currency: string) {
  const price = Number(value)
  return price > 0 ? `${price.toLocaleString('ro-RO')} ${currency}` : 'Preț nesetat'
}

export function PropertyForm({
  onSubmit,
  isSubmitting,
  onPreview,
  draftStorageKey,
}: PropertyFormProps) {
  const [restoredDraft, setRestoredDraft] = useState<PropertyPublicationDraft | null>(() => (
    draftStorageKey ? loadPropertyPublicationDraft(draftStorageKey) : null
  ))
  const [form, setForm] = useState<PropertyFormData>(() => (
    restoredDraft?.data || createEmptyPropertyFormData()
  ))
  const [showValidation, setShowValidation] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(restoredDraft?.savedAt || null)
  const [draftSaveError, setDraftSaveError] = useState(false)
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false)
  const skipInitialDraftSave = useRef(true)
  const transientAssetCount = countTransientPropertyAssets(form)

  useEffect(() => {
    if (!draftStorageKey) return
    if (skipInitialDraftSave.current) {
      skipInitialDraftSave.current = false
      return
    }

    const timer = window.setTimeout(() => {
      try {
        const savedDraft = savePropertyPublicationDraft(draftStorageKey, form)
        setLastSavedAt(savedDraft?.savedAt || null)
        setDraftSaveError(false)
      } catch {
        setDraftSaveError(true)
      }
    }, 650)

    return () => window.clearTimeout(timer)
  }, [draftStorageKey, form])

  useEffect(() => {
    if (transientAssetCount === 0) return

    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [transientAssetCount])

  const updateField = useCallback(<K extends keyof PropertyFormData>(
    key: K,
    value: PropertyFormData[K],
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }))
  }, [])

  const updateFields = useCallback((fields: Partial<PropertyFormData>) => {
    setForm((previous) => ({ ...previous, ...fields }))
  }, [])

  const validVirtualTour = isVirtualTourDraftValid(form.virtualTour)
  const currentYear = new Date().getFullYear()
  const publicationReadiness = getPropertyPublicationReadiness({
    ...form,
    virtualTourMode: form.virtualTour.mode,
    virtualTourValid: validVirtualTour,
    currentYear,
  })
  const {
    isLand,
    hasPin,
    sectionCompletion,
    steps,
    requiredItems,
    recommendations,
    qualityPercent,
    qualityLabel,
    pricePerSqm,
  } = publicationReadiness
  const isPositiveInteger = (value: string) => Number.isInteger(Number(value)) && Number(value) > 0
  const isOptionalNonNegativeInteger = (value: string) => (
    !value || (Number.isInteger(Number(value)) && Number(value) >= 0)
  )
  const hasValidYear = !form.yearBuilt || (
    Number.isInteger(Number(form.yearBuilt))
    && Number(form.yearBuilt) >= 1800
    && Number(form.yearBuilt) <= currentYear
  )

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setShowValidation(true)

    const firstMissing = requiredItems[0]
    if (firstMissing) {
      document.getElementById(firstMissing.sectionId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
      window.setTimeout(() => document.getElementById(firstMissing.fieldId)?.focus(), 450)
      toast.error('Completează câmpurile obligatorii', {
        description: `Mai lipsesc: ${requiredItems.map((item) => item.label).join(', ')}.`,
      })
      return
    }

    onSubmit(form)
  }

  const resetLocation = (fields: Partial<PropertyFormData>) => {
    updateFields({ ...fields, lat: null, lng: null })
  }

  const discardDraft = () => {
    if (draftStorageKey) clearPropertyPublicationDraft(draftStorageKey)
    setForm(createEmptyPropertyFormData())
    setShowValidation(false)
    setRestoredDraft(null)
    setLastSavedAt(null)
    setDraftSaveError(false)
    setDiscardDialogOpen(false)
    toast.success('Ciorna a fost ștearsă.')
  }

  const draftTimeLabel = lastSavedAt
    ? new Intl.DateTimeFormat('ro-RO', { hour: '2-digit', minute: '2-digit' }).format(new Date(lastSavedAt))
    : null

  return (
    <form onSubmit={handleSubmit} className="pb-28 lg:pb-0" noValidate>
      {restoredDraft ? (
        <PageSurface tone="subtle" className="mb-6 rounded-xl border-primary/20 bg-primary/[0.04] p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Save className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Ai reluat ciorna salvată automat</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Datele anunțului au fost restaurate
                  {draftTimeLabel ? ` din ${draftTimeLabel}` : ''}.
                  {restoredDraft.omittedLocalAssets > 0
                    ? ` Reatașează ${restoredDraft.omittedLocalAssets} ${restoredDraft.omittedLocalAssets === 1 ? 'fișier local' : 'fișiere locale'} înainte de publicare.`
                    : ' Poți continua exact de unde ai rămas.'}
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" className="shrink-0 gap-2" onClick={() => setDiscardDialogOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Începe de la zero
            </Button>
          </div>
        </PageSurface>
      ) : null}

      {transientAssetCount > 0 ? (
        <div className="mb-6 flex gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-100">
              {transientAssetCount} {transientAssetCount === 1 ? 'fișier rămâne' : 'fișiere rămân'} doar în această sesiune
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Detaliile text sunt salvate automat, dar fotografiile și panoramele alese de pe dispozitiv se încarcă în cloud doar la publicare. Nu închide pagina înainte să publici.
            </p>
          </div>
        </div>
      ) : null}

      <PageSurface className="mb-6 overflow-hidden rounded-xl">
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Completează anunțul</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {requiredItems.length > 0
                  ? `${requiredItems.length} ${requiredItems.length === 1 ? 'câmp obligatoriu rămas' : 'câmpuri obligatorii rămase'}.`
                  : 'Datele obligatorii sunt completate. Poți previzualiza și publica.'}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-xl font-semibold tabular-nums">{qualityPercent}%</span>
              <span className="ml-2 text-xs text-muted-foreground">{qualityLabel}</span>
            </div>
          </div>
          <Progress value={qualityPercent} className="mt-3 h-1.5" />

          {recommendations.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {recommendations.slice(0, 2).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => document.getElementById(item.sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="rounded-md border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {item.title}
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" />
              Aproximativ 4–6 minute
            </span>
            {draftStorageKey ? (
              <span role="status" className={cn('inline-flex items-center gap-1.5', draftSaveError && 'text-destructive')}>
                <Save className="h-3.5 w-3.5" />
                {draftSaveError
                  ? 'Ciorna nu a putut fi salvată'
                  : transientAssetCount > 0
                    ? `Detalii salvate · ${transientAssetCount} ${transientAssetCount === 1 ? 'fișier local' : 'fișiere locale'}`
                    : draftTimeLabel
                      ? `Salvat automat la ${draftTimeLabel}`
                      : 'Salvarea automată este activă'}
              </span>
            ) : null}
          </div>
        </div>

        <nav
          aria-label="Secțiunile formularului"
          className="property-form-steps overflow-x-auto border-t px-3 py-2 sm:px-4"
        >
          <div className="flex min-w-max gap-1">
            {steps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => document.getElementById(step.id)?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                })}
                className={cn(
                  'flex min-w-[132px] items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors',
                  step.complete
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center text-xs font-medium">
                  {step.complete ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-medium">{step.label}</span>
                  {!step.complete && step.optional ? <span className="block text-[10px]">Opțional</span> : null}
                </span>
              </button>
            ))}
          </div>
        </nav>
      </PageSurface>

      {showValidation && requiredItems.length > 0 ? (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm"
        >
          <p className="font-semibold text-destructive">Anunțul nu este încă pregătit pentru publicare.</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Completează {requiredItems.map((item) => item.label).join(', ')}. Te-am dus la primul câmp lipsă.
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-8">
        <div className="min-w-0 space-y-6">
          <ListingSection
            id="property-step-basic"
            step={1}
            icon={Tag}
            title="Despre proprietate"
            description="Creează o primă impresie clară și convingătoare."
            complete={sectionCompletion.basic}
          >
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="title">Titlul anunțului *</Label>
                  <span className={cn(
                    'text-[11px] tabular-nums text-muted-foreground',
                    form.title.length >= 20 && 'text-emerald-600',
                  )}>
                    {form.title.length}/80
                  </span>
                </div>
                <Input
                  id="title"
                  maxLength={80}
                  placeholder="Apartament luminos cu 3 camere în Dorobanți"
                  value={form.title}
                  onChange={(event) => updateField('title', event.target.value)}
                  className="h-12 text-base"
                  aria-invalid={showValidation && !form.title.trim()}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Include tipul proprietății, numărul de camere și zona.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <Label htmlFor="description">Descriere *</Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Evidențiază compartimentarea, finisajele, lumina naturală și vecinătățile.
                    </p>
                  </div>
                  <AiDescriptionGenerator
                    form={form}
                    onApply={({ title, description }) => {
                      setForm((previous) => ({ ...previous, title, description }))
                    }}
                  />
                </div>
                <Textarea
                  id="description"
                  placeholder="Descrie proprietatea, dotările și avantajele zonei…"
                  value={form.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  className="min-h-[180px] resize-y text-sm leading-6"
                  aria-invalid={showValidation && !form.description.trim()}
                  required
                />
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>Recomandat: minimum 160 de caractere.</span>
                  <span className={cn('tabular-nums', form.description.length >= 160 && 'text-emerald-600')}>
                    {form.description.length} caractere
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="property-type">Tipul proprietății *</Label>
                  <Select value={form.type} onValueChange={(value) => updateFields({
                    type: value,
                    ...( /teren/i.test(value) ? {
                      rooms: '',
                      bathrooms: '',
                      floor: '',
                      totalFloors: '',
                      yearBuilt: '',
                    } : {} ),
                  })} required>
                    <SelectTrigger
                      id="property-type"
                      className="h-12"
                      aria-invalid={showValidation && !form.type}
                    >
                      <SelectValue placeholder="Selectează tipul" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Tipul tranzacției *</legend>
                  <div className="grid grid-cols-2 rounded-xl border bg-muted/25 p-1">
                    {TRANSACTIONS.map((transaction) => {
                      const selected = form.transaction === transaction.value
                      return (
                        <button
                          key={transaction.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => updateField('transaction', transaction.value)}
                          className={cn(
                            'h-10 rounded-lg px-3 text-sm font-medium transition-all',
                            selected
                              ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                              : 'text-muted-foreground hover:text-foreground',
                          )}
                        >
                          {transaction.value === 'INCHIRIERE' ? 'Închiriere' : 'Vânzare'}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
              </div>
            </div>
          </ListingSection>

          <ListingSection
            id="property-step-details"
            step={2}
            icon={Building2}
            title="Preț și caracteristici"
            description="Detaliile care ajută cumpărătorii să compare rapid proprietatea."
            complete={sectionCompletion.details}
          >
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
                <div className="space-y-2">
                  <Label htmlFor="price">Preț *</Label>
                  <div className="relative">
                    <Euro className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step={form.transaction === 'INCHIRIERE' ? '50' : '1000'}
                      placeholder={form.transaction === 'INCHIRIERE' ? '850' : '150000'}
                      value={form.price}
                      onChange={(event) => updateField('price', event.target.value)}
                      className="h-12 pl-10 text-base font-semibold"
                      aria-invalid={showValidation && !(Number(form.price) > 0)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="property-currency">Moneda</Label>
                  <Select value={form.currency} onValueChange={(value) => updateField('currency', value)}>
                    <SelectTrigger id="property-currency" className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className={cn(
                'grid gap-4',
                isLand ? 'sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-5',
              )}>
                <div className="space-y-2">
                  <Label htmlFor="area">{isLand ? 'Suprafața terenului *' : 'Suprafață utilă *'}</Label>
                  <div className="relative">
                    <Ruler className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="area"
                      type="number"
                      min="1"
                      placeholder={isLand ? '500' : '75'}
                      value={form.areaSqm}
                      onChange={(event) => updateField('areaSqm', event.target.value)}
                      className="h-11 pl-10"
                      aria-invalid={showValidation && !(Number(form.areaSqm) > 0)}
                      required
                    />
                  </div>
                </div>

                {!isLand ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="rooms">Camere *</Label>
                      <div className="relative">
                        <BedDouble className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="rooms"
                          type="number"
                          min="1"
                          step="1"
                          placeholder="3"
                          value={form.rooms}
                          onChange={(event) => updateField('rooms', event.target.value)}
                          className="h-11 pl-10"
                          aria-invalid={showValidation && !isPositiveInteger(form.rooms)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bathrooms">Băi</Label>
                      <div className="relative">
                        <Bath className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="bathrooms"
                          type="number"
                          min="0"
                          step="1"
                          placeholder="2"
                          value={form.bathrooms}
                          onChange={(event) => updateField('bathrooms', event.target.value)}
                          className="h-11 pl-10"
                          aria-invalid={showValidation && !isOptionalNonNegativeInteger(form.bathrooms)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="floor">Etaj</Label>
                      <Input
                        id="floor"
                        type="number"
                        min="0"
                        step="1"
                        placeholder="3"
                        value={form.floor}
                        onChange={(event) => updateField('floor', event.target.value)}
                        className="h-11"
                        aria-invalid={showValidation && (
                          !isOptionalNonNegativeInteger(form.floor)
                          || Boolean(form.floor && form.totalFloors) && Number(form.floor) > Number(form.totalFloors)
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalFloors">Total etaje</Label>
                      <Input
                        id="totalFloors"
                        type="number"
                        min="0"
                        step="1"
                        placeholder="8"
                        value={form.totalFloors}
                        onChange={(event) => updateField('totalFloors', event.target.value)}
                        className="h-11"
                        aria-invalid={showValidation && !isOptionalNonNegativeInteger(form.totalFloors)}
                      />
                    </div>
                  </>
                ) : null}
              </div>

              {!isLand ? (
                <div className="max-w-xs space-y-2">
                  <Label htmlFor="yearBuilt">Anul construcției</Label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="yearBuilt"
                      type="number"
                      min="1800"
                      max={currentYear}
                      step="1"
                      placeholder="2020"
                      value={form.yearBuilt}
                      onChange={(event) => updateField('yearBuilt', event.target.value)}
                      className="h-11 pl-10"
                      aria-invalid={showValidation && !hasValidYear}
                    />
                  </div>
                </div>
              ) : null}

              {pricePerSqm ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">{pricePerSqm.toLocaleString('ro-RO')} {form.currency}/m²</p>
                    <p className="text-xs text-muted-foreground">Calculat automat din preț și suprafață.</p>
                  </div>
                  <Badge variant="outline">Indicator orientativ</Badge>
                </div>
              ) : null}
            </div>
          </ListingSection>

          <ListingSection
            id="property-step-location"
            step={3}
            icon={MapPin}
            title="Localizare"
            description="Alege zona, completează adresa și confirmă poziția pe hartă."
            complete={sectionCompletion.location}
          >
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="property-sector">Sector *</Label>
                  <Select
                    value={form.sector}
                    onValueChange={(value) => resetLocation({ sector: value })}
                    required
                  >
                    <SelectTrigger
                      id="property-sector"
                      className="h-12"
                      aria-invalid={showValidation && !form.sector}
                    >
                      <SelectValue placeholder="Selectează sectorul" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTOARE.map((sector) => (
                        <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="property-zone">Zonă *</Label>
                  <Select
                    value={form.zone}
                    onValueChange={(value) => resetLocation({ zone: value })}
                    required
                  >
                    <SelectTrigger
                      id="property-zone"
                      className="h-12"
                      aria-invalid={showValidation && !form.zone}
                    >
                      <SelectValue placeholder="Selectează zona" />
                    </SelectTrigger>
                    <SelectContent>
                      {ZONES.map((zone) => (
                        <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresa exactă *</Label>
                <Input
                  id="address"
                  placeholder="Strada, numărul, blocul și apartamentul"
                  value={form.address}
                  onChange={(event) => resetLocation({ address: event.target.value })}
                  className="h-12"
                  aria-invalid={showValidation && !form.address.trim()}
                  required
                />
                {hasPin ? null : (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Navigation className="h-3.5 w-3.5" />
                    După orice modificare a adresei, reconfirmă pinul pe hartă.
                  </p>
                )}
              </div>

              <PropertyLocationPicker
                address={form.address}
                zone={form.zone}
                sector={form.sector}
                lat={form.lat}
                lng={form.lng}
                onChange={(location) => updateFields({
                  ...(location.address ? { address: location.address } : {}),
                  lat: location.lat,
                  lng: location.lng,
                })}
              />
            </div>
          </ListingSection>

          <ListingSection
            id="property-step-images"
            step={4}
            icon={Upload}
            title="Fotografii"
            description="Alege o copertă puternică și adaugă imagini clare din fiecare încăpere."
            complete={sectionCompletion.images}
            optional
          >
            <ImageGalleryUploader
              urls={form.galleryUrls}
              onChange={(urls) => updateField('galleryUrls', urls)}
            />
          </ListingSection>

          <ListingSection
            id="property-step-virtual-tour"
            step={5}
            icon={Rotate3D}
            title="Tur virtual"
            description="Importă Matterport/Kuula sau construiește un tur 360° în HQS."
            complete={sectionCompletion.tour}
            optional
          >
            <VirtualTourEditor
              value={form.virtualTour}
              onChange={(virtualTour) => updateField('virtualTour', virtualTour)}
            />
          </ListingSection>
        </div>

        <aside className="hidden lg:block" aria-label="Rezumatul anunțului">
          <div className="space-y-4">
            <PageSurface className="overflow-hidden" tone="elevated">
              <div className="relative aspect-[16/10] overflow-hidden bg-[radial-gradient(circle_at_top_right,var(--primary),transparent_48%),linear-gradient(135deg,var(--muted),var(--background))]">
                {form.galleryUrls[0] ? (
                  <img
                    src={form.galleryUrls[0]}
                    alt="Coperta selectată pentru anunț"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-background/70 shadow-sm backdrop-blur">
                      <ImageIcon className="h-5 w-5 text-primary" />
                    </span>
                    <span className="text-xs font-medium">Coperta va apărea aici</span>
                  </div>
                )}
                <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                  <Badge className="bg-background/90 text-foreground shadow-sm backdrop-blur hover:bg-background/90">
                    {form.transaction === 'INCHIRIERE' ? 'Închiriere' : 'Vânzare'}
                  </Badge>
                  {form.type ? (
                    <Badge variant="secondary" className="bg-background/80 shadow-sm backdrop-blur">
                      {form.type}
                    </Badge>
                  ) : null}
                </div>
              </div>

              <div className="p-5">
                <p className="line-clamp-2 text-base font-semibold leading-6">
                  {form.title.trim() || 'Titlul proprietății tale'}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{form.zone || 'Zona'}{form.sector ? `, ${form.sector}` : ''}</span>
                </p>
                <p className="mt-4 text-xl font-bold text-primary">
                  {formatPrice(form.price, form.currency)}
                  {form.transaction === 'INCHIRIERE' && Number(form.price) > 0 ? (
                    <span className="text-xs font-medium text-muted-foreground"> / lună</span>
                  ) : null}
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-4 text-center">
                  <div>
                    <p className="truncate text-sm font-semibold">{isLand ? (form.type || '—') : (form.rooms || '—')}</p>
                    <p className="text-[10px] text-muted-foreground">{isLand ? 'categorie' : 'camere'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{form.areaSqm ? `${form.areaSqm} m²` : '—'}</p>
                    <p className="text-[10px] text-muted-foreground">suprafață</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{form.galleryUrls.length || '—'}</p>
                    <p className="text-[10px] text-muted-foreground">fotografii</p>
                  </div>
                </div>
              </div>
            </PageSurface>

            <PageSurface className="sticky top-24 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Pregătire pentru publicare</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {requiredItems.length === 0
                      ? 'Toate câmpurile obligatorii sunt complete.'
                      : `${requiredItems.length} ${requiredItems.length === 1 ? 'câmp obligatoriu rămas' : 'câmpuri obligatorii rămase'}.`}
                  </p>
                </div>
                <span className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                  requiredItems.length === 0
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-amber-500/10 text-amber-600',
                )}>
                  {requiredItems.length === 0
                    ? <CheckCircle2 className="h-5 w-5" />
                    : <Circle className="h-5 w-5" />}
                </span>
              </div>

              {requiredItems.length > 0 ? (
                <div className="mt-4 rounded-xl bg-muted/35 px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Mai lipsește</p>
                  <p className="mt-1 text-xs leading-5">{requiredItems.slice(0, 4).map((item) => item.label).join(', ')}</p>
                </div>
              ) : null}

              {requiredItems.length === 0 && recommendations.length > 0 ? (
                <div className="mt-4 rounded-xl border border-primary/15 bg-primary/[0.04] px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Optimizari recomandate</p>
                  <div className="mt-2 space-y-2">
                    {recommendations.slice(0, 3).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => document.getElementById(item.sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                        className="block w-full rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-background/80"
                      >
                        <span className="font-semibold">{item.title}</span>
                        <span className="mt-0.5 block leading-4 text-muted-foreground">{item.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-4 space-y-2.5 border-t pt-4 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> Pin pe hartă</span>
                  <span className={hasPin ? 'font-medium text-emerald-600' : 'text-muted-foreground'}>{hasPin ? 'Confirmat' : 'Recomandat'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-muted-foreground"><ImageIcon className="h-3.5 w-3.5" /> Fotografii</span>
                  <span>{form.galleryUrls.length > 0 ? `${form.galleryUrls.length} adăugate` : 'Recomandate'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-muted-foreground"><Rotate3D className="h-3.5 w-3.5" /> Tur virtual</span>
                  <span className="max-w-[150px] truncate text-right">
                    {form.virtualTour.mode === 'NONE'
                      ? 'Opțional'
                      : form.virtualTour.mode === 'NATIVE'
                        ? `${form.virtualTour.scenes.length} camere 360°`
                        : form.virtualTour.provider
                          ? virtualTourProviderLabel(form.virtualTour.provider)
                          : 'Link incomplet'}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border bg-muted/20 px-3 py-3">
                <div>
                  <Label htmlFor="featured-listing" className="text-xs font-semibold">Evidențiază anunțul</Label>
                  <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">Apare prioritar în selecțiile platformei.</p>
                </div>
                <Switch
                  id="featured-listing"
                  checked={form.featured}
                  onCheckedChange={(value) => updateField('featured', value)}
                  aria-label="Evidențiază anunțul"
                />
              </div>

              <div className="mt-4 grid gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 gap-2"
                  onClick={() => onPreview(form)}
                >
                  <Eye className="h-4 w-4" />
                  Previzualizează
                </Button>
                <Button type="submit" className="h-12 gap-2 text-base" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                  {isSubmitting ? 'Se publică…' : 'Publică proprietatea'}
                </Button>
              </div>
            </PageSurface>

            <PageSurface tone="subtle" className="flex gap-3 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-[11px] leading-5 text-muted-foreground">
                Prin publicare confirmi că informațiile sunt corecte și că ai dreptul să promovezi proprietatea.
              </p>
            </PageSurface>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-12px_30px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <div className="min-w-[54px] text-center">
            <p className="text-sm font-bold tabular-nums text-primary">{qualityPercent}%</p>
            <p className="text-[9px] text-muted-foreground">calitate</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0"
            onClick={() => onPreview(form)}
            aria-label="Previzualizează anunțul"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button type="submit" className="h-11 flex-1 gap-2" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {isSubmitting ? 'Se publică…' : 'Publică proprietatea'}
          </Button>
        </div>
      </div>

      <Dialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ștergi ciorna proprietății?</DialogTitle>
            <DialogDescription>
              Toate detaliile completate în acest formular vor fi eliminate. Acțiunea nu poate fi anulată.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Păstrează ciorna</Button>
            </DialogClose>
            <Button type="button" variant="destructive" onClick={discardDraft}>
              <Trash2 className="mr-2 h-4 w-4" />
              Șterge ciorna
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
