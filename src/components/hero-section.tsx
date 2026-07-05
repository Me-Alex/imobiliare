'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, MapPin, Home, TrendingUp, Users, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/store/use-app-store'
import { useZones } from '@/hooks/use-properties'

function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setInView(true), 300)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!inView) return
    let start = 0
    const duration = 2000
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
  }, [inView, target])

  return (
    <span>
      {prefix}
      {count.toLocaleString('ro-RO')}
      {suffix}
    </span>
  )
}

const stats = [
  { icon: Home, label: 'Proprietati', value: 248, suffix: '+' },
  { icon: TrendingUp, label: 'Pret mediu/m²', value: 2850, prefix: '€', suffix: '' },
  { icon: MapPin, label: 'Zone acoperite', value: 12, suffix: '' },
  { icon: Users, label: 'Clienti multumiti', value: 1450, suffix: '+' },
]

export function HeroSection() {
  const { searchQuery, setSearchQuery, selectedZone, setSelectedZone, selectedType, setSelectedType } = useAppStore()
  const { data: zones } = useZones()

  const scrollToProperties = useCallback(() => {
    document.getElementById('proprietati')?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80)',
        }}
      />
      <div className="hero-gradient absolute inset-0" />

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="max-w-3xl"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary-foreground backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Analiza imobiliara in timp real
            </span>
          </motion.div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4">
            Proprietati{' '}
            <span className="text-primary">Premium</span>
            <br />
            in Bucuresti
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-xl">
            Descopera proprietati verificate, analize de pret si tendinte de piata pentru cele mai cautate zone din Bucuresti.
          </p>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-12">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cauta dupa titlu sau adresa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-white/95 dark:bg-card/95 backdrop-blur-sm border-0 shadow-lg"
              />
            </div>
            <Select value={selectedZone || 'all'} onValueChange={(v) => setSelectedZone(v === 'all' ? '' : v)}>
              <SelectTrigger className="h-12 w-full sm:w-44 bg-white/95 dark:bg-card/95 backdrop-blur-sm border-0 shadow-lg">
                <SelectValue placeholder="Toate zonele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate zonele</SelectItem>
                {zones?.map((z) => (
                  <SelectItem key={z.id} value={z.name}>
                    {z.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedType || 'all'} onValueChange={(v) => setSelectedType(v === 'all' ? '' : v)}>
              <SelectTrigger className="h-12 w-full sm:w-40 bg-white/95 dark:bg-card/95 backdrop-blur-sm border-0 shadow-lg">
                <SelectValue placeholder="Tip" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate tipurile</SelectItem>
                <SelectItem value="APARTMENT">Apartament</SelectItem>
                <SelectItem value="HOUSE">Casa</SelectItem>
                <SelectItem value="VILLA">Vila</SelectItem>
                <SelectItem value="LAND">Teren</SelectItem>
                <SelectItem value="COMMERCIAL">Comercial</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="lg"
              className="h-12 px-8 shadow-lg"
              onClick={scrollToProperties}
            >
              Cauta
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center sm:text-left">
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  <AnimatedCounter
                    target={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                  />
                </div>
                <div className="text-sm text-white/60 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}