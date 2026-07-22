'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, Trash2, XCircle, Clock, Building2, MapPin, Euro } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LS_KEYS } from '@/lib/constants'
import { loadFromLS, saveToLS } from '@/lib/storage'
import { toast } from 'sonner'
import type { ValuationFormData } from './valuation-form'
import type { ValuationResultData } from './valuation-result'

interface HistoryEntry {
  id: string
  date: string
  formData: ValuationFormData
  result: ValuationResultData
}

interface ValuationHistoryProps {
  onSelect: (entry: HistoryEntry) => void
}

export function ValuationHistory({ onSelect }: ValuationHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>(() =>
    loadFromLS<HistoryEntry[]>(LS_KEYS.VALUATION_HISTORY, [])
  )

  const refresh = useCallback(() => {
    setHistory(loadFromLS<HistoryEntry[]>(LS_KEYS.VALUATION_HISTORY, []))
  }, [])

  useEffect(() => {
    const handler = () => refresh()
    window.addEventListener('pm-valuation-history-updated', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('pm-valuation-history-updated', handler)
      window.removeEventListener('storage', handler)
    }
  }, [refresh])

  function deleteEntry(id: string) {
    try {
      const entries = loadFromLS<HistoryEntry[]>(LS_KEYS.VALUATION_HISTORY, [])
      const filtered = entries.filter((e) => e.id !== id)
      saveToLS(LS_KEYS.VALUATION_HISTORY, filtered)
      refresh()
      window.dispatchEvent(new Event('pm-valuation-history-updated'))
      toast.success('Evaluare stearsa din istoric')
    } catch {
      toast.error('Eroare la stergere')
    }
  }

  function clearAll() {
    try {
      saveToLS(LS_KEYS.VALUATION_HISTORY, [])
      refresh()
      window.dispatchEvent(new Event('pm-valuation-history-updated'))
      toast.success('Istoricul a fost sters')
    } catch {
      toast.error('Eroare la stergerea istoricului')
    }
  }

  function formatDate(isoString: string) {
    const d = new Date(isoString)
    return d.toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (history.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-8 text-center"
      >
        <History className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
        <h3 className="font-semibold text-base mb-1">Nicio evaluare salvata</h3>
        <p className="text-sm text-muted-foreground">
          Evaluările tale salvate vor apărea aici
        </p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Istoric Evaluari
          <span className="text-sm font-normal text-muted-foreground">
            ({history.length})
          </span>
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="text-muted-foreground hover:text-destructive"
        >
          <XCircle className="mr-1 h-4 w-4" />
          Sterge tot
        </Button>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
        <AnimatePresence>
          {history.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10, height: 0 }}
              className="glass-card glass-card-interactive rounded-xl p-4 flex items-center gap-4 group cursor-pointer"
              onClick={() => onSelect(entry)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    {entry.formData.type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {entry.formData.transaction}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {entry.formData.zone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Euro className="h-3 w-3" />
                    {entry.result.estimatedValue.toLocaleString('ro-RO')} EUR
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(entry.date)}
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteEntry(entry.id)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
