'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Gauge,
  Inbox,
  Loader2,
  MapPin,
  MessageCircleWarning,
  PhoneCall,
  RefreshCw,
  Sparkles,
  Target,
  UserRoundPlus,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import {
  CRM_STAGES,
  type CrmLead,
  type CrmStage,
  autoAssignLeads,
  completeFollowUp,
  createFollowUp,
  fetchCrmSnapshot,
  normalizeCrmStage,
  relationOne,
  updateLeadStage,
} from '@/lib/transaction-workspace'

const STAGE_META: Record<CrmStage, { label: string; dot: string; accent: string }> = {
  NEW: { label: 'Nou', dot: 'bg-violet-500', accent: 'border-t-violet-500' },
  QUALIFIED: { label: 'Calificat', dot: 'bg-blue-500', accent: 'border-t-blue-500' },
  VIEWING: { label: 'Vizionare', dot: 'bg-amber-500', accent: 'border-t-amber-500' },
  OFFER: { label: 'Ofertă', dot: 'bg-orange-500', accent: 'border-t-orange-500' },
  CONTRACT: { label: 'Contract', dot: 'bg-emerald-500', accent: 'border-t-emerald-500' },
}

function shortDate(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('ro-RO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function sourceLabel(source?: string | null) {
  const normalized = (source || 'website').toLowerCase()
  if (normalized.includes('google')) return 'Google'
  if (normalized.includes('facebook') || normalized.includes('meta')) return 'Meta'
  if (normalized.includes('ref')) return 'Recomandare'
  if (normalized.includes('portal')) return 'Portal'
  return 'Website'
}

export function CrmPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [leads, setLeads] = useState<CrmLead[]>([])
  const [followUps, setFollowUps] = useState<Awaited<ReturnType<typeof fetchCrmSnapshot>>['followUps']>([])
  const [appointments, setAppointments] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    setError('')
    try {
      const snapshot = await fetchCrmSnapshot()
      setLeads(snapshot.leads)
      setFollowUps(snapshot.followUps)
      setAppointments(snapshot.appointments)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'CRM-ul nu a putut fi încărcat.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { void load() }, [load])

  const metrics = useMemo(() => {
    const responded = leads.filter((lead) => lead.first_response_at)
    const responseMinutes = responded.map((lead) => Math.max(0, (+new Date(lead.first_response_at as string) - +new Date(lead.created_at)) / 60000))
    const averageResponse = responseMinutes.length ? Math.round(responseMinutes.reduce((sum, value) => sum + value, 0) / responseMinutes.length) : 0
    const converted = leads.filter((lead) => ['OFFER', 'CONTRACT', 'WON', 'CLOSED'].includes(lead.status)).length
    const unanswered = leads.filter((lead) => lead.status === 'NEW' && +new Date(lead.response_due_at || lead.created_at) < Date.now()).length
    return {
      averageResponse,
      conversion: leads.length ? Math.round(converted / leads.length * 100) : 0,
      unanswered,
      upcoming: appointments.length,
    }
  }, [appointments.length, leads])

  const grouped = useMemo(() => Object.fromEntries(CRM_STAGES.map((stage) => [stage, leads.filter((lead) => normalizeCrmStage(lead.status) === stage)])) as Record<CrmStage, CrmLead[]>, [leads])
  const openFollowUps = followUps.filter((item) => item.status === 'OPEN')

  if (authLoading || loading) return <div className="flex min-h-[65vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (!user || !profile) return <SimpleState icon={Users} title="Autentificare necesară" description="CRM-ul este disponibil agenților și administratorilor autentificați." />
  if (!['AGENT', 'ADMIN'].includes(profile.role)) return <SimpleState icon={Target} title="Acces restricționat" description="Acest spațiu conține date comerciale și este disponibil doar echipei agenției." />
  if (error) return <SimpleState icon={MessageCircleWarning} title="CRM indisponibil" description={error} action={<Button onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" /> Reîncearcă</Button>} />

  const handleAdvance = async (lead: CrmLead) => {
    const current = CRM_STAGES.indexOf(normalizeCrmStage(lead.status))
    if (current >= CRM_STAGES.length - 1) return
    const next = CRM_STAGES[current + 1]
    setWorkingId(lead.id)
    try {
      await updateLeadStage(lead.id, next)
      toast.success(`${lead.name} a trecut în etapa „${STAGE_META[next].label}”.`)
      await load()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Etapa nu a putut fi actualizată.')
    } finally {
      setWorkingId('')
    }
  }

  const handleFollowUp = async (lead: CrmLead) => {
    const assignedTo = lead.agent_id || user.id
    const due = new Date(Date.now() + 24 * 60 * 60 * 1000)
    due.setHours(10, 0, 0, 0)
    setWorkingId(lead.id)
    try {
      await createFollowUp({ leadId: lead.id, assignedTo, createdBy: user.id, title: `Contactează ${lead.name}`, dueAt: due.toISOString() })
      toast.success('Follow-up programat pentru mâine la 10:00.')
      await load()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Follow-up-ul nu a putut fi creat.')
    } finally {
      setWorkingId('')
    }
  }

  const handleComplete = async (id: string) => {
    setWorkingId(id)
    try {
      await completeFollowUp(id)
      toast.success('Follow-up finalizat.')
      await load()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Follow-up-ul nu a putut fi finalizat.')
    } finally {
      setWorkingId('')
    }
  }

  const handleAutoAssign = async () => {
    setWorkingId('auto-assign')
    try {
      const changed = await autoAssignLeads()
      toast.success(`${changed} lead-uri au fost repartizate după zonă, disponibilitate și încărcare.`)
      await load()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Repartizarea automată nu a putut fi executată.')
    } finally {
      setWorkingId('')
    }
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto max-w-[1600px] px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><Badge className="mb-2 border-0 bg-primary/10 text-primary hover:bg-primary/10">CRM agenți</Badge><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Pipeline comercial</h1><p className="mt-2 text-sm text-muted-foreground">Lead-uri, follow-up-uri, vizionări și rezultate într-un singur flux.</p></div>
            <div className="flex gap-2">
              {profile.role === 'ADMIN' ? <Button variant="outline" onClick={() => void handleAutoAssign()} disabled={workingId === 'auto-assign'}>{workingId === 'auto-assign' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} Repartizează automat</Button> : null}
              <Button variant="outline" size="icon" aria-label="Reîncarcă CRM" onClick={() => void load()}><RefreshCw className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-7 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Metric icon={Inbox} label="Lead-uri active" value={leads.filter((lead) => !['WON', 'CLOSED', 'LOST'].includes(lead.status)).length} detail={`${leads.filter((lead) => lead.status === 'NEW').length} noi`} tone="violet" />
          <Metric icon={Clock3} label="Timp mediu răspuns" value={`${metrics.averageResponse} min`} detail="de la cerere" tone="blue" />
          <Metric icon={Target} label="Rată conversie" value={`${metrics.conversion}%`} detail="până la ofertă" tone="emerald" />
          <Metric icon={MessageCircleWarning} label="Fără răspuns" value={metrics.unanswered} detail={`${metrics.upcoming} vizionări viitoare`} tone={metrics.unanswered ? 'rose' : 'amber'} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
          <section aria-labelledby="pipeline-heading" className="min-w-0">
            <h2 id="pipeline-heading" className="sr-only">Etapele pipeline-ului</h2>
            <div className="overflow-x-auto pb-3">
              <div className="grid min-w-[1180px] grid-cols-5 gap-4">
                {CRM_STAGES.map((stage) => (
                  <div key={stage} className={`rounded-2xl border border-t-4 bg-background ${STAGE_META[stage].accent}`}>
                    <div className="flex items-center justify-between border-b px-4 py-3"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${STAGE_META[stage].dot}`} /><h3 className="text-sm font-semibold">{STAGE_META[stage].label}</h3></div><Badge variant="secondary">{grouped[stage].length}</Badge></div>
                    <div className="min-h-80 space-y-3 p-3">
                      {grouped[stage].map((lead) => <LeadCard key={lead.id} lead={lead} isWorking={workingId === lead.id} onAdvance={() => void handleAdvance(lead)} onFollowUp={() => void handleFollowUp(lead)} />)}
                      {grouped[stage].length === 0 ? <div className="rounded-xl border border-dashed p-5 text-center text-xs text-muted-foreground">Niciun lead în această etapă</div> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><CalendarClock className="h-4 w-4 text-primary" /> Follow-up-uri</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {openFollowUps.length === 0 ? <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground"><CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-500" /> Agenda este la zi.</div> : openFollowUps.slice(0, 8).map((item) => (
                  <div key={item.id} className="rounded-xl border p-3">
                    <div className="flex items-start gap-3"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.title}</p><p className={`mt-1 text-xs ${+new Date(item.due_at) < Date.now() ? 'font-medium text-rose-600' : 'text-muted-foreground'}`}>{shortDate(item.due_at)}</p></div></div>
                    <Button variant="ghost" size="sm" className="mt-2 w-full" disabled={workingId === item.id} onClick={() => void handleComplete(item.id)}><CheckCircle2 className="mr-2 h-4 w-4" /> Marchează finalizat</Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4 text-primary" /> Sănătatea pipeline-ului</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <HealthLine label="Răspuns în SLA" value={leads.length ? Math.round((leads.length - metrics.unanswered) / leads.length * 100) : 100} />
                <HealthLine label="Lead-uri calificate" value={leads.length ? Math.round(leads.filter((lead) => CRM_STAGES.indexOf(normalizeCrmStage(lead.status)) >= 1).length / leads.length * 100) : 0} />
                <HealthLine label="Conversie la ofertă" value={metrics.conversion} />
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  )
}

function LeadCard({ lead, isWorking, onAdvance, onFollowUp }: { lead: CrmLead; isWorking: boolean; onAdvance: () => void; onFollowUp: () => void }) {
  const property = relationOne(lead.properties)
  const stage = normalizeCrmStage(lead.status)
  const isLast = stage === 'CONTRACT'
  return (
    <article className="rounded-xl border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2"><div className="min-w-0"><h4 className="truncate text-sm font-semibold">{lead.name}</h4><p className="mt-0.5 truncate text-xs text-muted-foreground">{lead.email || lead.phone || 'Date de contact indisponibile'}</p></div><Badge variant="outline" className="shrink-0 text-[10px]">{sourceLabel(lead.source)}</Badge></div>
      {property ? <div className="mt-3 rounded-lg bg-muted/50 p-2.5"><p className="truncate text-xs font-medium">{property.title}</p><p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="h-3 w-3" /> {property.zone || property.city || 'Zonă nespecificată'}</p></div> : null}
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground"><span>Scor {lead.score}/100</span><span>{shortDate(lead.created_at)}</span></div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(5, Math.min(100, lead.score))}%` }} /></div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={onFollowUp} disabled={isWorking}><PhoneCall className="mr-1.5 h-3.5 w-3.5" /> Follow-up</Button>
        <Button size="sm" onClick={onAdvance} disabled={isWorking || isLast}>{isWorking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isLast ? <CheckCircle2 className="h-3.5 w-3.5" /> : <><span>Avansează</span><ArrowRight className="ml-1 h-3.5 w-3.5" /></>}</Button>
      </div>
    </article>
  )
}

function Metric({ icon: Icon, label, value, detail, tone }: { icon: React.ElementType; label: string; value: string | number; detail: string; tone: 'violet' | 'blue' | 'emerald' | 'rose' | 'amber' }) {
  const tones = { violet: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300', blue: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', rose: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300', amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' }
  return <Card><CardContent className="p-4 sm:p-5"><div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}><Icon className="h-4 w-4" /></div><p className="text-2xl font-bold sm:text-3xl">{value}</p><p className="text-sm font-medium">{label}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card>
}

function HealthLine({ label, value }: { label: string; value: number }) {
  return <div><div className="mb-1.5 flex items-center justify-between text-xs"><span>{label}</span><span className="font-semibold">{value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div></div>
}

function SimpleState({ icon: Icon, title, description, action }: { icon: React.ElementType; title: string; description: string; action?: React.ReactNode }) {
  return <div className="mx-auto flex min-h-[65vh] max-w-lg flex-col items-center justify-center px-4 text-center"><Icon className="h-11 w-11 text-primary" /><h1 className="mt-4 text-2xl font-bold">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{description}</p>{action ? <div className="mt-5">{action}</div> : null}</div>
}
