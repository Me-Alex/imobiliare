'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, ExternalLink, Loader2, RefreshCw, Rotate3D, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { VirtualTourViewer } from '@/components/property/virtual-tour-viewer'
import { toast } from 'sonner'
import { virtualTourProviderLabel, type VirtualTour, type VirtualTourStatus } from '@/lib/virtual-tours'

interface ReviewScene {
  id: string
  title: string
  preview_url: string | null
  sort_order: number
  initial_yaw: number
  initial_pitch: number
  initial_fov: number
}
interface ReviewTour {
  id: string
  provider: VirtualTour['provider']
  external_url: string | null
  status: VirtualTourStatus
  title: string
  entry_scene_id: string | null
  submitted_at: string | null
  reviewed_at: string | null
  review_note: string | null
  created_at: string
  properties: { id: string; title: string; slug: string } | Array<{ id: string; title: string; slug: string }>
  virtual_tour_scenes: ReviewScene[]
}

function propertyOf(tour: ReviewTour) {
  return Array.isArray(tour.properties) ? tour.properties[0] : tour.properties
}

function statusBadge(status: VirtualTourStatus) {
  const labels: Record<VirtualTourStatus, string> = {
    DRAFT: 'Ciornă',
    IN_REVIEW: 'De verificat',
    PUBLISHED: 'Publicat',
    REJECTED: 'Necesită corecturi',
    ARCHIVED: 'Arhivat',
  }
  const styles: Record<VirtualTourStatus, string> = {
    DRAFT: 'bg-muted text-muted-foreground',
    IN_REVIEW: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
    PUBLISHED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    REJECTED: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
    ARCHIVED: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
  }
  return <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${styles[status]}`}>{labels[status]}</span>
}

function ReviewCard({
  tour,
  busy,
  onAction,
}: {
  tour: ReviewTour
  busy: boolean
  onAction: (tour: ReviewTour, action: 'APPROVE' | 'REJECT', note: string) => void
}) {
  const [note, setNote] = useState(tour.review_note || '')
  const [activeSceneId, setActiveSceneId] = useState(tour.entry_scene_id || tour.virtual_tour_scenes[0]?.id || null)
  const property = propertyOf(tour)
  const previewTour = useMemo<VirtualTour | null>(() => {
    if (tour.provider !== 'NATIVE') {
      return tour.external_url ? {
        provider: tour.provider,
        title: tour.title,
        externalUrl: tour.external_url,
        entrySceneId: null,
        scenes: [],
      } : null
    }
    const scenes = tour.virtual_tour_scenes
      .filter((scene) => Boolean(scene.preview_url))
      .map((scene) => ({
        id: scene.id,
        title: scene.title,
        imageUrl: scene.preview_url!,
        sortOrder: scene.sort_order,
        initialYaw: scene.initial_yaw,
        initialPitch: scene.initial_pitch,
        initialFov: scene.initial_fov,
        hotspots: [],
      }))
    return scenes.length ? {
      provider: 'NATIVE',
      title: tour.title,
      entrySceneId: tour.entry_scene_id,
      scenes,
    } : null
  }, [tour])

  return (
    <article className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{property?.title || tour.title}</h3>
            {statusBadge(tour.status)}
            <Badge variant="outline">{virtualTourProviderLabel(tour.provider)}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Trimis {new Date(tour.submitted_at || tour.created_at).toLocaleString('ro-RO')}
            {tour.provider === 'NATIVE' ? ` · ${tour.virtual_tour_scenes.length} camere` : ''}
          </p>
        </div>
        {property?.slug ? (
          <a href={`/proprietati/${property.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            Anunț <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </div>

      {previewTour ? (
        <div className="bg-slate-950">
          <VirtualTourViewer tour={previewTour} activeSceneId={activeSceneId} className="h-[420px]" title={`Verificare ${tour.title}`} />
          {tour.provider === 'NATIVE' && tour.virtual_tour_scenes.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto border-t border-white/10 p-3">
              {tour.virtual_tour_scenes.map((scene) => (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => setActiveSceneId(scene.id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition-colors ${activeSceneId === scene.id ? 'bg-white text-slate-950' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  {scene.title}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center bg-muted/40 text-sm text-muted-foreground">Previzualizarea nu este disponibilă.</div>
      )}

      <div className="space-y-3 p-4">
        <Input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={1000}
          placeholder="Notă pentru autor (opțional la aprobare)"
          disabled={busy}
        />
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" className="gap-2 text-destructive hover:text-destructive" onClick={() => onAction(tour, 'REJECT', note)} disabled={busy || tour.status === 'PUBLISHED'}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Cere corecturi
          </Button>
          <Button type="button" className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => onAction(tour, 'APPROVE', note)} disabled={busy || tour.status === 'PUBLISHED'}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Aprobă și publică
          </Button>
        </div>
      </div>
    </article>
  )
}

export function VirtualTourReviewPanel({ accessToken }: { accessToken: string }) {
  const [tours, setTours] = useState<ReviewTour[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const loadTours = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/virtual-tours', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Tururile nu au putut fi încărcate.')
      setTours(payload.tours || [])
    } catch (error) {
      toast.error('Eroare la încărcarea tururilor', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    void loadTours()
  }, [loadTours])

  const handleAction = async (tour: ReviewTour, action: 'APPROVE' | 'REJECT', note: string) => {
    setBusyId(tour.id)
    try {
      const response = await fetch('/api/admin/virtual-tours', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: tour.id, action, note }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Acțiunea nu a putut fi finalizată.')
      toast.success(action === 'APPROVE' ? 'Turul a fost publicat.' : 'Turul a fost trimis pentru corecturi.')
      await loadTours()
    } catch (error) {
      toast.error('Eroare la actualizarea turului', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setBusyId(null)
    }
  }

  const orderedTours = useMemo(() => [...tours].sort((a, b) => {
    if (a.status === 'IN_REVIEW' && b.status !== 'IN_REVIEW') return -1
    if (b.status === 'IN_REVIEW' && a.status !== 'IN_REVIEW') return 1
    return new Date(b.submitted_at || b.created_at).getTime() - new Date(a.submitted_at || a.created_at).getTime()
  }), [tours])

  if (loading) {
    return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Rotate3D className="h-5 w-5 text-primary" /> Verificare tururi virtuale</h2>
          <p className="mt-1 text-xs text-muted-foreground">Panoramele private sunt publicate doar după aprobarea administratorului.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void loadTours()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Reîncarcă
        </Button>
      </div>
      {orderedTours.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed text-center">
          <Rotate3D className="h-9 w-9 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold">Nu există tururi trimise</p>
          <p className="mt-1 text-xs text-muted-foreground">Tururile noi vor apărea aici pentru verificare.</p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {orderedTours.map((tour) => (
            <ReviewCard key={tour.id} tour={tour} busy={busyId === tour.id} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  )
}
