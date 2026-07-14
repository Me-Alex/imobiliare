'use client'

import { motion } from 'framer-motion'
import {
  Euro,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Lightbulb,
  BookmarkPlus,
  Search,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/use-app-store'
import { toast } from 'sonner'
import type { ValuationFormData } from './valuation-form'
import { LS_KEYS } from '@/lib/constants'

export interface ValuationResultData {
  estimatedValue: number
  pricePerSqm: number
  confidenceRange: [number, number]
  marketTrend: string
  zoneAnalysis: string
  recommendations: string[]
  comparableProperties: Array<{
    title: string
    zone: string
    price: number
    areaSqm: number
    pricePerSqm: number
  }>
  _fallback?: boolean
}

interface ValuationResultProps {
  result: ValuationResultData
  formData: ValuationFormData
}

function formatPrice(value: number, transaction: string) {
  const isRent = transaction.toLowerCase().includes('inchiriere')
  const formatted = value.toLocaleString('ro-RO')
  return `${formatted} ${isRent ? 'EUR/lună' : 'EUR'}`
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend.toLowerCase().includes('crestere') || trend.toLowerCase().includes('increase')) {
    return <TrendingUp className="h-4 w-4 text-emerald-600" />
  }
  if (trend.toLowerCase().includes('scadere') || trend.toLowerCase().includes('decrease')) {
    return <TrendingDown className="h-4 w-4 text-red-500" />
  }
  return <Minus className="h-4 w-4 text-amber-500" />
}

function trendBadgeClass(trend: string) {
  if (trend.toLowerCase().includes('crestere') || trend.toLowerCase().includes('increase')) {
    return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700'
  }
  if (trend.toLowerCase().includes('scadere') || trend.toLowerCase().includes('decrease')) {
    return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700'
  }
  return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700'
}

export function ValuationResult({ result, formData }: ValuationResultProps) {
  const navigateTo = useAppStore((s) => s.navigateTo)

  const [minVal, maxVal] = result.confidenceRange
  const rangeSpan = maxVal - minVal
  const positionPercent = rangeSpan > 0
    ? Math.min(100, Math.max(0, ((result.estimatedValue - minVal) / rangeSpan) * 100))
    : 50

  function handleSaveToHistory() {
    try {
      const stored = localStorage.getItem(LS_KEYS.VALUATION_HISTORY)
      const history: Array<{
        id: string
        date: string
        formData: ValuationFormData
        result: ValuationResultData
      }> = stored ? JSON.parse(stored) : []

      history.unshift({
        id: `val-${Date.now()}`,
        date: new Date().toISOString(),
        formData,
        result,
      })

      // Keep max 20 entries
      if (history.length > 20) history.length = 20

      localStorage.setItem(LS_KEYS.VALUATION_HISTORY, JSON.stringify(history))
      toast.success('Evaluare salvată în istoric')
    } catch {
      toast.error('Eroare la salvarea evaluării')
    }
  }

  function handleViewSimilar() {
    navigateTo('proprietati')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-6"
    >
      {/* Main Value Card */}
      <div className="glass-card rounded-2xl p-6 lg:p-8">
        {result._fallback && (
          <Badge variant="outline" className="mb-4 text-xs text-amber-600 border-amber-300">
            Estimare de rezervă (AI indisponibil)
          </Badge>
        )}

        <div className="text-center mb-6">
          <p className="text-sm text-muted-foreground mb-2">Valoare estimată</p>
          <div className="flex items-center justify-center gap-2">
            <Euro className="h-8 w-8 text-primary" />
            <span className="text-4xl lg:text-5xl font-bold tracking-tight text-primary">
              {formatPrice(result.estimatedValue, formData.transaction)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-center gap-3 text-sm">
            <span className="text-muted-foreground">
              {result.pricePerSqm.toLocaleString('ro-RO')} EUR/m²
            </span>
            <span className="text-border">|</span>
            <Badge variant="outline" className={trendBadgeClass(result.marketTrend)}>
              <TrendIcon trend={result.marketTrend} />
              <span className="ml-1">{result.marketTrend}</span>
            </Badge>
          </div>
        </div>

        {/* Confidence Range Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Aprovizionare estimativă</span>
          </div>
          <div className="relative">
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400/60 via-primary/40 to-primary/60 rounded-full" style={{ width: '100%' }} />
            </div>
            {/* Marker */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-primary border-2 border-background shadow-md"
              style={{ left: `${positionPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{minVal.toLocaleString('ro-RO')} EUR</span>
            <span className="text-foreground font-medium">{result.estimatedValue.toLocaleString('ro-RO')} EUR</span>
            <span>{maxVal.toLocaleString('ro-RO')} EUR</span>
          </div>
        </div>
      </div>

      {/* Zone Analysis + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Zone Analysis */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-base">Analiza Zonei</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {result.zoneAnalysis}
          </p>
        </div>

        {/* Recommendations */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold text-base">Recomandări</h3>
          </div>
          <ul className="space-y-2">
            {result.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Comparable Properties */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-semibold text-base mb-4">Proprietăți Comparabile</h3>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left py-2 font-medium text-muted-foreground">Titlu</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Zonă</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Preț</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Suprafață</th>
                <th className="text-right py-2 font-medium text-muted-foreground">€/m²</th>
              </tr>
            </thead>
            <tbody>
              {result.comparableProperties.map((prop, i) => (
                <tr key={i} className="border-b border-border/30 last:border-0">
                  <td className="py-3 font-medium">{prop.title}</td>
                  <td className="py-3 text-muted-foreground">{prop.zone}</td>
                  <td className="py-3 text-right font-medium">
                    {prop.price.toLocaleString('ro-RO')} EUR
                  </td>
                  <td className="py-3 text-right text-muted-foreground">
                    {prop.areaSqm} m²
                  </td>
                  <td className="py-3 text-right font-medium text-primary">
                    {prop.pricePerSqm.toLocaleString('ro-RO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={handleSaveToHistory}
          className="flex-1 h-11"
        >
          <BookmarkPlus className="mr-2 h-4 w-4" />
          Salvează în Istoric
        </Button>
        <Button
          onClick={handleViewSimilar}
          className="flex-1 h-11"
        >
          <Search className="mr-2 h-4 w-4" />
          Vezi Proprietăți Similare
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}