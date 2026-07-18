'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { AlertTriangle, DoorOpen, Loader2, Rotate3D } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VirtualTour } from '@/lib/virtual-tours'

interface PannellumViewerApi {
  destroy: () => void
  getYaw: () => number
  getPitch: () => number
  getHfov: () => number
  getScene: () => string
  loadScene: (sceneId: string, pitch?: number, yaw?: number, hfov?: number) => PannellumViewerApi
  on: {
    (eventName: 'load', callback: () => void): PannellumViewerApi
    (eventName: 'scenechange', callback: (sceneId: string) => void): PannellumViewerApi
    (eventName: 'error', callback: (message?: string) => void): PannellumViewerApi
  }
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
  onSceneChange?: (sceneId: string) => void
  showSceneSelector?: boolean
}

export const VirtualTourViewer = forwardRef<VirtualTourViewerHandle, VirtualTourViewerProps>(
  function VirtualTourViewer({
    tour,
    className,
    activeSceneId,
    title = 'Tur virtual',
    editing = false,
    onSceneChange,
    showSceneSelector,
  }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const viewerRef = useRef<PannellumViewerApi | null>(null)
    const activeSceneIdRef = useRef(activeSceneId)
    const onSceneChangeRef = useRef(onSceneChange)
    const loadingRef = useRef(tour.provider === 'NATIVE')
    const pendingSceneIdRef = useRef<string | null>(null)
    const [loading, setLoading] = useState(tour.provider === 'NATIVE')
    const [error, setError] = useState<string | null>(null)
    const [currentSceneId, setCurrentSceneId] = useState<string | null>(
      activeSceneId || tour.entrySceneId || tour.scenes[0]?.id || null,
    )

    const orderedScenes = useMemo(
      () => [...tour.scenes].sort((a, b) => a.sortOrder - b.sortOrder),
      [tour.scenes],
    )
    const validSceneIds = useMemo(
      () => new Set(orderedScenes.map((scene) => scene.id)),
      [orderedScenes],
    )
    const shouldShowSceneSelector = (
      showSceneSelector ?? activeSceneId === undefined
    ) && orderedScenes.length > 1

    useEffect(() => {
      activeSceneIdRef.current = activeSceneId
    }, [activeSceneId])

    useEffect(() => {
      onSceneChangeRef.current = onSceneChange
    }, [onSceneChange])

    const requestScene = useCallback((sceneId: string) => {
      if (!validSceneIds.has(sceneId)) return
      const viewer = viewerRef.current
      if (!viewer) {
        pendingSceneIdRef.current = sceneId
        return
      }
      if (viewer.getScene() === sceneId) return
      if (loadingRef.current) {
        pendingSceneIdRef.current = sceneId
        return
      }
      pendingSceneIdRef.current = null
      loadingRef.current = true
      setLoading(true)
      setError(null)
      viewer.loadScene(sceneId)
    }, [validSceneIds])

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
      loadScene: requestScene,
    }), [requestScene])

    useEffect(() => {
      if (tour.provider !== 'NATIVE' || !containerRef.current || orderedScenes.length === 0) return

      let cancelled = false

      const initialize = async () => {
        try {
          loadingRef.current = true
          pendingSceneIdRef.current = null
          setLoading(true)
          setError(null)
          const pannellum = await loadPannellumRuntime()
          if (cancelled || !containerRef.current) return

          const requestedSceneId = activeSceneIdRef.current
          const firstSceneId = requestedSceneId && validSceneIds.has(requestedSceneId)
            ? requestedSceneId
            : tour.entrySceneId && validSceneIds.has(tour.entrySceneId)
              ? tour.entrySceneId
              : orderedScenes[0].id
          setCurrentSceneId(firstSceneId)

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
              hotSpots: scene.hotspots
                .filter((hotspot) => validSceneIds.has(hotspot.targetSceneId))
                .map((hotspot) => ({
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
            escapeHTML: true,
            default: {
              firstScene: firstSceneId,
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
            if (!cancelled) {
              const pendingSceneId = pendingSceneIdRef.current
              pendingSceneIdRef.current = null
              if (pendingSceneId && pendingSceneId !== viewer.getScene()) {
                loadingRef.current = true
                setLoading(true)
                setError(null)
                viewer.loadScene(pendingSceneId)
                return
              }
              loadingRef.current = false
              setLoading(false)
            }
          })
          viewer.on('scenechange', (sceneId) => {
            if (!cancelled) {
              loadingRef.current = true
              setLoading(true)
              setError(null)
              setCurrentSceneId(sceneId)
              onSceneChangeRef.current?.(sceneId)
            }
          })
          viewer.on('error', (message) => {
            if (!cancelled) {
              loadingRef.current = false
              pendingSceneIdRef.current = null
              setLoading(false)
              setError(message || 'Panorama acestei camere nu a putut fi încărcată.')
            }
          })
        } catch (cause) {
          if (!cancelled) {
            loadingRef.current = false
            setLoading(false)
            setError(cause instanceof Error ? cause.message : 'Turul 360° nu poate fi afișat.')
          }
        }
      }

      void initialize()
      return () => {
        cancelled = true
        loadingRef.current = false
        pendingSceneIdRef.current = null
        viewerRef.current?.destroy()
        viewerRef.current = null
      }
    }, [editing, orderedScenes, tour.entrySceneId, tour.provider, validSceneIds])

    useEffect(() => {
      if (!activeSceneId || !validSceneIds.has(activeSceneId)) return
      const viewer = viewerRef.current
      if (!viewer) {
        pendingSceneIdRef.current = activeSceneId
        return
      }
      if (viewer.getScene() === activeSceneId) return
      if (loadingRef.current) {
        pendingSceneIdRef.current = activeSceneId
        return
      }
      pendingSceneIdRef.current = null
      loadingRef.current = true
      viewer.loadScene(activeSceneId)
    }, [activeSceneId, validSceneIds])

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
        {shouldShowSceneSelector && !error ? (
          <nav
            aria-label="Camerele turului virtual"
            className="pointer-events-none absolute inset-x-0 bottom-3 z-20 px-3"
          >
            <div className="pointer-events-auto mx-auto w-fit max-w-full rounded-2xl border border-white/20 bg-slate-950/85 p-2 shadow-2xl backdrop-blur-md">
              <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-medium text-white/75">
                <DoorOpen className="h-3.5 w-3.5" />
                <span>Intră prin uși sau alege camera</span>
              </div>
              <div className="flex max-w-[calc(100vw-3rem)] gap-1 overflow-x-auto pb-0.5">
                {orderedScenes.map((scene) => {
                  const isActive = scene.id === currentSceneId
                  return (
                    <button
                      key={scene.id}
                      type="button"
                      disabled={loading}
                      aria-pressed={isActive}
                      aria-label={`Mergi în ${scene.title}`}
                      className={cn(
                        'shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-wait disabled:opacity-60',
                        isActive
                          ? 'bg-white text-slate-950'
                          : 'bg-white/10 text-white hover:bg-white/20',
                      )}
                      onClick={() => requestScene(scene.id)}
                    >
                      {scene.title}
                    </button>
                  )
                })}
              </div>
            </div>
            <span className="sr-only" aria-live="polite">
              Camera curentă: {orderedScenes.find((scene) => scene.id === currentSceneId)?.title || 'necunoscută'}
            </span>
          </nav>
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
