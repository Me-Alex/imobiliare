'use client'

import { motion } from 'framer-motion'
import { MapPin, Navigation, Layers, Compass } from 'lucide-react'
import { ZoneCards } from '@/components/zone/zone-cards'
import { ZoneMap } from '@/components/zone/zone-map'
import { NeighborhoodInsights } from '@/components/zone/neighborhood-insights'
import { PageHero } from '@/components/layout/page-hero'

export function ZonePage() {
  return (
    <>
      <PageHero
        icon={MapPin}
        title="Zone Bucuresti"
        description="Exploreaza fiecare zona si descopera preturile medii"
        breadcrumb={[{ label: 'Acasa', page: 'acasa' }, { label: 'Zone' }]}
      >
        {/* Quick zone stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
          {[
            { icon: Compass, label: 'Sectoare', value: '6 sectoare', desc: 'Acoperire completa' },
            { icon: Layers, label: 'Cartiere', value: '12+ zone', desc: 'Date detaliate' },
            { icon: Navigation, label: 'Harta Interactiva', value: 'Click pentru detalii', desc: 'Filtreaza dupa sector' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-medium">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </PageHero>

      {/* Interactive Zone Map */}
      <ZoneMap />

      <hr className="section-divider" />

      {/* Zone Cards */}
      <ZoneCards />

      <hr className="section-divider" />

      {/* Neighborhood Insights */}
      <NeighborhoodInsights />
    </>
  )
}