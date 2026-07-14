'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Building2, TrendingUp, MapPin, Star } from 'lucide-react'
import { usePropertiesPaginated, useZones } from '@/hooks/use-properties'

const statThemes = [
  { border: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: '#059669', darkIcon: '#34d399' },
  { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: '#d97706', darkIcon: '#fbbf24' },
  { border: '#14b8a6', bg: 'rgba(20, 184, 166, 0.1)', icon: '#0d9488', darkIcon: '#2dd4bf' },
  { border: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)', icon: '#e11d48', darkIcon: '#fb7185' },
]

function StatCard({
  icon: Icon,
  value,
  suffix,
  prefix,
  label,
  description,
  inView,
  index,
}: {
  icon: React.ElementType
  value: number
  suffix?: string
  prefix?: string
  label: string
  description: string
  inView: boolean
  index: number
}) {
  const theme = statThemes[index] || statThemes[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 group"
    >
      {/* Subtle inner glow on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{
        boxShadow: 'inset 0 0 30px oklch(0.527 0.14 160 / 6%)',
      }} />
      {/* Decorative corner dots */}
      <div className="absolute top-3 right-3 flex gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-10" style={{ color: theme.border }} />
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-10" style={{ color: theme.border }} />
      </div>
      {/* Colored left border accent */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
        style={{ backgroundColor: theme.border }}
      />
      <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-primary/5 -translate-y-8 translate-x-8" />
      <div className="relative">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl mb-4"
          style={{ backgroundColor: theme.bg }}
        >
          <Icon
            className="h-6 w-6"
            style={{ color: theme.icon }}
          />
        </div>
        <div className="text-3xl font-bold tracking-tight mb-1 counter-value">
          {prefix}{value.toLocaleString('ro-RO')}{suffix}
        </div>
        <div className="font-medium text-sm mb-0.5">{label}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  )
}

export function StatsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const { data: propertyPages } = usePropertiesPaginated()
  const { data: zones } = useZones()

  const properties = propertyPages?.pages.flatMap((page) => page.properties) ?? []
  const totalProperties = propertyPages?.pages[0]?.total ?? 0
  const avgPriceSqm = properties.length
    ? Math.round(
        properties.reduce((sum, p) => sum + (p.pricePerSqm || p.price / p.areaSqm), 0) / properties.length
      )
    : 0
  const activeZones = zones?.length || 0
  const featuredProperties = properties.filter((p) => p.featured).length

  return (
    <section ref={ref} className="py-16 relative overflow-hidden">
      {/* Gradient background that shifts — light mode */}
      <div className="absolute inset-0 gradient-shift" style={{
        background: 'linear-gradient(135deg, oklch(0.96 0.015 160 / 30%) 0%, oklch(0.96 0.01 80 / 20%) 50%, oklch(0.96 0.015 140 / 30%) 100%)',
      }} />
      {/* Gradient background that shifts — dark mode overlay */}
      <div className="absolute inset-0 hidden dark:block gradient-shift" style={{
        background: 'linear-gradient(135deg, oklch(0.20 0.03 160 / 20%) 0%, oklch(0.14 0.015 60 / 10%) 50%, oklch(0.20 0.03 140 / 20%) 100%)',
      }} />

      {/* Decorative dots pattern */}
      <div className="absolute inset-0 dots-pattern" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight">Piata Imobiliara Bucuresti</h2>
          <p className="text-muted-foreground mt-2">Cifre cheie actualizate in timp real</p>
        </div>

        <hr className="section-divider mb-8" />

        {/* Subtle animated gradient orb behind the stats grid */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none animate-gentle-float" style={{
          background: 'radial-gradient(circle, oklch(0.527 0.14 160 / 8%) 0%, transparent 70%)',
        }} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          <StatCard
            icon={Building2}
            value={totalProperties}
            suffix="+"
            label="Total Proprietati"
            description="Proprietati active in baza de date"
            inView={inView}
            index={0}
          />
          <StatCard
            icon={TrendingUp}
            value={avgPriceSqm}
            prefix="€"
            label="Pret mediu/m²"
            description="Medie pe toate zonele si tipurile"
            inView={inView}
            index={1}
          />
          <StatCard
            icon={MapPin}
            value={activeZones}
            label="Zone Active"
            description="Zone cu proprietati listate"
            inView={inView}
            index={2}
          />
          <StatCard
            icon={Star}
            value={featuredProperties}
            label="Oferte Populare"
            description="Proprietati recomandate de echipa"
            inView={inView}
            index={3}
          />
        </div>
      </div>
    </section>
  )
}
