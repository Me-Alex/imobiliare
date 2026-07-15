'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays, Clock, User,
  CalendarCheck, CalendarX2, Inbox,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'
import { loadFromLS, saveToLS } from '@/lib/storage'
import { LS_KEYS } from '@/lib/constants'
import type { Vizionare, AvailabilitySlot } from '@/lib/types'
import { VizionareFeedbackDialog } from '@/components/dialogs/vizionare-feedback-dialog'
import { toast } from 'sonner'
import { PageHero } from '@/components/layout/page-hero'
import { VizionareCard } from '@/components/features/vizionare-card'
import {
  cancelViewing,
  listViewings,
  saveViewingFeedback,
} from '@/lib/viewing-documents'

// ─── Empty State ────────────────────────────────────────────────────────────

function EmptyState({ message, icon: Icon }: { message: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <p className="text-muted-foreground text-sm max-w-xs">{message}</p>
    </motion.div>
  )
}

// ─── Timeline Dot ───────────────────────────────────────────────────────────

function TimelineDot({ status }: { status: Vizionare['status'] }) {
  const colorMap: Record<string, string> = {
    pending: 'bg-yellow-400',
    confirmed: 'bg-emerald-500',
    completed: 'bg-blue-500',
    cancelled: 'bg-red-400',
  }
  return <div className={`w-3 h-3 rounded-full ${colorMap[status] || 'bg-muted'} ring-4 ring-background flex-shrink-0`} />
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export function VizionarileMelePage() {
  const { user, loading: authLoading } = useAuth()
  const { navigateTo, setVizionareProperty } = useAppStore()
  const [vizionari, setVizionari] = useState<Vizionare[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active')

  // Feedback dialog state
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackVizionare, setFeedbackVizionare] = useState<Vizionare | null>(null)

  const refreshViewings = useCallback(async () => {
    if (!user) return
    setDataLoading(true)
    try {
      setVizionari(await listViewings())
    } catch (error) {
      toast.error('Vizionarile nu au putut fi incarcate.', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setDataLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) queueMicrotask(() => void refreshViewings())
  }, [user, refreshViewings])

  const activeVizionari = useMemo(
    () => vizionari.filter(v => v.status === 'pending' || v.status === 'confirmed')
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)),
    [vizionari]
  )

  const historyVizionari = useMemo(
    () => vizionari.filter(v => v.status === 'completed' || v.status === 'cancelled')
      .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime)),
    [vizionari]
  )

  const handleCancel = useCallback(async (id: string) => {
    try {
      await cancelViewing(id)
      const cancelled = vizionari.find((viewing) => viewing.id === id)
      if (cancelled) {
        const slots = loadFromLS<AvailabilitySlot[]>(LS_KEYS.STAFF_AVAILABILITY, [])
        const slotIdx = slots.findIndex((slot) =>
          slot.staffId === cancelled.staffId && slot.date === cancelled.date &&
          slot.startTime === cancelled.startTime && slot.isBooked
        )
        if (slotIdx !== -1) {
          slots[slotIdx].isBooked = false
          slots[slotIdx].bookedBy = null
          slots[slotIdx].bookedByName = null
          saveToLS(LS_KEYS.STAFF_AVAILABILITY, slots)
        }
      }
      await refreshViewings()
      toast.success('Vizionare anulata', { description: 'Programarea a fost anulata cu succes.' })
    } catch (error) {
      toast.error('Vizionarea nu a putut fi anulata.', {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }, [refreshViewings, vizionari])

  const handleAddFeedback = useCallback((v: Vizionare) => {
    setFeedbackVizionare(v)
    setFeedbackOpen(true)
  }, [])

  const handleFeedbackSaved = useCallback(async (input: {
    rating: number
    feedback: string
    wouldProceed: boolean
    notes: string
  }) => {
    if (!feedbackVizionare) return
    await saveViewingFeedback(feedbackVizionare.id, input)
    await refreshViewings()
  }, [feedbackVizionare, refreshViewings])

  const handleReschedule = useCallback(async (v: Vizionare) => {
    try {
      await cancelViewing(v.id)
      const slots = loadFromLS<AvailabilitySlot[]>(LS_KEYS.STAFF_AVAILABILITY, [])
      const slotIdx = slots.findIndex(
        (s: AvailabilitySlot) =>
          s.staffId === v.staffId &&
          s.date === v.date &&
          s.startTime === v.startTime &&
          s.isBooked
      )
      if (slotIdx !== -1) {
        slots[slotIdx].isBooked = false
        slots[slotIdx].bookedBy = null
        slots[slotIdx].bookedByName = null
        saveToLS(LS_KEYS.STAFF_AVAILABILITY, slots)
      }
      setVizionareProperty(v.propertyId, v.propertyTitle)
      navigateTo('programare-vizionare')
      toast.info('Reprogramare', {
        description: 'Vizionarea anterioara a fost anulata. Alege o noua data.',
      })
    } catch (error) {
      toast.error('Vizionarea nu a putut fi reprogramata.', {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }, [setVizionareProperty, navigateTo])

  if (authLoading || (user && dataLoading)) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8 text-center max-w-md"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
            <User className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold mb-2">Autentifica-te</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Trebuie sa fii autentificat pentru a vedea vizionarile tale.
          </p>
          <Button onClick={() => navigateTo('login')} className="gap-2">
            Autentifica-te
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <PageHero
          variant="simple"
          title="Vizionarile Mele"
          description="Gestioneaza programarile tale de vizionare."
          showBackButton
          onBack={() => navigateTo('acasa')}
          backLabel="Inapoi"
        />

        {/* Stats summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Active', count: activeVizionari.length, icon: CalendarCheck, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'In asteptare', count: activeVizionari.filter(v => v.status === 'pending').length, icon: Clock, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' },
            { label: 'Confirmate', count: activeVizionari.filter(v => v.status === 'confirmed').length, icon: CalendarDays, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Istoric', count: historyVizionari.length, icon: CalendarX2, color: 'text-muted-600 bg-muted/50' },
          ].map(stat => (
            <div key={stat.label} className="glass-card rounded-xl p-3 sm:p-4 text-center">
              <div className={`mx-auto w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <p className="text-xl font-bold">{stat.count}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="active" className="flex-1 gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 hidden sm:block" />
              Vizionari Active
              {activeVizionari.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] text-[10px] px-1.5">
                  {activeVizionari.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 gap-1.5">
              <CalendarX2 className="h-3.5 w-3.5 hidden sm:block" />
              Istoric
              {historyVizionari.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] text-[10px] px-1.5">
                  {historyVizionari.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Active Tab */}
          <TabsContent value="active">
            <AnimatePresence mode="popLayout">
              {activeVizionari.length > 0 ? (
                <div className="space-y-3">
                  {activeVizionari.map((v) => (
                    <VizionareCard
                      key={v.id}
                      vizionare={v}
                      onCancel={handleCancel}
                      onAddFeedback={handleAddFeedback}
                      onReschedule={handleReschedule}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CalendarCheck}
                  message="Fara vizionari programate. Programeaza o vizionare la o proprietate care te intereseaza."
                />
              )}
            </AnimatePresence>

            {activeVizionari.length > 0 && (
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigateTo('programare-vizionare')}
                >
                  <CalendarDays className="h-4 w-4" />
                  Programeaza o Vizionare Noua
                </Button>
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <AnimatePresence mode="popLayout">
              {historyVizionari.length > 0 ? (
                <div className="relative pl-6">
                  {/* Timeline line */}
                  <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-border" />

                  <div className="space-y-4">
                    {historyVizionari.map((v) => (
                      <div key={v.id} className="relative">
                        <TimelineDot status={v.status} />
                        <VizionareCard
                          vizionare={v}
                          onCancel={handleCancel}
                          onAddFeedback={handleAddFeedback}
                          onReschedule={handleReschedule}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={Inbox}
                  message="Nu ai inca vizionari in istoric. Vizionarile finalizate sau anulate vor aparea aici."
                />
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>

      {/* Feedback Dialog */}
      <VizionareFeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        vizionare={feedbackVizionare}
        onSaved={handleFeedbackSaved}
      />
    </div>
  )
}
