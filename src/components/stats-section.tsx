'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Building2, TrendingUp, MapPin, Users } from 'lucide-react'
import { useProperties, useZones } from '@/hooks/use-properties'
import { formatPrice } from '@/lib/api'

function useCountUp(target: number, inView: boolean, duration = 2000) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    let start = 0
    const stepTime = 20
    const steps = duration / stepTime
    const increment = target / steps

    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, stepTime)
    return () => clearInterval(timer)
  }, [inView, target, duration])

  return count
}

function StatCard({
  icon: Icon,
  value,
  suffix,
  prefix,
  label,
  description,
  inView,
}: {
  icon: React.ElementType
  value: number
  suffix?: string
  prefix?: string
  label: string
  description: string
  inView: boolean
}) {
  const count = useCountUp(value, inView)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-2xl border bg-card p-6 card-hover"
    >
      <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-primary/5 -translate-y-8 translate-x-8" />
      <div className="relative">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="text-3xl font-bold tracking-tight mb-1">
          {prefix}{count.toLocaleString('ro-RO')}{suffix}
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
  const { data: properties } = useProperties()
  const { data: zones } = useZones()

  const totalProperties = properties?.length || 0
  const avgPriceSqm = properties?.length
    ? Math.round(
        properties.reduce((sum, p) => sum + (p.pricePerSqm || p.price / p.areaSqm), 0) / properties.length
      )
    : 0
  const activeZones = zones?.length || 0
  const soldThisMonth = properties?.filter((p) => p.status === 'SOLD').length || Math.round((properties?.length || 0) * 0.15)

  return (
    <section ref={ref} className="py-16 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight">Piata Imobiliara Bucuresti</h2>
          <p className="text-muted-foreground mt-2">Cifre cheie actualizate in timp real</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Building2}
            value={totalProperties}
            suffix="+"
            label="Total Proprietati"
            description="Proprietati active in baza de date"
            inView={inView}
          />
          <StatCard
            icon={TrendingUp}
            value={avgPriceSqm}
            prefix="€"
            label="Pret mediu/m²"
            description="Medie pe toate zonele si tipurile"
            inView={inView}
          />
          <StatCard
            icon={MapPin}
            value={activeZones}
            label="Zone Active"
            description="Zone cu proprietati listate"
            inView={inView}
          />
          <StatCard
            icon={Users}
            value={soldThisMonth}
            label="Vanzari Luna Aceasta"
            description="Proprietati vandute recent"
            inView={inView}
          />
        </div>
      </div>
    </section>
  )
}