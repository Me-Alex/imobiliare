'use client'

import { motion } from 'framer-motion'
import { BarChart3, Home, ChevronRight, TrendingUp, Activity, PieChart } from 'lucide-react'
import { MarketAnalytics } from '@/components/market-analytics'
import { ZoneCards } from '@/components/zone-cards'
import { ZoneMap } from '@/components/zone-map'
import { NeighborhoodInsights } from '@/components/neighborhood-insights'

export function AnalizaPage() {
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
              <span className="text-foreground font-medium">Analiza Piata</span>
            </nav>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Analiza de Piata</h1>
                <p className="text-muted-foreground mt-1">Tendinte, preturi si statistici imobiliare in Bucuresti</p>
              </div>
            </div>

            {/* Quick stat pills */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
              {[
                { icon: TrendingUp, label: 'Tendinta', value: 'In crestere +4.2%', color: 'text-emerald-600 dark:text-emerald-400' },
                { icon: Activity, label: 'Tranzactii/luna', value: '1,240+', color: 'text-amber-600 dark:text-amber-400' },
                { icon: PieChart, label: 'Cerere vs Oferta', value: 'Raport 1:1.3', color: 'text-rose-600 dark:text-rose-400' },
                { icon: BarChart3, label: 'Pret mediu/m²', value: '€2,850', color: 'text-teal-600 dark:text-teal-400' },
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
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                    <div className={`text-sm font-bold ${stat.color}`}>{stat.value}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* Market Analytics Charts */}
      <MarketAnalytics />

      <hr className="section-divider" />

      {/* Zone Overview Cards */}
      <ZoneCards />

      <hr className="section-divider" />

      {/* Interactive Zone Map */}
      <ZoneMap />

      <hr className="section-divider" />

      {/* Neighborhood Insights */}
      <NeighborhoodInsights />
    </>
  )
}