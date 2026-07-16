'use client'

import { useMemo, useState } from 'react'
import {
  Check, CheckCircle2, Clipboard, Languages, Loader2, RefreshCw,
  RotateCcw, Sparkles, WandSparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import type {
  ListingInput, ListingLanguage, ListingLength, ListingResult,
  ListingTone, ListingVariant,
} from '@/lib/ai-listing-types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface PropertyFormSnapshot {
  title: string
  type: string
  transaction: string
  zone: string
  rooms: string
  bathrooms: string
  areaSqm: string
  price: string
  currency: string
  floor: string
  totalFloors: string
  yearBuilt: string
}

interface AiDescriptionGeneratorProps {
  form: PropertyFormSnapshot
  onApply: (content: { title: string; description: string }) => void
}

interface ListingApiResponse extends Partial<ListingResult> {
  ok?: boolean
  error?: string
  variant?: ListingVariant
}

const FEATURE_OPTIONS = [
  'Balcon', 'Terasă', 'Parcare', 'Garaj', 'Lift', 'Centrală proprie',
  'Aer condiționat', 'Mobilat', 'Electrocasnice', 'Parchet',
]

const TONES: Array<{ value: ListingTone; label: string; description: string }> = [
  { value: 'professional', label: 'Profesional', description: 'clar și echilibrat' },
  { value: 'warm', label: 'Cald', description: 'prietenos și personal' },
  { value: 'luxury', label: 'Premium', description: 'rafinat și selectiv' },
  { value: 'concise', label: 'Concis', description: 'direct și factual' },
  { value: 'investor', label: 'Investitor', description: 'orientat spre valoare' },
]

const LENGTHS: Array<{ value: ListingLength; label: string; description: string }> = [
  { value: 'short', label: 'Scurtă', description: '45–70 cuvinte' },
  { value: 'medium', label: 'Medie', description: '90–130 cuvinte' },
  { value: 'long', label: 'Lungă', description: '150–210 cuvinte' },
]

function optionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function buildPayload(
  form: PropertyFormSnapshot,
  options: {
    tone: ListingTone
    language: ListingLanguage
    length: ListingLength
    features: string[]
    highlights: string
  },
): ListingInput {
  const currency: ListingInput['currency'] = ['EUR', 'RON', 'USD'].includes(form.currency)
    ? form.currency as ListingInput['currency']
    : 'EUR'

  return {
    propertyType: form.type,
    transaction: form.transaction === 'INCHIRIERE' ? 'INCHIRIERE' : 'VANZARE',
    zone: form.zone,
    city: 'București',
    rooms: Number(form.rooms) || 0,
    bathrooms: Number(form.bathrooms) || 0,
    surface: Number(form.areaSqm) || 0,
    price: Number(form.price) || 0,
    currency,
    floor: optionalNumber(form.floor),
    totalFloors: optionalNumber(form.totalFloors),
    yearBuilt: optionalNumber(form.yearBuilt),
    features: options.features,
    highlights: options.highlights.trim() || undefined,
    tone: options.tone,
    language: options.language,
    length: options.length,
  }
}

export function AiDescriptionGenerator({ form, onApply }: AiDescriptionGeneratorProps) {
  const [open, setOpen] = useState(false)
  const [tone, setTone] = useState<ListingTone>('professional')
  const [language, setLanguage] = useState<ListingLanguage>('ro')
  const [length, setLength] = useState<ListingLength>('medium')
  const [features, setFeatures] = useState<string[]>([])
  const [highlights, setHighlights] = useState('')
  const [loading, setLoading] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [variants, setVariants] = useState<ListingVariant[]>([])
  const [titles, setTitles] = useState<string[]>([])
  const [activeVariantId, setActiveVariantId] = useState('v1')
  const [editedText, setEditedText] = useState('')
  const [selectedTitleIndex, setSelectedTitleIndex] = useState(0)
  const [generatedBy, setGeneratedBy] = useState<ListingResult['generatedBy'] | null>(null)
  const [copied, setCopied] = useState(false)

  const missingFields = useMemo(() => {
    const missing: string[] = []
    if (!form.type) missing.push('tipul proprietății')
    if (!form.zone) missing.push('zona')
    if (!(Number(form.areaSqm) > 0)) missing.push('suprafața')
    if (!(Number(form.price) > 0)) missing.push('prețul')
    if (!/teren/i.test(form.type) && !(Number(form.rooms) > 0)) missing.push('numărul de camere')
    return missing
  }, [form.areaSqm, form.price, form.rooms, form.type, form.zone])

  const activeVariant = variants.find((variant) => variant.id === activeVariantId)
  const selectedTitle = titles[selectedTitleIndex] || form.title
  const wordCount = editedText.trim() ? editedText.trim().split(/\s+/).length : 0

  function options() {
    return { tone, language, length, features, highlights }
  }

  function toggleFeature(feature: string) {
    setFeatures((current) => current.includes(feature)
      ? current.filter((item) => item !== feature)
      : [...current, feature])
  }

  async function requestContent(payload: ListingInput & { variantIndex?: number }): Promise<ListingApiResponse> {
    const response = await fetch('/api/ai-listing-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await response.json().catch(() => ({})) as ListingApiResponse
    if (!response.ok) throw new Error(data.error || 'Serviciul de redactare nu a răspuns.')
    return data
  }

  async function handleGenerate() {
    if (missingFields.length) {
      toast.error('Mai sunt câteva detalii de completat', {
        description: `Adaugă ${missingFields.join(', ')} înainte de generare.`,
      })
      return
    }

    setLoading(true)
    try {
      const data = await requestContent(buildPayload(form, options()))
      const nextVariants = data.variants || []
      if (!nextVariants.length) throw new Error('Nu au fost returnate variante de descriere.')
      setVariants(nextVariants)
      setTitles(data.titles || [])
      setActiveVariantId(nextVariants[0].id)
      setEditedText(nextVariants[0].text)
      setSelectedTitleIndex(0)
      setGeneratedBy(data.generatedBy || 'template')
      toast.success('Conținutul anunțului este gata', {
        description: `${nextVariants.length} descrieri și ${data.titles?.length || 0} titluri SEO.`,
      })
    } catch (error) {
      toast.error('Generarea nu a reușit', {
        description: error instanceof Error ? error.message : 'Încearcă din nou.',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleRegenerate() {
    const index = Math.max(0, variants.findIndex((variant) => variant.id === activeVariantId))
    setRegenerating(true)
    try {
      const data = await requestContent({ ...buildPayload(form, options()), variantIndex: index })
      if (!data.variant) throw new Error('Nu a fost returnată o descriere nouă.')
      setVariants((current) => current.map((variant) => variant.id === data.variant?.id ? data.variant : variant))
      setEditedText(data.variant.text)
      setGeneratedBy(data.generatedBy || 'template')
      toast.success('Varianta a fost regenerată')
    } catch (error) {
      toast.error('Regenerarea nu a reușit', {
        description: error instanceof Error ? error.message : 'Încearcă din nou.',
      })
    } finally {
      setRegenerating(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${selectedTitle ? `${selectedTitle}\n\n` : ''}${editedText}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1_800)
      toast.success('Titlul și descrierea au fost copiate')
    } catch {
      toast.error('Copierea nu este disponibilă în acest browser')
    }
  }

  function handleApply() {
    if (!editedText.trim()) return
    onApply({ title: selectedTitle || form.title, description: editedText.trim() })
    setOpen(false)
    toast.success('Conținut aplicat în anunț', {
      description: selectedTitle ? 'Titlul și descrierea au fost actualizate.' : 'Descrierea a fost actualizată.',
    })
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Generează cu AI
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[92vh] max-w-5xl flex-col overflow-hidden p-0 sm:max-w-5xl">
          <DialogHeader className="border-b bg-gradient-to-r from-primary/10 via-background to-emerald-500/5 px-5 py-5 pr-12 sm:px-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <WandSparkles className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <DialogTitle>Studio AI pentru anunț</DialogTitle>
                <DialogDescription>
                  Transformă datele proprietății în 3 descrieri distincte și 5 titluri SEO, fără să inventeze dotări.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            <section className="space-y-4 rounded-xl border bg-muted/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold">Setări de redactare</h3>
                  <p className="text-xs text-muted-foreground">Datele tehnice sunt preluate automat din formular.</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {form.type && <Badge variant="secondary">{form.type}</Badge>}
                  {form.zone && <Badge variant="secondary">{form.zone}</Badge>}
                  {form.areaSqm && <Badge variant="secondary">{form.areaSqm} m²</Badge>}
                  {form.price && <Badge variant="secondary">{Number(form.price).toLocaleString('ro-RO')} {form.currency}</Badge>}
                </div>
              </div>

              {missingFields.length > 0 && (
                <div className="rounded-lg border border-amber-300/70 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                  Pentru generare mai trebuie completate: {missingFields.join(', ')}.
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Ton</Label>
                  <Select value={tone} onValueChange={(value) => setTone(value as ListingTone)}>
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label} · {item.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Limbă</Label>
                  <div className="grid grid-cols-2 rounded-lg border bg-background p-1">
                    {(['ro', 'en'] as const).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setLanguage(item)}
                        className={cn(
                          'flex h-8 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-colors',
                          language === item ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted',
                        )}
                        aria-pressed={language === item}
                      >
                        <Languages className="h-3.5 w-3.5" /> {item.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Lungime</Label>
                  <Select value={length} onValueChange={(value) => setLength(value as ListingLength)}>
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LENGTHS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label} · {item.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Facilități confirmate</Label>
                <div className="flex flex-wrap gap-2">
                  {FEATURE_OPTIONS.map((feature) => {
                    const selected = features.includes(feature)
                    return (
                      <button
                        key={feature}
                        type="button"
                        onClick={() => toggleFeature(feature)}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs transition-colors',
                          selected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground',
                        )}
                        aria-pressed={selected}
                      >
                        {selected && <Check className="mr-1 inline h-3 w-3" />}
                        {feature}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-highlights">Alte puncte forte confirmate</Label>
                <Textarea
                  id="ai-highlights"
                  value={highlights}
                  onChange={(event) => setHighlights(event.target.value)}
                  maxLength={600}
                  rows={2}
                  placeholder="Ex.: orientare sud, vedere spre parc, renovat în 2024..."
                  className="resize-y bg-background"
                />
              </div>

              <Button type="button" onClick={handleGenerate} disabled={loading} className="w-full gap-2 sm:w-auto">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? 'Se redactează variantele…' : variants.length ? 'Generează variante noi' : 'Generează 3 descrieri + 5 titluri'}
              </Button>
            </section>

            <Separator />

            {loading ? (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
                <p className="font-medium">Redactăm conținutul anunțului</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">Verificăm datele și pregătim trei unghiuri diferite, plus titluri potrivite pentru căutare.</p>
              </div>
            ) : variants.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/10 px-6 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="h-6 w-6" />
                </div>
                <p className="font-medium">Nicio descriere generată încă</p>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">Alege setările, confirmă facilitățile și pornește generarea. Vei putea edita orice rezultat înainte să îl aplici.</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold">Descrieri generate</h3>
                    <p className="text-xs text-muted-foreground">Alege varianta potrivită și editeaz-o direct.</p>
                  </div>
                  <Badge variant="outline" className={cn(
                    generatedBy === 'ai' ? 'border-emerald-300 text-emerald-700 dark:text-emerald-300' : 'border-amber-300 text-amber-700 dark:text-amber-300',
                  )}>
                    {generatedBy === 'ai' ? 'Generat cu AI' : 'Variantă asistată local'}
                  </Badge>
                </div>

                <Tabs
                  value={activeVariantId}
                  onValueChange={(id) => {
                    setActiveVariantId(id)
                    const variant = variants.find((item) => item.id === id)
                    if (variant) setEditedText(variant.text)
                  }}
                >
                  <TabsList className="grid h-auto w-full grid-cols-1 gap-1 sm:grid-cols-3">
                    {variants.map((variant) => (
                      <TabsTrigger key={variant.id} value={variant.id} className="min-h-9 whitespace-normal px-3 py-2 text-xs">
                        {variant.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {variants.map((variant) => (
                    <TabsContent key={variant.id} value={variant.id} className="mt-3 space-y-3">
                      <Textarea
                        value={editedText}
                        onChange={(event) => setEditedText(event.target.value)}
                        rows={9}
                        className="resize-y text-sm leading-relaxed"
                        aria-label={`Descriere: ${variant.label}`}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="secondary">{wordCount} cuvinte</Badge>
                          <Badge variant="secondary">{editedText.length} caractere</Badge>
                          <Badge variant="outline">{TONES.find((item) => item.value === tone)?.label}</Badge>
                          <Badge variant="outline">{language.toUpperCase()}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditedText(activeVariant?.text || '')}
                            className="gap-1.5"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Resetează
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRegenerate}
                            disabled={regenerating}
                            className="gap-1.5"
                          >
                            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                            Regenerează
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                {titles.length > 0 && (
                  <section className="space-y-3 rounded-xl border p-4">
                    <div>
                      <h3 className="text-sm font-semibold">Titluri SEO</h3>
                      <p className="text-xs text-muted-foreground">Selectează titlul care va fi aplicat împreună cu descrierea.</p>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {titles.map((title, index) => {
                        const selected = selectedTitleIndex === index
                        return (
                          <button
                            key={`${title}-${index}`}
                            type="button"
                            onClick={() => setSelectedTitleIndex(index)}
                            className={cn(
                              'flex min-h-12 items-start gap-2 rounded-lg border p-3 text-left text-sm transition-colors',
                              selected ? 'border-primary bg-primary/5' : 'hover:border-primary/40 hover:bg-muted/40',
                            )}
                            aria-pressed={selected}
                          >
                            <CheckCircle2 className={cn('mt-0.5 h-4 w-4 shrink-0', selected ? 'text-primary' : 'text-muted-foreground/40')} />
                            <span className="flex-1 leading-snug">{title}</span>
                            <span className={cn('text-[10px] tabular-nums', title.length > 70 ? 'text-destructive' : 'text-muted-foreground')}>
                              {title.length}/70
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="border-t bg-background px-5 py-4 sm:px-6">
            <Button type="button" variant="outline" onClick={handleCopy} disabled={!editedText} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
              {copied ? 'Copiat' : 'Copiază pachetul'}
            </Button>
            <Button type="button" onClick={handleApply} disabled={!editedText} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Aplică titlul și descrierea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
