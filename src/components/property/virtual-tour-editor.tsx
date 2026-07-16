'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  CircleOff,
  ExternalLink,
  Link2,
  Loader2,
  LocateFixed,
  Plus,
  Rotate3D,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { VirtualTourViewer, type VirtualTourViewerHandle } from './virtual-tour-viewer'
import {
  parseExternalTourUrl,
  virtualTourProviderLabel,
  type VirtualTour,
  type VirtualTourDraft,
  type VirtualTourMode,
  type VirtualTourScene,
} from '@/lib/virtual-tours'

interface VirtualTourEditorProps {
  value: VirtualTourDraft
  onChange: (value: VirtualTourDraft) => void
}
const MAX_SCENES = 8
const MAX_INPUT_SIZE = 20 * 1024 * 1024
const MAX_OUTPUT_SIZE = 10 * 1024 * 1024
const MAX_PANORAMA_WIDTH = 4096

function createUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function panoramaTitle(fileName: string, index: number): string {
  const cleaned = fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned || `Camera ${index + 1}`
}

function readPanorama(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error(`${file.name}: formatul nu este o imagine.`))
      return
    }
    if (file.size > MAX_INPUT_SIZE) {
      reject(new Error(`${file.name}: fișierul depășește 20 MB.`))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error(`${file.name}: imaginea nu poate fi citită.`))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error(`${file.name}: imagine invalidă.`))
      image.onload = () => {
        const ratio = image.width / Math.max(image.height, 1)
        if (ratio < 1.8 || ratio > 2.2) {
          reject(new Error(`${file.name}: panorama trebuie să aibă raport aproximativ 2:1.`))
          return
        }
        if (image.width < 1600) {
          reject(new Error(`${file.name}: rezoluția minimă recomandată este 1600 × 800 px.`))
          return
        }

        const targetWidth = Math.min(image.width, MAX_PANORAMA_WIDTH)
        const targetHeight = Math.round(targetWidth / ratio)
        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight
        const context = canvas.getContext('2d')
        if (!context) {
          reject(new Error('Browserul nu poate procesa panorama.'))
          return
        }
        context.drawImage(image, 0, 0, targetWidth, targetHeight)
        const output = canvas.toDataURL('image/jpeg', 0.86)
        const estimatedBytes = Math.ceil((output.length - output.indexOf(',') - 1) * 0.75)
        if (estimatedBytes > MAX_OUTPUT_SIZE) {
          reject(new Error(`${file.name}: panorama optimizată depășește 10 MB.`))
          return
        }
        resolve(output)
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

const MODE_OPTIONS: Array<{
  mode: VirtualTourMode
  title: string
  description: string
  icon: React.ElementType
}> = [
  { mode: 'NONE', title: 'Fără tur', description: 'Poți adăuga turul și ulterior.', icon: CircleOff },
  { mode: 'EXTERNAL', title: 'Matterport / Kuula', description: 'Import securizat dintr-un link existent.', icon: Link2 },
  { mode: 'NATIVE', title: 'Tur 360° HQS', description: 'Încarcă panorame și leagă camerele.', icon: Rotate3D },
]

export function VirtualTourEditor({ value, onChange }: VirtualTourEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const viewerRef = useRef<VirtualTourViewerHandle>(null)
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(value.entrySceneId || value.scenes[0]?.id || null)
  const [targetSceneId, setTargetSceneId] = useState('')
  const [processing, setProcessing] = useState(false)
  const parsedExternal = useMemo(() => parseExternalTourUrl(value.externalUrl), [value.externalUrl])
  const orderedScenes = useMemo(() => [...value.scenes].sort((a, b) => a.sortOrder - b.sortOrder), [value.scenes])
  const selectedScene = orderedScenes.find((scene) => scene.id === selectedSceneId) || orderedScenes[0]

  useEffect(() => {
    if (!selectedSceneId && orderedScenes[0]) setSelectedSceneId(orderedScenes[0].id)
    if (selectedSceneId && !orderedScenes.some((scene) => scene.id === selectedSceneId)) {
      setSelectedSceneId(orderedScenes[0]?.id || null)
    }
  }, [orderedScenes, selectedSceneId])

  useEffect(() => {
    const firstTarget = orderedScenes.find((scene) => scene.id !== selectedScene?.id)
    if (!targetSceneId || targetSceneId === selectedScene?.id || !orderedScenes.some((scene) => scene.id === targetSceneId)) {
      setTargetSceneId(firstTarget?.id || '')
    }
  }, [orderedScenes, selectedScene?.id, targetSceneId])

  const updateScenes = (scenes: VirtualTourScene[], entrySceneId = value.entrySceneId) => {
    onChange({
      ...value,
      scenes: scenes.map((scene, index) => ({ ...scene, sortOrder: index })),
      entrySceneId: entrySceneId && scenes.some((scene) => scene.id === entrySceneId)
        ? entrySceneId
        : scenes[0]?.id || null,
    })
  }

  const updateScene = (sceneId: string, patch: Partial<VirtualTourScene>) => {
    updateScenes(orderedScenes.map((scene) => scene.id === sceneId ? { ...scene, ...patch } : scene))
  }

  const setMode = (mode: VirtualTourMode) => {
    onChange({
      ...value,
      mode,
      provider: mode === 'EXTERNAL' ? parsedExternal?.provider || value.provider : null,
    })
  }

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return
    const available = MAX_SCENES - orderedScenes.length
    if (available <= 0) {
      toast.error(`Poți adăuga maximum ${MAX_SCENES} camere.`)
      return
    }

    setProcessing(true)
    const nextScenes = [...orderedScenes]
    const errors: string[] = []
    for (const file of Array.from(files).slice(0, available)) {
      try {
        const imageUrl = await readPanorama(file)
        nextScenes.push({
          id: createUuid(),
          title: panoramaTitle(file.name, nextScenes.length),
          imageUrl,
          sortOrder: nextScenes.length,
          initialYaw: 0,
          initialPitch: 0,
          initialFov: 100,
          hotspots: [],
        })
      } catch (cause) {
        errors.push(cause instanceof Error ? cause.message : `${file.name}: eroare la procesare.`)
      }
    }
    setProcessing(false)
    updateScenes(nextScenes, value.entrySceneId || nextScenes[0]?.id || null)
    if (nextScenes.length > orderedScenes.length) {
      setSelectedSceneId(nextScenes[orderedScenes.length].id)
      toast.success(`${nextScenes.length - orderedScenes.length} panorame adăugate.`)
    }
    if (errors.length) toast.error('Unele panorame nu au fost adăugate', { description: errors.join(' ') })
  }

  const moveScene = (sceneId: string, direction: -1 | 1) => {
    const index = orderedScenes.findIndex((scene) => scene.id === sceneId)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= orderedScenes.length) return
    const next = [...orderedScenes]
    ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
    updateScenes(next)
  }

  const removeScene = (sceneId: string) => {
    const next = orderedScenes
      .filter((scene) => scene.id !== sceneId)
      .map((scene) => ({
        ...scene,
        hotspots: scene.hotspots.filter((hotspot) => hotspot.targetSceneId !== sceneId),
      }))
    updateScenes(next)
  }

  const saveInitialView = () => {
    if (!selectedScene) return
    const view = viewerRef.current?.getView()
    if (!view) return
    updateScene(selectedScene.id, {
      initialYaw: Math.round(view.yaw * 10) / 10,
      initialPitch: Math.round(view.pitch * 10) / 10,
      initialFov: Math.round(view.fov * 10) / 10,
    })
    toast.success('Unghiul de pornire a fost salvat.')
  }

  const addConnection = () => {
    if (!selectedScene || !targetSceneId) return
    const target = orderedScenes.find((scene) => scene.id === targetSceneId)
    const view = viewerRef.current?.getView()
    if (!target || !view) return
    updateScene(selectedScene.id, {
      hotspots: [
        ...selectedScene.hotspots,
        {
          id: createUuid(),
          label: `Spre ${target.title}`,
          yaw: Math.round(view.yaw * 10) / 10,
          pitch: Math.round(view.pitch * 10) / 10,
          targetSceneId: target.id,
        },
      ],
    })
    toast.success(`Legătură adăugată spre ${target.title}.`)
  }

  const previewTour: VirtualTour | null = value.mode === 'NATIVE'
    ? {
        provider: 'NATIVE',
        title: 'Previzualizare tur 360°',
        entrySceneId: value.entrySceneId,
        scenes: orderedScenes,
      }
    : parsedExternal
      ? {
          provider: parsedExternal.provider,
          title: 'Previzualizare tur virtual',
          externalUrl: parsedExternal.embedUrl,
          scenes: [],
        }
      : null

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {MODE_OPTIONS.map((option) => {
          const Icon = option.icon
          const selected = value.mode === option.mode
          return (
            <button
              key={option.mode}
              type="button"
              onClick={() => setMode(option.mode)}
              className={`rounded-xl border p-4 text-left transition-all ${selected ? 'border-primary bg-primary/5 ring-2 ring-primary/10' : 'hover:border-primary/40 hover:bg-muted/40'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <Icon className="h-4 w-4" />
                </span>
                {selected ? <CheckCircle2 className="h-4 w-4 text-primary" /> : null}
              </div>
              <p className="mt-3 text-sm font-semibold">{option.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{option.description}</p>
            </button>
          )
        })}
      </div>

      {value.mode === 'EXTERNAL' ? (
        <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
          <div className="space-y-2">
            <Label htmlFor="virtual-tour-url">Link public Matterport sau Kuula</Label>
            <div className="relative">
              <ExternalLink className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="virtual-tour-url"
                type="url"
                placeholder="https://my.matterport.com/show/?m=..."
                value={value.externalUrl}
                onChange={(event) => {
                  const externalUrl = event.target.value
                  const parsed = parseExternalTourUrl(externalUrl)
                  onChange({ ...value, externalUrl, provider: parsed?.provider || null })
                }}
                onBlur={() => {
                  if (parsedExternal) onChange({ ...value, externalUrl: parsedExternal.embedUrl, provider: parsedExternal.provider })
                }}
                className="h-11 pl-10"
              />
            </div>
            {value.externalUrl ? (
              parsedExternal ? (
                <p className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Link {virtualTourProviderLabel(parsedExternal.provider)} valid.
                </p>
              ) : (
                <p className="text-xs text-destructive">Acceptăm doar linkuri HTTPS publice de pe my.matterport.com sau kuula.co/share.</p>
              )
            ) : null}
          </div>
          {previewTour ? (
            <div className="overflow-hidden rounded-xl border bg-slate-950">
              <VirtualTourViewer tour={previewTour} className="h-[420px]" title="Previzualizare tur extern" />
            </div>
          ) : null}
        </div>
      ) : null}

      {value.mode === 'NATIVE' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/20 p-4">
            <div>
              <p className="text-sm font-semibold">Panorame equirectangulare 2:1</p>
              <p className="mt-1 text-xs text-muted-foreground">JPG, PNG sau WebP · max. 20 MB la import · maximum {MAX_SCENES} camere.</p>
            </div>
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={processing || orderedScenes.length >= MAX_SCENES}>
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Adaugă panorame
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(event) => {
                void addFiles(event.target.files)
                event.target.value = ''
              }}
            />
          </div>

          {orderedScenes.length > 0 && previewTour ? (
            <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
              <div className="space-y-2">
                {orderedScenes.map((scene, index) => (
                  <button
                    key={scene.id}
                    type="button"
                    onClick={() => setSelectedSceneId(scene.id)}
                    className={`group flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-colors ${scene.id === selectedScene?.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                  >
                    <img src={scene.imageUrl} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold">{scene.title}</span>
                      <span className="mt-0.5 block text-[10px] text-muted-foreground">Camera {index + 1} · {scene.hotspots.length} legături</span>
                    </span>
                    {value.entrySceneId === scene.id ? <Badge className="px-1.5 text-[9px]">Start</Badge> : null}
                  </button>
                ))}
              </div>

              <div className="min-w-0 space-y-3">
                <div className="overflow-hidden rounded-xl border bg-slate-950">
                  <VirtualTourViewer
                    ref={viewerRef}
                    tour={previewTour}
                    activeSceneId={selectedScene?.id}
                    className="h-[460px]"
                    title="Editor tur 360°"
                    editing
                  />
                </div>

                {selectedScene ? (
                  <div className="space-y-3 rounded-xl border p-4">
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="min-w-[180px] flex-1 space-y-1.5">
                        <Label htmlFor={`scene-title-${selectedScene.id}`}>Numele camerei</Label>
                        <Input
                          id={`scene-title-${selectedScene.id}`}
                          value={selectedScene.title}
                          maxLength={100}
                          onChange={(event) => updateScene(selectedScene.id, { title: event.target.value })}
                        />
                      </div>
                      <Button type="button" variant="outline" size="icon" onClick={() => moveScene(selectedScene.id, -1)} disabled={selectedScene.sortOrder === 0} aria-label="Mută camera mai sus">
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="outline" size="icon" onClick={() => moveScene(selectedScene.id, 1)} disabled={selectedScene.sortOrder === orderedScenes.length - 1} aria-label="Mută camera mai jos">
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="outline" onClick={() => onChange({ ...value, entrySceneId: selectedScene.id })}>
                        <Sparkles className="mr-2 h-4 w-4" /> Setează start
                      </Button>
                      <Button type="button" variant="destructive" size="icon" onClick={() => removeScene(selectedScene.id)} aria-label="Șterge camera">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                      <Select value={targetSceneId} onValueChange={setTargetSceneId} disabled={orderedScenes.length < 2}>
                        <SelectTrigger>
                          <SelectValue placeholder="Alege camera destinație" />
                        </SelectTrigger>
                        <SelectContent>
                          {orderedScenes.filter((scene) => scene.id !== selectedScene.id).map((scene) => (
                            <SelectItem key={scene.id} value={scene.id}>{scene.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" onClick={saveInitialView}>
                        <LocateFixed className="mr-2 h-4 w-4" /> Salvează unghiul
                      </Button>
                      <Button type="button" onClick={addConnection} disabled={!targetSceneId}>
                        <Plus className="mr-2 h-4 w-4" /> Legătură aici
                      </Button>
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Orientează panorama spre ușa sau direcția dorită, alege camera destinație și apasă „Legătură aici”.
                    </p>

                    {selectedScene.hotspots.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedScene.hotspots.map((hotspot) => (
                          <Badge key={hotspot.id} variant="secondary" className="gap-1.5 py-1">
                            {hotspot.label}
                            <button
                              type="button"
                              onClick={() => updateScene(selectedScene.id, { hotspots: selectedScene.hotspots.filter((item) => item.id !== hotspot.id) })}
                              className="rounded-sm hover:text-destructive"
                              aria-label={`Șterge ${hotspot.label}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-48 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
            >
              <Rotate3D className="h-9 w-9 text-primary" />
              <p className="mt-3 text-sm font-semibold">Încarcă prima panoramă 360°</p>
              <p className="mt-1 max-w-md text-xs text-muted-foreground">Folosește exportul equirectangular al camerei 360°, cu raport aproximativ 2:1.</p>
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}
