'use client'

import { fetchDealRooms, type DealRoom } from '@/lib/transaction-workspace'
import { getTransactionProcess } from '@/lib/transaction-process'
import { getViewingProcessGroup } from '@/lib/viewing-guidance'


import { useState, useMemo, useCallback, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import {
  CalendarDays,
  User,
  CalendarCheck,
  CalendarX2,
  Inbox,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import { PageContainer, PageHero, PageShell } from '@/components/layout'
import { PageState } from '@/components/ui/page-state'
import { VizionareCard } from '@/components/features/vizionare-card'
import { readAppointmentContext } from '@/lib/document-navigation'

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

export function VizionarileMelePage() {
  const { user, profile, loading: authLoading } = useAuth()
  const { navigateTo, setVizionareProperty } = useAppStore()
  const [vizionari, setVizionari] = useState<Vizionare[]>([])
  const [rooms, setRooms] = useState<DealRoom[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Feedback dialog state
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackVizionare, setFeedbackVizionare] = useState<Vizionare | null>(null)
  const [cancelRequest, setCancelRequest] = useState<{ id: string; actor: 'client' | 'agency' } | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelSubmitting, setCancelSubmitting] = useState(false)
  const [rescheduleRequest, setRescheduleRequest] = useState<Vizionare | null>(null)
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false)

  const refreshViewings = useCallback(async () => {
    if (!user) return
    setDataLoading(true)
    try {
      const [visits, deals] = await Promise.all([listViewings(), fetchDealRooms()])
      setVizionari(visits)
      setRooms(deals)
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

  const transactions = useMemo(() => new Map(rooms.flatMap(room => {
    if (!profile || !user) return []
    const process = getTransactionProcess(room, profile.role, user.id)
    return ['negotiation', 'contract', 'closed'].includes(process.phase)
      ? (room.deal_appointments || []).map(link => [link.appointment_id, { id: room.id, process }] as const) : []
  })), [rooms, profile, user])
  const viewingGroup = useCallback((viewing: Vizionare) => {
    const transaction = transactions.get(viewing.id)
    if (viewing.status === 'completed' && transaction) return transaction.process.phase === 'closed' ? 'history' : 'followup'
    return getViewingProcessGroup(viewing)
  }, [transactions])

  useEffect(() => {
    const id = readAppointmentContext()
    const viewing = vizionari.find(item => item.id === id)
    if (!viewing) return
    const timer = window.setTimeout(() => {
      setActiveTab(viewingGroup(viewing))
      setSearch('')
      setStatusFilter('all')
      window.setTimeout(() => document.getElementById(`viewing-${id}`)?.scrollIntoView({ block: 'center' }), 100)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [vizionari, viewingGroup])

  const activeVizionari = useMemo(
    () => vizionari.filter(v => viewingGroup(v) === 'active')
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)),
    [vizionari, viewingGroup]
  )

  const followupVizionari = vizionari.filter(v => viewingGroup(v) === 'followup')

  const historyVizionari = useMemo(
    () => vizionari.filter(v => viewingGroup(v) === 'history')
      .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime)),
    [vizionari, viewingGroup]
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
    rating: number | null
    feedback: string
    wouldProceed: boolean
    notes: string
  }) => {
    if (!feedbackVizionare) return
    await saveViewingFeedback(feedbackVizionare.id, input)
    await refreshViewings()
  }, [feedbackVizionare, refreshViewings])

  const handleReschedule = useCallback(async (v: Vizionare) => {
    setRescheduleSubmitting(true)
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
      setRescheduleRequest(null)
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
    finally { setRescheduleSubmitting(false) }
  }, [setVizionareProperty, navigateTo])

  const requestReschedule = (viewing: Vizionare) => {
    if (['pending', 'confirmed'].includes(viewing.status)) setRescheduleRequest(viewing)
    else void handleReschedule(viewing)
  }

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

  const matchesViewing = (viewing: Vizionare) => {
    const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('ro')
    return normalize(`${viewing.propertyTitle} ${viewing.staffName} ${viewing.date}`).includes(normalize(search.trim()))
      && (statusFilter === 'all' || viewing.status === statusFilter)
  }
  const visibleActive = activeVizionari.filter(matchesViewing)
  const visibleHistory = historyVizionari.filter(matchesViewing)

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

  const appointmentContext = readAppointmentContext()
  const focusedViewing = vizionari.find(viewing => viewing.id === appointmentContext)

  return (
    <PageShell>
      <PageContainer width="narrow" className="py-8 sm:py-10">
        {appointmentContext ? <>
          <Button variant="link" className="mb-5 h-auto p-0" onClick={() => navigateTo('dashboard')}>Înapoi la dosarele mele</Button>
          <h1 className="mb-5 text-2xl font-semibold">Vizionare</h1>
          {focusedViewing ? <VizionareCard vizionare={focusedViewing} transaction={transactions.get(focusedViewing.id)}
            canManage={canManage} currentUserId={user.id} onCancel={id => requestCancellation(id, 'client')}
            onAddFeedback={handleAddFeedback} onReschedule={requestReschedule}
            onConfirm={id => void runOperationalAction(id, () => confirmViewing(id), 'Programarea a fost confirmată.')}
            onCheckIn={id => void runOperationalAction(id, () => checkInViewing(id), 'Prezența a fost confirmată.')}
            onComplete={id => void runOperationalAction(id, () => completeViewing(id), 'Vizionarea a fost finalizată.')}
            onNoShow={id => void runOperationalAction(id, () => markViewingNoShow(id), 'Neprezentarea a fost consemnată.')}
            onCancelByAgent={id => requestCancellation(id, 'agency')} />
            : <p role="alert">Această vizionare nu este disponibilă în contul tău.</p>}
        </> : <>
        <PageHero
          variant="simple"
          title={canManage ? 'Agenda vizionărilor' : 'Vizionările mele'}
          description={canManage
            ? 'Confirmă programările și actualizează rezultatul fiecărei vizionări.'
            : 'Gestionează programările tale de vizionare.'}
          showBackButton
          onBack={() => navigateTo('acasa')}
          backLabel="Înapoi"
        >{profile?.role === 'CLIENT' && <Button className="min-h-11 gap-2" onClick={() => navigateTo('programare-vizionare')}><CalendarDays className="h-4 w-4" />Programează o vizionare</Button>}</PageHero>

        <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
          <div><Label htmlFor="viewing-search">Caută o vizionare</Label><Input id="viewing-search" className="mt-2 min-h-11" value={search} onChange={event => setSearch(event.target.value)} placeholder="Proprietate, agent sau dată" /></div>
          <div><Label htmlFor="viewing-status">Stare</Label><select id="viewing-status" value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="mt-2 h-11 w-full rounded-md border bg-background px-3 text-sm">
            <option value="all">Toate stările</option>
            {(activeTab === 'active' ? [['pending', 'În așteptare'], ['confirmed', 'Confirmată'], ['checked_in', 'Prezență confirmată']] : activeTab === 'followup' ? [['completed', 'Finalizată']] : [['completed', 'Fără continuare'], ['no_show', 'Neprezentare'], ['cancelled_by_client', 'Anulată de client'], ['cancelled_by_agent', 'Anulată de agenție'], ['cancelled', 'Anulată']]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={value => { setActiveTab(value); setStatusFilter("all") }}>
          <TabsList className="w-full h-auto mb-6">
            <TabsTrigger value="active" className="min-h-11 flex-1 gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 hidden sm:block" />
              Programări
              {activeVizionari.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] text-[10px] px-1.5">
                  {activeVizionari.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="followup" className="min-h-11 flex-1 gap-1.5">După vizită <Badge variant="secondary">{followupVizionari.length}</Badge></TabsTrigger>
            <TabsTrigger value="history" className="min-h-11 flex-1 gap-1.5">
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
              {visibleActive.length > 0 ? (
                <div className="space-y-3">
                  {visibleActive.map((v) => (
                    <VizionareCard
                      key={v.id}
                      transaction={transactions.get(v.id)}
                      vizionare={v}
                      canManage={canManage}
                      currentUserId={user.id}
                      onCancel={(id) => requestCancellation(id, 'client')}
                      onAddFeedback={handleAddFeedback}
                      onReschedule={requestReschedule}
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
                  title={activeVizionari.length ? "Nicio vizionare pentru aceste filtre" : "Nu ai vizionări active"}
                  description={activeVizionari.length ? "Schimbă căutarea sau alege toate stările." : "Alege o proprietate și programează prima vizionare."}
                  action={search || statusFilter !== 'all' ? <Button variant="outline" onClick={() => { setSearch(''); setStatusFilter('all') }}>Resetează filtrele</Button> : !canManage ? <Button variant="outline" size="sm" onClick={() => navigateTo('proprietati')}>Vezi proprietățile</Button> : undefined}
                />
              )}
            </AnimatePresence>

            {activeVizionari.length > 0 && profile?.role === 'CLIENT' && (
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

          <TabsContent value="followup">
            <p className="mb-4 text-sm text-muted-foreground">Decizia clientului și tranzacțiile care continuă după vizită.</p>
            <div className="space-y-3">
              {followupVizionari.filter(matchesViewing).map(v => (
                <VizionareCard key={v.id} transaction={transactions.get(v.id)} vizionare={v} canManage={canManage} currentUserId={user.id}
                  onCancel={id => requestCancellation(id, 'client')} onAddFeedback={handleAddFeedback}
                  onReschedule={requestReschedule}
                      onConfirm={(id) => void runOperationalAction(id, () => confirmViewing(id), 'Programarea a fost confirmată.')}
                      onCheckIn={(id) => void runOperationalAction(id, () => checkInViewing(id), 'Prezența clientului a fost confirmată.')}
                      onComplete={(id) => void runOperationalAction(id, () => completeViewing(id), 'Vizionarea a fost finalizată. Fișa poate fi generată.')}
                      onNoShow={(id) => void runOperationalAction(id, () => markViewingNoShow(id), 'Neprezentarea a fost consemnată fără penalizare automată.')}
                      onCancelByAgent={(id) => requestCancellation(id, 'agency')} />
              ))}
              {!followupVizionari.filter(matchesViewing).length && <PageState compact icon={CalendarCheck} title="Nicio vizită de continuat" description="Vizitele finalizate apar aici până când clientul decide să nu continue." />}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <AnimatePresence mode="popLayout">
              {visibleHistory.length > 0 ? (
                <div className="relative pl-6">
                  {/* Timeline line */}
                  <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-border" />

                  <div className="space-y-4">
                    {visibleHistory.map((v) => (
                      <div key={v.id} className="relative">
                        <TimelineDot status={v.status} />
                        <VizionareCard
                          transaction={transactions.get(v.id)}
                      vizionare={v}
                          canManage={canManage}
                          currentUserId={user.id}
                          onCancel={(id) => requestCancellation(id, 'client')}
                          onAddFeedback={handleAddFeedback}
                          onReschedule={requestReschedule}
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
                  title={historyVizionari.length ? "Nicio vizionare pentru aceste filtre" : "Istoricul este gol"}
                  action={search || statusFilter !== 'all' ? <Button variant="outline" onClick={() => { setSearch(''); setStatusFilter('all') }}>Resetează filtrele</Button> : undefined}
                  description={historyVizionari.length ? "Schimbă căutarea sau alege toate stările." : "Programările anulate și vizitele fără continuare apar aici."}
                />
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
        </>}
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

      <Dialog open={Boolean(rescheduleRequest)} onOpenChange={open => { if (!open && !rescheduleSubmitting) setRescheduleRequest(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schimbi programarea?</DialogTitle><DialogDescription>Programarea actuală va fi anulată și intervalul va fi eliberat. Vei alege apoi o altă dată; noul interval nu este rezervat până nu trimiți o nouă solicitare.</DialogDescription></DialogHeader>
          <p className="text-sm font-medium">{rescheduleRequest?.propertyTitle} · {rescheduleRequest?.date}, {rescheduleRequest?.startTime}</p>
          <DialogFooter><Button variant="outline" disabled={rescheduleSubmitting} onClick={() => setRescheduleRequest(null)}>Păstrează programarea</Button><Button disabled={rescheduleSubmitting} className="h-auto min-h-11 whitespace-normal" onClick={() => { if (rescheduleRequest) void handleReschedule(rescheduleRequest) }}>{rescheduleSubmitting ? 'Se pregătește…' : 'Anulează și alege o altă dată'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      {feedbackOpen && <VizionareFeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        vizionare={feedbackVizionare}
        onSaved={handleFeedbackSaved}
      />}
    </PageShell>
  )
}
