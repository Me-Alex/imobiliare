'use client'

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
  TrendingUp,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'
import {
  type PropertyMetric,
  type WorkspaceProperty,
  fetchOwnerSnapshot,
  listingQuality,
  relationOne,
} from '@/lib/transaction-workspace'

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

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    setError('')
    try {
      const data = await fetchOwnerSnapshot(user.id)
      setSnapshot(data)
      setSelectedId((current) => current && data.properties.some((property) => property.id === current) ? current : data.properties[0]?.id || '')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Dashboardul nu a putut fi încărcat.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { void load() }, [load])

  const property = snapshot?.properties.find((item) => item.id === selectedId) || null
  const metrics = useMemo(() => snapshot?.metrics.filter((item) => item.property_id === selectedId) || [], [selectedId, snapshot?.metrics])
  const appointments = useMemo(() => snapshot?.appointments.filter((item) => item.property_id === selectedId) || [], [selectedId, snapshot?.appointments])
  const requirements = useMemo(() => snapshot?.requirements.filter((item) => relationPropertyId(item.deal_rooms) === selectedId) || [], [selectedId, snapshot?.requirements])
  const events = useMemo(() => snapshot?.events.filter((item) => relationPropertyId(item.deal_rooms) === selectedId) || [], [selectedId, snapshot?.events])
  const analysis = useMemo(() => property ? analyzeProperty(property, snapshot?.comparables || []) : null, [property, snapshot?.comparables])
  const quality = useMemo(() => property ? listingQuality(property) : null, [property])

  if (authLoading || loading) return <div className="flex min-h-[65vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (!user || !profile) return <StateBlock icon={Users} title="Autentificare necesară" description="Dashboardul proprietarului conține date private despre anunț și tranzacții." />
  if (!['OWNER', 'ADMIN'].includes(profile.role)) return <StateBlock icon={Building2} title="Profil de proprietar necesar" description="Acest dashboard este disponibil proprietarilor și administratorilor." />
  if (error) return <StateBlock icon={HelpCircle} title="Date indisponibile" description={error} action={<Button onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" /> Reîncearcă</Button>} />
  if (!snapshot || !property || !analysis || !quality) {
    return <StateBlock icon={ImagePlus} title="Publică prima proprietate" description="După publicare vei vedea aici vizualizările, cererile, feedbackul și recomandările de optimizare." action={<Button onClick={() => navigateTo('adauga-proprietate')}>Adaugă proprietate</Button>} />
  }

  const totals = sumMetrics(metrics)
  const feedbackRows = appointments.filter((item) => typeof item.rating === 'number' || typeof item.feedback === 'string')
  const averageRating = feedbackRows.length ? feedbackRows.reduce((sum, item) => sum + Number(item.rating || 0), 0) / feedbackRows.filter((item) => Number(item.rating || 0) > 0).length : 0
  const missingDocuments = requirements.filter((item) => !['APPROVED', 'WAIVED'].includes(String(item.status)))

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div><Badge className="mb-2 border-0 bg-primary/10 text-primary hover:bg-primary/10">Dashboard proprietar</Badge><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Performanța proprietății tale</h1><p className="mt-2 text-sm text-muted-foreground">Datele ultimelor 30 de zile și următorii pași recomandați.</p></div>
            <div className="flex gap-2">
              <label className="sr-only" htmlFor="owner-property">Selectează proprietatea</label>
              <select id="owner-property" className="h-10 min-w-64 rounded-md border bg-background px-3 text-sm" value={property.id} onChange={(event) => setSelectedId(event.target.value)}>{snapshot.properties.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
              <Button variant="outline" size="icon" aria-label="Reîncarcă dashboardul" onClick={() => void load()}><RefreshCw className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-6 lg:px-8">
        <Card className="overflow-hidden">
          <div className="grid md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="h-44 bg-muted md:h-full">{property.cover_image_url ? <img src={property.cover_image_url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Building2 className="h-10 w-10 text-muted-foreground/40" /></div>}</div>
            <CardContent className="flex flex-col justify-between gap-5 p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold">{property.title}</h2><Badge variant="outline">{property.status}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{property.address || property.zone || property.city}</p></div><p className="text-2xl font-bold text-primary">{formatMoney(Number(property.price || 0), property.currency || 'EUR')}</p></div>
              <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => navigateTo('adauga-proprietate')}>Editează anunțul</Button><Button onClick={() => navigateTo('deal-room')}>Deschide Deal Room <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
            </CardContent>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard icon={Eye} label="Vizualizări" value={totals.views} detail="vizitatori unici/zi" tone="violet" />
          <MetricCard icon={Heart} label="Favorite" value={totals.favorites} detail={ratio(totals.favorites, totals.views, 'din vizualizări')} tone="rose" />
          <MetricCard icon={MessageSquare} label="Cereri" value={totals.inquiries} detail={ratio(totals.inquiries, totals.views, 'rată de interes')} tone="blue" />
          <MetricCard icon={CalendarCheck} label="Vizionări" value={Math.max(totals.viewings, appointments.length)} detail={`${appointments.filter((item) => ['COMPLETED', 'DONE'].includes(String(item.status))).length} finalizate`} tone="emerald" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <Card>
            <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4 text-primary" /> Interes în ultimele 14 zile</CardTitle><Badge variant="secondary">{totals.views} vizualizări</Badge></div></CardHeader>
            <CardContent><MetricChart metrics={metrics} /></CardContent>
          </Card>

          <Card className={analysis.adjustmentPercent > 0 ? 'border-amber-500/30 bg-amber-500/[0.04]' : 'border-emerald-500/30 bg-emerald-500/[0.04]'}>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Scale className="h-4 w-4 text-primary" /> Poziționare în piață</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><p className="text-sm text-muted-foreground">Prețul tău / m²</p><p className="text-2xl font-bold">{formatMoney(analysis.propertyPricePerSqm)}</p></div>
              <div className="grid grid-cols-2 gap-3 rounded-xl border bg-background/70 p-3 text-sm"><div><p className="text-xs text-muted-foreground">Media comparabilelor</p><p className="mt-1 font-semibold">{formatMoney(analysis.marketAverage)}</p></div><div><p className="text-xs text-muted-foreground">Anunțuri comparate</p><p className="mt-1 font-semibold">{analysis.comparableCount}</p></div></div>
              {analysis.adjustmentPercent > 0 ? <div className="flex gap-3 rounded-xl bg-amber-100 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200"><ArrowDownRight className="mt-0.5 h-4 w-4 shrink-0" /><p>Ia în calcul o ajustare de aproximativ <strong>{analysis.adjustmentPercent}%</strong> pentru a ajunge la {formatMoney(analysis.recommendedPrice, property.currency || 'EUR')}.</p></div> : <div className="flex gap-3 rounded-xl bg-emerald-100 p-3 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><p>Prețul este aliniat cu proprietățile comparabile din zonă.</p></div>}
              <p className="text-[11px] leading-relaxed text-muted-foreground">Estimare orientativă, nu raport de evaluare ANEVAR. Se bazează pe anunțurile publice comparabile disponibile.</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-primary" /> Calitatea anunțului</CardTitle><span className="text-2xl font-bold">{quality.score}<span className="text-sm text-muted-foreground">/100</span></span></div></CardHeader>
            <CardContent><div className="mb-4 h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${quality.score}%` }} /></div>{quality.issues.length ? <div className="space-y-2">{quality.issues.map((issue) => <div key={issue} className="flex gap-2 rounded-lg bg-muted/50 p-3 text-sm"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /> {issue}</div>)}</div> : <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Anunț complet și convingător.</div>}</CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Star className="h-4 w-4 text-primary" /> Feedback anonim agregat</CardTitle></CardHeader>
            <CardContent>{feedbackRows.length ? <><div className="flex items-end gap-2"><span className="text-3xl font-bold">{Number.isFinite(averageRating) ? averageRating.toFixed(1) : '—'}</span><span className="pb-1 text-sm text-muted-foreground">din 5 · {feedbackRows.length} răspunsuri</span></div><div className="mt-4 space-y-2">{feedbackRows.slice(0, 3).map((item, index) => <div key={String(item.id || index)} className="rounded-lg border p-3 text-sm text-muted-foreground">{String(item.feedback || (item.would_proceed ? 'Interes confirmat după vizionare.' : 'Nu dorește să continue în acest moment.'))}</div>)}</div></> : <Empty message="Feedbackul apare după vizionările finalizate, fără datele de contact ale clientului." />}</CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2 text-base"><FileWarning className="h-4 w-4 text-primary" /> Documente necesare</CardTitle><Badge variant={missingDocuments.length ? 'destructive' : 'secondary'}>{missingDocuments.length} lipsă</Badge></div></CardHeader>
            <CardContent className="space-y-2">{requirements.length ? requirements.slice(0, 6).map((item) => <div key={String(item.id)} className="flex items-center gap-3 rounded-lg border p-3"><ClipboardCheck className={`h-4 w-4 shrink-0 ${['APPROVED', 'WAIVED'].includes(String(item.status)) ? 'text-emerald-500' : 'text-amber-500'}`} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{String(item.label)}</p><p className="text-xs text-muted-foreground">{String(item.status).replaceAll('_', ' ')}</p></div></div>) : <Empty message="Cerințele apar automat după prima vizionare." />}<Button variant="outline" className="mt-2 w-full" onClick={() => navigateTo('deal-room')}>Vezi checklistul complet</Button></CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4 text-primary" /> Activitatea agentului</CardTitle><Button variant="ghost" size="sm" onClick={() => navigateTo('deal-room')}>Jurnal complet</Button></div></CardHeader>
          <CardContent>{events.length ? <div className="grid gap-3 md:grid-cols-2">{events.slice(0, 6).map((event) => <div key={String(event.id)} className="flex items-start gap-3 rounded-xl border p-3"><div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" /><div><p className="text-sm font-medium">{String(event.summary)}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(event.created_at)}</p></div></div>)}</div> : <Empty message="Activitatea agentului va fi înregistrată automat în jurnalul tranzacției." />}</CardContent>
        </Card>
      </main>
    </div>
  )
}

function analyzeProperty(property: WorkspaceProperty, allComparables: WorkspaceProperty[]) {
  const area = Number(property.area_sqm || 0)
  const price = Number(property.price || 0)
  const candidates = allComparables.filter((item) => item.id !== property.id && item.type === property.type && item.zone === property.zone && Number(item.area_sqm) > 0 && Number(item.price) > 0)
  const expanded = candidates.length >= 3 ? candidates : allComparables.filter((item) => item.id !== property.id && item.type === property.type && Number(item.area_sqm) > 0 && Number(item.price) > 0)
  const values = expanded.map((item) => Number(item.price) / Number(item.area_sqm)).filter(Number.isFinite)
  const marketAverage = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : area ? price / area : 0
  const propertyPricePerSqm = area ? price / area : 0
  const difference = marketAverage ? (propertyPricePerSqm - marketAverage) / marketAverage * 100 : 0
  const adjustmentPercent = difference > 8 ? Math.min(15, Math.max(3, Math.round(difference - 3))) : 0
  const recommendedPrice = adjustmentPercent ? Math.round(price * (1 - adjustmentPercent / 100) / 1000) * 1000 : price
  return { marketAverage, propertyPricePerSqm, comparableCount: values.length, adjustmentPercent, recommendedPrice }
}

function sumMetrics(metrics: PropertyMetric[]) {
  return metrics.reduce((totals, item) => ({ views: totals.views + item.views, favorites: totals.favorites + item.favorites, inquiries: totals.inquiries + item.inquiries, viewings: totals.viewings + item.viewings }), { views: 0, favorites: 0, inquiries: 0, viewings: 0 })
}

function ratio(part: number, total: number, suffix: string) {
  return total ? `${(part / total * 100).toFixed(1)}% ${suffix}` : `0% ${suffix}`
}

function MetricChart({ metrics }: { metrics: PropertyMetric[] }) {
  const days = Array.from({ length: 14 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (13 - index)); const key = date.toISOString().slice(0, 10); const row = metrics.find((item) => item.metric_date === key); return { key, label: new Intl.DateTimeFormat('ro-RO', { day: '2-digit', month: 'short' }).format(date), views: row?.views || 0, interest: (row?.favorites || 0) + (row?.inquiries || 0) } })
  const max = Math.max(1, ...days.map((day) => Math.max(day.views, day.interest)))
  return <div><div className="flex h-56 items-end gap-2">{days.map((day) => <div key={day.key} className="group flex h-full flex-1 items-end justify-center gap-0.5" title={`${day.label}: ${day.views} vizualizări, ${day.interest} acțiuni`}><div className="w-1/2 rounded-t bg-primary/35 transition-colors group-hover:bg-primary/55" style={{ height: `${Math.max(day.views ? 6 : 1, day.views / max * 100)}%` }} /><div className="w-1/2 rounded-t bg-primary" style={{ height: `${Math.max(day.interest ? 6 : 1, day.interest / max * 100)}%` }} /></div>)}</div><div className="mt-3 flex justify-between text-[10px] text-muted-foreground"><span>{days[0].label}</span><div className="flex gap-4"><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm bg-primary/35" /> Vizualizări</span><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm bg-primary" /> Acțiuni</span></div><span>{days[days.length - 1].label}</span></div></div>
}

function MetricCard({ icon: Icon, label, value, detail, tone }: { icon: React.ElementType; label: string; value: number; detail: string; tone: 'violet' | 'rose' | 'blue' | 'emerald' }) {
  const tones = { violet: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300', rose: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300', blue: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' }
  return <Card><CardContent className="p-4 sm:p-5"><div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}><Icon className="h-4 w-4" /></div><p className="text-3xl font-bold">{value}</p><p className="text-sm font-medium">{label}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card>
}

function Empty({ message }: { message: string }) { return <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">{message}</div> }

function StateBlock({ icon: Icon, title, description, action }: { icon: React.ElementType; title: string; description: string; action?: React.ReactNode }) {
  return <div className="mx-auto flex min-h-[65vh] max-w-lg flex-col items-center justify-center px-4 text-center"><Icon className="h-11 w-11 text-primary" /><h1 className="mt-4 text-2xl font-bold">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{description}</p>{action ? <div className="mt-5">{action}</div> : null}</div>
}
