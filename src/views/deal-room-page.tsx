'use client'

import { getTransactionProcess } from '@/lib/transaction-process'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, Loader2, ShieldCheck, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  const [unresolvedContext, setUnresolvedContext] = useState(false)
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
    return <div className="mx-auto max-w-xl p-8"><h1 className="text-2xl font-semibold">Intră în cont</h1><Button className="mt-4" onClick={() => navigateTo('login')}>Autentificare</Button></div>
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
        return <button key={item.id} type="button" className="flex w-full flex-col gap-3 py-5 text-left hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between" onClick={() => { setSelectedId(item.id); setUnresolvedContext(false); selectDealRoom(item.id, item.deal_appointments?.[0]?.appointment_id) }}>
          <span className="min-w-0"><span className="block text-lg font-semibold">{relationOne(item.properties)?.title || item.title}</span><span className="mt-1 block text-sm text-muted-foreground">{client ? `Client: ${client} · ` : ''}{process.title}</span><span className="mt-1 block text-xs text-muted-foreground">{process.actionable ? 'De făcut de tine' : `În așteptare: ${process.actor}`}</span></span><span className="inline-flex shrink-0 items-center gap-2 text-sm font-medium">Deschide dosarul <ArrowRight className="h-4 w-4" /></span>
        </button>
      })}
      {!rooms.length && <div className="py-8"><h2 className="font-semibold">Nu ai încă un dosar de tranzacție</h2><p className="mt-2 text-sm text-muted-foreground">Începe cu o vizionare. Vei regăsi aici dosarul asociat proprietății.</p><Button className="mt-4" onClick={() => navigateTo('vizionarile-mele')}>Vezi vizionările</Button></div>}
    </div>
  </div>

  const process = getTransactionProcess(room, profile.role, user.id)
  const participants = room.deal_participants || []
  const appointments = room.deal_appointments || []
  const requirements = room.deal_document_requirements || []
  const offers = [...(room.property_offers || [])].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
  const events = [...(room.deal_events || [])].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
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
  const handleOpenDocuments = (focus: DocumentFocusTarget = 'primary') => {
    if (appointmentId) openViewingDocuments(navigateTo, appointmentId, room.id, { focus })
    else navigateTo('documente')
  }

  const handleOpenViewing = () => {
    navigateTo('vizionarile-mele')
    if (appointmentId) {
      const url = new URL(window.location.href)
      url.searchParams.set('appointment', appointmentId)
      window.history.replaceState(window.history.state, '', url)
    }
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


  const offerForm = canSendOffer ? <form className="mt-5 space-y-4" onSubmit={event => { event.preventDefault(); void handleOffer() }}>
    <div><Label htmlFor="deal-offer">{offerKind === 'COUNTER_OFFER' ? 'Propune altă sumă' : 'Suma oferită'} ({activeOffer?.currency || property?.currency || 'EUR'})</Label>
      <Input id="deal-offer" className="mt-2" type="number" min="1" required value={offerAmount} onChange={event => setOfferAmount(event.target.value)} placeholder="Ex. 145000" disabled={saving} /></div>
    <div><Label htmlFor="offer-conditions">Condițiile ofertei (opțional)</Label><Textarea id="offer-conditions" className="mt-2" value={offerNotes} onChange={event => setOfferNotes(event.target.value)} placeholder="Avans, termen sau alte condiții" rows={2} disabled={saving} /></div>
    <Button type="submit" disabled={saving}>{saving ? 'Se trimite…' : offerButtonLabel}</Button>
  </form> : null

  const offerSection = <section aria-label="Oferta tranzacției" className="space-y-4">
    {activeOffer ? <div>
      <div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-semibold">{formatMoney(activeOffer.offer_price, activeOffer.currency)}</h2><StatusBadge status={activeOffer.status} /></div>
      <p className="mt-1 text-sm text-muted-foreground">{activeOffer.offer_kind === 'COUNTER_OFFER' ? 'Contraoferta curentă' : 'Oferta curentă'}</p>
      {activeOffer.notes && <p className="mt-3 whitespace-pre-wrap text-sm">{activeOffer.notes}</p>}
      {decisionActions.length > 0 && <div className="mt-5">
        <details><summary className="cursor-pointer py-2 text-sm text-muted-foreground">Adaugă o notă la răspuns</summary><Textarea className="mt-2" value={decisionNote} onChange={event => setDecisionNote(event.target.value)} aria-label="Notă pentru răspuns (opțional)" rows={2} /></details>
        <div className="mt-3 flex flex-wrap gap-2">
          {decisionActions.includes('ACCEPTED') && <Button disabled={saving} onClick={() => void handleOfferDecision('ACCEPTED')}>Acceptă oferta</Button>}
          {decisionActions.includes('REJECTED') && <Button variant="outline" disabled={saving} onClick={() => void handleOfferDecision('REJECTED')}>Respinge</Button>}
          {decisionActions.includes('WITHDRAWN') && <Button variant="outline" disabled={saving} onClick={() => void handleOfferDecision('WITHDRAWN')}>Retrage oferta</Button>}
        </div>
      </div>}
    </div> : offers.length === 0 ? <p className="text-sm text-muted-foreground">Nu există încă o ofertă.</p> : null}
    {offerForm && (activeOffer ? <details className="border-t pt-3"><summary className="cursor-pointer py-2 font-medium">Propune o altă ofertă</summary>{offerForm}</details> : offerForm)}
    {offers.filter(offer => offer.id !== activeOffer?.id).length > 0 && <details className="border-t pt-3"><summary className="cursor-pointer py-2 text-sm">Ofertele anterioare</summary><div className="divide-y">{offers.filter(offer => offer.id !== activeOffer?.id).map(offer => <div key={offer.id} className="flex items-center justify-between gap-3 py-3"><div><p className="font-medium">{formatMoney(offer.offer_price, offer.currency)}</p><p className="text-xs text-muted-foreground">{formatDate(offer.submitted_at || offer.created_at)}</p></div><StatusBadge status={offer.status} /></div>)}</div></details>}
  </section>

  const documentsSection = <section aria-label="Documentele tranzacției">
    {requirements.length ? <div className="divide-y">{requirements.map(requirement => <div key={requirement.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium">{requirement.label}</p><p className="mt-1 text-xs text-muted-foreground">{getRoleLabel(requirement.responsible_role)}</p></div><StatusBadge status={getDealRequirementState(requirement).displayStatus} /></div>)}</div> : <p className="text-sm text-muted-foreground">Agentul stabilește documentele necesare.</p>}
    <Button variant={process.phase === 'contract' ? 'default' : 'outline'} className="mt-4" onClick={() => handleOpenDocuments('primary')}>{process.phase === 'contract' && process.target === 'documents' ? process.actionLabel : 'Consultă documentele'}</Button>
  </section>

  return <div className="mx-auto max-w-3xl space-y-7 px-4 py-7 sm:px-6">
    <header>
      <Button variant="link" className="mb-4 h-auto p-0" onClick={() => { setSelectedId(null); selectDealRoom('', null) }}>Înapoi la tranzacții</Button>
      <h1 className="text-2xl font-semibold leading-snug">{property?.title || room.title}</h1>
      {property?.address && <p className="mt-2 text-sm text-muted-foreground">{property.address}</p>}
    </header>
    <section aria-label="Ce urmează în acest dosar" className="border-y py-5">
      <h2 className="text-lg font-semibold">{process.title}</h2>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">{process.description}</p>
      {!process.actionable && process.phase !== 'closed' && <p className="mt-2 text-sm">Se așteaptă: {process.actor.toLowerCase()}.</p>}
      {process.target === 'viewings' && <Button className="mt-4" onClick={handleOpenViewing}>{process.actionLabel}</Button>}
    </section>
    {process.phase === 'negotiation' && offerSection}
    {process.phase === 'contract' && documentsSection}
    <div className="divide-y border-y">
      {process.phase !== 'negotiation' && <details className="py-3"><summary className="cursor-pointer py-2 font-medium">Oferte{offers.length ? ` · ${offers.length}` : ''}</summary><div className="py-3">{offerSection}</div></details>}
      {process.phase !== 'contract' && <details className="py-3"><summary className="cursor-pointer py-2 font-medium">Documente{requirements.length ? ` · ${requirements.length}` : ''}</summary><div className="py-3">{documentsSection}</div></details>}
      <details className="py-3"><summary className="cursor-pointer py-2 font-medium">Vizionarea și persoanele implicate</summary>
        <div className="space-y-4 py-3">
          {appointments.map(link => { const visit = relationOne(link.appointments); return visit ? <div key={link.appointment_id}><p className="text-sm">{formatDate(visit.start_at || visit.requested_at)} · {getStatusLabel(visit.status)}</p><p className="mt-1 text-sm text-muted-foreground">{visit.client_name} · {visit.staff_name}</p></div> : null })}
          {participants.map(participant => { const person = relationOne(participant.profiles); return <p key={participant.profile_id} className="text-sm"><span className="font-medium">{person?.full_name || person?.name || getRoleLabel(participant.participant_role)}</span><span className="text-muted-foreground"> · {getRoleLabel(participant.participant_role)}</span></p> })}
          <Button variant="outline" onClick={handleOpenViewing}>Consultă vizionarea</Button>
        </div>
      </details>
      {canManage && process.phase !== 'closed' && <details open={process.target === 'next'} className="py-3"><summary className="cursor-pointer py-2 font-medium">Gestionarea tranzacției</summary><div className="space-y-4 py-3">
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
      </div></details>}
      <details className="py-3"><summary className="cursor-pointer py-2 font-medium">Istoric</summary><div className="divide-y py-3">{events.length ? events.map(event => <div key={event.id} className="py-3"><p className="text-sm">{event.summary}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(event.created_at)}</p></div>) : <p className="text-sm text-muted-foreground">Nu sunt modificări înregistrate.</p>}</div></details>
    </div>
    <Button variant="ghost" size="sm" onClick={() => void loadRooms()}>Actualizează datele</Button>
  </div>
}

function StatusBadge({ status }: { status: string }) {
  return <Badge variant="outline" className={`shrink-0 text-xs ${getStatusTone(status)}`}>{getStatusLabel(status)}</Badge>
}
