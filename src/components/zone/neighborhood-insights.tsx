'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Home,
  Activity,
  Star,
  ArrowRight,
  MapPin,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useZones } from '@/hooks/use-properties'
import { useAppStore } from '@/store/use-app-store'
import { formatPrice, formatSector } from '@/lib/utils'
import type { Zone } from '@/lib/types'

const demandTextColors: Record<string, string> = {
  Ridicata: 'text-red-500',
  Mare: 'text-orange-500',
  Moderata: 'text-amber-500',
  Scăzuta: 'text-emerald-500',
  Scazuta: 'text-emerald-500',
}

const demandBadgeVariants: Record<string, 'destructive' | 'secondary' | 'outline'> = {
  Ridicata: 'destructive',
  Mare: 'destructive',
  Moderata: 'secondary',
  Scăzuta: 'outline',
  Scazuta: 'outline',
}

const zoneProsCons: Record<string, { pros: string[]; contra: string[] }> = {
  Floreasca: {
    pros: ['Parcuri si lacuri', 'Zone rezidentiale premium'],
    contra: ['Preturi ridicate'],
  },
  Militari: {
    pros: ['Acces la metrou', 'Preturi accesibile'],
    contra: ['Trafic intens'],
  },
  Unirii: {
    pros: ['Centru istoric', 'Transport excelent'],
    contra: ['Zgomot si aglomeratie'],
  },
  Cotroceni: {
    pros: ['Arhitectura frumoasa', 'Universitati'],
    contra: ['Parcare limitata'],
  },
  Pipera: {
    pros: ['Zone noi moderne', 'Parcuri'],
    contra: ['Distanta de centru'],
  },
  Berceni: {
    pros: ['Preturi mici', 'Spatii noi'],
    contra: ['Infrastructura in dezvoltare'],
  },
}

function getDefaultProsCons(zoneName: string) {
  return zoneProsCons[zoneName] || {
    pros: ['Accesibil', 'In dezvoltare'],
    contra: ['Transport limitat'],
  }
}

function getZoneDescription(zone: Zone): string {
  if (zone.description) return zone.description

  const sectorLabel = zone.sector ? formatSector(zone.sector) : 'Bucuresti'
  const popularFor: string[] = zone.popularFor ? JSON.parse(zone.popularFor) : []
  const popularText = popularFor.length > 0 ? `Zona este apreciata pentru ${popularFor.slice(0, 3).join(', ').toLowerCase()}.` : ''

  return `${zone.name} este o zona din ${sectorLabel} cu o cerere ${zone.demand?.toLowerCase() || 'moderata'} pe piata imobiliara. ${popularText} Cu un pret mediu de ${zone.avgPriceSqm ? formatPrice(zone.avgPriceSqm) + '/m²' : 'n/a'}, reprezinta o optiune ${zone.avgPriceSqm && zone.avgPriceSqm > 3000 ? 'premium' : 'accesibila'} pentru cei care cauta ${popularFor[0]?.toLowerCase() || 'proprietati'}.`
}

function ZoneProfileCard({ zone }: { zone: Zone }) {
  const setSelectedZone = useAppStore((s) => s.setSelectedZone)
  const navigateTo = useAppStore((s) => s.navigateTo)
  const popularFor: string[] = zone.popularFor ? JSON.parse(zone.popularFor) : []
  const { pros, contra } = getDefaultProsCons(zone.name)
  const description = getZoneDescription(zone)
  const demandColor = demandTextColors[zone.demand] || 'text-muted-foreground'
  const demandBadgeVariant = demandBadgeVariants[zone.demand] || 'outline'

  const handleViewProperties = () => {
    setSelectedZone(zone.name)
    navigateTo('proprietati')
  }

  return (
    <motion.div
      key={zone.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="glass-card rounded-xl p-6"
    >
      {/* Header: name, sector badge, demand badge */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="text-2xl font-bold tracking-tight">{zone.name}</h3>
        </div>
        {zone.sector && (
          <Badge variant="outline" className="text-xs">
            {formatSector(zone.sector)}
          </Badge>
        )}
        <Badge variant={demandBadgeVariant} className="text-xs">
          <Activity className="h-3 w-3 mr-1" />
          {zone.demand}
        </Badge>
      </div>

      {/* Description */}
      <p className="text-muted-foreground text-sm leading-relaxed mb-6">
        {description}
      </p>

      {/* 4 key metrics in 2x2 grid */}
      <div className="grid grid-cols-2 gap-0 mb-6 rounded-lg border border-border/60 overflow-hidden">
        {/* Pret mediu/m² */}
        <div className="p-4 border-b border-r border-border/60">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1.5">
            {zone.avgPriceSqm && zone.avgPriceSqm >= 2500 ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
            )}
            Pret mediu/m²
          </div>
          <p className="text-lg font-bold">
            {zone.avgPriceSqm ? formatPrice(zone.avgPriceSqm) : 'N/A'}
          </p>
        </div>

        {/* Numar proprietati */}
        <div className="p-4 border-b border-border/60">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1.5">
            <Home className="h-3.5 w-3.5" />
            Numar proprietati
          </div>
          <p className="text-lg font-bold">
            {zone._count?.properties ?? 0}
          </p>
        </div>

        {/* Cerere */}
        <div className="p-4 border-r border-border/60">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1.5">
            <Activity className="h-3.5 w-3.5" />
            Cerere
          </div>
          <p className={`text-lg font-bold ${demandColor}`}>
            {zone.demand}
          </p>
        </div>

        {/* Popular pentru */}
        <div className="p-4">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1.5">
            <Star className="h-3.5 w-3.5" />
            Popular pentru
          </div>
          <p className="text-sm font-medium leading-snug">
            {popularFor.length > 0 ? popularFor.slice(0, 2).join(', ') : 'N/A'}
          </p>
        </div>
      </div>

      {/* Pro & Contra */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <h4 className="text-sm font-semibold mb-2 text-emerald-600 dark:text-emerald-400">Pro</h4>
          <ul className="space-y-1.5">
            {pros.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-2 text-amber-600 dark:text-amber-400">Contra</h4>
          <ul className="space-y-1.5">
            {contra.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4 text-amber-500 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA button */}
      <Button onClick={handleViewProperties} className="w-full sm:w-auto">
        Vezi proprietatile
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </motion.div>
  )
}

export function NeighborhoodInsights() {
  const { data: zones, isLoading } = useZones()

  const topZones = useMemo(() => {
    if (!zones) return []
    return [...zones]
      .sort((a, b) => (b.avgPriceSqm || 0) - (a.avgPriceSqm || 0))
      .slice(0, 6)
  }, [zones])

  if (isLoading) {
    return (
      <section id="insight" className="py-16 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-48 mb-3 mx-auto" />
          <Skeleton className="h-4 w-96 mb-8 mx-auto" />
          <Skeleton className="h-10 w-full max-w-2xl mb-6 mx-auto" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </section>
    )
  }

  if (!topZones.length) return null

  const defaultTab = topZones[0]?.slug || 'default'

  return (
    <section id="insight" className="py-16 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-10">
            <h2 className="section-header text-3xl font-bold tracking-tight inline-block">
              Insight Zone
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Descopera ce face fiecare zona speciala — infrastructura, lifestyle si investitii.
            </p>
          </div>

          <Tabs defaultValue={defaultTab} className="w-full">
            {/* Tab bar */}
            <TabsList className="w-full max-w-2xl mx-auto flex h-auto p-1 bg-muted/50 rounded-lg mb-6 overflow-x-auto scroll-horizontal">
              {topZones.map((zone) => (
                <TabsTrigger
                  key={zone.id}
                  value={zone.slug}
                  className="flex-1 min-w-[120px] text-xs sm:text-sm data-[state=active]:bg-accent data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:font-bold whitespace-nowrap"
                >
                  {zone.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Tab content */}
            <div className="relative min-h-[400px]">
              <AnimatePresence mode="wait">
                {topZones.map((zone) => (
                  <TabsContent key={zone.id} value={zone.slug} className="mt-0">
                    <ZoneProfileCard zone={zone} />
                  </TabsContent>
                ))}
              </AnimatePresence>
            </div>
          </Tabs>
        </motion.div>
      </div>
    </section>
  )
}
