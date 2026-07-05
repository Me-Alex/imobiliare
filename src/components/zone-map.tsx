'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, X, RotateCcw } from 'lucide-react'
import { useAppStore } from '@/store/use-app-store'

// ── Geometry helpers ────────────────────────────────────────────────────
const CX = 200
const CY = 200
const OUTER_R = 160
const INNER_R = 60
const LABEL_R = 115 // midpoint radius for sector labels
const SVG_SIZE = 400

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

function polarToXY(angleDeg: number, radius: number) {
  return {
    x: CX + radius * Math.cos(toRad(angleDeg)),
    y: CY + radius * Math.sin(toRad(angleDeg)),
  }
}

// Build an annular sector path: inner-start → outer-start → outer-arc → outer-end → inner-end → inner-arc → back
function buildSectorPath(startDeg: number, endDeg: number): string {
  const iStart = polarToXY(startDeg, INNER_R)
  const oStart = polarToXY(startDeg, OUTER_R)
  const oEnd = polarToXY(endDeg, OUTER_R)
  const iEnd = polarToXY(endDeg, INNER_R)

  // large-arc-flag: 0 because 60° < 180°
  // outer arc: sweep=1 (clockwise), inner arc: sweep=0 (counter-clockwise back)
  return [
    `M ${iStart.x.toFixed(2)},${iStart.y.toFixed(2)}`,
    `L ${oStart.x.toFixed(2)},${oStart.y.toFixed(2)}`,
    `A ${OUTER_R},${OUTER_R} 0 0,1 ${oEnd.x.toFixed(2)},${oEnd.y.toFixed(2)}`,
    `L ${iEnd.x.toFixed(2)},${iEnd.y.toFixed(2)}`,
    `A ${INNER_R},${INNER_R} 0 0,0 ${iStart.x.toFixed(2)},${iStart.y.toFixed(2)}`,
    'Z',
  ].join(' ')
}

// ── Price → color mapping ───────────────────────────────────────────────
const PRICE_MIN = 1700
const PRICE_MAX = 3200

function priceToColor(price: number): string {
  const t = Math.max(0, Math.min(1, (price - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)))
  // Lightness: 0.85 (low) → 0.527 (high)
  const l = (0.85 - t * 0.323).toFixed(3)
  // Chroma: 0.08 (low) → 0.14 (high)
  const c = (0.08 + t * 0.06).toFixed(3)
  return `oklch(${l} ${c} 160)`
}

function priceToHoverColor(price: number): string {
  const t = Math.max(0, Math.min(1, (price - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)))
  const l = (0.80 - t * 0.273).toFixed(3)
  const c = (0.10 + t * 0.06).toFixed(3)
  return `oklch(${l} ${c} 160)`
}

// ── Sector data ─────────────────────────────────────────────────────────
interface SectorData {
  id: number
  name: string
  label: string
  avgPrice: number
  properties: number
  color: string
  hoverColor: string
  path: string
  cx: number
  cy: number
  startDeg: number
  endDeg: number
}

const SECTORS: SectorData[] = [
  {
    id: 1,
    name: 'Sector 1',
    label: 'Sector 1',
    avgPrice: 3200,
    properties: 18,
    startDeg: -90,
    endDeg: -30,
  },
  {
    id: 2,
    name: 'Sector 2',
    label: 'Sector 2',
    avgPrice: 2600,
    properties: 12,
    startDeg: -30,
    endDeg: 30,
  },
  {
    id: 3,
    name: 'Sector 3',
    label: 'Sector 3',
    avgPrice: 2200,
    properties: 10,
    startDeg: 30,
    endDeg: 90,
  },
  {
    id: 4,
    name: 'Sector 4',
    label: 'Sector 4',
    avgPrice: 1800,
    properties: 8,
    startDeg: 90,
    endDeg: 150,
  },
  {
    id: 5,
    name: 'Sector 5',
    label: 'Sector 5',
    avgPrice: 1700,
    properties: 6,
    startDeg: 150,
    endDeg: 210,
  },
  {
    id: 6,
    name: 'Sector 6',
    label: 'Sector 6',
    avgPrice: 2400,
    properties: 11,
    startDeg: 210,
    endDeg: 270,
  },
].map((s) => {
  const midDeg = (s.startDeg + s.endDeg) / 2
  const center = polarToXY(midDeg, LABEL_R)
  return {
    ...s,
    path: buildSectorPath(s.startDeg, s.endDeg),
    cx: center.x,
    cy: center.y,
    color: priceToColor(s.avgPrice),
    hoverColor: priceToHoverColor(s.avgPrice),
  }
})

// ── Format price ────────────────────────────────────────────────────────
function formatEur(value: number): string {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// ── Component ───────────────────────────────────────────────────────────
export function ZoneMap() {
  const { selectedZone, setSelectedZone } = useAppStore()
  const [hoveredSector, setHoveredSector] = useState<number | null>(null)

  const activeSectorId = useMemo(() => {
    if (!selectedZone) return null
    const match = selectedZone.match(/Sector (\d)/)
    return match ? Number(match[1]) : null
  }, [selectedZone])

  const handleSectorClick = useCallback(
    (sector: SectorData) => {
      if (selectedZone === sector.name) {
        setSelectedZone('')
      } else {
        setSelectedZone(sector.name)
      }
      // Scroll to properties
      document.getElementById('proprietati')?.scrollIntoView({ behavior: 'smooth' })
    },
    [selectedZone, setSelectedZone]
  )

  const handleReset = useCallback(() => {
    setSelectedZone('')
  }, [setSelectedZone])

  return (
    <section id="harta" className="py-16 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight section-title-accent">
              Harta Zonelor
            </h2>
            <p className="text-muted-foreground mt-2">
              Selecteaza un sector pentru a filtra proprietatile
            </p>
          </div>

          <div className="flex flex-col items-center">
            {/* Map container */}
            <div className="relative w-full max-w-lg">
              <svg
                viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
                className="w-full h-auto"
                role="img"
                aria-label="Harta interactiva a sectoarelor Bucurestiului"
              >
                {/* Background subtle circle */}
                <circle
                  cx={CX}
                  cy={CY}
                  r={OUTER_R + 8}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={0.5}
                  className="text-muted-foreground/20"
                />

                {/* Sectors */}
                {SECTORS.map((sector) => {
                  const isHovered = hoveredSector === sector.id
                  const isActive = activeSectorId === sector.id

                  return (
                    <g key={sector.id}>
                      <path
                        d={sector.path}
                        fill={isHovered ? sector.hoverColor : sector.color}
                        stroke={isActive ? '#10b981' : 'rgba(255,255,255,0.6)'}
                        strokeWidth={isActive ? 3 : 1.5}
                        className="cursor-pointer transition-all duration-200"
                        style={{
                          filter: isHovered
                            ? 'drop-shadow(0 4px 12px rgba(16,185,129,0.3))'
                            : isActive
                              ? 'drop-shadow(0 2px 8px rgba(16,185,129,0.25))'
                              : 'none',
                        }}
                        onMouseEnter={() => setHoveredSector(sector.id)}
                        onMouseLeave={() => setHoveredSector(null)}
                        onClick={() => handleSectorClick(sector)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleSectorClick(sector)
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`${sector.label} — Pret mediu: ${formatEur(sector.avgPrice)}/m²`}
                      />

                      {/* Sector label */}
                      <text
                        x={sector.cx}
                        y={sector.cy - 6}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-foreground pointer-events-none select-none"
                        fontSize={13}
                        fontWeight={700}
                      >
                        {sector.label}
                      </text>
                      <text
                        x={sector.cx}
                        y={sector.cy + 12}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-foreground/60 pointer-events-none select-none"
                        fontSize={10}
                      >
                        {formatEur(sector.avgPrice)}/m²
                      </text>
                    </g>
                  )
                })}

                {/* Center circle */}
                <circle
                  cx={CX}
                  cy={CY}
                  r={INNER_R - 4}
                  fill="hsl(var(--background))"
                  className="pointer-events-none"
                />
                <text
                  x={CX}
                  y={CY - 6}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-foreground select-none"
                  fontSize={14}
                  fontWeight={800}
                >
                  București
                </text>
                <text
                  x={CX}
                  y={CY + 12}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-muted-foreground select-none"
                  fontSize={10}
                >
                  6 Sectoare
                </text>

                {/* Compass rose (top) */}
                <text
                  x={CX}
                  y={CY - OUTER_R - 14}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-muted-foreground/60 select-none"
                  fontSize={9}
                  fontWeight={600}
                >
                  N
                </text>
              </svg>

              {/* Tooltip overlay */}
              <AnimatePresence>
                {hoveredSector !== null && (() => {
                  const sector = SECTORS.find((s) => s.id === hoveredSector)
                  if (!sector) return null
                  // Convert SVG coordinates to percentage positions
                  const pctX = (sector.cx / SVG_SIZE) * 100
                  const pctY = (sector.cy / SVG_SIZE) * 100

                  return (
                    <motion.div
                      key={`tooltip-${sector.id}`}
                      initial={{ opacity: 0, scale: 0.9, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute pointer-events-none z-10"
                      style={{
                        left: `${pctX}%`,
                        top: `${pctY}%`,
                        transform: 'translate(-50%, -140%)',
                      }}
                    >
                      <div className="rounded-lg border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur-sm text-center min-w-[120px]">
                        <p className="font-semibold text-sm">{sector.label}</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                          {formatEur(sector.avgPrice)}/m²
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {sector.properties} proprietati
                        </p>
                      </div>
                    </motion.div>
                  )
                })()}
              </AnimatePresence>
            </div>

            {/* Reset button */}
            {selectedZone && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
              >
                <button
                  onClick={handleReset}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reseteaza harta
                </button>
              </motion.div>
            )}

            {/* Active filter indicator */}
            {selectedZone && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 flex items-center gap-2"
              >
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Filtru activ:{' '}
                  <span className="font-semibold text-foreground">{selectedZone}</span>
                </span>
                <button
                  onClick={handleReset}
                  className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors cursor-pointer"
                  aria-label="Sterge filtrul"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            )}

            {/* Legend */}
            <div className="mt-8 w-full max-w-sm">
              <p className="text-xs text-muted-foreground mb-2 text-center font-medium">
                Pret mediu pe m²
              </p>
              <div className="relative h-3 rounded-full overflow-hidden">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${priceToColor(PRICE_MIN)}, ${priceToColor(PRICE_MAX)})`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[11px] text-muted-foreground">
                  {formatEur(PRICE_MIN)}/m²
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {formatEur(PRICE_MAX)}/m²
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}