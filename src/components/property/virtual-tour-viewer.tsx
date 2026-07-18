'use client'

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { AlertTriangle, Loader2, Rotate3D } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VirtualTour } from '@/lib/virtual-tours'

interface PannellumViewerApi {
  destroy: () => void
  getYaw: () => number
  getPitch: () => number
  getHfov: () => number
  loadScene: (sceneId: string) => void
  on: (eventName: string, callback: () => void) => void
}

interface PannellumWindow extends Window {
  pannellum?: {
    viewer: (element: HTMLElement, config: Record<string, unknown>) => PannellumViewerApi
  }
}

type PannellumRuntime = NonNullable<PannellumWindow['pannellum']>

let pannellumLoadPromise: Promise<PannellumRuntime> | null = null

function loadPannellumRuntime(): Promise<PannellumRuntime> {
  const current = (window as PannellumWindow).pannellum
  if (current) return Promise.resolve(current)
  if (pannellumLoadPromise) return pannellumLoadPromise

  pannellumLoadPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-hqs-pannellum]')) {
      const stylesheet = document.createElement('link')
      stylesheet.rel = 'stylesheet'
      stylesheet.href = 'https://cdn.pannellum.org/2.5/pannellum.css'
      stylesheet.dataset.hqsPannellum = 'true'
      document.head.appendChild(stylesheet)
    }

    const finish = () => {
      const runtime = (window as PannellumWindow).pannellum
      if (runtime) resolve(runtime)
      else reject(new Error('Motorul 360° nu a putut fi inițializat.'))
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-hqs-pannellum]')
    if (existing) {
      existing.addEventListener('load', finish, { once: true })
      existing.addEventListener('error', () => reject(new Error('Motorul 360° nu a putut fi descărcat.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.pannellum.org/2.5/pannellum.js'
    script.async = true
    script.dataset.hqsPannellum = 'true'
    script.addEventListener('load', finish, { once: true })
    script.addEventListener('error', () => reject(new Error('Motorul 360° nu a putut fi descărcat.')), { once: true })
    document.head.appendChild(script)
  })

  return pannellumLoadPromise
}

export interface VirtualTourViewerHandle {
  getView: () => { yaw: number; pitch: number; fov: number } | null
  loadScene: (sceneId: string) => void
}

interface VirtualTourViewerProps {
  tour: VirtualTour
  className?: string
  activeSceneId?: string | null
  title?: string
  editing?: boolean
}

export const VirtualTourViewer = forwardRef<VirtualTourViewerHandle, VirtualTourViewerProps>(
  function VirtualTourViewer({ tour, className, activeSceneId, title = 'Tur virtual', editing = false }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const viewerRef = useRef<PannellumViewerApi | null>(null)
    const [loading, setLoading] = useState(tour.provider === 'NATIVE')
    const [error, setError] = useState<string | null>(null)

    const orderedScenes = useMemo(
      () => [...tour.scenes].sort((a, b) => a.sortOrder - b.sortOrder),
      [tour.scenes],
    )

    useImperativeHandle(ref, () => ({
      getView: () => {
        const viewer = viewerRef.current
        if (!viewer) return null
        return {
          yaw: viewer.getYaw(),
          pitch: viewer.getPitch(),
          fov: viewer.getHfov(),
        }
      },
      loadScene: (sceneId: string) => viewerRef.current?.loadScene(sceneId),
    }), [])

    useEffect(() => {
      if (tour.provider !== 'NATIVE' || !containerRef.current || orderedScenes.length === 0) return

      let cancelled = false

      const initialize = async () => {
        try {
          setLoading(true)
          setError(null)
          const pannellum = await loadPannellumRuntime()
          if (cancelled || !containerRef.current) return

          const scenes = Object.fromEntries(orderedScenes.map((scene) => [
            scene.id,
            {
              type: 'equirectangular',
              panorama: scene.imageUrl,
              title: scene.title,
              yaw: scene.initialYaw,
              pitch: scene.initialPitch,
              hfov: scene.initialFov,
              crossOrigin: 'anonymous',
              hotSpots: scene.hotspots.map((hotspot) => ({
                id: hotspot.id,
                type: 'scene',
                pitch: hotspot.pitch,
                yaw: hotspot.yaw,
                text: hotspot.label,
                sceneId: hotspot.targetSceneId,
              })),
            },
          ]))

          viewerRef.current?.destroy()
          const viewer = pannellum.viewer(containerRef.current, {
            default: {
              firstScene: activeSceneId || tour.entrySceneId || orderedScenes[0].id,
              autoLoad: true,
              sceneFadeDuration: 700,
              showControls: true,
              compass: false,
              hotSpotDebug: editing,
            },
            scenes,
          })
          viewerRef.current = viewer
          viewer.on('load', () => {
            if (!cancelled) setLoading(false)
          })
        } catch (cause) {
          if (!cancelled) {
            setLoading(false)
            setError(cause instanceof Error ? cause.message : 'Turul 360° nu poate fi afișat.')
          }
        }
      }

      void initialize()
      return () => {
        cancelled = true
        viewerRef.current?.destroy()
        viewerRef.current = null
      }
    }, [activeSceneId, editing, orderedScenes, tour.entrySceneId, tour.provider])

    if (tour.provider !== 'NATIVE') {
      if (!tour.externalUrl) return null
      return (
        <iframe
          title={title}
          src={tour.externalUrl}
          className={cn('min-h-[360px] w-full border-0 bg-slate-950', className)}
          allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
        />
      )
    }

    if (orderedScenes.length === 0) {
      return (
        <div className={cn('flex min-h-[320px] items-center justify-center bg-muted/40 text-center', className)}>
          <div className="px-6">
            <Rotate3D className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">Adaugă cel puțin o panoramă 360°</p>
          </div>
        </div>
      )
    }

    return (
      <div className={cn('relative min-h-[360px] overflow-hidden bg-slate-950', className)}>
        <div ref={containerRef} className="absolute inset-0" aria-label={title} />
        {tour.isDemo ? (
          <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-full border border-amber-300/40 bg-slate-950/85 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-200 shadow-lg backdrop-blur">
            Demo · imagine sintetică
          </div>
        ) : null}
        {loading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 text-white">
            <div className="text-center">
              <Loader2 className="mx-auto h-7 w-7 animate-spin" />
              <p className="mt-2 text-xs">Se încarcă turul 360°…</p>
            </div>
          </div>
        ) : null}
        {error ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950 p-6 text-center text-white">
            <div>
              <AlertTriangle className="mx-auto h-8 w-8 text-amber-400" />
              <p className="mt-3 text-sm font-medium">{error}</p>
              <p className="mt-1 text-xs text-white/60">Verifică imaginea panoramică și încearcă din nou.</p>
            </div>
          </div>
        ) : null}
      </div>
    )
  },
)
