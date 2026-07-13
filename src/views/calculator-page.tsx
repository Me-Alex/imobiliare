'use client'

import { motion } from 'framer-motion'
import { Calculator, Euro, Percent, Calendar, Info } from 'lucide-react'
import { MortgageCalculator } from '@/components/features/mortgage-calculator'
import { PageHero } from '@/components/layout/page-hero'

export function CalculatorPage() {
  return (
    <>
      <PageHero
        icon={Calculator}
        title="Calculator Ipotecar"
        description="Estimeaza rata lunara si planul de amortizare"
        breadcrumb={[{ label: 'Acasa', page: 'acasa' }, { label: 'Calculator' }]}
      >
        {/* Quick info cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          {[
            { icon: Euro, label: 'Dobanda medie', value: '5.4% - 6.2%', desc: 'EURIBOR + marja' },
            { icon: Calendar, label: 'Perioada', value: '5 - 30 ani', desc: 'Flexibila' },
            { icon: Percent, label: 'Avans minim', value: '15% - 25%', desc: 'Dupa tip credit' },
            { icon: Info, label: 'DAE mediu', value: '~6.8%', desc: 'Cost total credit' },
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
                <div className="text-sm font-medium">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label} · {stat.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </PageHero>

      {/* Calculator */}
      <MortgageCalculator />

      {/* Extra info section below calculator */}
      <section className="py-16 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="section-header mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight">Informatii Utile despre Credite Ipotecare</h2>
            <p className="text-muted-foreground mt-2">Tot ce trebuie sa stii inainte de a aplica</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Ce este DAE?',
                text: 'DAE (Dobanda Anuala Efectiva) reprezinta costul total al creditului, inclusiv dobanda, comisioanele si alte costuri. Este cel mai important indicator pentru compararea ofertelor de credit.',
              },
              {
                title: 'Avansul necesar',
                text: 'In general, bancile solicita un avans de 15-25% din valoarea proprietatii pentru credite ipotecare in lei si 25% pentru cele in euro. Un avans mai mare inseamna o rata lunara mai mica.',
              },
              {
                title: 'Documente necesare',
                text: 'Acte de identitate, adeverinta de venit, extras de cont (3-6 luni), acte proprietate, evaluare imobiliara, certificat fiscal. Unele banci pot solicita documente suplimentare.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * i, duration: 0.5 }}
                className="glass-card p-6 rounded-2xl"
              >
                <h3 className="font-semibold text-lg mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}