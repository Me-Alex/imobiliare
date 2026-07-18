'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  Check,
  CheckCircle2,
  Circle,
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
  UserRoundCheck,
  Users,
  WalletCards,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'
import {
  DEAL_STAGES,
  type DealRoom,
  type DealStage,
  fetchDealRooms,
  relationOne,
  submitDealOffer,
  updateDealNextStep,
} from '@/lib/transaction-workspace'

const STAGE_LABELS: Record<DealStage, string> = {
  NEW: 'Nou',
  QUALIFIED: 'Calificat',
  VIEWING: 'Vizionare',
  OFFER: 'Ofertă',
  CONTRACT: 'Contract',
  CLOSED_WON: 'Finalizat',
  CLOSED_LOST: 'Închis',
}

const STATUS_STYLES: Record<string, string> = {
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  SIGNED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  PRESENT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  UPLOADED: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  REQUIRED: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  REJECTED: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
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
  const [rooms, setRooms] = useState<DealRoom[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [offerAmount, setOfferAmount] = useState('')
  const [offerNotes, setOfferNotes] = useState('')
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
      const requestedAppointment = typeof window !== 'undefined' ? sessionStorage.getItem('hqs-selected-appointment-id') : null
      const requestedRoom = requestedAppointment
        ? nextRooms.find((room) => room.deal_appointments?.some((item) => item.appointment_id === requestedAppointment))
        : null
      setSelectedId((current) => requestedRoom?.id || (current && nextRooms.some((room) => room.id === current) ? current : nextRooms[0]?.id || null))
      if (requestedRoom && typeof window !== 'undefined') sessionStorage.removeItem('hqs-selected-appointment-id')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Deal Room nu a putut fi încărcat.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { void loadRooms() }, [loadRooms])

  const room = useMemo(() => rooms.find((item) => item.id === selectedId) || null, [rooms, selectedId])
  const property = relationOne(room?.properties)
  const canManage = profile?.role === 'AGENT' || profile?.role === 'ADMIN'
  const canCounter = profile?.role === 'AGENT' || profile?.role === 'OWNER' || profile?.role === 'ADMIN'

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

  if (!room) {
    return (
      <div className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <WalletCards className="h-11 w-11 text-primary" />
        <h1 className="mt-4 text-2xl font-bold">Prima tranzacție începe cu o vizionare</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">După programarea unei vizionări, platforma creează automat spațiul comun pentru participanți, documente, oferte și pașii următori.</p>
        <Button className="mt-6" onClick={() => navigateTo(profile.role === 'CLIENT' ? 'programare-vizionare' : 'vizionarile-mele')}>Deschide vizionările</Button>
      </div>
    )
  }

  const participants = room.deal_participants || []
  const appointments = room.deal_appointments || []
  const requirements = room.deal_document_requirements || []
  const offers = [...(room.property_offers || [])].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
  const events = [...(room.deal_events || [])].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
  const completedDocs = requirements.filter((item) => ['APPROVED', 'WAIVED'].includes(item.status)).length
  const progress = requirements.length ? Math.round(completedDocs / requirements.length * 100) : 0

  const handleOffer = async () => {
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
        kind: canCounter && offers.length > 0 ? 'COUNTER_OFFER' : 'OFFER',
        parentOfferId: offers[0]?.id,
        notes: offerNotes,
      })
      setOfferAmount('')
      setOfferNotes('')
      toast.success(canCounter && offers.length > 0 ? 'Contraoferta a fost înregistrată.' : 'Oferta a fost înregistrată.')
      await loadRooms()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Oferta nu a putut fi salvată.')
    } finally {
      setSaving(false)
    }
  }

  const handleNextStep = async () => {
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
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge className="border-0 bg-primary/10 text-primary hover:bg-primary/10">Deal Room</Badge>
                <Badge variant="outline">{room.status}</Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{room.title}</h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Building2 className="h-4 w-4" /> {property?.address || property?.title || 'Proprietate'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="deal-selector">Selectează tranzacția</label>
              <select id="deal-selector" className="h-10 min-w-64 rounded-md border bg-background px-3 text-sm" value={room.id} onChange={(event) => setSelectedId(event.target.value)}>
                {rooms.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
              <Button variant="outline" size="icon" aria-label="Reîncarcă Deal Room" onClick={() => void loadRooms()}><RefreshCw className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-6 lg:px-8">
        <StageProgress current={room.stage} />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
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
                  <Button variant="outline" className="w-full" onClick={() => navigateTo('vizionarile-mele')}>Deschide fișa de vizionare <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-primary" /> Participanți</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {participants.map((participant) => {
                    const person = relationOne(participant.profiles)
                    return (
                      <div key={participant.profile_id} className="flex items-center gap-3 rounded-xl border p-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{(person?.full_name || person?.name || participant.participant_role).charAt(0)}</div>
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{person?.full_name || person?.name || 'Participant'}</p><p className="text-xs text-muted-foreground">{participant.participant_role}</p></div>
                        <StatusBadge status={participant.attendance_status} />
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div><CardTitle className="flex items-center gap-2 text-base"><FileCheck2 className="h-4 w-4 text-primary" /> Documente, contracte și semnături</CardTitle><p className="mt-1 text-sm text-muted-foreground">{completedDocs} din {requirements.length} cerințe finalizate</p></div>
                  <div className="min-w-48"><div className="mb-1 flex justify-between text-xs"><span>Completare</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div></div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {requirements.map((requirement) => {
                  const document = relationOne(requirement.client_documents)
                  const signers = document?.document_signers || []
                  return (
                    <div key={requirement.id} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-3"><div><p className="font-medium">{requirement.label}</p><p className="mt-1 text-xs text-muted-foreground">Responsabil: {requirement.responsible_role}</p></div><StatusBadge status={requirement.status} /></div>
                      {document ? (
                        <div className="mt-3 space-y-2 rounded-lg bg-muted/40 p-3 text-xs">
                          <div className="flex items-center justify-between"><span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> {document.title}</span><Badge variant="outline">v{document.version}</Badge></div>
                          <div className="flex items-center justify-between"><span>Semnături</span><span className="font-medium">{signers.filter((item) => item.status === 'SIGNED').length}/{signers.length}</span></div>
                        </div>
                      ) : <p className="mt-3 text-xs text-muted-foreground">Documentul nu a fost încă încărcat.</p>}
                    </div>
                  )
                })}
                <Button variant="outline" className="md:col-span-2" onClick={() => navigateTo('documente')}><FileSignature className="mr-2 h-4 w-4" /> Gestionează documentele și versiunile</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><HandCoins className="h-4 w-4 text-primary" /> Ofertă și contraofertă</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
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
                    <Label htmlFor="deal-offer">{canCounter && offers.length > 0 ? 'Valoare contraofertă' : 'Valoare ofertă'}</Label>
                    <Input id="deal-offer" type="number" min="1" value={offerAmount} onChange={(event) => setOfferAmount(event.target.value)} placeholder="Ex. 145000" />
                    <Textarea value={offerNotes} onChange={(event) => setOfferNotes(event.target.value)} placeholder="Condiții, termen de valabilitate, avans…" rows={3} />
                    <Button className="w-full" onClick={() => void handleOffer()} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{canCounter && offers.length > 0 ? 'Trimite contraoferta' : 'Trimite oferta'}</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="border-primary/20 bg-primary/[0.03]">
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><ArrowRight className="h-4 w-4 text-primary" /> Următorul pas</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {canManage ? (
                  <>
                    <div><Label htmlFor="deal-stage">Etapă</Label><select id="deal-stage" className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" value={stage} onChange={(event) => setStage(event.target.value as DealStage)}>{DEAL_STAGES.map((value) => <option key={value} value={value}>{STAGE_LABELS[value]}</option>)}</select></div>
                    <div><Label htmlFor="next-step">Acțiune</Label><Textarea id="next-step" className="mt-1" value={nextStep} onChange={(event) => setNextStep(event.target.value)} rows={3} /></div>
                    <div><Label htmlFor="next-owner">Responsabil</Label><select id="next-owner" className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" value={nextStepOwner} onChange={(event) => setNextStepOwner(event.target.value)}><option value="">Nealocat</option>{participants.map((participant) => { const person = relationOne(participant.profiles); return <option key={participant.profile_id} value={participant.profile_id}>{person?.full_name || person?.name || participant.participant_role}</option> })}</select></div>
                    <div><Label htmlFor="next-due">Termen</Label><Input id="next-due" className="mt-1" type="datetime-local" value={nextStepDue} onChange={(event) => setNextStepDue(event.target.value)} /></div>
                    <Button className="w-full" onClick={() => void handleNextStep()} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Salvează pasul</Button>
                  </>
                ) : (
                  <div><p className="font-medium">{room.next_step || 'În curs de stabilire'}</p><p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="h-4 w-4" /> {formatDate(room.next_step_due_at)}</p></div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4 text-primary" /> Jurnal complet</CardTitle></CardHeader>
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
          </aside>
        </div>
      </main>
    </div>
  )
}

function StageProgress({ current }: { current: DealStage }) {
  const currentIndex = DEAL_STAGES.indexOf(current)
  return (
    <Card><CardContent className="overflow-x-auto p-4 sm:p-5"><div className="flex min-w-[700px] items-center">{DEAL_STAGES.map((stage, index) => { const complete = index < currentIndex; const active = index === currentIndex; return <div key={stage} className="flex flex-1 items-center last:flex-none"><div className="flex flex-col items-center gap-2"><div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${complete ? 'border-primary bg-primary text-primary-foreground' : active ? 'border-primary bg-background text-primary' : 'border-border bg-muted text-muted-foreground'}`}>{complete ? <Check className="h-4 w-4" /> : active ? <Circle className="h-3 w-3 fill-current" /> : index + 1}</div><span className={`text-xs font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>{STAGE_LABELS[stage]}</span></div>{index < DEAL_STAGES.length - 1 ? <div className={`mx-2 h-0.5 flex-1 ${index < currentIndex ? 'bg-primary' : 'bg-border'}`} /> : null}</div> })}</div></CardContent></Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  return <Badge variant="secondary" className={`shrink-0 border-0 text-[10px] ${STATUS_STYLES[status] || ''}`}>{status.replaceAll('_', ' ')}</Badge>
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
