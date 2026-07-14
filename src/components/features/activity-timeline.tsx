'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import {
  CalendarCheck,
  Building2,
  Search,
  TrendingUp,
  FileText,
  Clock,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { loadFromLS } from '@/lib/storage'
import { LS_KEYS } from '@/lib/constants'
import type { Vizionare, UserProperty, UploadedDocument, SavedSearch } from '@/lib/types'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ActivityItem {
  id: string
  type: 'vizionare' | 'property' | 'search_saved' | 'valuation' | 'document'
  title: string
  description: string
  timestamp: string
  icon: LucideIcon
  color: string
}

// ─── Color map per type ─────────────────────────────────────────────────────

const TYPE_STYLES: Record<ActivityItem['type'], { dot: string; icon: string; badge: string }> = {
  vizionare: {
    dot: 'bg-blue-500',
    icon: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  },
  property: {
    dot: 'bg-emerald-500',
    icon: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  search_saved: {
    dot: 'bg-amber-500',
    icon: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
  valuation: {
    dot: 'bg-purple-500',
    icon: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  },
  document: {
    dot: 'bg-rose-500',
    icon: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  },
}

// ─── Vizionare status labels ────────────────────────────────────────────────

const VIZIONARE_ACTION_LABELS: Record<Vizionare['status'], string> = {
  pending: 'Vizionare creata',
  confirmed: 'Vizionare confirmata',
  completed: 'Vizionare finalizata',
  cancelled: 'Vizionare anulata',
}

// ─── Relative time formatting ───────────────────────────────────────────────

function formatRelativeTime(isoString: string): string {
  const now = Date.now()
  const then = new Date(isoString).getTime()
  const diffMs = now - then

  if (diffMs < 0) return 'chiar acum'

  const minutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (minutes < 1) return 'chiar acum'
  if (minutes < 60) return `acum ${minutes} minut${minutes === 1 ? '' : 'e'}`
  if (hours < 24) return `acum ${hours} or${hours === 1 ? 'a' : 'e'}`
  if (days < 7) return `acum ${days} zi${days === 1 ? '' : 'le'}`
  if (days < 30) return `acum ${weeks} saptamani`
  return `acum ${months} luni`
}

// ─── Data aggregation ───────────────────────────────────────────────────────

interface ValuationHistoryEntry {
  id: string
  date: string
  formData: { type?: string; zone?: string; transaction?: string }
  result: { estimatedValue: number }
}

function buildActivityItems(): ActivityItem[] {
  const items: ActivityItem[] = []

  // Vizionari
  const vizionari = loadFromLS<Vizionare[]>(LS_KEYS.VIZIONARI, [])
  for (const v of vizionari) {
    const ts = v.completedAt || v.createdAt
    if (!ts) continue
    items.push({
      id: `viz-${v.id}`,
      type: 'vizionare',
      title: VIZIONARE_ACTION_LABELS[v.status] || 'Vizionare',
      description: `${v.propertyTitle} — ${v.staffName}`,
      timestamp: ts,
      icon: CalendarCheck,
      color: TYPE_STYLES.vizionare.icon,
    })
  }

  // User Properties
  const properties = loadFromLS<UserProperty[]>(LS_KEYS.USER_PROPERTIES, [])
  for (const p of properties) {
    const ts = (p as Record<string, unknown>).created_at as string | undefined
    // Fallback: parse id if it starts with a timestamp
    const fallbackTs = /^\d{13}/.test(p.id) ? new Date(parseInt(p.id.slice(0, 13))).toISOString() : undefined
    const timestamp = ts || fallbackTs
    if (!timestamp) continue
    items.push({
      id: `prop-${p.id}`,
      type: 'property',
      title: 'Proprietate adaugata',
      description: p.title || 'Proprietate noua',
      timestamp,
      icon: Building2,
      color: TYPE_STYLES.property.icon,
    })
  }

  // Saved Searches
  const savedSearches = loadFromLS<SavedSearch[]>(LS_KEYS.SAVED_SEARCHES, [])
  for (const s of savedSearches) {
    if (!s.createdAt) continue
    items.push({
      id: `search-${s.id}`,
      type: 'search_saved',
      title: 'Cautare salvata',
      description: s.name || 'Cautare personalizata',
      timestamp: s.createdAt,
      icon: Search,
      color: TYPE_STYLES.search_saved.icon,
    })
  }

  // Valuation History
  const valHistory = loadFromLS<ValuationHistoryEntry[]>(LS_KEYS.VALUATION_HISTORY, [])
  for (const v of valHistory) {
    if (!v.date) continue
    items.push({
      id: `val-${v.id}`,
      type: 'valuation',
      title: 'Evaluare proprietate',
      description: `${v.formData?.type || 'Proprietate'} — ${v.formData?.zone || 'Bucuresti'} · ${v.result?.estimatedValue?.toLocaleString('ro-RO') || '—'} EUR`,
      timestamp: v.date,
      icon: TrendingUp,
      color: TYPE_STYLES.valuation.icon,
    })
  }

  // Documents
  const documents = loadFromLS<UploadedDocument[]>(LS_KEYS.DOCUMENTS, [])
  for (const d of documents) {
    if (!d.uploadedAt) continue
    items.push({
      id: `doc-${d.id}`,
      type: 'document',
      title: 'Document incarcat',
      description: d.fileName || 'Document',
      timestamp: d.uploadedAt,
      icon: FileText,
      color: TYPE_STYLES.document.icon,
    })
  }

  // Sort newest first, cap at 10
  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return items.slice(0, 10)
}

// ─── Component ──────────────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

interface ActivityTimelineProps {
  onViewAll?: () => void
}

export function ActivityTimeline({ onViewAll }: ActivityTimelineProps) {
  const items = useMemo(() => buildActivityItems(), [])

  return (
    <div className="glass-card rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Activitate Recenta
        </h2>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs"
            onClick={onViewAll}
          >
            Vezi toata activitatea
          </Button>
        )}
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nicio activitate recenta</p>
          <p className="text-xs mt-1 opacity-70">
            Activitatea ta pe platforma va aparea aici
          </p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative max-h-[520px] overflow-y-auto pr-1"
        >
          {/* Timeline line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" aria-hidden="true" />

          <div className="space-y-1">
            {items.map((item) => {
              const styles = TYPE_STYLES[item.type]
              const Icon = item.icon

              return (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  className="relative flex items-start gap-4 py-3 pl-1 group"
                >
                  {/* Dot on timeline */}
                  <div className="relative z-10 mt-1 flex h-[30px] w-[30px] shrink-0 items-center justify-center">
                    <div className={`h-3 w-3 rounded-full ${styles.dot} ring-4 ring-background`} />
                  </div>

                  {/* Icon badge */}
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.color} mt-0.5`}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium leading-snug">
                        {item.title}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1.5 py-0 h-4 font-normal ${styles.badge}`}
                      >
                        {formatRelativeTime(item.timestamp)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}