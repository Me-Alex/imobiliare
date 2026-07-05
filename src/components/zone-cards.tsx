'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Home } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useZones } from '@/hooks/use-properties'
import { formatPrice } from '@/lib/api'

const demandColors: Record<string, string> = {
  Ridicata: 'bg-red-500',
  Mare: 'bg-orange-500',
  Moderata: 'bg-amber-500',
  Scăzuta: 'bg-emerald-500',
  Scazuta: 'bg-emerald-500',
}

const demandBadgeVariant: Record<string, 'destructive' | 'secondary' | 'outline'> = {
  Ridicata: 'destructive',
  Mare: 'destructive',
  Moderata: 'secondary',
  Scăzuta: 'outline',
  Scazuta: 'outline',
}

export function ZoneCards() {
  const { data: zones, isLoading } = useZones()

  const sortedZones = useMemo(() => {
    if (!zones) return []
    return [...zones].sort((a, b) => (b.avgPriceSqm || 0) - (a.avgPriceSqm || 0))
  }, [zones])

  if (isLoading) {
    return (
      <section id="zone" className="py-16 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="zone" className="py-16 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-10">
            <h2 className="text-3xl font-bold tracking-tight">Zone din Bucuresti</h2>
            <p className="text-muted-foreground mt-2">Exploreaza preturile si cererea pentru fiecare zona in parte.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedZones.map((zone, index) => {
              const demandColor = demandColors[zone.demand] || 'bg-muted-foreground'
              const badgeVariant = demandBadgeVariant[zone.demand] || 'outline'
              const popularFor: string[] = zone.popularFor ? JSON.parse(zone.popularFor) : []

              return (
                <motion.div
                  key={zone.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="card-hover py-0 gap-0 h-full">
                    <CardContent className="p-5 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm leading-tight">{zone.name}</h3>
                            {zone.sector && <p className="text-xs text-muted-foreground">Sector {zone.sector}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className={`h-2 w-2 rounded-full ${demandColor}`} />
                          <span className="text-[11px] text-muted-foreground">{zone.demand}</span>
                        </div>
                      </div>

                      {zone.avgPriceSqm && (
                        <div className="mb-3">
                          <div className="text-lg font-bold text-primary">
                            {formatPrice(zone.avgPriceSqm)}<span className="text-xs font-normal text-muted-foreground">/m²</span>
                          </div>
                        </div>
                      )}

                      {/* Demand bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Nivel cerere</span>
                          <Badge variant={badgeVariant} className="text-[10px] h-5 px-1.5">
                            {zone.demand}
                          </Badge>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${demandColor} transition-all duration-500`}
                            style={{
                              width: zone.demand === 'Ridicata' ? '95%' : zone.demand === 'Mare' ? '75%' : zone.demand === 'Moderata' ? '50%' : '25%',
                            }}
                          />
                        </div>
                      </div>

                      {/* Popular for */}
                      {popularFor.length > 0 && (
                        <div className="mt-auto pt-3 border-t border-border/50">
                          <p className="text-[11px] text-muted-foreground mb-1.5">Popular pentru:</p>
                          <div className="flex flex-wrap gap-1">
                            {popularFor.slice(0, 3).map((item) => (
                              <span key={item} className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground bg-muted rounded-md px-1.5 py-0.5">
                                <Home className="h-2.5 w-2.5" />
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {zone._count && zone._count.properties > 0 && (
                        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                          <Home className="h-3 w-3" />
                          {zone._count.properties} proprietati
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}