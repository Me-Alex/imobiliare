'use client'

import { AccountHelp } from '@/components/account/account-help'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileWarning,
  Heart,
  HelpCircle,
  ImagePlus,
  Lightbulb,
  Loader2,
  MessageSquare,
  RefreshCw,
  Scale,
  Sparkles,
  Star,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'
import {
  type PropertyMetric,
  fetchOwnerSnapshot,
  listingQuality,
  relationOne,
} from '@/lib/transaction-workspace'
import { getStatusLabel } from '@/lib/presentation'
import {
  getOwnerDashboardPriority,
  type OwnerDashboardActionTarget,
} from '@/lib/owner-dashboard-guidance'
import {
  getOwnerDashboardJourney,
  type OwnerDashboardJourney,
} from '@/lib/owner-dashboard-journey'

import { analyzeOwnerProperty, ownerFeedbackText, ownerEventSummary } from '@/lib/owner-performance'

type OwnerSnapshot = Awaited<ReturnType<typeof fetchOwnerSnapshot>>

function formatMoney(value: number, currency = 'EUR') {
  return new Intl.NumberFormat('ro-RO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

function formatDate(value: unknown) {
  if (typeof value !== 'string') return '—'
  return new Intl.DateTimeFormat('ro-RO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function relationPropertyId(value: unknown): string | null {
  const relation = relationOne(value as { property_id?: string } | Array<{ property_id?: string }> | null)
  return relation?.property_id || null
}

export function OwnerDashboardPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const navigateTo = useAppStore((state) => state.navigateTo)
  const [snapshot, setSnapshot] = useState<OwnerSnapshot | null>(null)
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const role = profile?.role
  const canViewOwnerPerformance = role === 'OWNER' || role === 'ADMIN'
  const isAdminPerformance = role === 'ADMIN'

  const load = useCallback(async () => {
    if (!user || (role !== 'OWNER' && role !== 'ADMIN')) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await fetchOwnerSnapshot(user.id, role)
      setSnapshot(data)
      setSelectedId((current) => current && data.properties.some((property) => property.id === current) ? current : data.properties[0]?.id || '')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Dashboardul nu a putut fi încărcat.')
    } finally {
      setLoading(false)
    }
  }, [role, user])

  useEffect(() => { void load() }, [load])

  const property = snapshot?.properties.find((item) => item.id === selectedId) || null
  const metrics = useMemo(() => snapshot?.metrics.filter((item) => item.property_id === selectedId) || [], [selectedId, snapshot?.metrics])
  const appointments = useMemo(() => snapshot?.appointments.filter((item) => item.property_id === selectedId) || [], [selectedId, snapshot?.appointments])
  const requirements = useMemo(() => snapshot?.requirements.filter((item) => relationPropertyId(item.deal_rooms) === selectedId) || [], [selectedId, snapshot?.requirements])
  const events = useMemo(() => snapshot?.events.filter((item) => relationPropertyId(item.deal_rooms) === selectedId) || [], [selectedId, snapshot?.events])
  const analysis = useMemo(() => property ? analyzeOwnerProperty(property, snapshot?.comparables || []) : null, [property, snapshot?.comparables])
  const quality = useMemo(() => property ? listingQuality(property) : null, [property])

  if (authLoading || loading) return <div className="flex min-h-[65vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (!user || !profile) return <StateBlock icon={Users} title="Autentificare necesară" description="Dashboardul proprietarului conține date private despre anunț și tranzacții." />
  if (!canViewOwnerPerformance) return <StateBlock icon={Building2} title="Profil de proprietar sau administrator necesar" description="Acest dashboard este disponibil proprietarilor și administratorilor care auditează portofoliul." />
  if (error) return <StateBlock icon={HelpCircle} title="Date indisponibile" description={error} action={<Button onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" /> Reîncearcă</Button>} />
  if (!snapshot || !property || !analysis || !quality) {
    return <StateBlock
      icon={ImagePlus}
      title={isAdminPerformance ? 'Nu există proprietăți de analizat' : 'Publică prima proprietate'}
      description={isAdminPerformance
        ? 'Când există proprietăți publicate sau în lucru, admin-ul va vedea aici interesul, feedbackul, documentele și recomandările de preț.'
        : 'După publicare vei vedea aici vizualizările, cererile, feedbackul și recomandările de optimizare.'}
      action={<Button onClick={() => navigateTo('adauga-proprietate')}>{isAdminPerformance ? 'Adaugă proprietate demo' : 'Adaugă proprietate'}</Button>}
    />
  }

  const totals = sumMetrics(metrics)
  const openSelectedDeal = () => navigateTo('deal-room')
  const feedbackRows = appointments.filter((item) => (typeof item.rating === 'number' && item.rating > 0) || (typeof item.feedback === 'string' && item.feedback.trim().length > 0) || typeof item.would_proceed === 'boolean')
  const ratedRows = feedbackRows.filter((item) => Number(item.rating || 0) > 0)
  const averageRating = ratedRows.length
    ? ratedRows.reduce((sum, item) => sum + Number(item.rating || 0), 0) / ratedRows.length
    : 0
  const missingDocuments = requirements.filter((item) => !['APPROVED', 'WAIVED'].includes(String(item.status)))
  const ownerPriority = getOwnerDashboardPriority({
    qualityScore: quality.score,
    qualityNextAction: quality.nextAction,
    missingDocuments: missingDocuments.length,
    adjustmentPercent: analysis.adjustmentPercent,
    views: totals.views,
    inquiries: totals.inquiries,
    viewings: totals.viewings,
    feedbackCount: feedbackRows.length,
  })
  if (ownerPriority.guidance.target === 'documents') {
    ownerPriority.guidance.title = `${missingDocuments.length} documente de verificat`
    ownerPriority.guidance.description = 'Cerințe nefinalizate în dosarele proprietății. Alege dosarul pentru a vedea ce lipsește sau așteaptă verificarea.'
    ownerPriority.guidance.actionLabel = 'Alege dosarul'
  }
  const ownerJourney = getOwnerDashboardJourney({
    qualityScore: quality.score,
    adjustmentPercent: analysis.adjustmentPercent,
    views: totals.views,
    inquiries: totals.inquiries,
    viewings: totals.viewings,
    feedbackCount: feedbackRows.length,
    missingDocuments: missingDocuments.length,
  })
  const openSelectedDocuments = () => navigateTo('documente')
  const scrollToOwnerSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
  }
  const handleOwnerPriority = (target: OwnerDashboardActionTarget) => {
    if (target === 'documents') {
      openSelectedDocuments()
      return
    }
    if (target === 'listing-quality') {
      scrollToOwnerSection('owner-listing-quality')
      return
    }
    if (target === 'pricing') {
      scrollToOwnerSection('owner-pricing')
      return
    }
    if (target === 'appointments') {
      navigateTo('vizionarile-mele')
      return
    }
    scrollToOwnerSection('owner-metrics')
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {isAdminPerformance ? 'Performanța proprietăților administrate' : 'Performanța proprietății tale'}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {isAdminPerformance
                  ? 'Rezultatele anunțurilor și starea dosarelor din portofoliu.'
                  : 'Vezi interesul pentru anunț și ce poți face în continuare.'}
              </p>
            </div>
            <div className="flex min-w-0 flex-wrap items-end gap-2 lg:max-w-sm">
              <label className="w-full text-sm font-medium" htmlFor="owner-property">Selectează proprietatea</label>
              <select id="owner-property" className="h-11 min-w-0 w-full flex-1 sm:w-64 rounded-md border bg-background px-3 text-sm" value={property.id} onChange={(event) => setSelectedId(event.target.value)}>{snapshot.properties.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
              <Button variant="outline" size="icon" aria-label="Reîncarcă dashboardul" onClick={() => void load()}><RefreshCw className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-6 lg:px-8">
        <section aria-label="Proprietatea selectată" className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="break-words text-lg font-semibold">{property.title}</h2><StatusBadge status={property.status} /></div><p className="mt-1 text-sm text-muted-foreground">{property.address || property.zone || property.city}</p><p className="mt-2 font-semibold">{formatMoney(Number(property.price || 0), property.currency || 'EUR')}</p></div>
          <Button variant="outline" className="shrink-0" onClick={() => navigateTo('proprietatile-mele')}>{isAdminPerformance ? 'Gestionează portofoliul' : 'Gestionează proprietățile'}</Button>
        </section>

        <OwnerPriorityPanel priority={ownerPriority} onAction={handleOwnerPriority} />

        <section id="owner-metrics" className="scroll-mt-36"><h2 className="mb-4 text-lg font-semibold">Rezultate în ultimele 30 de zile</h2><div className="grid grid-cols-2 gap-x-6 gap-y-5 border-y py-5 lg:grid-cols-4">
          <MetricCard icon={Eye} label="Vizualizări" value={totals.views} detail="accesări ale anunțului" />
          <MetricCard icon={Heart} label="Favorite" value={totals.favorites} detail={ratio(totals.favorites, totals.views, 'din vizualizări')} />
          <MetricCard icon={MessageSquare} label="Cereri" value={totals.inquiries} detail={ratio(totals.inquiries, totals.views, 'rată de interes')} />
          <MetricCard icon={CalendarCheck} label="Vizionări" value={totals.viewings} detail="înregistrate în statisticile anunțului" />
        </div></section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <Card>
            <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4 text-primary" /> Interes în ultimele 14 zile</CardTitle></div></CardHeader>
            <CardContent><MetricChart metrics={metrics} /></CardContent>
          </Card>

          <Card id="owner-pricing" className="scroll-mt-36">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Scale className="h-4 w-4 text-primary" /> Poziționare în piață</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><p className="text-sm text-muted-foreground">Prețul tău / m²</p><p className="text-2xl font-bold">{analysis.propertyPricePerSqm === null ? 'Suprafață sau preț lipsă' : formatMoney(analysis.propertyPricePerSqm, property.currency || 'EUR')}</p></div>
              <div className="grid grid-cols-2 gap-3 border-y py-3 text-sm"><div><p className="text-xs text-muted-foreground">Media comparabilelor</p><p className="mt-1 font-semibold">{analysis.marketAverage === null ? 'Date insuficiente' : formatMoney(analysis.marketAverage, property.currency || 'EUR')}</p></div><div><p className="text-xs text-muted-foreground">Anunțuri comparate</p><p className="mt-1 font-semibold">{analysis.comparableCount}</p></div></div>
              {!analysis.hasComparison ? <p className="text-sm text-muted-foreground">Nu sunt suficiente anunțuri comparabile în aceeași zonă, pentru același tip de tranzacție și aceeași monedă. Discută prețul cu agentul.</p> : analysis.adjustmentPercent > 0 ? <div className="flex gap-3 rounded-xl bg-amber-100 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200"><ArrowDownRight className="mt-0.5 h-4 w-4 shrink-0" /><p>Ia în calcul o ajustare de aproximativ <strong>{analysis.adjustmentPercent}%</strong> pentru a ajunge la {formatMoney(analysis.recommendedPrice, property.currency || 'EUR')}.</p></div> : <div className="flex gap-3 rounded-xl bg-emerald-100 p-3 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><p>Prețul nu depășește semnificativ media anunțurilor comparate.</p></div>}
              <p className="text-[11px] leading-relaxed text-muted-foreground">Estimare orientativă, nu raport de evaluare ANEVAR. Se bazează pe anunțurile publice comparabile disponibile.</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <Card id="owner-listing-quality" className="scroll-mt-36">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-primary" /> Calitatea anunțului</CardTitle>
                <div className="text-right">
                  <span className="text-2xl font-bold">{quality.score}<span className="text-sm text-muted-foreground">/100</span></span>
                  <p className="text-xs text-muted-foreground">{quality.label}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${quality.score}%` }} /></div>
              {quality.recommendations.length ? (
                <div className="space-y-2">
                  {quality.recommendations.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex gap-2 border-b py-3 text-sm last:border-0">
                      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Anunț complet și convingător.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Star className="h-4 w-4 text-primary" /> Feedback după vizionări</CardTitle></CardHeader>
            <CardContent>{feedbackRows.length ? <><div className="flex items-end gap-2"><span className="text-3xl font-bold">{ratedRows.length ? averageRating.toFixed(1) : '—'}</span><span className="pb-1 text-sm text-muted-foreground">{ratedRows.length ? `din 5 · ${ratedRows.length} evaluări` : 'fără evaluări numerice'} · {feedbackRows.length} răspunsuri</span></div><div className="mt-4 space-y-2">{feedbackRows.slice(0, 3).map((item, index) => <div key={String(item.id || index)} className="border-b py-3 text-sm text-muted-foreground last:border-0">{ownerFeedbackText(item)}</div>)}</div></> : <Empty message="Feedbackul apare după vizionările finalizate, fără datele de contact ale clientului." />}</CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2 text-base"><FileWarning className="h-4 w-4 text-primary" /> Documente din toate dosarele</CardTitle><Badge variant={missingDocuments.length ? 'destructive' : 'secondary'}>{missingDocuments.length} de rezolvat</Badge></div></CardHeader>
            <CardContent className="space-y-2">{requirements.length ? requirements.slice(0, 6).map((item) => <div key={String(item.id)} className="flex items-center gap-3 border-b py-3 last:border-0"><ClipboardCheck className={`h-4 w-4 shrink-0 ${['APPROVED', 'WAIVED'].includes(String(item.status)) ? 'text-emerald-500' : 'text-amber-500'}`} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{String(item.label)}</p><p className="text-xs text-muted-foreground">{getStatusLabel(item.status)}</p></div></div>) : <Empty message="Cerințele apar automat după prima vizionare." />}<Button variant="outline" className="mt-2 w-full" onClick={openSelectedDocuments}>Alege dosarul pentru documente</Button></CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4 text-primary" /> Activitatea agentului</CardTitle><Button variant="ghost" size="sm" onClick={openSelectedDeal}>Alege tranzacția</Button></div></CardHeader>
          <CardContent><p className="mb-4 text-sm text-muted-foreground">Activitate pentru această proprietate din ultimele 40 de evenimente ale portofoliului. Pentru istoricul complet, alege tranzacția.</p>{events.length ? <div className="grid gap-3 md:grid-cols-2">{events.slice(0, 6).map((event) => <div key={String(event.id)} className="flex items-start gap-3 border-b py-3"><div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" /><div><p className="text-sm font-medium">{ownerEventSummary(event.summary)}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(event.created_at)}</p></div></div>)}</div> : <Empty message="Nu există evenimente pentru această proprietate în activitatea recentă a portofoliului." />}</CardContent>
        </Card>
        <AccountHelp title="Etapele vânzării și recomandări"><OwnerJourneyPanel journey={ownerJourney} onAction={handleOwnerPriority} /></AccountHelp>
      </main>
    </div>
  )
}

function OwnerJourneyPanel({ journey, onAction }: { journey: OwnerDashboardJourney; onAction: (target: OwnerDashboardActionTarget) => void }) {
  return <div className="divide-y">{journey.stages.map(stage => <div key={stage.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-medium">{stage.title}</h3><p className="mt-1 max-w-2xl text-sm text-muted-foreground">{stage.description}</p></div><Button variant="outline" className="shrink-0" onClick={() => onAction(stage.target)}>{stage.value}<ArrowRight className="ml-2 h-4 w-4" /></Button></div>)}</div>
}

function OwnerPriorityPanel({ priority, onAction }: { priority: ReturnType<typeof getOwnerDashboardPriority>; onAction: (target: OwnerDashboardActionTarget) => void }) {
  return <section aria-label="Următorul pas recomandat" className="flex flex-col gap-4 rounded-xl bg-muted/60 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold">{priority.guidance.title}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{priority.guidance.description}</p></div><Button className="h-auto min-h-11 shrink-0 whitespace-normal py-2 sm:max-w-60" onClick={() => onAction(priority.guidance.target)}>{priority.guidance.actionLabel}<ArrowRight className="ml-2 h-4 w-4 shrink-0" /></Button></section>
}

function sumMetrics(metrics: PropertyMetric[]) {
  return metrics.reduce((totals, item) => ({ views: totals.views + item.views, favorites: totals.favorites + item.favorites, inquiries: totals.inquiries + item.inquiries, viewings: totals.viewings + item.viewings }), { views: 0, favorites: 0, inquiries: 0, viewings: 0 })
}

function ratio(part: number, total: number, suffix: string) {
  return total ? `${(part / total * 100).toFixed(1)}% ${suffix}` : `0% ${suffix}`
}

function MetricChart({ metrics }: { metrics: PropertyMetric[] }) {
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date()
    date.setUTCDate(date.getUTCDate() - (13 - index))
    const key = date.toISOString().slice(0, 10)
    const row = metrics.find(item => item.metric_date === key)
    return { key, label: new Intl.DateTimeFormat('ro-RO', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(date), views: row?.views || 0, interest: (row?.favorites || 0) + (row?.inquiries || 0) }
  })
  const max = Math.max(1, ...days.map(day => Math.max(day.views, day.interest)))
  const total = days.reduce((sum, day) => sum + day.views, 0)
  return <div>
    <p className="mb-4 text-sm text-muted-foreground">{total} vizualizări în perioada afișată. Acțiuni = favorite și cereri.</p>
    {days.some(day => day.views > 0 || day.interest > 0) ? <><div aria-hidden="true" className="flex h-40 items-end gap-1 sm:h-56 sm:gap-2">{days.map(day => <div key={day.key} className="flex h-full flex-1 items-end justify-center gap-0.5"><div className="w-1/2 rounded-t bg-primary/35" style={{ height: `${day.views / max * 100}%` }} /><div className="w-1/2 rounded-t bg-primary" style={{ height: `${day.interest / max * 100}%` }} /></div>)}</div>
    <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span>{days[0].label}</span><div className="flex gap-4"><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm bg-primary/35" />Vizualizări</span><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm bg-primary" />Acțiuni</span></div><span>{days[13].label}</span></div></> : <p className="border-y py-5 text-sm text-muted-foreground">Nu sunt înregistrate vizualizări sau acțiuni în aceste 14 zile.</p>}
    <details className="mt-5 border-t pt-3"><summary className="cursor-pointer rounded text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Vezi valorile pe zile</summary><table className="mt-3 w-full text-left text-sm tabular-nums"><caption className="sr-only">Interesul zilnic pentru anunț</caption><thead><tr className="border-b"><th scope="col" className="py-2">Data</th><th scope="col" className="py-2 text-right">Vizualizări</th><th scope="col" className="py-2 text-right">Acțiuni</th></tr></thead><tbody>{days.map(day => <tr key={day.key} className="border-b last:border-0"><th scope="row" className="py-2 font-normal">{day.label}</th><td className="text-right">{day.views}</td><td className="text-right">{day.interest}</td></tr>)}</tbody></table></details>
  </div>
}

function MetricCard({ icon: Icon, label, value, detail }: { icon: React.ElementType; label: string; value: number; detail: string }) {
  return <div><p className="flex items-center gap-2 text-sm font-medium"><Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>
}

function Empty({ message }: { message: string }) { return <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">{message}</div> }

function StateBlock({ icon: Icon, title, description, action }: { icon: React.ElementType; title: string; description: string; action?: React.ReactNode }) {
  return <div className="mx-auto flex min-h-[65vh] max-w-lg flex-col items-center justify-center px-4 text-center"><Icon className="h-11 w-11 text-primary" /><h1 className="mt-4 text-2xl font-bold">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{description}</p>{action ? <div className="mt-5">{action}</div> : null}</div>
}
