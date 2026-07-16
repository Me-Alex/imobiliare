'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet'
import {
  CheckCircle2, ExternalLink, Loader2, LocateFixed, MapPin, Search, Trash2,
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
  const setMarkerRef = useRef<((nextLat: number, nextLng: number, moveMap?: boolean) => void) | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [searchError, setSearchError] = useState('')

  useEffect(() => { onChangeRef.current = onChange }, [onChange])
  useEffect(() => { addressRef.current = address }, [address])

  const searchQuery = useMemo(() => [
    address.trim(), zone, sector, 'București', 'România',
  ].filter(Boolean).join(', '), [address, sector, zone])
  const canSearch = address.trim().length >= 4 || Boolean(zone)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false
    const container = containerRef.current

    void import('leaflet').then((L) => {
      if (cancelled || mapRef.current) return
      const initialCenter = validCoordinates(lat, lng)
        ? [lat, lng] as [number, number]
        : ZONE_CENTERS[zone] || BUCHAREST_CENTER
      const map = L.map(container, {
        center: initialCenter,
        zoom: validCoordinates(lat, lng) ? 16 : zone ? 14 : 12,
        zoomControl: false,
        scrollWheelZoom: false,
      })

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
          marker.bindTooltip('Trage pinul pentru o poziționare mai precisă', { direction: 'top', offset: [0, -36] })
          marker.on('dragend', () => {
            const point = marker.getLatLng()
            onChangeRef.current({ lat: point.lat, lng: point.lng })
          })
          markerRef.current = marker
        }
        if (moveMap) map.flyTo([nextLat, nextLng], 17, { duration: 0.6 })
      }

      setMarkerRef.current = setMarker
      if (validCoordinates(lat, lng)) setMarker(lat, lng!)

      map.on('click', (event: L.LeafletMouseEvent) => {
        setMarker(event.latlng.lat, event.latlng.lng)
        onChangeRef.current({ lat: event.latlng.lat, lng: event.latlng.lng })
      })

      mapRef.current = map
      setMapReady(true)
      window.setTimeout(() => map.invalidateSize(), 50)
    }).catch((error) => {
      console.error('Map initialization failed:', error)
      setSearchError('Harta nu a putut fi încărcată.')
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
    // The map is intentionally initialized once; later prop changes are handled below.
  }, [])

  useEffect(() => {
    if (!mapRef.current) return
    if (validCoordinates(lat, lng)) {
      setMarkerRef.current?.(lat, lng!)
      return
    }
    markerRef.current?.remove()
    markerRef.current = null
    const center = ZONE_CENTERS[zone] || BUCHAREST_CENTER
    mapRef.current.flyTo(center, zone ? 14 : 12, { duration: 0.4 })
  }, [lat, lng, zone])

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
    toast.success('Adresa a fost poziționată pe hartă')
  }

  function clearPin() {
    markerRef.current?.remove()
    markerRef.current = null
    onChange({ lat: null, lng: null })
    toast.success('Pinul a fost eliminat')
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={handleSearch}
          disabled={searching || !canSearch}
          className="gap-2 sm:w-auto"
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {searching ? 'Căutăm adresa…' : 'Caută adresa pe hartă'}
        </Button>
        {validCoordinates(lat, lng) && (
          <Button type="button" variant="ghost" onClick={clearPin} className="gap-2 text-muted-foreground">
            <Trash2 className="h-4 w-4" /> Elimină pinul
          </Button>
        )}
      </div>

      {results.length > 0 && (
        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
          <div className="border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
            Alege rezultatul corect
          </div>
          <div className="divide-y">
            {results.map((result, index) => (
              <button
                key={`${result.lat}-${result.lng}-${index}`}
                type="button"
                onClick={() => selectResult(result)}
                className="flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-primary/5"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 text-sm leading-snug">{result.displayName}</span>
                <Badge variant="secondary" className="hidden shrink-0 capitalize sm:inline-flex">{result.type}</Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {searchError && (
        <p className="rounded-lg border border-amber-300/60 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
          {searchError}
        </p>
      )}

      <div className="relative overflow-hidden rounded-2xl border bg-muted shadow-inner">
        <div
          ref={containerRef}
          data-testid="property-location-map"
          className="h-[320px] w-full sm:h-[380px]"
          aria-label="Hartă pentru poziționarea proprietății"
        />

        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        <div className="pointer-events-none absolute left-3 top-3 z-[500] max-w-[calc(100%-4.5rem)] rounded-lg border bg-background/95 px-3 py-2 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2 text-xs font-medium">
            <LocateFixed className="h-3.5 w-3.5 text-primary" />
            Click pe hartă sau trage pinul
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border bg-muted/25 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          <CheckCircle2 className={cn('mt-0.5 h-4 w-4 shrink-0', validCoordinates(lat, lng) ? 'text-emerald-600' : 'text-muted-foreground')} />
          <div>
            <p className="text-xs font-medium">
              {validCoordinates(lat, lng) ? 'Poziția proprietății este salvată' : 'Pinul este recomandat pentru o localizare corectă'}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {validCoordinates(lat, lng)
                ? `${lat.toFixed(6)}, ${lng!.toFixed(6)}`
                : 'Adresa poate fi căutată sau pinul poate fi pus manual.'}
            </p>
          </div>
        </div>
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          Date © OpenStreetMap <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Căutarea are loc numai când apeși butonul și trimite textul adresei către serviciul OpenStreetMap Nominatim.
        Dacă adresa este confidențială, poziționează manual pinul la nivelul străzii sau al zonei.
      </p>
    </div>
  )
}
