'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ZoomIn, ZoomOut, List, X, MapPin, Star, Home, Building2, TreePine, LandPlot, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAppStore } from '@/store/use-app-store'
import type { Property } from '@/lib/types'

// ─── Zone coordinate mapping (percentage-based) ────────────────────────────────
const ZONE_POSITIONS: Record<string, { x: number; y: number }> = {
  'Dorobanti': { x: 52, y: 22 },
  'Victoriei': { x: 45, y: 30 },
  'Floreasca': { x: 58, y: 18 },
  'Aviatorilor': { x: 50, y: 25 },
  'Primaverii': { x: 42, y: 18 },
  'Herastrau': { x: 45, y: 15 },
  'Baneasa': { x: 62, y: 12 },
  'Pipera': { x: 70, y: 10 },
  'Barbu Vacarescu': { x: 55, y: 30 },
  'Romana': { x: 50, y: 35 },
  'Universitate': { x: 48, y: 40 },
  'Unirii': { x: 52, y: 45 },
  'Centru Civic': { x: 50, y: 42 },
  'Parlament': { x: 48, y: 50 },
  'Vitan': { x: 58, y: 48 },
  'Titan': { x: 62, y: 45 },
  'Pantelimon': { x: 70, y: 42 },
  'Colentina': { x: 60, y: 38 },
  'Obor': { x: 55, y: 35 },
  'Militari': { x: 25, y: 45 },
  'Drumul Taberei': { x: 30, y: 55 },
  'Ghencea': { x: 28, y: 38 },
  'Rahova': { x: 35, y: 55 },
  'Crangasi': { x: 35, y: 32 },
  'Grozavesti': { x: 38, y: 38 },
  'Politehnica': { x: 32, y: 40 },
  'Iancului': { x: 55, y: 32 },
  'Mihai Bravu': { x: 58, y: 42 },
}

// ─── Property type colors ─────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, { fill: string; stroke: string; bg: string; label: string; icon: typeof Home }> = {
  APARTMENT: { fill: '#10b981', stroke: '#059669', bg: 'bg-emerald-500', label: 'Apartament', icon: Building2 },
  HOUSE: { fill: '#f59e0b', stroke: '#d97706', bg: 'bg-amber-500', label: 'Casa', icon: Home },
  VILLA: { fill: '#f43f5e', stroke: '#e11d48', bg: 'bg-rose-500', label: 'Vila', icon: Star },
  LAND: { fill: '#14b8a6', stroke: '#0d9488', bg: 'bg-teal-500', label: 'Teren', icon: TreePine },
  COMMERCIAL: { fill: '#64748b', stroke: '#475569', bg: 'bg-slate-500', label: 'Comercial', icon: Store },
}

// ─── Sector polygon data ──────────────────────────────────────────────────────
const SECTORS = [
  {
    id: 'sector-1',
    label: 'Sector 1',
    color: 'rgba(16, 185, 129, 0.08)',
    stroke: 'rgba(16, 185, 129, 0.25)',
    points: '38,5 75,5 75,33 65,33 60,28 52,30 48,28 42,25 38,22 36,15',
  },
  {
    id: 'sector-2',
    label: 'Sector 2',
    color: 'rgba(59, 130, 246, 0.08)',
    stroke: 'rgba(59, 130, 246, 0.25)',
    points: '55,30 65,33 75,33 78,42 75,55 65,52 58,48 52,48 52,38 55,30',
  },
  {
    id: 'sector-3',
    label: 'Sector 3',
    color: 'rgba(245, 158, 11, 0.08)',
    stroke: 'rgba(245, 158, 11, 0.25)',
    points: '52,48 58,48 65,52 75,55 72,62 60,62 48,58 42,55 42,48 48,50',
  },
  {
    id: 'sector-4',
    label: 'Sector 4',
    color: 'rgba(244, 63, 94, 0.08)',
    stroke: 'rgba(244, 63, 94, 0.25)',
    points: '25,48 42,48 42,55 48,58 60,62 55,70 42,68 30,62 25,55',
  },
  {
    id: 'sector-5',
    label: 'Sector 5',
    color: 'rgba(168, 85, 247, 0.08)',
    stroke: 'rgba(168, 85, 247, 0.25)',
    points: '25,33 36,30 42,35 48,38 52,38 52,48 42,48 25,48 22,42',
  },
  {
    id: 'sector-6',
    label: 'Sector 6',
    color: 'rgba(249, 115, 22, 0.08)',
    stroke: 'rgba(249, 115, 22, 0.25)',
    points: '12,28 22,22 30,22 36,28 36,30 25,33 22,42 25,48 25,55 20,55 12,48',
  },
]

// ─── Sector label positions ────────────────────────────────────────────────────
const SECTOR_LABELS: Record<string, { x: number; y: number }> = {
  'sector-1': { x: 55, y: 16 },
  'sector-2': { x: 65, y: 42 },
  'sector-3': { x: 55, y: 58 },
  'sector-4': { x: 40, y: 56 },
  'sector-5': { x: 36, y: 42 },
  'sector-6': { x: 20, y: 40 },
}

// ─── Deterministic offset from property id ─────────────────────────────────────
function getOffset(id: string): { dx: number; dy: number } {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i)
    hash |= 0
  }
  return {
    dx: ((hash % 7) - 3) * 1.2,
    dy: (((hash >> 4) % 7) - 3) * 1.2,
  }
}

// ─── Main Component ────────────────────────────────────────────────────────────
interface PropertyMapViewProps {
  properties: Property[]
}

export function PropertyMapView({ properties }: PropertyMapViewProps) {
  const { setSelectedPropertySlug } = useAppStore()
  const [zoom, setZoom] = useState(1)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(false)

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.3, 3)), [])
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.3, 0.6)), [])

  // Compute marker positions
  const markers = useMemo(() => {
    return properties.map((p) => {
      const zonePos = ZONE_POSITIONS[p.zone]
      if (!zonePos) return null
      const offset = getOffset(p.id)
      return {
        ...p,
        cx: zonePos.x + offset.dx,
        cy: zonePos.y + offset.dy,
      }
    }).filter(Boolean) as (Property & { cx: number; cy: number })[]
  }, [properties])

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'EUR') return `${price.toLocaleString('ro-RO')} €`
    return `${price.toLocaleString('ro-RO')} ${currency}`
  }

  return (
    <div className="relative w-full rounded-xl border bg-card overflow-hidden" style={{ minHeight: 520 }}>
      {/* Map Controls (top-right) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-lg bg-background/90 backdrop-blur-sm shadow-sm border-border/50"
          onClick={handleZoomIn}
          aria-label="Marire"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-lg bg-background/90 backdrop-blur-sm shadow-sm border-border/50"
          onClick={handleZoomOut}
          aria-label="Micsorare"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-lg bg-background/90 backdrop-blur-sm shadow-sm border-border/50"
          onClick={() => setShowSidebar(!showSidebar)}
          aria-label="Lista proprietati"
        >
          <List className="h-4 w-4" />
        </Button>
      </div>

      {/* Results count (top-left) */}
      <div className="absolute top-4 left-4 z-20">
        <div className="rounded-lg bg-background/90 backdrop-blur-sm shadow-sm border border-border/50 px-3 py-1.5 text-sm">
          <span className="font-medium">{markers.length}</span>
          <span className="text-muted-foreground ml-1">proprietati pe harta</span>
        </div>
      </div>

      {/* Legend (bottom-left) */}
      <div className="absolute bottom-4 left-4 z-20">
        <div className="rounded-lg bg-background/90 backdrop-blur-sm shadow-sm border border-border/50 p-3">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Tip Proprietate</div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {Object.entries(TYPE_COLORS).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: val.fill }} />
                <span className="text-[11px] text-muted-foreground">{val.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar overlay */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-0 right-0 z-30 h-full w-80 bg-background/95 backdrop-blur-sm border-l shadow-xl"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-sm">Proprietati ({markers.length})</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowSidebar(false)}
                aria-label="Inchide"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="h-[calc(100%-52px)]">
              <div className="p-3 space-y-2">
                {markers.map((m) => {
                  const typeInfo = TYPE_COLORS[m.type] || TYPE_COLORS.APARTMENT
                  return (
                    <motion.button
                      key={m.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full text-left rounded-lg border p-3 hover:bg-accent/50 transition-colors group"
                      onClick={() => setSelectedPropertySlug(m.slug)}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className="mt-0.5 h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: typeInfo.fill }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {m.title}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{formatPrice(m.price, m.currency)}</span>
                            <span className="text-border">·</span>
                            <span>{m.zone}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                              {m.areaSqm} m²
                            </Badge>
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                              {m.rooms} cam.
                            </Badge>
                            {m.featured && (
                              <Badge className="text-[10px] h-5 px-1.5 bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
                                <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                                Popular
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SVG Map */}
      <div className="w-full h-full" style={{ minHeight: 520 }}>
        <svg
          viewBox="0 0 100 75"
          className="w-full h-full select-none"
          style={{ minHeight: 520 }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Grid pattern */}
            <pattern id="map-grid" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="0.15" />
            </pattern>
            {/* Glow filter for markers */}
            <filter id="marker-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="0.6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Pulse animation for featured */}
            <filter id="featured-glow" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="1" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g transform={`scale(${zoom})`} style={{ transformOrigin: '50% 50%' }}>
            {/* Background */}
            <rect width="100" height="75" fill="#fafafa" rx="1" />

            {/* Grid overlay */}
            <rect width="100" height="75" fill="url(#map-grid)" />

            {/* Sector polygons */}
            {SECTORS.map((sector) => (
              <g key={sector.id}>
                <polygon
                  points={sector.points}
                  fill={sector.color}
                  stroke={sector.stroke}
                  strokeWidth="0.2"
                  strokeLinejoin="round"
                />
                {/* Sector label */}
                <text
                  x={SECTOR_LABELS[sector.id]?.x ?? 50}
                  y={SECTOR_LABELS[sector.id]?.y ?? 40}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="1.8"
                  fontWeight="600"
                  fill="rgba(0,0,0,0.1)"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {sector.label}
                </text>
              </g>
            ))}

            {/* Main roads */}
            <g stroke="rgba(0,0,0,0.08)" strokeWidth="0.4" fill="none">
              {/* North-South main axis */}
              <line x1="50" y1="3" x2="50" y2="70" />
              {/* East-West main axis */}
              <line x1="5" y1="40" x2="95" y2="40" />
              {/* Diagonal - Victoriei to Unirii */}
              <line x1="44" y1="30" x2="52" y2="45" />
              {/* Ring road approximation */}
              <ellipse cx="50" cy="35" rx="30" ry="22" strokeDasharray="2,1" strokeWidth="0.25" />
            </g>

            {/* River (Dambovita) - curved path near center */}
            <path
              d="M 8,44 Q 25,42 40,44 Q 50,46 60,43 Q 75,40 92,42"
              fill="none"
              stroke="rgba(56, 189, 248, 0.25)"
              strokeWidth="0.6"
              strokeLinecap="round"
            />
            <text
              x="80"
              y="40"
              fontSize="1.2"
              fill="rgba(56, 189, 248, 0.4)"
              fontStyle="italic"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              Dambovita
            </text>

            {/* Herastrau Park area */}
            <ellipse
              cx="44"
              cy="14"
              rx="6"
              ry="4"
              fill="rgba(34, 197, 94, 0.1)"
              stroke="rgba(34, 197, 94, 0.2)"
              strokeWidth="0.2"
            />
            <text
              x="44"
              y="14.5"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="1.1"
              fill="rgba(34, 197, 94, 0.35)"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              Parcul Herastrau
            </text>

            {/* Property markers */}
            {markers.map((m, idx) => {
              const typeInfo = TYPE_COLORS[m.type] || TYPE_COLORS.APARTMENT
              const isHovered = hoveredId === m.id
              const r = isHovered ? 1.5 : 1

              return (
                <Tooltip key={m.id}>
                  <TooltipTrigger asChild>
                    <g
                      onMouseEnter={() => setHoveredId(m.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => setSelectedPropertySlug(m.slug)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Featured pulse ring */}
                      {m.featured && (
                        <motion.circle
                          cx={m.cx}
                          cy={m.cy}
                          r={r}
                          fill="none"
                          stroke={typeInfo.fill}
                          strokeWidth="0.2"
                          animate={{
                            r: [r, r + 2, r + 3.5],
                            opacity: [0.6, 0.2, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: idx * 0.15,
                          }}
                        />
                      )}
                      {/* Marker shadow */}
                      <circle
                        cx={m.cx}
                        cy={m.cy + 0.3}
                        r={r}
                        fill="rgba(0,0,0,0.15)"
                      />
                      {/* Marker body */}
                      <motion.circle
                        cx={m.cx}
                        cy={m.cy}
                        r={r}
                        fill={typeInfo.fill}
                        stroke={typeInfo.stroke}
                        strokeWidth={isHovered ? 0.3 : 0.15}
                        filter={m.featured ? 'url(#featured-glow)' : 'url(#marker-glow)'}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: idx * 0.03, duration: 0.3, type: 'spring', stiffness: 200 }}
                        whileHover={{ scale: 1.4 }}
                      />
                      {/* Inner dot */}
                      <circle
                        cx={m.cx}
                        cy={m.cy}
                        r={r * 0.35}
                        fill="white"
                        opacity="0.6"
                      />
                    </g>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    sideOffset={8}
                    className="bg-card text-card-foreground border border-border/60 shadow-lg p-0 rounded-lg overflow-hidden max-w-[240px]"
                  >
                    <div className="p-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: typeInfo.fill }}
                        />
                        <span className="font-semibold text-sm truncate">{m.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span>{m.zone}</span>
                        <span className="text-border">·</span>
                        <span>{m.areaSqm} m²</span>
                        {m.rooms > 0 && (
                          <>
                            <span className="text-border">·</span>
                            <span>{m.rooms} cam.</span>
                          </>
                        )}
                      </div>
                      <div className="text-sm font-bold text-primary">
                        {formatPrice(m.price, m.currency)}
                      </div>
                      {m.featured && (
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-amber-100 text-amber-800 border-amber-200">
                          <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                          Proprietate Populara
                        </Badge>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </g>

          {/* "Bucuresti" label */}
          <text
            x="50"
            y="3"
            textAnchor="middle"
            fontSize="2.5"
            fontWeight="700"
            fill="rgba(0,0,0,0.15)"
            letterSpacing="3"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            BUCURESTI
          </text>
        </svg>
      </div>
    </div>
  )
}