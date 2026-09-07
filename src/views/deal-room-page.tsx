'use client'

import { getTransactionProcess, PROCESS_PHASES, type TransactionProcess } from '@/lib/transaction-process'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileSignature,
  FileText,
  HandCoins,
  History,
  Loader2,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  Undo2,
  UserRoundCheck,
  Users,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'
import { getRoleLabel, getStatusLabel, getStatusTone } from '@/lib/presentation'
import {
  DEAL_STAGES,
  canSubmitDealOffer,
  type DealRoom,
  type DealOfferAction,
  type DealStage,
  fetchDealRooms,
  getActiveDealOffer,
  getAllowedDealOfferActions,
  getDealRequirementState,
  getDealStageGate,
  summarizeDealRequirements,
  relationOne,
  submitDealOffer,
  transitionDealOffer,
  updateDealNextStep,
} from '@/lib/transaction-workspace'
import {
  openViewingDocuments,
  readAppointmentContext,
  readDealContext,
  selectDealRoom,
  type DocumentFocusTarget,
} from '@/lib/document-navigation'

const STAGE_LABELS: Record<DealStage, string> = {
  NEW: 'Nou',
  QUALIFIED: 'Calificat',
  VIEWING: 'Vizionare',
  OFFER: 'Ofertă',
  CONTRACT: 'Contract',
  CLOSED_WON: 'Finalizat',
  CLOSED_LOST: 'Închis',
}

function formatDate(value?: string | null, includeTime = true) {
  if (!value) return 'Fără termen'
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(value))
}

function formatMoney(value: number | string, currency = 'EUR') {
  return new Intl.NumberFormat('ro-RO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value))
}

export function DealRoomPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const navigateTo = useAppStore((state) => state.navigateTo)
  const [section, setSection] = useState('')
  const [unresolvedContext, setUnresolvedContext] = useState(false)
  const [focusRequest, setFocusRequest] = useState<{ id: string } | null>(null)
  useEffect(() => {
    if (!focusRequest) return
    const frame = requestAnimationFrame(() => document.getElementById(focusRequest.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    return () => cancelAnimationFrame(frame)
  }, [section, focusRequest])
  const [rooms, setRooms] = useState<DealRoom[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [offerAmount, setOfferAmount] = useState('')
  const [offerNotes, setOfferNotes] = useState('')
  const [decisionNote, setDecisionNote] = useState('')
  const [stage, setStage] = useState<DealStage>('VIEWING')
  const [nextStep, setNextStep] = useState('')
  const [nextStepOwner, setNextStepOwner] = useState('')
  const [nextStepDue, setNextStepDue] = useState('')
  const [showAllRequirements, setShowAllRequirements] = useState(false)

  const loadRooms = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const nextRooms = await fetchDealRooms()
      setRooms(nextRooms)
      const requestedAppointment = readAppointmentContext()
      const requestedDeal = readDealContext()
      const requestedRoom = requestedDeal
        ? nextRooms.find(room => room.id === requestedDeal && (!requestedAppointment || room.deal_appointments?.some(link => link.appointment_id === requestedAppointment)))
        : requestedAppointment ? nextRooms.find(room => room.deal_appointments?.some(link => link.appointment_id === requestedAppointment)) : null
      setUnresolvedContext(Boolean((requestedAppointment || requestedDeal) && !requestedRoom))
      setSelectedId(current => requestedRoom?.id || (!requestedAppointment && !requestedDeal && current && nextRooms.some(room => room.id === current) ? current : null))

    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Deal Room nu a putut fi încărcat.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { void loadRooms() }, [loadRooms])

  useEffect(() => {
    setOfferAmount('')
    setOfferNotes('')
    setDecisionNote('')
    setShowAllRequirements(false)
    setFocusRequest(null)
  }, [selectedId])

  const room = useMemo(() => rooms.find((item) => item.id === selectedId) || null, [rooms, selectedId])
  const property = relationOne(room?.properties)
  const canManage = profile?.role === 'AGENT' || profile?.role === 'ADMIN'

  useEffect(() => {
    if (!room) return
    setStage(room.stage)
    setNextStep(room.next_step || '')
    setNextStepOwner(room.next_step_owner_id || '')
    setNextStepDue(room.next_step_due_at ? room.next_step_due_at.slice(0, 16) : '')
  }, [room])

  if (authLoading || loading) {
    return <div className="flex min-h-[65vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  if (!user || !profile) {
    return <AccountGate onLogin={() => navigateTo('login')} />
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <ShieldCheck className="h-10 w-10 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">Deal Room indisponibil</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button className="mt-5 gap-2" onClick={() => void loadRooms()}><RefreshCw className="h-4 w-4" /> Reîncearcă</Button>
      </div>
    )
  }

  if (!room) return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
    <h1 className="text-3xl font-semibold">Tranzacții</h1>
    <p className="mt-2 text-muted-foreground">Alege proprietatea și clientul. Fiecare dosar păstrează vizionarea, decizia, oferta și contractul împreună.</p>
    {unresolvedContext && <div role="alert" className="mt-6 rounded-xl border border-amber-300 p-4"><p className="font-medium">Dosarul cerut nu este disponibil pentru acest cont.</p><p className="mt-1 text-sm">Revino la vizionare sau alege explicit un dosar din lista de mai jos.</p><Button variant="outline" className="mt-3" onClick={() => navigateTo('vizionarile-mele')}>Înapoi la vizionări</Button></div>}
    <div className="mt-7 divide-y rounded-xl border bg-card px-4">
      {rooms.map(item => {
        const process = getTransactionProcess(item, profile.role, user.id)
        const client = item.deal_appointments?.map(link => relationOne(link.appointments)?.client_name).find(Boolean)
        return <button key={item.id} type="button" className="flex w-full flex-col gap-3 py-5 text-left hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between" onClick={() => { setSelectedId(item.id); setSection(''); setUnresolvedContext(false); selectDealRoom(item.id, item.deal_appointments?.[0]?.appointment_id) }}>
          <span className="min-w-0"><span className="block text-lg font-semibold">{relationOne(item.properties)?.title || item.title}</span><span className="mt-1 block text-sm text-muted-foreground">{client ? `Client: ${client} · ` : ''}{process.title}</span><span className="mt-1 block text-xs text-muted-foreground">{process.actionable ? 'De făcut de tine' : `În așteptare: ${process.actor}`}</span></span><span className="inline-flex shrink-0 items-center gap-2 text-sm font-medium">Deschide dosarul <ArrowRight className="h-4 w-4" /></span>
        </button>
      })}
      {!rooms.length && <div className="py-8"><h2 className="font-semibold">Nu ai încă un dosar de tranzacție</h2><p className="mt-2 text-sm text-muted-foreground">Începe cu o vizionare. Vei regăsi aici dosarul asociat proprietății.</p><Button className="mt-4" onClick={() => navigateTo('vizionarile-mele')}>Vezi vizionările</Button></div>}
    </div>
  </div>

  const process = getTransactionProcess(room, profile.role, user.id)
  const defaultSection = process.target === 'viewings' ? 'overview' : process.target
  const activeSection = section || defaultSection

  const participants = room.deal_participants || []
  const appointments = room.deal_appointments || []
  const requirements = room.deal_document_requirements || []
  const offers = [...(room.property_offers || [])].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
  const events = [...(room.deal_events || [])].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
  const documentSummary = summarizeDealRequirements(requirements)
  const completedDocs = documentSummary.complete
  const progress = documentSummary.receivedProgress
  const hasAcceptedOffer = offers.some(offer => offer.status === 'ACCEPTED')
  const activeOffer = getActiveDealOffer(offers)
  const allowedOfferActions = process.phase === 'negotiation' ? getAllowedDealOfferActions(activeOffer, profile.role, user.id, room) : []
  const decisionActions = allowedOfferActions.filter((action) => action !== 'COUNTERED')
  const canSendOffer = process.phase === 'negotiation' && canSubmitDealOffer(profile.role, activeOffer)
  const offerKind = profile.role === 'CLIENT' ? 'OFFER' : 'COUNTER_OFFER'
  const offerButtonLabel = activeOffer
    ? offerKind === 'COUNTER_OFFER' ? 'Trimite contraoferta' : 'Trimite oferta revizuita'
    : 'Trimite oferta'
  const selectedStageGate = getDealStageGate(stage, offers, requirements)
  const requestedAppointmentId = readAppointmentContext()
  const appointmentId = requestedAppointmentId && appointments.some((item) => item.appointment_id === requestedAppointmentId)
    ? requestedAppointmentId
    : appointments[0]?.appointment_id || null
  const pendingSignatureRequirement = requirements.find((requirement) => {
    const document = relationOne(requirement.client_documents)
    return document?.document_signers?.some((signer) => signer.user_id === user.id && signer.status === 'PENDING')
  })
  const nextRequirement = pendingSignatureRequirement
    || requirements.find((requirement) =>
      !getDealRequirementState(requirement).isComplete
      && (canManage || requirement.responsible_role === profile.role || requirement.assigned_to === user.id),
    )
    || requirements.find((requirement) => !getDealRequirementState(requirement).isComplete)
  const visibleRequirements = showAllRequirements ? requirements : requirements.slice(0, 4)
  const suggestedNextStep = process.description

  const handleOpenDocuments = (focus: DocumentFocusTarget = 'primary') => {
    if (appointmentId) openViewingDocuments(navigateTo, appointmentId, room.id, { focus })
    else navigateTo('documente')
  }

  const handleJourneyFocus = (target: 'viewing' | 'participants' | 'offers' | 'documents' | 'next-step') => {
    const targetId: Record<string, string> = {
      viewing: 'deal-viewing',
      participants: 'deal-participants',
      offers: 'deal-offers',
      documents: 'deal-documents',
      'next-step': 'deal-next-step',
    }
    setSection(target === 'offers' ? 'offers' : target === 'documents' ? 'documents' : target === 'next-step' ? 'next' : 'overview')
    setFocusRequest({ id: targetId[target] })
  }

  const handleProcessAction = () => {
    if (process.target === 'viewings') {
      navigateTo('vizionarile-mele')
      if (appointmentId) {
        const url = new URL(window.location.href)
        url.searchParams.set('appointment', appointmentId)
        window.history.replaceState(window.history.state, '', url)
      }
    } else if (process.target === 'documents') handleOpenDocuments('primary')
    else if (process.target === 'activity') { setSection('activity'); setFocusRequest({ id: 'deal-activity' }) }
    else handleJourneyFocus(process.target === 'offers' ? 'offers' : 'next-step')
  }

  const handleOffer = async () => {
    if (!canSendOffer) {
      toast.error('Nu exista o actiune de oferta disponibila pentru rolul tau acum.')
      return
    }
    const amount = Number(offerAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Introdu o valoare validă pentru ofertă.')
      return
    }
    setSaving(true)
    try {
      await submitDealOffer({
        room,
        userId: user.id,
        userName: profile.fullName,
        userEmail: user.email || '',
        amount,
        kind: offerKind,
        parentOfferId: activeOffer?.id,
        actor: profile.role,
        notes: offerNotes,
      })
      setOfferAmount('')
      setOfferNotes('')
      toast.success(offerKind === 'COUNTER_OFFER' ? 'Contraoferta a fost înregistrată.' : 'Oferta a fost înregistrată.')
      await loadRooms()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Oferta nu a putut fi salvată.')
    } finally {
      setSaving(false)
    }
  }

  const handleOfferDecision = async (nextStatus: DealOfferAction) => {
    if (!activeOffer) return
    setSaving(true)
    try {
      await transitionDealOffer({
        offerId: activeOffer.id,
        nextStatus,
        actor: profile.role,
        note: decisionNote,
      })
      setDecisionNote('')
      const copy: Record<DealOfferAction, string> = {
        ACCEPTED: 'Oferta a fost acceptata.',
        REJECTED: 'Oferta a fost respinsa.',
        WITHDRAWN: 'Oferta a fost retrasa.',
        COUNTERED: 'Negocierea a fost marcata pentru contraoferta.',
      }
      toast.success(copy[nextStatus])
      await loadRooms()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Oferta nu a putut fi actualizata.')
    } finally {
      setSaving(false)
    }
  }

  const handleNextStep = async () => {
    if (!selectedStageGate.ok) {
      toast.error(selectedStageGate.reason || 'Etapa selectata nu poate fi salvata in acest moment.')
      return
    }
    if ((stage === 'CONTRACT' || stage === 'CLOSED_WON') && !hasAcceptedOffer) {
      toast.error('Acceptă o ofertă înainte să muți tranzacția în Contract.')
      return
    }
    setSaving(true)
    try {
      await updateDealNextStep({
        dealId: room.id,
        stage,
        nextStep,
        ownerId: nextStepOwner || null,
        dueAt: nextStepDue ? new Date(nextStepDue).toISOString() : null,
      })
      toast.success('Următorul pas a fost actualizat.')
      await loadRooms()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Actualizarea nu a putut fi salvată.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <Button variant="ghost" className="mb-3 px-0" onClick={() => { setSelectedId(null); setSection(''); selectDealRoom('', null) }}>Înapoi la toate dosarele</Button>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={room.status} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{room.title}</h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Building2 className="h-4 w-4" /> {property?.address || property?.title || 'Proprietate'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="deal-selector">Selectează tranzacția</label>
              <select
                id="deal-selector"
                className="h-10 min-w-0 w-full max-w-full sm:w-64 rounded-md border bg-background px-3 text-sm"
                value={room.id}
                onChange={(event) => {
                  const dealId = event.target.value
                  const selectedRoom = rooms.find((item) => item.id === dealId)
                  setSection('')
                  setSelectedId(dealId)
                  selectDealRoom(dealId, selectedRoom?.deal_appointments?.[0]?.appointment_id)
                }}
              >
                {rooms.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
              <Button variant="outline" size="icon" aria-label="Reîncarcă Deal Room" onClick={() => void loadRooms()}><RefreshCw className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-5 sm:px-6 lg:px-8">
        <ProcessProgress process={process} />

        <section aria-label="Ce urmează în acest dosar" className="rounded-xl border bg-card p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-semibold">{process.title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{process.description}</p><p className="mt-3 text-sm font-medium">{process.actionable ? 'Acum acționezi tu.' : `Următoarea acțiune: ${process.actor}.`}</p></div><Button className="h-auto min-h-11 shrink-0 gap-2 whitespace-normal" variant={process.actionable ? 'default' : 'outline'} onClick={handleProcessAction}>{process.actionLabel}<ArrowRight className="h-4 w-4" /></Button></div>
        </section>

        <Tabs value={activeSection} onValueChange={value => { setSection(value); setFocusRequest(null) }} className="gap-5">
          <details className="rounded-xl border p-4"><summary className="cursor-pointer text-sm font-medium">Consultă alte informații din dosar</summary>
          <TabsList aria-label="Secțiunile tranzacției" className="mt-4 grid h-auto w-full grid-cols-3 gap-1 p-1 sm:grid-cols-5">
            <TabsTrigger value="overview" className="min-h-12 gap-2 whitespace-normal px-2"><CalendarCheck className="hidden h-4 w-4 sm:block" />Vizionare</TabsTrigger>
            <TabsTrigger value="documents" className="min-h-12 gap-2 whitespace-normal px-2"><FileText className="hidden h-4 w-4 sm:block" />Documente</TabsTrigger>
            <TabsTrigger value="offers" className="min-h-12 gap-2 whitespace-normal px-2"><HandCoins className="hidden h-4 w-4 sm:block" />Oferte</TabsTrigger>
            <TabsTrigger value="next" className="min-h-12 gap-2 whitespace-normal px-2"><ArrowRight className="hidden h-4 w-4 sm:block" />Pașii următori</TabsTrigger>
            <TabsTrigger value="activity" className="min-h-12 gap-2 whitespace-normal px-2"><History className="hidden h-4 w-4 sm:block" />Activitate</TabsTrigger>
          </TabsList></details>
          <TabsContent value="overview" forceMount className="space-y-4 data-[state=inactive]:hidden">
            <div><h2 className="text-xl font-semibold">Vizionarea și participanții</h2><p className="mt-1 text-sm text-muted-foreground">Verifică programarea și persoanele implicate în această tranzacție.</p></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card id="deal-viewing" className="scroll-mt-24">
                <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><CalendarCheck className="h-4 w-4 text-primary" /> Vizionare și prezență</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {appointments.length === 0 ? <EmptyLine text="Nicio vizionare asociată." /> : appointments.map((link) => {
                    const appointment = relationOne(link.appointments)
                    if (!appointment) return null
                    return (
                      <div key={link.appointment_id} className="rounded-xl border bg-muted/25 p-4">
                        <div className="flex items-center justify-between gap-3"><span className="font-medium">{formatDate(appointment.start_at || appointment.requested_at)}</span><StatusBadge status={appointment.status} /></div>
                        <p className="mt-2 text-sm text-muted-foreground">{appointment.client_name || 'Client'} · {appointment.staff_name || 'Agent în curs de alocare'}</p>
                        {appointment.feedback ? <p className="mt-3 rounded-lg bg-background p-3 text-sm">„{appointment.feedback}”</p> : null}
                      </div>
                    )
                  })}
                  <Button variant="outline" className="w-full" onClick={() => navigateTo('vizionarile-mele')}>Deschide agenda vizionărilor <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </CardContent>
              </Card>

              <Card id="deal-participants" className="scroll-mt-24">
                <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-primary" /> Participanți</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {participants.map((participant) => {
                    const person = relationOne(participant.profiles)
                    return (
                        <div key={participant.profile_id} className="flex items-center gap-3 rounded-xl border p-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{(person?.full_name || person?.name || participant.participant_role).charAt(0)}</div>
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{person?.full_name || person?.name || 'Participant'}</p><p className="text-xs text-muted-foreground">{getRoleLabel(participant.participant_role)}</p></div>
                        <StatusBadge status={participant.attendance_status} />
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="documents" forceMount className="space-y-4 data-[state=inactive]:hidden">
            <div><h2 className="text-xl font-semibold">Documentele tranzacției</h2><p className="mt-1 text-sm text-muted-foreground">Vezi ce lipsește și continuă completarea sau semnarea în dosarul digital.</p></div>
            <Card id="deal-documents" className="scroll-mt-24">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div><CardTitle className="flex items-center gap-2 text-base"><FileCheck2 className="h-4 w-4 text-primary" /> Documente, contracte și semnături</CardTitle><p className="mt-1 text-sm text-muted-foreground">{documentSummary.received} din {requirements.length} documente primite · {completedDocs} finalizate</p></div>
                  <div className="min-w-48"><div className="mb-1 flex justify-between text-xs"><span>Primite</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div></div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {nextRequirement && (
                  <div className="md:col-span-2 flex flex-col gap-4 rounded-xl border border-primary/25 bg-primary/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Badge className="mb-2 border-0 bg-primary/10 text-primary hover:bg-primary/10">Document de rezolvat</Badge>
                      <p className="font-semibold">{pendingSignatureRequirement ? `Semnează: ${nextRequirement.label}` : `Rezolvă: ${nextRequirement.label}`}</p>
                      <p className="mt-1 text-sm text-muted-foreground">Deschidem direct dosarul acestei vizionări, fără să pierzi contextul tranzacției.</p>
                    </div>
                    <Button className="shrink-0" onClick={() => handleOpenDocuments('primary')}>
                      {pendingSignatureRequirement ? <FileSignature className="mr-2 h-4 w-4" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                      Continuă documentul
                    </Button>
                  </div>
                )}
                {visibleRequirements.map((requirement) => {
                  const document = relationOne(requirement.client_documents)
                  const signers = document?.document_signers || []
                  const requirementState = getDealRequirementState(requirement)
                  return (
                      <div key={requirement.id} className="rounded-xl border p-4">
                        <div className="flex items-start justify-between gap-3"><div><p className="font-medium">{requirement.label}</p><p className="mt-1 text-xs text-muted-foreground">Responsabil: {getRoleLabel(requirement.responsible_role)}</p></div><StatusBadge status={requirementState.displayStatus} /></div>
                      {document ? (
                        <div className="mt-3 space-y-2 rounded-lg bg-muted/40 p-3 text-xs">
                          <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> {document.title}</span><Badge variant="outline">v{document.version}</Badge></div>
                          <div className="flex items-center justify-between"><span>Semnături</span><span className="font-medium">{signers.filter((item) => item.status === 'SIGNED').length}/{signers.length}</span></div>
                        </div>
                      ) : null}
                      <p className="mt-3 text-xs text-muted-foreground">{requirementState.helper}</p>
                    </div>
                  )
                })}
                {requirements.length > 4 && (
                  <Button variant="ghost" className="md:col-span-2" onClick={() => setShowAllRequirements((value) => !value)}>
                    {showAllRequirements ? 'Arată doar documentele prioritare' : `Arată toate cele ${requirements.length} cerințe`}
                  </Button>
                )}
                <Button variant="outline" className="md:col-span-2" onClick={() => handleOpenDocuments('archive')}><FileSignature className="mr-2 h-4 w-4" /> Deschide dosarul complet și versiunile</Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="offers" forceMount className="space-y-4 data-[state=inactive]:hidden">
            <div><h2 className="text-xl font-semibold">Negocierea ofertei</h2><p className="mt-1 text-sm text-muted-foreground">Consultă oferta curentă, răspunde sau propune o nouă valoare.</p></div>
            <Card id="deal-offers" className="scroll-mt-24">
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><HandCoins className="h-4 w-4 text-primary" /> Ofertă și contraofertă</CardTitle></CardHeader>
              <CardContent>
                {activeOffer ? (
                  <div className="mb-5 rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Badge className="mb-2 border-0 bg-primary/10 text-primary hover:bg-primary/10">Negociere activa</Badge>
                        <p className="font-semibold">{activeOffer.offer_kind === 'COUNTER_OFFER' ? 'Contraoferta activa' : 'Oferta activa'}: {formatMoney(activeOffer.offer_price, activeOffer.currency)}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{suggestedNextStep}</p>
                      </div>
                      <StatusBadge status={activeOffer.status} />
                    </div>
                    {decisionActions.length > 0 ? (
                      <div className="mt-4 space-y-3">
                        <Textarea value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} aria-label="Notă pentru răspuns (opțional)" placeholder="Notă pentru răspuns (opțional)" rows={2} />
                        <div className="flex flex-wrap gap-2">
                          {decisionActions.includes('ACCEPTED') ? <Button className="gap-2" onClick={() => void handleOfferDecision('ACCEPTED')} disabled={saving}><CheckCircle2 className="h-4 w-4" /> Acceptă oferta</Button> : null}
                          {decisionActions.includes('REJECTED') ? <Button variant="outline" className="gap-2" onClick={() => void handleOfferDecision('REJECTED')} disabled={saving}><XCircle className="h-4 w-4" /> Respinge</Button> : null}
                          {decisionActions.includes('WITHDRAWN') ? <Button variant="outline" className="gap-2" onClick={() => void handleOfferDecision('WITHDRAWN')} disabled={saving}><Undo2 className="h-4 w-4" /> Retrage</Button> : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-3">
                    {offers.length === 0 ? <EmptyLine text="Nu a fost depusă nicio ofertă." /> : offers.map((offer) => (
                      <div key={offer.id} className="flex items-center gap-4 rounded-xl border p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><HandCoins className="h-5 w-5 text-primary" /></div>
                        <div className="min-w-0 flex-1"><p className="font-semibold">{formatMoney(offer.offer_price, offer.currency)}</p><p className="text-xs text-muted-foreground">{offer.offer_kind === 'COUNTER_OFFER' ? 'Contraofertă' : 'Ofertă'} · {formatDate(offer.submitted_at || offer.created_at)}</p></div>
                        <StatusBadge status={offer.status} />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
                    <Label htmlFor="deal-offer">{offerKind === 'COUNTER_OFFER' ? 'Valoare contraofertă' : activeOffer ? 'Valoare ofertă revizuită' : 'Valoare ofertă'}</Label>
                    <Input id="deal-offer" type="number" min="1" value={offerAmount} onChange={(event) => setOfferAmount(event.target.value)} placeholder="Ex. 145000" disabled={!canSendOffer || saving} />
                    <Textarea aria-label="Condițiile ofertei (opțional)" value={offerNotes} onChange={(event) => setOfferNotes(event.target.value)} placeholder="Condiții, termen de valabilitate, avans…" rows={3} disabled={!canSendOffer || saving} />
                    {!canSendOffer ? <p className="text-xs text-muted-foreground">Asteapta actiunea celeilalte parti sau foloseste butoanele pentru oferta activa.</p> : null}
                    <Button className="w-full" onClick={() => void handleOffer()} disabled={saving || !canSendOffer}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{offerButtonLabel}</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="next" forceMount className="space-y-4 data-[state=inactive]:hidden">
            <div><h2 className="text-xl font-semibold">Cine face următorul pas</h2><p className="mt-1 text-sm text-muted-foreground">Urmărește acțiunea, responsabilul și termenul stabilit.</p></div>
            <Card id="deal-next-step" className="scroll-mt-24 border-primary/20 bg-primary/[0.03]">
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><ArrowRight className="h-4 w-4 text-primary" /> Următorul pas</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border bg-background/70 p-3">
                  <Badge variant="outline" className="mb-2 text-[10px]">Sugestie</Badge>
                  <p className="text-sm font-medium">{suggestedNextStep}</p>
                </div>
                {canManage && process.phase !== 'closed' ? (
                  <>
                    <div><Label htmlFor="deal-stage">Etapă</Label><select id="deal-stage" className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" value={stage} onChange={(event) => setStage(event.target.value as DealStage)}>{DEAL_STAGES.map((value) => <option key={value} value={value}>{STAGE_LABELS[value]}</option>)}</select></div>
                    <div><Label htmlFor="next-step">Acțiune</Label><Textarea id="next-step" className="mt-1" value={nextStep} onChange={(event) => setNextStep(event.target.value)} rows={3} /></div>
                    {!selectedStageGate.ok ? (
                      <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-500/10 p-3 text-xs text-amber-900 dark:border-amber-500/30 dark:text-amber-100">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{selectedStageGate.reason}</span>
                      </div>
                    ) : null}
                    <div><Label htmlFor="next-owner">Responsabil</Label><select id="next-owner" className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" value={nextStepOwner} onChange={(event) => setNextStepOwner(event.target.value)}><option value="">Nealocat</option>{participants.map((participant) => { const person = relationOne(participant.profiles); return <option key={participant.profile_id} value={participant.profile_id}>{person?.full_name || person?.name || participant.participant_role}</option> })}</select></div>
                    <div><Label htmlFor="next-due">Termen</Label><Input id="next-due" className="mt-1" type="datetime-local" value={nextStepDue} onChange={(event) => setNextStepDue(event.target.value)} /></div>
                    <Button className="w-full" onClick={() => void handleNextStep()} disabled={saving || !selectedStageGate.ok}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Salvează pasul</Button>
                  </>
                ) : (
                  <div><p className="font-medium">{room.next_step || suggestedNextStep || 'În curs de stabilire'}</p><p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="h-4 w-4" /> {formatDate(room.next_step_due_at)}</p></div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent id="deal-activity" value="activity" forceMount className="space-y-4 data-[state=inactive]:hidden">
            <div><h2 className="text-xl font-semibold">Istoricul tranzacției</h2><p className="mt-1 text-sm text-muted-foreground">Modificările recente, în ordine de la cea mai nouă.</p></div>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4 text-primary" /> Activitate recentă</CardTitle></CardHeader>
              <CardContent className="space-y-0">
                {events.length === 0 ? <EmptyLine text="Jurnalul va apărea aici." /> : events.slice(0, 12).map((event, index) => (
                  <div key={event.id} className="relative flex gap-3 pb-5">
                    {index < Math.min(events.length, 12) - 1 ? <div className="absolute left-[7px] top-4 h-full w-px bg-border" /> : null}
                    <div className="relative mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-primary bg-background" />
                    <div><p className="text-sm font-medium leading-snug">{event.summary}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(event.created_at)}</p></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>


      </main>
    </div>
  )
}

function ProcessProgress({ process }: { process: TransactionProcess }) {
  return <section aria-label="Parcursul dosarului" className="border-b pb-5">
    <ol className="grid grid-cols-2 gap-3 sm:grid-cols-5">{PROCESS_PHASES.map((phase, index) => <li key={phase.id} aria-current={phase.id === process.phase ? 'step' : undefined} className={`flex items-center gap-2 text-sm ${phase.id === process.phase ? 'font-semibold text-primary' : 'text-muted-foreground'}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs ${phase.id === process.phase ? 'border-primary bg-primary text-primary-foreground' : ''}`}>{index + 1}</span>{phase.label}</li>)}</ol>
  </section>
}

function StatusBadge({ status }: { status: string }) {
  return <Badge variant="outline" className={`shrink-0 text-[10px] ${getStatusTone(status)}`}>{getStatusLabel(status)}</Badge>
}

function EmptyLine({ text }: { text: string }) {
  return <div className="flex items-center gap-2 rounded-xl border border-dashed p-4 text-sm text-muted-foreground"><MessageSquareText className="h-4 w-4" /> {text}</div>
}

function AccountGate({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <UserRoundCheck className="h-11 w-11 text-primary" />
      <h1 className="mt-4 text-2xl font-bold">Autentificare necesară</h1>
      <p className="mt-2 text-sm text-muted-foreground">Deal Room conține date private ale tranzacției și este vizibil doar participanților autorizați.</p>
      <Button className="mt-6" onClick={onLogin}><CheckCircle2 className="mr-2 h-4 w-4" /> Autentifică-te</Button>
    </div>
  )
}
