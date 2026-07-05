'use client'

import { motion } from 'framer-motion'
import { Search, BarChart3, Scale, MessageSquare } from 'lucide-react'

const steps = [
  {
    number: 1,
    title: 'Cauta Proprietatea',
    description:
      'Foloseste filtrele noastre avansate pentru a gasi proprietatea ideala in functie de zona, pret, suprafata si facilitati.',
    icon: Search,
  },
  {
    number: 2,
    title: 'Analizeaza Datele',
    description:
      'Acceseaza dashboard-ul analitic cu preturi actualizate zilnic, tendinte de piata si comparatii intre zone.',
    icon: BarChart3,
  },
  {
    number: 3,
    title: 'Compara Ofertele',
    description:
      'Pune proprietatile side-by-side si compara toate detaliile importante pentru a lua cea mai buna decizie.',
    icon: Scale,
  },
  {
    number: 4,
    title: 'Contacteaza-ne',
    description:
      'Echipa noastra de consultanti imobiliari te ajuta cu toate detaliile tranzactiei, de la negociere pana la semnare.',
    icon: MessageSquare,
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const stepVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

export function HowItWorks() {
  return (
    <section id="cum-functioneaza" className="scroll-mt-20 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="mb-14 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title-accent text-3xl font-bold tracking-tight sm:text-4xl">
            Cum Functioneaza
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Gaseste proprietatea potrivita in doar 4 pasi simpli.
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Desktop: horizontal timeline */}
          <div className="relative hidden md:block">
            {/* Connecting line */}
            <div className="absolute top-16 left-[calc(12.5%+28px)] right-[calc(12.5%+28px)] h-0.5 bg-gradient-to-r from-emerald-500/20 via-emerald-500/40 to-emerald-500/20" />

            <div className="grid grid-cols-4 gap-6">
              {steps.map((step, index) => {
                const Icon = step.icon
                return (
                  <motion.div
                    key={step.number}
                    variants={stepVariants}
                    className="relative flex flex-col items-center text-center"
                  >
                    {/* Step circle */}
                    <div className="relative z-10 mb-5">
                      <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-card border-2 border-emerald-500 shadow-lg shadow-emerald-500/20">
                        <Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        {/* Pulse ring */}
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-emerald-500/40"
                          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            delay: index * 0.5,
                            ease: 'easeInOut',
                          }}
                        />
                      </div>
                      {/* Step number badge */}
                      <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white shadow-md">
                        {step.number}
                      </div>
                    </div>

                    {/* Step content */}
                    <h3 className="mb-2 text-lg font-semibold tracking-tight">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground max-w-[220px]">
                      {step.description}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Mobile: vertical timeline */}
          <div className="relative md:hidden">
            {/* Vertical line */}
            <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500/20 via-emerald-500/40 to-emerald-500/20" />

            <div className="flex flex-col gap-8">
              {steps.map((step) => {
                const Icon = step.icon
                return (
                  <motion.div
                    key={step.number}
                    variants={stepVariants}
                    className="relative flex gap-5"
                  >
                    {/* Step circle */}
                    <div className="relative z-10 shrink-0">
                      <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-card border-2 border-emerald-500 shadow-lg shadow-emerald-500/20">
                        <Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-emerald-500/40"
                          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            delay: (step.number - 1) * 0.5,
                            ease: 'easeInOut',
                          }}
                        />
                      </div>
                      <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white shadow-md">
                        {step.number}
                      </div>
                    </div>

                    {/* Step content */}
                    <div className="pt-1">
                      <h3 className="mb-1.5 text-lg font-semibold tracking-tight">{step.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}