'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw, Users, Target, MessageCircleWarning } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { PageContainer, PageShell } from '@/components/layout/page-shell'
import { PageHero } from '@/components/layout/page-hero'
import { useAuth } from '@/contexts/auth-context'
import {
  CRM_STAGES, type CrmLead, type CrmStage, autoAssignLeads,
  completeFollowUp, createFollowUp, fetchCrmSnapshot,
  normalizeCrmStage, relationOne, updateLeadStage,
} from '@/lib/transaction-workspace'

const STAGE_META: Record<CrmStage, { label: string }> = {
  NEW: { label: 'Nou' }, QUALIFIED: { label: 'Calificat' },
  VIEWING: { label: 'Vizionare' }, OFFER: { label: 'Ofertă' }, CONTRACT: { label: 'Contract' },
}
const TERMINAL_LEAD_STATUSES = new Set(['WON', 'CLOSED', 'LOST'])
function isLeadTerminal(lead: CrmLead) { return TERMINAL_LEAD_STATUSES.has(lead.status) }
function shortDate(value?: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Dată nespecificată'
  return new Intl.DateTimeFormat('ro-RO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}
function isLeadResponseOverdue(lead: CrmLead) {
  return lead.status === 'NEW' && Date.parse(lead.response_due_at || lead.created_at) < Date.now()
}

export function CrmPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [leads, setLeads] = useState<CrmLead[]>([])
  const [followUps, setFollowUps] = useState<Awaited<ReturnType<typeof fetchCrmSnapshot>>['followUps']>([])
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState('')
  const [error, setError] = useState('')
  const [leadScope, setLeadScope] = useState<'mine' | 'all'>('all')
  const [query, setQuery] = useState('')
  const [stageFilter, setStageFilter] = useState('active')
  const load = useCallback(async () => {
    if (!user || !profile || !['AGENT', 'ADMIN'].includes(profile.role)) { setLoading(false); return }
    setLoading(true)
    setError('')
    try {
      const snapshot = await fetchCrmSnapshot()
      setLeads(snapshot.leads)
      setFollowUps(snapshot.followUps)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Clienții nu au putut fi încărcați.')
    } finally { setLoading(false) }
  }, [user, profile])
  useEffect(() => { void load() }, [load])
  useEffect(() => { setLeadScope(profile?.role === 'AGENT' ? 'mine' : 'all') }, [profile?.role])
  const scopedLeads = useMemo(() => leads.filter(lead => leadScope === 'all' || lead.agent_id === user?.id), [leads, leadScope, user?.id])
  const scopedFollowUps = useMemo(() => followUps
    .filter(item => item.status === 'OPEN' && (leadScope === 'all' || item.assigned_to === user?.id))
    .sort((a, b) => Date.parse(a.due_at) - Date.parse(b.due_at)), [followUps, leadScope, user?.id])
  const visibleLeads = useMemo(() => scopedLeads.filter(lead => {
    const terminal = isLeadTerminal(lead)
    const matchesStage = stageFilter === 'closed' ? terminal : !terminal && (stageFilter === 'active' || (stageFilter === 'overdue' ? isLeadResponseOverdue(lead) : normalizeCrmStage(lead.status) === stageFilter))
    const property = relationOne(lead.properties)
    const haystack = [lead.name, lead.email, lead.phone, property?.title].filter(Boolean).join(' ').toLocaleLowerCase('ro')
    return matchesStage && haystack.includes(query.trim().toLocaleLowerCase('ro'))
  }).sort((a, b) => Number(isLeadResponseOverdue(b)) - Number(isLeadResponseOverdue(a)) || Date.parse(b.created_at) - Date.parse(a.created_at)), [scopedLeads, stageFilter, query])
  const unassignedCount = leads.filter(lead => !isLeadTerminal(lead) && !lead.agent_id).length

  if (authLoading || loading) return <div role="status" className="flex min-h-[50vh] items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Se încarcă clienții…</div>
  if (!user || !profile) return <SimpleState icon={Users} title="Autentificare necesară" description="Autentifică-te pentru a vedea clienții." />
  if (!['AGENT', 'ADMIN'].includes(profile.role)) return <SimpleState icon={Target} title="Acces restricționat" description="Această pagină este disponibilă echipei agenției." />
  if (error) return <SimpleState icon={MessageCircleWarning} title="Clienți indisponibili" description={error} action={<Button onClick={() => void load()}>Reîncearcă</Button>} />

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
    <PageShell>
      <PageContainer width="default" className="py-6 sm:py-8">
        <PageHero variant="simple" title="Clienți și solicitări" description="Găsește un client, verifică etapa și stabilește următorul contact.">
          <Button variant="outline" size="icon" aria-label="Reîncarcă CRM" onClick={() => void load()}><RefreshCw className="h-4 w-4" /></Button>
        </PageHero>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <label className="grid gap-1.5 text-sm font-medium">Responsabil
            <select className="h-11 rounded-md border bg-background px-3 font-normal" value={leadScope} onChange={e => setLeadScope(e.target.value as 'mine' | 'all')}>
              <option value="mine">Clienții mei</option><option value="all">Toată echipa</option>
            </select>
          </label>
          {profile.role === 'ADMIN' && unassignedCount > 0 && <Button variant="outline" onClick={() => void handleAutoAssign()} disabled={Boolean(workingId)}>Repartizează {unassignedCount} clienți fără agent</Button>}
        </div>
        <Tabs defaultValue="clients">
          <TabsList aria-label="Activitate clienți" className="mb-4 h-auto w-full justify-start gap-2 bg-transparent p-0">
            <TabsTrigger value="clients" className="min-h-11 flex-none">Clienți</TabsTrigger>
            <TabsTrigger value="contacts" className="min-h-11 flex-none">Contactări planificate ({scopedFollowUps.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="clients">
          <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
            <label className="grid gap-1.5 text-sm font-medium">Caută un client
              <Input className="h-11" placeholder="Nume, telefon, e-mail sau proprietate" value={query} onChange={e => setQuery(e.target.value)} />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">Etapă
              <select className="h-11 rounded-md border bg-background px-3 font-normal" value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
                <option value="active">Toți clienții activi</option><option value="overdue">Așteaptă răspuns</option>
                {CRM_STAGES.map(stage => <option key={stage} value={stage}>{STAGE_META[stage].label}</option>)}
                <option value="closed">Încheiați</option>
              </select>
            </label>
          </div>
          <p role="status" className="mb-3 text-sm text-muted-foreground">{visibleLeads.length} clienți · Solicitările care așteaptă răspuns apar primele.</p>
          <div className="divide-y rounded-xl border">
            {visibleLeads.map(lead => <LeadRow key={lead.id} lead={lead} isWorking={Boolean(workingId)} onAdvance={() => void handleAdvance(lead)} onFollowUp={() => void handleFollowUp(lead)} hasFollowUp={followUps.some(item => item.status === 'OPEN' && item.lead_id === lead.id)} />)}
            {visibleLeads.length === 0 && <div className="p-8 text-center"><p>Nu există clienți pentru această selecție.</p>{(query || stageFilter !== 'active') && <Button variant="link" onClick={() => { setQuery(''); setStageFilter('active') }}>Resetează filtrele</Button>}</div>}
          </div>
        </TabsContent><TabsContent value="contacts">
          <p className="mb-4 text-sm text-muted-foreground">Contactările sunt ordonate după termen. Marchează-le finalizate după ce ai discutat cu clientul.</p>
          <div className="divide-y rounded-xl border">
            {scopedFollowUps.map(item => <article key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><h2 className="break-words font-medium">{item.title}</h2><p className="mt-1 text-sm text-muted-foreground">{shortDate(item.due_at)}{Date.parse(item.due_at) < Date.now() ? ' · Termen depășit' : ''}</p></div>
              <Button variant="outline" className="shrink-0" disabled={Boolean(workingId)} onClick={() => void handleComplete(item.id)}>Marchează finalizat</Button>
            </article>)}
            {scopedFollowUps.length === 0 && <p className="p-8 text-center text-muted-foreground">Nu ai contactări planificate. Le poți adăuga din lista de clienți.</p>}
          </div>
        </TabsContent></Tabs>
      </PageContainer>
    </PageShell>
  )
}

function LeadRow({ lead, isWorking, hasFollowUp, onAdvance, onFollowUp }: { lead: CrmLead; isWorking: boolean; hasFollowUp: boolean; onAdvance: () => void; onFollowUp: () => void }) {
  const property = relationOne(lead.properties)
  const stage = normalizeCrmStage(lead.status)
  const closed = isLeadTerminal(lead)
  const next = CRM_STAGES[CRM_STAGES.indexOf(stage) + 1]
  return <article className="p-4 sm:p-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="break-words font-semibold">{lead.name}</h2>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {lead.phone && <a className="break-all text-primary underline-offset-4 hover:underline" href={`tel:${lead.phone}`}>{lead.phone}</a>}
          {lead.email && <a className="break-all text-primary underline-offset-4 hover:underline" href={`mailto:${lead.email}`}>{lead.email}</a>}
          {!lead.phone && !lead.email && <span className="text-muted-foreground">Date de contact indisponibile</span>}
        </div>
        {property && <p className="mt-2 break-words text-sm text-muted-foreground">{property.title} · {property.zone || property.city || 'Zonă nespecificată'}</p>}
      </div>
      <Badge variant="secondary" className="shrink-0">{closed ? lead.status === 'WON' ? 'Câștigat' : lead.status === 'LOST' ? 'Pierdut' : 'Încheiat' : STAGE_META[stage].label}</Badge>
    </div>
    {isLeadResponseOverdue(lead) && <p className="mt-3 text-sm font-medium text-amber-700 dark:text-amber-400">Așteaptă primul răspuns</p>}
    {!closed && <div className="mt-4 flex flex-wrap items-center gap-2">
      {next && <Button variant="outline" onClick={onAdvance} disabled={isWorking}>Mută în etapa „{STAGE_META[next].label}”</Button>}
      <Button variant="ghost" onClick={onFollowUp} disabled={isWorking || hasFollowUp}>{hasFollowUp ? 'Contactare deja planificată' : 'Amintește-mi mâine la 10:00'}</Button>
    </div>}
    <details className="mt-3 text-sm text-muted-foreground"><summary className="w-fit cursor-pointer py-1">Detalii solicitare</summary><p className="pt-2">Primită: {shortDate(lead.created_at)} · Sursă: {lead.source || 'Website'} · Scor: {lead.score}/100</p></details>
  </article>
}

function SimpleState({ icon: Icon, title, description, action }: { icon: React.ElementType; title: string; description: string; action?: React.ReactNode }) {
  return <div className="mx-auto flex min-h-[65vh] max-w-lg flex-col items-center justify-center px-4 text-center"><Icon className="h-11 w-11 text-primary" /><h1 className="mt-4 text-2xl font-bold">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{description}</p>{action ? <div className="mt-5">{action}</div> : null}</div>
}
