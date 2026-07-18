'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BadgeDollarSign,
  Brain,
  BarChart3,
  FileText,
  History,
  Calculator,
  MapPin,
  Ruler,
  Layers,
  CalendarDays,
  ShieldCheck,
} from 'lucide-react'
import { PageHero } from '@/components/layout/page-hero'
import { ValuationForm, type ValuationFormData } from '@/components/features/valuation-form'
import { ValuationResult, type ValuationResultData } from '@/components/features/valuation-result'
import { ValuationHistory } from '@/components/features/valuation-history'
import { toast } from 'sonner'

interface HistoryEntry {
  id: string
  date: string
  formData: ValuationFormData
  result: ValuationResultData
}

export function EvaluarePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ValuationResultData | null>(null)
  const [resultFormData, setResultFormData] = useState<ValuationFormData | null>(null)

  const handleSubmit = useCallback(async (data: ValuationFormData) => {
    setIsLoading(true)
    setResult(null)
    setResultFormData(data)

    try {
      const res = await fetch('/api/valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Eroare la evaluare')
      }

      const json = await res.json() as ValuationResultData
      setResult(json)

      if (json._fallback) {
        toast.info('Estimarea a fost generată cu date de rezervă')
      } else {
        toast.success('Evaluare completă!')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Eroare necunoscută'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleHistorySelect = useCallback((entry: HistoryEntry) => {
    setResultFormData(entry.formData)
    setResult(entry.result)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <>
      <PageHero
        icon={BadgeDollarSign}
        title="Evaluare Imobiliara"
        description="Estimeaza valoarea de piata a proprietatii tale cu ajutorul AI"
        breadcrumb={[{ label: 'Acasă', page: 'acasa' }, { label: 'Servicii', page: 'servicii' }, { label: 'Evaluare imobiliară' }]}
      >
        {/* Quick info cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          {[
            { icon: Brain, label: 'Evaluare AI', desc: 'Analiza inteligenta' },
            { icon: BarChart3, label: 'Date reale', desc: 'Bazat pe piata' },
            { icon: FileText, label: 'Raport detaliat', desc: 'Recomandari incluse' },
            { icon: History, label: 'Istoric evaluari', desc: 'Salveaza rezultatele' },
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
                <div className="text-sm font-medium">{stat.label}</div>
                <div className="text-xs text-muted-foreground">{stat.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </PageHero>

      {/* Main Content */}
      <section className="py-10 lg:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Form — left side on desktop */}
            <div className="lg:col-span-2">
              <ValuationForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>

            {/* Result — right side on desktop */}
            <div className="lg:col-span-3">
              {isLoading && !result && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card rounded-2xl p-12 text-center"
                >
                  <div className="h-10 w-10 mx-auto mb-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <p className="text-muted-foreground font-medium">Analizăm datele proprietății...</p>
                  <p className="text-xs text-muted-foreground mt-1">Acest proces poate dura câteva secunde</p>
                </motion.div>
              )}

              {result && resultFormData && (
                <ValuationResult result={result} formData={resultFormData} />
              )}

              {!isLoading && !result && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card rounded-2xl p-12 text-center"
                >
                  <BadgeDollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-1">
                    Evaluează-ți proprietatea
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Completează formularul din stânga și vei primi o estimare detaliată bazată pe analiza AI a pieței imobiliare din București
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          {/* History Section */}
          <div className="mt-12">
            <ValuationHistory onSelect={handleHistorySelect} />
          </div>
        </div>
      </section>

      {/* Extra Info Section */}
      <section className="py-16 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="section-header mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight">Cum Funcționează Evaluarea</h2>
            <p className="text-muted-foreground mt-2">Tot ce trebuie să știi despre estimările noastre</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Cum functioneaza?',
                text: 'Sistemul nostru utilizează inteligența artificială pentru a analiza datele proprietății tale și a le compara cu tranzacțiile recente de pe piață. Algoritmul ia în considerare multiple variabile: locația, suprafața, numărul de camere, starea proprietății și tendințele pieței imobiliare din București pentru a genera o estimare cât mai precisă.',
                icon: Calculator,
              },
              {
                title: 'Factori de influenta',
                text: 'Prețul estimat este influențat de: zona (zonele centrale și premium precum Dorobanți, Primăverii au prețuri mai ridicate), suprafața totală în m², numărul de camere, etajul (pentru apartamente — etajele intermediare sunt mai căutate), anul construcției și starea generală a proprietății.',
                icon: Layers,
              },
              {
                title: 'Precizia estimarii',
                text: 'Estimarea oferită este o indicație a valorii de piață bazată pe date disponibile și algoritmi AI. Aceasta nu înlocuiește o evaluare profesională realizată de un evaluator autorizat ANEVAR. Recomandăm să folosiți această estimare ca punct de plecare în luarea deciziilor imobiliare.',
                icon: ShieldCheck,
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
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
