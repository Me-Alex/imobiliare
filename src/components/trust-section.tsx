'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ShieldCheck, TrendingUp, Headphones, Scale, Bell, Lock } from 'lucide-react'

const trustThemes = [
  { border: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: '#059669' },
  { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: '#d97706' },
  { border: '#14b8a6', bg: 'rgba(20, 184, 166, 0.1)', icon: '#0d9488' },
  { border: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)', icon: '#e11d48' },
  { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', icon: '#7c3aed' },
  { border: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)', icon: '#0891b2' },
]

const features = [
  {
    icon: ShieldCheck,
    title: 'Date Verificate',
    description:
      'Fiecare proprietate este verificata manual de echipa noastra pentru a garanta acuratețea informațiilor.',
  },
  {
    icon: TrendingUp,
    title: 'Analiza in Timp Real',
    description:
      'Dashboard-ul nostru ofera date actualizate zilnic despre preturi, tendinte si cererea de piata.',
  },
  {
    icon: Headphones,
    title: 'Suport Dedicat',
    description:
      'Echipa de consultanti imobiliari este disponibila 7 zile din 7 pentru a te ajuta sa iei cea mai buna decizie.',
  },
  {
    icon: Scale,
    title: 'Compara Usor',
    description:
      'Instrumentul de comparare iti permite sa vezi proprietati side-by-side cu analiza detaliata.',
  },
  {
    icon: Bell,
    title: 'Alerte de Pret',
    description:
      'Primeste notificari instantanee cand proprietatile care te intereseaza scad de pret sau apar pe piata.',
  },
  {
    icon: Lock,
    title: 'Tranzactii Securizate',
    description:
      'Toate tranzactiile sunt protejate prin procesul nostru de verificare multipla si asistenta juridica.',
  },
]

function TrustCard({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: React.ElementType
  title: string
  description: string
  index: number
}) {
  const theme = trustThemes[index] || trustThemes[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
    >
      {/* Colored left border accent */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
        style={{ backgroundColor: theme.border }}
      />
      {/* Decorative circle */}
      <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-primary/5 -translate-y-8 translate-x-8" />
      <div className="relative">
        {/* Icon container */}
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl mb-4"
          style={{ backgroundColor: theme.bg }}
        >
          <Icon className="h-6 w-6" style={{ color: theme.icon }} />
        </div>
        {/* Title */}
        <h3 className="text-lg font-semibold tracking-tight mb-2">{title}</h3>
        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </motion.div>
  )
}

export function TrustSection() {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <section id="de-ce-noi" ref={ref} className="py-16 relative overflow-hidden scroll-mt-20">
      {/* Decorative dots pattern */}
      <div className="absolute inset-0 dots-pattern" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight gradient-text">De Ce PropMarket?</h2>
          <p className="text-muted-foreground mt-2">
            Motivele pentru care mii de cumparatori si investitori ne aleg
          </p>
        </div>

        <hr className="section-divider mb-8" />

        {/* 2x3 grid: mobile 1 col, tablet 2, desktop 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <TrustCard key={feature.title} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}