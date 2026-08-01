'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Clock,
  FileSignature,
  User,
  CalendarCheck,
  CalendarX2,
  Inbox,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { openDealRoomForViewing, openViewingDocuments } from '@/lib/document-navigation'
import {
  getViewingAgendaGuide,
  type ViewingAgendaAction,
  type ViewingAgendaCard,
  type ViewingAgendaGuide,
} from '@/lib/viewing-agenda-guide'
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
import { cn } from '@/lib/utils'

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

const agendaToneStyles: Record<
  ViewingAgendaCard['tone'],
  {
    surface: string
    icon: string
    badge: 'default' | 'secondary' | 'destructive' | 'outline'
  }
> = {
  primary: {
    surface: 'border-primary/25 bg-primary/5',
    icon: 'bg-primary/10 text-primary',
    badge: 'default',
  },
  warning: {
    surface: 'border-amber-500/25 bg-amber-500/10',
    icon: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    badge: 'secondary',
  },
  success: {
    surface: 'border-emerald-500/25 bg-emerald-500/10',
    icon: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    badge: 'secondary',
  },
  neutral: {
    surface: 'border-border bg-card/70',
    icon: 'bg-muted text-muted-foreground',
    badge: 'outline',
  },
}

const agendaCardIcons: Record<ViewingAgendaCard['id'], LucideIcon> = {
  now: CalendarCheck,
  queue: BriefcaseBusiness,
  documents: FileSignature,
  history: CalendarX2,
}

function ViewingAgendaGuidePanel({
  guide,
  onAction,
}: {
  guide: ViewingAgendaGuide
  onAction: (action: ViewingAgendaAction) => void
}) {
  const quickStats = [
    { label: 'Active', value: guide.metrics.active },
    { label: 'Pending', value: guide.metrics.pending },
    { label: 'Feedback', value: guide.metrics.needsFeedback },
    { label: 'Dosare', value: guide.metrics.readyForDocuments },
  ]

  return (
    <PageSurface tone="elevated" className="mb-6 overflow-hidden border-primary/15">
      <div className="grid gap-0 lg:grid-cols-[1.05fr_1.35fr]">
        <div className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-primary/12 via-primary/5 to-background p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <div className="absolute -right-12 -top-14 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
          <Badge variant="secondary" className="mb-4 w-fit">
            Agenda ghidată
          </Badge>
          <h2 className="relative text-2xl font-semibold tracking-tight">{guide.headline}</h2>
          <p className="relative mt-2 text-sm leading-6 text-muted-foreground">{guide.description}</p>

          <div className="relative mt-5 grid grid-cols-2 gap-2">
            {quickStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-border/70 bg-background/75 p-3">
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <Button className="relative mt-5 w-full justify-between sm:w-auto" onClick={() => onAction(guide.primaryAction)}>
            {guide.primaryAction.label}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
          {guide.cards.map((card) => {
            const Icon = agendaCardIcons[card.id]
            const style = agendaToneStyles[card.tone]

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => onAction(card.action)}
                className={cn(
                  'group rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  style.surface,
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={cn('flex h-10 w-10 items-center justify-center rounded-2xl', style.icon)}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <Badge variant={style.badge} className="shrink-0">
                    {card.badgeLabel}
                  </Badge>
                </div>
                <h3 className="mt-4 font-semibold">{card.title}</h3>
                <p className="mt-1 min-h-[42px] text-sm leading-6 text-muted-foreground">{card.description}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  {card.action.label}
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </PageSurface>
  )
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
  const [cancelRequest, setCancelRequest] = useState<{ id: string; actor: 'client' | 'agency' } | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelSubmitting, setCancelSubmitting] = useState(false)

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

  const releaseLocalSlot = useCallback((id: string) => {
    const cancelled = vizionari.find((viewing) => viewing.id === id)
    if (!cancelled) return
    const slots = loadFromLS<AvailabilitySlot[]>(LS_KEYS.STAFF_AVAILABILITY, [])
    const slotIdx = slots.findIndex((slot) =>
      slot.staffId === cancelled.staffId && slot.date === cancelled.date &&
      slot.startTime === cancelled.startTime && slot.isBooked
    )
    if (slotIdx === -1) return
    slots[slotIdx].isBooked = false
    slots[slotIdx].bookedBy = null
    slots[slotIdx].bookedByName = null
    saveToLS(LS_KEYS.STAFF_AVAILABILITY, slots)
  }, [vizionari])

  const requestCancellation = useCallback((id: string, actor: 'client' | 'agency') => {
    setCancelReason('')
    setCancelRequest({ id, actor })
  }, [])

  const confirmCancellation = useCallback(async () => {
    if (!cancelRequest) return
    const reason = cancelReason.trim()
    if (cancelRequest.actor === 'agency' && reason.length < 3) {
      toast.error('Adaugă un motiv de cel puțin 3 caractere pentru client.')
      return
    }

    setCancelSubmitting(true)
    try {
      if (cancelRequest.actor === 'agency') {
        await cancelViewingByAgent(cancelRequest.id, reason)
      } else {
        await cancelViewing(cancelRequest.id, reason || 'Anulare solicitată de client')
      }
      releaseLocalSlot(cancelRequest.id)
      await refreshViewings()
      toast.success('Vizionare anulată', {
        description: cancelRequest.actor === 'agency'
          ? 'Clientul va vedea motivul, iar intervalul a fost eliberat.'
          : 'Intervalul a fost eliberat. Poți programa o altă dată.',
      })
      setCancelRequest(null)
      setCancelReason('')
    } catch (error) {
      toast.error('Vizionarea nu a putut fi anulată.', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setCancelSubmitting(false)
    }
  }, [cancelReason, cancelRequest, refreshViewings, releaseLocalSlot])

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

  const canManage = profile?.role === 'AGENT' || profile?.role === 'ADMIN'
  const agendaGuide = useMemo(
    () => profile
      ? getViewingAgendaGuide({
          role: profile.role,
          userId: user?.id ?? '',
          viewings: vizionari,
        })
      : null,
    [profile, user?.id, vizionari],
  )

  const handleAgendaGuideAction = useCallback((action: ViewingAgendaAction) => {
    if (action.target === 'schedule') {
      navigateTo('programare-vizionare')
      return
    }

    if (action.target === 'active_tab') {
      setActiveTab('active')
      return
    }

    if (action.target === 'history_tab') {
      setActiveTab('history')
      return
    }

    const viewing = action.viewingId ? vizionari.find((item) => item.id === action.viewingId) : null
    if (!viewing) {
      toast.error('Vizionarea nu mai este disponibilă în agenda curentă.')
      return
    }

    if (action.target === 'confirm') {
      void runOperationalAction(viewing.id, () => confirmViewing(viewing.id), 'Programarea a fost confirmată.')
      return
    }

    if (action.target === 'check_in') {
      void runOperationalAction(viewing.id, () => checkInViewing(viewing.id), 'Prezența clientului a fost confirmată.')
      return
    }

    if (action.target === 'complete') {
      void runOperationalAction(viewing.id, () => completeViewing(viewing.id), 'Vizionarea a fost finalizată. Fișa poate fi generată.')
      return
    }

    if (action.target === 'feedback') {
      handleAddFeedback(viewing)
      return
    }

    if (action.target === 'documents') {
      openViewingDocuments(navigateTo, viewing.id, null, { focus: 'primary' })
      return
    }

    if (action.target === 'deal_room') {
      openDealRoomForViewing(navigateTo, viewing.id)
      return
    }

    if (action.target === 'reschedule') {
      void handleReschedule(viewing)
      return
    }

    setActiveTab(['completed', 'cancelled', 'cancelled_by_client', 'cancelled_by_agent', 'no_show'].includes(viewing.status) ? 'history' : 'active')
  }, [handleAddFeedback, handleReschedule, navigateTo, runOperationalAction, vizionari])

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

        {agendaGuide && (
          <ViewingAgendaGuidePanel guide={agendaGuide} onAction={handleAgendaGuideAction} />
        )}

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
                      onCancel={(id) => requestCancellation(id, 'client')}
                      onAddFeedback={handleAddFeedback}
                      onReschedule={handleReschedule}
                      onConfirm={(id) => void runOperationalAction(id, () => confirmViewing(id), 'Programarea a fost confirmată.')}
                      onCheckIn={(id) => void runOperationalAction(id, () => checkInViewing(id), 'Prezența clientului a fost confirmată.')}
                      onComplete={(id) => void runOperationalAction(id, () => completeViewing(id), 'Vizionarea a fost finalizată. Fișa poate fi generată.')}
                      onNoShow={(id) => void runOperationalAction(id, () => markViewingNoShow(id), 'Neprezentarea a fost consemnată fără penalizare automată.')}
                      onCancelByAgent={(id) => requestCancellation(id, 'agency')}
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
                          onCancel={(id) => requestCancellation(id, 'client')}
                          onAddFeedback={handleAddFeedback}
                          onReschedule={handleReschedule}
                          onConfirm={(id) => void runOperationalAction(id, () => confirmViewing(id), 'Programarea a fost confirmată.')}
                          onCheckIn={(id) => void runOperationalAction(id, () => checkInViewing(id), 'Prezența clientului a fost confirmată.')}
                          onComplete={(id) => void runOperationalAction(id, () => completeViewing(id), 'Vizionarea a fost finalizată. Fișa poate fi generată.')}
                          onNoShow={(id) => void runOperationalAction(id, () => markViewingNoShow(id), 'Neprezentarea a fost consemnată fără penalizare automată.')}
                          onCancelByAgent={(id) => requestCancellation(id, 'agency')}
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

      <Dialog
        open={Boolean(cancelRequest)}
        onOpenChange={(open) => {
          if (open || cancelSubmitting) return
          setCancelRequest(null)
          setCancelReason('')
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {cancelRequest?.actor === 'agency' ? 'Anulezi vizionarea din partea agenției?' : 'Anulezi programarea?'}
            </DialogTitle>
            <DialogDescription>
              {cancelRequest?.actor === 'agency'
                ? 'Clientul va vedea motivul anulării, iar intervalul va deveni din nou disponibil.'
                : 'Intervalul va fi eliberat. Proprietatea rămâne disponibilă și poți alege imediat o altă dată.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="viewing-cancel-reason">
              Motiv {cancelRequest?.actor === 'agency' ? '(obligatoriu)' : '(opțional)'}
            </Label>
            <Textarea
              id="viewing-cancel-reason"
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value.slice(0, 500))}
              placeholder={cancelRequest?.actor === 'agency'
                ? 'Ex.: proprietatea nu este disponibilă în intervalul confirmat'
                : 'Spune-ne pe scurt ce s-a schimbat'}
              rows={3}
              autoFocus
            />
            <p className="text-right text-xs text-muted-foreground">{cancelReason.length}/500</p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={cancelSubmitting}
              onClick={() => {
                setCancelRequest(null)
                setCancelReason('')
              }}
            >
              Păstrează programarea
            </Button>
            <Button
              variant="destructive"
              disabled={cancelSubmitting || (cancelRequest?.actor === 'agency' && cancelReason.trim().length < 3)}
              onClick={() => void confirmCancellation()}
            >
              {cancelSubmitting ? 'Se anulează…' : 'Confirmă anularea'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
