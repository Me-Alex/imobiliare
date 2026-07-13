'use client'

import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Activity, PieChart } from 'lucide-react'
import { MarketAnalytics } from '@/components/features/market-analytics'
import { ZoneCards } from '@/components/zone/zone-cards'
import { ZoneMap } from '@/components/zone/zone-map'
import { NeighborhoodInsights } from '@/components/zone/neighborhood-insights'
import { PageHero } from '@/components/layout/page-hero'

export function AnalizaPage() {
  return (
    <>
      <PageHero
        icon={BarChart3}
        title="Analiza de Piata"
        description="Tendinte, preturi si statistici imobiliare in Bucuresti"
        breadcrumb={[{ label: 'Acasa', page: 'acasa' }, { label: 'Analiza Piata' }]}
      >
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
      </PageHero>

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