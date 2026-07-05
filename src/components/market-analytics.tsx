'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Minus, BarChart3, PieChartIcon, DollarSign, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, Pie, PieChart, Cell, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { useMarketData, useProperties } from '@/hooks/use-properties'
import { formatPrice } from '@/lib/api'

const priceTrendConfig: ChartConfig = {
  avgPriceSqm: {
    label: 'Pret mediu/m²',
    color: 'var(--chart-1)',
  },
}

const listingSoldConfig: ChartConfig = {
  totalListed: {
    label: 'Listate',
    color: 'var(--chart-1)',
  },
  soldCount: {
    label: 'Vandute',
    color: 'var(--chart-3)',
  },
}

const typeConfig: ChartConfig = {
  APARTMENT: { label: 'Apartament', color: 'var(--chart-1)' },
  HOUSE: { label: 'Casa', color: 'var(--chart-2)' },
  VILLA: { label: 'Vila', color: 'var(--chart-3)' },
  LAND: { label: 'Teren', color: 'var(--chart-4)' },
  COMMERCIAL: { label: 'Comercial', color: 'var(--chart-5)' },
}

const PIE_COLORS = [
  'oklch(0.527 0.14 160)',
  'oklch(0.65 0.17 140)',
  'oklch(0.75 0.12 85)',
  'oklch(0.60 0.15 25)',
  'oklch(0.55 0.10 290)',
]

const typeLabels: Record<string, string> = {
  APARTMENT: 'Apartament',
  HOUSE: 'Casa',
  VILLA: 'Vila',
  LAND: 'Teren',
  COMMERCIAL: 'Comercial',
}

function StatPill({
  icon: Icon,
  label,
  value,
  description,
  trend,
}: {
  icon: React.ElementType
  label: string
  value: string
  description: string
  trend?: 'up' | 'down' | 'stable'
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 transition-all duration-200 hover:shadow-md hover:shadow-primary/5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-bold tracking-tight truncate">{value}</span>
          {trend === 'up' && (
            <span className="flex items-center text-xs text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">+12%</span>
            </span>
          )}
          {trend === 'down' && (
            <span className="flex items-center text-xs text-red-500">
              <ArrowDownRight className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">-3%</span>
            </span>
          )}
          {trend === 'stable' && (
            <span className="flex items-center text-xs text-amber-500">
              <Minus className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground truncate">{description}</p>
      </div>
    </div>
  )
}

export function MarketAnalytics() {
  const { data: marketData, isLoading } = useMarketData()
  const { data: properties } = useProperties()

  const priceTrendData = useMemo(() => {
    if (!marketData?.length) return []
    const byWeek: Record<string, { week: string; avgPriceSqm: number }> = {}
    for (const d of marketData) {
      if (!byWeek[d.week]) byWeek[d.week] = { week: d.week, avgPriceSqm: 0 }
      byWeek[d.week].avgPriceSqm += d.avgPriceSqm
    }
    const entries = Object.values(byWeek)
    const counts: Record<string, number> = {}
    for (const d of marketData) {
      counts[d.week] = (counts[d.week] || 0) + 1
    }
    return entries
      .map((e) => ({
        week: e.week.slice(5),
        avgPriceSqm: Math.round(e.avgPriceSqm / (counts[e.week] || 1)),
      }))
      .sort((a, b) => a.week.localeCompare(b.week))
  }, [marketData])

  const listingSoldData = useMemo(() => {
    if (!marketData?.length) return []
    const byZone: Record<string, { zone: string; totalListed: number; soldCount: number }> = {}
    for (const d of marketData) {
      if (!byZone[d.zone]) byZone[d.zone] = { zone: d.zone, totalListed: 0, soldCount: 0 }
      byZone[d.zone].totalListed += d.totalListed
      byZone[d.zone].soldCount += d.soldCount
    }
    return Object.values(byZone).sort((a, b) => b.totalListed - a.totalListed).slice(0, 8)
  }, [marketData])

  const typeDistribution = useMemo(() => {
    if (!properties?.length) return []
    const byType: Record<string, number> = {}
    for (const p of properties) {
      byType[p.type] = (byType[p.type] || 0) + 1
    }
    return Object.entries(byType).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [properties])

  const totalVolume = useMemo(() => {
    if (!properties?.length) return 0
    return properties.reduce((sum, p) => sum + p.price, 0)
  }, [properties])

  const avgPrice = useMemo(() => {
    if (!properties?.length) return 0
    return Math.round(properties.reduce((sum, p) => sum + p.price, 0) / properties.length)
  }, [properties])

  if (isLoading) {
    return (
      <section id="analiza" className="py-16 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-80 rounded-2xl" />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="analiza" className="py-16 scroll-mt-20 relative overflow-hidden">
      {/* Subtle animated gradient orbs in the background */}
      <div className="floating-blob w-[400px] h-[400px] top-10 -left-32" style={{ background: 'oklch(0.527 0.14 160)' }} />
      <div className="floating-blob w-[350px] h-[350px] bottom-10 -right-24" style={{ background: 'oklch(0.65 0.17 140)' }} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Analiza de Piata</h2>
              <p className="text-muted-foreground mt-2">Tendinte si statistici imobiliare in timp real pentru Bucuresti.</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary shrink-0 badge-glow">
              <Clock className="h-3.5 w-3.5" />
              Perioada: Ultimele 8 saptamani
            </span>
          </div>

          <hr className="section-divider mb-8" />

          {/* Rounded stat pills with icons and trend arrows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatPill
              icon={DollarSign}
              label="Volum total piata"
              value={formatPrice(totalVolume)}
              description="Valoarea totala a proprietatilor"
              trend="up"
            />
            <StatPill
              icon={TrendingUp}
              label="Pret mediu"
              value={formatPrice(avgPrice)}
              description="Pretul mediu per proprietate"
              trend="up"
            />
            <StatPill
              icon={BarChart3}
              label="Zone active"
              value={listingSoldData.length?.toString() || '0'}
              description="Zone cu tranzactii active"
              trend="stable"
            />
            <StatPill
              icon={PieChartIcon}
              label="Tip cel mai popular"
              value={typeLabels[typeDistribution[0]?.name] || '-'}
              description={`${typeDistribution[0]?.value || 0} proprietati`}
              trend="up"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Area chart - Price trend */}
            <Card className="glass-card py-0 gap-0 rounded-2xl overflow-hidden relative">
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-base">Evolutie Pret mediu/m²</CardTitle>
                <CardDescription>Tendinta saptamanala a pretului mediu per metru patrat</CardDescription>
              </CardHeader>
              <CardContent className="pb-6 relative z-10">
                {priceTrendData.length > 0 ? (
                  <ChartContainer config={priceTrendConfig} className="h-[280px] w-full">
                    <AreaChart data={priceTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `${v}€`} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="avgPriceSqm"
                        stroke="var(--color-avgPriceSqm)"
                        fill="var(--color-avgPriceSqm)"
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                    Nu sunt date disponibile
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bar chart - Listed vs Sold */}
            <Card className="glass-card py-0 gap-0 rounded-2xl overflow-hidden relative">
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-base">Listate vs Vandute</CardTitle>
                <CardDescription>Comparatie proprietati listate si vandute pe zone</CardDescription>
              </CardHeader>
              <CardContent className="pb-6 relative z-10">
                {listingSoldData.length > 0 ? (
                  <ChartContainer config={listingSoldConfig} className="h-[280px] w-full">
                    <BarChart data={listingSoldData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="zone" tickLine={false} axisLine={false} fontSize={11} angle={-20} textAnchor="end" height={60} />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="totalListed" fill="var(--color-totalListed)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="soldCount" fill="var(--color-soldCount)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                    Nu sunt date disponibile
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pie chart - Type distribution */}
            {typeDistribution.length > 0 && (
              <Card className="glass-card py-0 gap-0 lg:col-span-2 rounded-2xl overflow-hidden relative">
                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="text-base">Distributia pe Tip de Proprietate</CardTitle>
                  <CardDescription>Proportia fiecarui tip de proprietate din piata</CardDescription>
                </CardHeader>
                <CardContent className="pb-6 relative z-10">
                  <ChartContainer config={typeConfig} className="h-[320px] w-full max-w-md mx-auto">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie
                        data={typeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={true}
                      >
                        {typeDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}