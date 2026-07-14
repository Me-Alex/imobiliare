'use client'

import { motion, type Variants } from 'framer-motion'
import { Handshake } from 'lucide-react'

const bankPartners = [
  'Banca Transilvania',
  'BRD',
  'ING Romania',
  'OTP Bank',
  'Alpha Bank',
  'UniCredit',
]

const realEstatePartners = ['RE/MAX', 'Century 21', 'Keller Williams']

const allPartners = [...bankPartners, ...realEstatePartners]

// Duplicate for seamless infinite scroll
const marqueeItems = [...allPartners, ...allPartners, ...allPartners]

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

export function PartnersSection() {
  return (
    <section id="parteneri" className="scroll-mt-20 py-16 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <Handshake className="h-4 w-4" />
            Parteneriate
          </div>
          <h2 className="section-title-accent text-3xl font-bold tracking-tight sm:text-4xl">
            Partenerii nostri de incredere
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Colaboram cu cele mai importante banci si agentii imobiliare din Romania.
          </p>
        </motion.div>

        {/* Marquee row — infinite scroll */}
        <div className="relative overflow-hidden py-4 mb-10">
          {/* Fade edges */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-24 bg-gradient-to-r from-muted/20 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-24 bg-gradient-to-l from-muted/20 to-transparent" />

          <motion.div
            className="flex gap-4 w-max"
            animate={{ x: ['0%', '-33.33%'] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: 'loop',
                duration: 30,
                ease: 'linear',
              },
            }}
          >
            {marqueeItems.map((name, index) => (
              <div
                key={`${name}-${index}`}
                className="flex h-14 shrink-0 items-center rounded-xl border border-border/50 bg-card/60 px-6 backdrop-blur-sm transition-all duration-200 hover:border-emerald-500/30 hover:bg-card hover:shadow-md"
              >
                <span className="whitespace-nowrap text-sm font-semibold tracking-wide text-muted-foreground hover:text-foreground transition-colors">
                  {name}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Grid of partner cards */}
        <motion.div
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {allPartners.map((name, index) => (
            <motion.div
              key={name}
              variants={cardVariants}
              className="group relative flex items-center justify-center rounded-2xl border border-border/50 bg-card/40 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/30 hover:bg-card hover:shadow-lg hover:shadow-emerald-500/5"
            >
              {/* Glassmorphism shine */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative text-center text-sm font-bold tracking-wide text-muted-foreground transition-colors group-hover:text-foreground">
                {name}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
