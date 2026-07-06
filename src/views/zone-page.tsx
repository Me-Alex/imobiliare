'use client'

import { motion } from 'framer-motion'
import { MapPin, Home, ChevronRight, Navigation, Layers, Compass } from 'lucide-react'
import { ZoneCards } from '@/components/zone-cards'
import { ZoneMap } from '@/components/zone-map'
import { NeighborhoodInsights } from '@/components/neighborhood-insights'

export function ZonePage() {
  return (
    <>
      {/* Page Hero */}
      <section className="relative py-16 lg:py-20 bg-gradient-to-b from-primary/5 via-transparent to-transparent overflow-hidden">
        <div className="absolute inset-0 dots-pattern opacity-30" />
        <div className="floating-blob w-[400px] h-[400px] -top-32 -right-32" style={{ background: 'radial-gradient(circle, oklch(0.527 0.14 160 / 10%) 0%, transparent 70%)' }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
              <Home className="h-4 w-4" />
              <span>Acasa</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium">Zone</span>
            </nav>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Zone Bucuresti</h1>
                <p className="text-muted-foreground mt-1">Exploreaza fiecare zona si descopera preturile medii</p>
              </div>
            </div>

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
          </motion.div>
        </div>
      </section>

      <hr className="section-divider" />

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