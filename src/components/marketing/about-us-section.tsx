'use client'

import { Building2, Calendar, Home, MapPin, Users } from 'lucide-react'
import { motion, type Variants } from 'framer-motion'

const stats = [
  { icon: Calendar, value: '5+', label: 'Ani Experienta' },
  { icon: Home, value: '248+', label: 'Proprietati' },
  { icon: MapPin, value: '12', label: 'Zone Acoperite' },
  { icon: Users, value: '1450+', label: 'Clienti Multumiti' },
]

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

export function AboutUsSection() {
  return (
    <section id="despre-noi" className="bg-muted/30 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left — Stylized placeholder image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative mx-auto w-full max-w-md lg:max-w-none"
          >
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-emerald-200/30 dark:to-emerald-900/20" />
              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              {/* Centered content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 backdrop-blur-sm border border-primary/20">
                  <Building2 className="h-10 w-10 text-primary" />
                </div>
                <span className="text-2xl font-bold tracking-tight gradient-text-warm">Est. 2024</span>
              </div>
            </div>
            {/* Decorative accent */}
            <div className="absolute -bottom-3 -right-3 h-24 w-24 rounded-xl bg-primary/10 -z-10" />
            <div className="absolute -top-3 -left-3 h-16 w-16 rounded-lg bg-primary/5 -z-10" />
          </motion.div>

          {/* Right — Text content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <h2 className="section-header text-3xl font-bold tracking-tight">
                Despre HQS Imobiliare
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
              className="mt-6 space-y-4 text-muted-foreground leading-relaxed"
            >
              <p>
                HQS Imobiliare s-a născut din dorința de a aduce transparența totală în piața imobiliară din
                București. Ne propunem să transformăm experiența de căutare a proprietăților printr-o
                platformă bazată exclusiv pe date verificate și analize de piață în timp real. Fiecare
                proprietate din portofoliul nostru este atent evaluată pentru a te ajuta să iei cele mai
                bune decizii de investiție.
              </p>
              <p>
                Suntem dedicați furnizării de informații exacte și instrumente intuitive care simplifică
                procesul de cumpărare, vânzare sau închiriere. Echipa noastră de experți monitorizează
                continuu tendințele pieței, astfel încât tu să ai mereu acces la cele mai recente și mai
                relevante date imobiliare din București.
              </p>
            </motion.div>

            {/* Stat cards */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="mt-8 grid grid-cols-2 gap-3 sm:gap-4"
            >
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <motion.div
                    key={stat.label}
                    variants={itemVariants}
                    className="flex items-center gap-3 rounded-xl border border-border/50 bg-background p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-bold leading-tight counter-value">{stat.value}</p>
                      <p className="text-xs text-muted-foreground leading-snug">{stat.label}</p>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
