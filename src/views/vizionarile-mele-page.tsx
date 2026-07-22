'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
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
import { PageContainer, PageHero, PageShell, PageSurface } from '@/components/layout'
import { PageState } from '@/components/ui/page-state'
import { VizionareCard } from '@/components/features/vizionare-card'
import {
  cancelViewing,
  cancelViewingByAgent,
  checkInViewing,
  completeViewing,
  confirmViewing,
  listViewings,
  markViewingNoShow,
  saveViewingFeedback,
} from '@/lib/viewing-documents'

// ─── Timeline Dot ───────────────────────────────────────────────────────────

function TimelineDot({ status }: { status: Vizionare['status'] }) {
  const colorMap: Record<string, string> = {
    pending: 'bg-yellow-400',
    confirmed: 'bg-emerald-500',
    completed: 'bg-blue-500',
    checked_in: 'bg-violet-500',
    cancelled: 'bg-red-400',
    cancelled_by_client: 'bg-red-400',
    cancelled_by_agent: 'bg-red-400',
    no_show: 'bg-orange-500',
  }
  return <div className={`w-3 h-3 rounded-full ${colorMap[status] || 'bg-muted'} ring-4 ring-background flex-shrink-0`} />
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export function VizionarileMelePage() {
  const { user, profile, loading: authLoading } = useAuth()
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
      toast.error('Vizionările nu au putut fi încărcate.', {
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
    () => vizionari.filter(v => ['pending', 'confirmed', 'checked_in'].includes(v.status))
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)),
    [vizionari]
  )

  const historyVizionari = useMemo(
    () => vizionari.filter(v => ['completed', 'cancelled', 'cancelled_by_client', 'cancelled_by_agent', 'no_show'].includes(v.status))
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
      toast.success('Vizionare anulată', { description: 'Programarea a fost anulată cu succes.' })
    } catch (error) {
      toast.error('Vizionarea nu a putut fi anulată.', {
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
      const activeAppointment = v.status === 'pending' || v.status === 'confirmed'
      if (activeAppointment) {
        await cancelViewing(v.id, 'Anulată pentru reprogramare')
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
      }
      setVizionareProperty(v.propertyId, v.propertyTitle)
      navigateTo('programare-vizionare')
      toast.info('Reprogramare', {
        description: activeAppointment
          ? 'Vizionarea anterioară a fost anulată. Alege o nouă dată.'
          : 'Programarea din istoric rămâne în audit. Alege o nouă dată.',
      })
    } catch (error) {
      toast.error('Vizionarea nu a putut fi reprogramată.', {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }, [setVizionareProperty, navigateTo])

  const runOperationalAction = useCallback(async (
    id: string,
    action: () => Promise<void>,
    success: string,
  ) => {
    try {
      await action()
      await refreshViewings()
      toast.success(success)
    } catch (error) {
      toast.error('Starea vizionării nu a putut fi schimbată.', {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }, [refreshViewings])

  const handleCancelByAgent = useCallback((id: string) => {
    const reason = window.prompt('Motivul anulării de către agenție:')
    if (!reason) return
    void runOperationalAction(id, () => cancelViewingByAgent(id, reason), 'Vizionarea a fost anulată de agenție.')
  }, [runOperationalAction])

  const canManage = profile?.role === 'AGENT' || profile?.role === 'ADMIN'

  if (authLoading || (user && dataLoading)) {
    return (
      <PageShell>
        <PageContainer width="narrow" className="py-10">
          <PageState tone="loading" title="Încărcăm vizionările" description="Sincronizăm programările și stările lor actuale." />
        </PageContainer>
      </PageShell>
    )
  }

  if (!user) {
    return (
      <PageShell>
        <PageContainer width="narrow" className="py-10">
          <PageState
            tone="neutral"
            icon={User}
            title="Autentifică-te"
            description="Intră în cont pentru a vedea și administra vizionările tale."
            action={<Button onClick={() => navigateTo('login')}>Autentificare</Button>}
          />
        </PageContainer>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PageContainer width="narrow" className="py-8 sm:py-10">
        <PageHero
          variant="simple"
          title={canManage ? 'Agenda vizionărilor' : 'Vizionările mele'}
          description={canManage
            ? 'Confirmă programările, prezența, finalizarea sau neprezentarea, cu jurnal de audit.'
            : 'Gestionează programările tale de vizionare.'}
          showBackButton
          onBack={() => navigateTo('acasa')}
          backLabel="Înapoi"
        />

        {/* Stats summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Active', count: activeVizionari.length, icon: CalendarCheck, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'În așteptare', count: activeVizionari.filter(v => v.status === 'pending').length, icon: Clock, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' },
            { label: 'Confirmate / prezenți', count: activeVizionari.filter(v => v.status === 'confirmed' || v.status === 'checked_in').length, icon: CalendarDays, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Istoric', count: historyVizionari.length, icon: CalendarX2, color: 'text-muted-600 bg-muted/50' },
          ].map(stat => (
            <PageSurface key={stat.label} className="p-3 text-center sm:p-4">
              <div className={`mx-auto w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <p className="text-xl font-bold">{stat.count}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </PageSurface>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="active" className="flex-1 gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 hidden sm:block" />
              Vizionări active
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
                      canManage={canManage}
                      currentUserId={user.id}
                      onCancel={handleCancel}
                      onAddFeedback={handleAddFeedback}
                      onReschedule={handleReschedule}
                      onConfirm={(id) => void runOperationalAction(id, () => confirmViewing(id), 'Programarea a fost confirmată.')}
                      onCheckIn={(id) => void runOperationalAction(id, () => checkInViewing(id), 'Prezența clientului a fost confirmată.')}
                      onComplete={(id) => void runOperationalAction(id, () => completeViewing(id), 'Vizionarea a fost finalizată. Fișa poate fi generată.')}
                      onNoShow={(id) => void runOperationalAction(id, () => markViewingNoShow(id), 'Neprezentarea a fost consemnată fără penalizare automată.')}
                      onCancelByAgent={handleCancelByAgent}
                    />
                  ))}
                </div>
              ) : (
                <PageState
                  compact
                  icon={CalendarCheck}
                  title="Nu ai vizionări active"
                  description="Programează o vizionare direct din catalogul de proprietăți."
                  action={!canManage ? <Button variant="outline" size="sm" onClick={() => navigateTo('proprietati')}>Vezi proprietățile</Button> : undefined}
                />
              )}
            </AnimatePresence>

            {activeVizionari.length > 0 && !canManage && (
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigateTo('programare-vizionare')}
                >
                  <CalendarDays className="h-4 w-4" />
                  Programează o vizionare nouă
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
                          canManage={canManage}
                          currentUserId={user.id}
                          onCancel={handleCancel}
                          onAddFeedback={handleAddFeedback}
                          onReschedule={handleReschedule}
                          onConfirm={(id) => void runOperationalAction(id, () => confirmViewing(id), 'Programarea a fost confirmată.')}
                          onCheckIn={(id) => void runOperationalAction(id, () => checkInViewing(id), 'Prezența clientului a fost confirmată.')}
                          onComplete={(id) => void runOperationalAction(id, () => completeViewing(id), 'Vizionarea a fost finalizată. Fișa poate fi generată.')}
                          onNoShow={(id) => void runOperationalAction(id, () => markViewingNoShow(id), 'Neprezentarea a fost consemnată fără penalizare automată.')}
                          onCancelByAgent={handleCancelByAgent}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <PageState
                  compact
                  icon={Inbox}
                  title="Istoricul este gol"
                  description="Vizionările finalizate sau anulate vor apărea aici."
                />
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </PageContainer>

      {/* Feedback Dialog */}
      <VizionareFeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        vizionare={feedbackVizionare}
        onSaved={handleFeedbackSaved}
      />
    </PageShell>
  )
}
