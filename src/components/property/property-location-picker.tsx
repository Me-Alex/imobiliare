'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet'
import {
  CheckCircle2, CircleAlert, ExternalLink, Loader2, LocateFixed, MapPin, Search,
  ShieldCheck, Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface GeocodeResult {
  lat: number
  lng: number
  displayName: string
  type: string
}

interface PropertyLocationPickerProps {
  address: string
  zone: string
  sector: string
  lat: number | null
  lng: number | null
  onChange: (location: { address?: string; lat: number | null; lng: number | null }) => void
}

const BUCHAREST_CENTER: [number, number] = [44.4268, 26.1025]

const ZONE_CENTERS: Record<string, [number, number]> = {
  Dorobanti: [44.4594, 26.0958],
  Victoriei: [44.4512, 26.0876],
  Floreasca: [44.4754, 26.1025],
  Aviatorilor: [44.4653, 26.0864],
  Primaverii: [44.4614, 26.0851],
  Herastrau: [44.4782, 26.0817],
  Baneasa: [44.4904, 26.0824],
  Pipera: [44.5004, 26.1282],
  'Barbu Vacarescu': [44.4772, 26.1054],
  Romana: [44.4462, 26.0969],
  Universitate: [44.4356, 26.1027],
  Unirii: [44.4274, 26.1033],
  'Centru Civic': [44.4264, 26.1052],
  Parlament: [44.4276, 26.0874],
  Vitan: [44.4207, 26.1281],
  Titan: [44.4194, 26.1547],
  Pantelimon: [44.4435, 26.1664],
  Colentina: [44.4595, 26.1384],
  Obor: [44.4494, 26.1252],
  Militari: [44.4346, 26.0188],
  'Drumul Taberei': [44.4203, 26.0316],
  Ghencea: [44.4135, 26.0414],
  Rahova: [44.4038, 26.0693],
  Crangasi: [44.4552, 26.0454],
  Grozavesti: [44.4423, 26.0601],
  Politehnica: [44.4387, 26.0524],
  Iancului: [44.4414, 26.1311],
  'Mihai Bravu': [44.4261, 26.1342],
}

const PIN_HTML = `
  <div style="width:36px;height:44px;filter:drop-shadow(0 5px 7px rgba(15,23,42,.28));transform:translateY(-2px)">
    <svg viewBox="0 0 36 44" width="36" height="44" aria-hidden="true">
      <path d="M18 1C8.6 1 1 8.6 1 18c0 12.3 17 25 17 25s17-12.7 17-25C35 8.6 27.4 1 18 1Z" fill="#059669" stroke="white" stroke-width="2"/>
      <circle cx="18" cy="18" r="6" fill="white"/>
      <circle cx="18" cy="18" r="2.8" fill="#059669"/>
    </svg>
  </div>`

function validCoordinates(lat: number | null, lng: number | null): lat is number {
  return lat !== null && lng !== null && Number.isFinite(lat) && Number.isFinite(lng)
}

export function PropertyLocationPicker({
  address, zone, sector, lat, lng, onChange,
}: PropertyLocationPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<LeafletMarker | null>(null)
  const onChangeRef = useRef(onChange)
  const addressRef = useRef(address)
  const locationRef = useRef({ lat, lng, zone })
  const setMarkerRef = useRef<((nextLat: number, nextLng: number, moveMap?: boolean) => void) | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState('')
  const [mapAttempt, setMapAttempt] = useState(0)
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [searchError, setSearchError] = useState('')

  useEffect(() => { onChangeRef.current = onChange }, [onChange])
  useEffect(() => { addressRef.current = address }, [address])
  useEffect(() => { locationRef.current = { lat, lng, zone } }, [lat, lng, zone])

  const searchQuery = useMemo(() => [
    address.trim(), zone, sector, 'București', 'România',
  ].filter(Boolean).join(', '), [address, sector, zone])
  const canSearch = address.trim().length >= 4 || Boolean(zone)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false
    const container = containerRef.current
    setMapReady(false)
    setMapError('')

    void import('leaflet').then((L) => {
      if (cancelled || mapRef.current) return
      const initialLocation = locationRef.current
      const initialCenter = validCoordinates(initialLocation.lat, initialLocation.lng)
        ? [initialLocation.lat, initialLocation.lng] as [number, number]
        : ZONE_CENTERS[initialLocation.zone] || BUCHAREST_CENTER
      const map = L.map(container, {
        center: initialCenter,
        zoom: validCoordinates(initialLocation.lat, initialLocation.lng) ? 16 : initialLocation.zone ? 14 : 12,
        zoomControl: false,
        scrollWheelZoom: false,
      })
      mapRef.current = map

      L.control.zoom({ position: 'topright' }).addTo(map)
      L.tileLayer(
        process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        },
      ).addTo(map)

      const icon = L.divIcon({
        html: PIN_HTML,
        className: 'hqs-property-map-pin',
        iconSize: [36, 44],
        iconAnchor: [18, 43],
      })

      const setMarker = (nextLat: number, nextLng: number, moveMap = false) => {
        if (markerRef.current) {
          markerRef.current.setLatLng([nextLat, nextLng])
        } else {
          const marker = L.marker([nextLat, nextLng], { icon, draggable: true, keyboard: true }).addTo(map)
          marker.bindTooltip('Trage pinul pentru o poziționare mai precisă.', { direction: 'top', offset: [0, -36] })
          marker.on('dragend', () => {
            const point = marker.getLatLng()
            onChangeRef.current({ lat: point.lat, lng: point.lng })
          })
          markerRef.current = marker
        }
        if (moveMap) map.flyTo([nextLat, nextLng], 17, { duration: 0.6 })
      }

      setMarkerRef.current = setMarker
      if (validCoordinates(initialLocation.lat, initialLocation.lng)) {
        setMarker(initialLocation.lat, initialLocation.lng!)
      }

      map.on('click', (event: L.LeafletMouseEvent) => {
        setMarker(event.latlng.lat, event.latlng.lng)
        onChangeRef.current({ lat: event.latlng.lat, lng: event.latlng.lng })
      })

      setMapReady(true)
      window.setTimeout(() => map.invalidateSize(), 50)
    }).catch((error) => {
      if (cancelled) return
      console.error('Map initialization failed:', error)
      markerRef.current = null
      setMarkerRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
      setMapReady(false)
      setMapError('Harta nu a putut fi încărcată. Verifică conexiunea și încearcă din nou.')
    })

    return () => {
      cancelled = true
      setMarkerRef.current = null
      markerRef.current = null
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
    // Reinitialize only after an explicit retry; later prop changes are synchronized below.
  }, [mapAttempt])

  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    if (validCoordinates(lat, lng)) {
      setMarkerRef.current?.(lat, lng!)
      return
    }
    markerRef.current?.remove()
    markerRef.current = null
    const center = ZONE_CENTERS[zone] || BUCHAREST_CENTER
    mapRef.current.flyTo(center, zone ? 14 : 12, { duration: 0.4 })
  }, [lat, lng, mapReady, zone])

  function retryMap() {
    setMapError('')
    setMapReady(false)
    setMapAttempt((attempt) => attempt + 1)
  }

  async function handleSearch() {
    if (!canSearch) return
    setSearching(true)
    setSearchError('')
    setResults([])
    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      })
      const data = await response.json().catch(() => ({})) as { error?: string; results?: GeocodeResult[] }
      if (!response.ok) throw new Error(data.error || 'Căutarea adresei nu a reușit.')
      const nextResults = data.results || []
      setResults(nextResults)
      if (nextResults.length === 0) setSearchError('Nu am găsit adresa. Mută pinul manual pe hartă.')
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Căutarea adresei nu a reușit.')
    } finally {
      setSearching(false)
    }
  }

  function selectResult(result: GeocodeResult) {
    setMarkerRef.current?.(result.lat, result.lng, true)
    onChange({ address: result.displayName, lat: result.lat, lng: result.lng })
    setResults([])
    setSearchError('')
    toast.success('Adresa a fost poziționată pe hartă.')
  }

  function clearPin() {
    markerRef.current?.remove()
    markerRef.current = null
    onChange({ lat: null, lng: null })
    toast.success('Pinul a fost eliminat.')
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-muted/20 p-3.5 sm:p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Search className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Găsește adresa pe hartă</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Folosim adresa, zona și sectorul completate mai sus pentru o căutare mai precisă.
              </p>
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              type="button"
              onClick={handleSearch}
              disabled={searching || !canSearch}
              className="w-full gap-2 sm:w-auto"
              aria-busy={searching}
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {searching ? 'Căutăm adresa…' : 'Caută pe hartă'}
            </Button>
            {validCoordinates(lat, lng) && (
              <Button
                type="button"
                variant="outline"
                onClick={clearPin}
                className="w-full gap-2 text-muted-foreground sm:w-auto"
              >
                <Trash2 className="h-4 w-4" /> Elimină pinul
              </Button>
            )}
          </div>
        </div>

        {!canSearch && (
          <p className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
            Completează cel puțin zona sau primele patru caractere ale adresei pentru a porni căutarea.
          </p>
        )}
      </div>

      {results.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-primary/15 bg-background shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b bg-primary/5 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Alege adresa corectă</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Selectarea unui rezultat va muta automat pinul.</p>
            </div>
            <Badge variant="secondary" className="tabular-nums">
              {results.length} {results.length === 1 ? 'rezultat' : 'rezultate'}
            </Badge>
          </div>
          <div className="divide-y">
            {results.map((result, index) => (
              <button
                key={`${result.lat}-${result.lng}-${index}`}
                type="button"
                onClick={() => selectResult(result)}
                className="group flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:outline-none"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <MapPin className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 text-sm leading-snug">{result.displayName}</span>
                <Badge variant="secondary" className="hidden shrink-0 capitalize sm:inline-flex">{result.type}</Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {searchError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-amber-300/60 bg-amber-500/10 px-3.5 py-3 text-xs text-amber-900 dark:text-amber-200"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="leading-relaxed">{searchError}</p>
        </div>
      )}

      <div className="relative overflow-hidden rounded-[1.25rem] border border-border/70 bg-muted shadow-sm ring-1 ring-black/[0.02] dark:ring-white/[0.03]">
        <div
          ref={containerRef}
          data-testid="property-location-map"
          className="h-[300px] w-full sm:h-[380px]"
          aria-label="Hartă pentru poziționarea proprietății"
        />

        {!mapReady && !mapError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted" role="status" aria-live="polite">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-background shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
            </span>
            <p className="text-xs font-medium text-muted-foreground">Se încarcă harta…</p>
          </div>
        )}

        {mapError && (
          <div
            className="absolute inset-0 z-[510] flex flex-col items-center justify-center gap-3 bg-muted px-6 text-center"
            role="alert"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <CircleAlert className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">Harta nu este disponibilă momentan</p>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">{mapError}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={retryMap} className="gap-2">
              <LocateFixed className="h-4 w-4" aria-hidden="true" />
              Reîncearcă
            </Button>
          </div>
        )}

        {!mapError && (
          <div className="pointer-events-none absolute left-3 top-3 z-[500] max-w-[calc(100%-4.5rem)] rounded-xl border border-border/70 bg-background/95 px-3.5 py-2.5 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <LocateFixed className="h-3.5 w-3.5 text-primary" />
              Clic pe hartă pentru a pune pinul
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Îl poți trage apoi până la poziția exactă.</p>
          </div>
        )}
      </div>

      <div
        className={cn(
          'flex flex-col gap-3 rounded-2xl border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between',
          validCoordinates(lat, lng)
            ? 'border-emerald-500/20 bg-emerald-500/[0.07]'
            : 'border-border/70 bg-muted/20',
        )}
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
              validCoordinates(lat, lng)
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {validCoordinates(lat, lng)
              ? <CheckCircle2 className="h-4.5 w-4.5" />
              : <MapPin className="h-4.5 w-4.5" />}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold">
                {validCoordinates(lat, lng) ? 'Poziție salvată' : 'Poziționează proprietatea'}
              </p>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px]',
                  validCoordinates(lat, lng) && 'border-emerald-500/25 bg-background/70 text-emerald-700 dark:text-emerald-300',
                )}
              >
                {validCoordinates(lat, lng) ? 'Localizare completă' : 'Pin nesetat'}
              </Badge>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {validCoordinates(lat, lng)
                ? 'Pinul va fi folosit pentru hartă și căutările bazate pe zonă.'
                : 'Adaugă un pin pentru ca proprietatea să fie găsită mai ușor pe hartă.'}
            </p>
            {validCoordinates(lat, lng) && (
              <p className="mt-1 font-mono text-[10px] tabular-nums text-muted-foreground">
                {lat.toFixed(6)}, {lng!.toFixed(6)}
              </p>
            )}
          </div>
        </div>
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Date cartografice © OpenStreetMap <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="flex items-start gap-2.5 px-1 text-[11px] leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
        <p>
          Căutarea pornește numai când apeși butonul și trimite textul adresei către OpenStreetMap Nominatim.
          Pentru o adresă confidențială, plasează pinul aproximativ, la nivelul străzii sau al zonei.
        </p>
      </div>
    </div>
  )
}
