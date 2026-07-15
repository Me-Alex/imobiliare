'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight, Building2, Calculator, MapPin, Star, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/use-app-store'
import { usePropertiesPaginated, useZones } from '@/hooks/use-properties'

export function CtaSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const navigateTo = useAppStore((s) => s.navigateTo)
  const { data: propertyPages } = usePropertiesPaginated()
  const { data: zones } = useZones()
  const properties = propertyPages?.pages.flatMap((page) => page.properties) ?? []
  const trustItems = [
    { icon: Building2, label: `${propertyPages?.pages[0]?.total ?? 0} Proprietati active` },
    { icon: MapPin, label: `${zones?.length ?? 0} Zone` },
    { icon: Star, label: `${properties.filter((property) => property.featured).length} Oferte populare` },
  ]

  return (
    <section
      ref={ref}
      className="relative py-20 lg:py-28 overflow-hidden"
      aria-label="Call to action"
    >
      {/* Dark emerald gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 gradient-shift" />

      {/* Dots pattern overlay */}
      <div className="absolute inset-0 dots-pattern opacity-100" />

      {/* Grid lines overlay */}
      <div className="absolute inset-0 grid-lines opacity-50 pointer-events-none" />

      {/* Floating Particles */}
      <div className="particle h-2 w-2 bg-emerald-400/15 z-[1]" style={{ top: '20%', left: '15%', '--duration': '6s', '--delay': '0s' } as React.CSSProperties} />
      <div className="particle h-1.5 w-1.5 bg-emerald-400/15 z-[1]" style={{ top: '35%', left: '80%', '--duration': '5s', '--delay': '1s' } as React.CSSProperties} />
      <div className="particle h-2.5 w-2.5 bg-emerald-400/15 z-[1]" style={{ top: '70%', left: '25%', '--duration': '7s', '--delay': '2s' } as React.CSSProperties} />
      <div className="particle h-1.5 w-1.5 bg-emerald-400/15 z-[1]" style={{ top: '60%', left: '70%', '--duration': '5.5s', '--delay': '0.5s' } as React.CSSProperties} />

      {/* Decorative glow orbs */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="cta-gradient-border rounded-xl"
        >
          <div className="relative rounded-xl bg-emerald-900/80 backdrop-blur-sm px-6 py-12 sm:px-12 sm:py-16 text-center">
            {/* Shield icon badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/30"
            >
              <Shield className="h-7 w-7 text-emerald-300" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white"
            >
              Gaseste proprietatea perfecta
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-emerald-100/80 leading-relaxed"
            >
              Exploreaza oferte actualizate si gaseste locuinta potrivita cu ajutorul HQS Imobiliare.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                size="lg"
                onClick={() => navigateTo('proprietati')}
                className="bg-white text-emerald-900 hover:bg-emerald-50 font-semibold h-12 px-8 text-base gap-2 shadow-lg shadow-black/10 transition-all hover:shadow-xl hover:shadow-black/15"
              >
                Explora Proprietati
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigateTo('calculator')}
                className="border-emerald-400/40 text-white hover:bg-emerald-800/60 hover:text-white hover:border-emerald-300/60 font-semibold h-12 px-8 text-base transition-all"
              >
                <Calculator className="h-4 w-4" />
                Calculeaza rata
              </Button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10"
            >
              {trustItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2.5 text-emerald-100/90"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 ring-1 ring-emerald-400/20">
                    <item.icon className="h-5 w-5 text-emerald-300" />
                  </div>
                  <span className="text-sm sm:text-base font-medium">{item.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
