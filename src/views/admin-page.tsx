'use client'

import { useCallback, useEffect, useMemo, useState, type ElementType } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Coins,
  ExternalLink,
  FileCheck2,
  FileWarning,
  Handshake,
  Inbox,
  LayoutDashboard,
  ListTodo,
  Loader2,
  LogOut,
  Mail,
  MessageSquare,
  RefreshCw,
  Rotate3D,
  Search,
  Settings2,
  Shield,
  ShieldAlert,
  UserCheck,
  Users,
  UserX,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHero } from '@/components/layout/page-hero'
import { RoleAccessDenied } from '@/components/account/role-access-denied'
import { VirtualTourReviewPanel } from '@/components/admin/virtual-tour-review-panel'
import { LegalCompliancePanel } from '@/components/features/documents/legal-compliance-panel'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'
import { ACCOUNT_ROLES, ACCOUNT_ROLE_DEFINITIONS, type AccountRole } from '@/lib/account-roles'
import {
  ADMIN_PROPERTY_STATUSES,
  type AdminDashboardData,
  type AdminPropertyStatus,
} from '@/lib/admin-dashboard'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const ROLE_TONES: Record<AccountRole, string> = {
  CLIENT: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  OWNER: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  AGENT: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  ADMIN: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
}

const PROPERTY_STATUS_LABELS: Record<AdminPropertyStatus, string> = {
  DRAFT: 'Ciornă',
  PUBLISHED: 'Publicată',
  SOLD: 'Vândută',
  RENTED: 'Închiriată',
  ARCHIVED: 'Arhivată',
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nou',
  CONTACTED: 'Contactat',
  QUALIFIED: 'Calificat',
  VIEWING: 'Vizionare',
  OFFER: 'Ofertă',
  CONTRACT: 'Contract',
  WON: 'Câștigat',
  CLOSED: 'Închis',
  LOST: 'Pierdut',
  PENDING: 'În așteptare',
  REQUESTED: 'Solicitat',
  CONFIRMED: 'Confirmată',
  CHECKED_IN: 'Prezent',
  COMPLETED: 'Finalizat',
  DONE: 'Finalizat',
  CANCELLED: 'Anulat',
  CANCELLED_BY_CLIENT: 'Anulat de client',
  CANCELLED_BY_AGENT: 'Anulat de agent',
  NO_SHOW: 'Neprezentare',
  ACTIVE: 'Activ',
  ON_HOLD: 'În așteptare',
  REQUIRED: 'Necesar',
  UPLOADED: 'Încărcat',
  UNDER_REVIEW: 'În verificare',
  APPROVED: 'Aprobat',
  REVIEW_REQUIRED: 'Necesită aviz',
  REJECTED: 'Respins',
  WAIVED: 'Exceptat',
  FULFILLED: 'Onorat',
  IN_REVIEW: 'În analiză',
  NEEDS_INFO: 'Necesită informații',
  ARCHIVED: 'Arhivat',
}

type Confirmation = {
  title: string
  description: string
  confirmLabel: string
  destructive?: boolean
  run: () => Promise<void>
}

type AdminTab =
  | 'home'
  | 'tasks'
  | 'people'
  | 'properties'
  | 'transactions'
  | 'settings'
  | 'inbox'
  | 'compliance'
  | 'virtual-tours'
  | 'audit'

type WorkDestination = 'crm' | 'properties' | 'transactions' | 'documents' | 'compliance'

type WorkItem = {
  id: string
  title: string
  description: string
  count: number
  priority: 'urgent' | 'normal'
  destination: WorkDestination
  actionLabel: string
  icon: ElementType
}

type GlobalSearchResult = {
  id: string
  label: string
  meta: string
  kind: string
  tab: AdminTab
  localSearch?: string
  icon: ElementType
}

function formatDate(value?: string | null) {
  if (!value) return 'Fără termen'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Dată indisponibilă'
  return date.toLocaleString('ro-RO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPrice(price: number, currency = 'EUR') {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(price) || 0)
}

function statusTone(status: string) {
  if (['ACTIVE', 'PUBLISHED', 'APPROVED', 'FULFILLED', 'COMPLETED', 'DONE', 'WON'].includes(status)) {
    return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
  }
  if (['REJECTED', 'LOST', 'NO_SHOW', 'CANCELLED', 'CANCELLED_BY_CLIENT', 'CANCELLED_BY_AGENT'].includes(status)) {
    return 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
  }
  if (['REQUESTED', 'PENDING', 'REVIEW_REQUIRED', 'UNDER_REVIEW', 'IN_REVIEW', 'NEEDS_INFO'].includes(status)) {
    return 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
  }
  return 'bg-slate-500/10 text-slate-700 dark:text-slate-300'
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex rounded-full px-2 py-1 text-[11px] font-semibold', statusTone(status))}>
      {STATUS_LABELS[status] || PROPERTY_STATUS_LABELS[status as AdminPropertyStatus] || status.replaceAll('_', ' ')}
    </span>
  )
}

function MetricCard({ icon: Icon, label, value, note, tone }: {
  icon: ElementType
  label: string
  value: number | string
  note: string
  tone: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border bg-card p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{note}</p>
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', tone)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  )
}

function SectionHeader({ icon: Icon, title, description, action }: {
  icon: ElementType
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {action}
    </div>
  )
}

function EmptyState({ icon: Icon, title, description }: { icon: ElementType; title: string; description: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center">
      <Icon className="h-8 w-8 text-muted-foreground" />
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

export function AdminPage() {
  const { user, session, profile, signOut, loading: authLoading } = useAuth()
  const navigateTo = useAppStore((state) => state.navigateTo)
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<AdminTab>('home')
  const [globalSearch, setGlobalSearch] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | AccountRole>('ALL')
  const [propertyFilter, setPropertyFilter] = useState<'ALL' | AdminPropertyStatus>('ALL')
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [redemptionNotes, setRedemptionNotes] = useState<Record<string, string>>({})

  const fetchDashboard = useCallback(async () => {
    if (!session?.access_token) return
    setLoading(true)
    setLoadError(null)
    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Panoul administrativ nu a putut fi încărcat.')
      setData(payload)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Eroare de conexiune.'
      setLoadError(message)
      toast.error('Eroare la încărcarea panoului', { description: message })
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

  useEffect(() => {
    if (user && profile?.role === 'ADMIN' && session) void fetchDashboard()
  }, [user, profile?.role, session, fetchDashboard])

  useEffect(() => {
    if (!authLoading && !user) navigateTo('login')
  }, [authLoading, user, navigateTo])

  const runAction = useCallback(async (
    key: string,
    body: Record<string, unknown>,
    successMessage: string,
  ) => {
    if (!session?.access_token) return
    setBusyKey(key)
    try {
      const response = await fetch('/api/admin/dashboard', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Acțiunea nu a putut fi finalizată.')
      toast.success(successMessage)
      await fetchDashboard()
    } catch (error) {
      toast.error('Acțiune administrativă eșuată', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setBusyKey(null)
    }
  }, [fetchDashboard, session?.access_token])

  const filteredUsers = useMemo(() => {
    if (!data) return []
    const query = search.trim().toLocaleLowerCase('ro-RO')
    return data.users.filter((item) => {
      const matchesRole = roleFilter === 'ALL' || item.role === roleFilter
      const haystack = `${item.full_name || item.name || ''} ${item.email || ''} ${item.phone || ''}`.toLocaleLowerCase('ro-RO')
      return matchesRole && (!query || haystack.includes(query))
    })
  }, [data, roleFilter, search])

  const filteredProperties = useMemo(() => {
    if (!data) return []
    const query = search.trim().toLocaleLowerCase('ro-RO')
    return data.properties.filter((item) => {
      const matchesStatus = propertyFilter === 'ALL' || item.status === propertyFilter
      const haystack = `${item.title} ${item.city || ''} ${item.zone || ''} ${item.type}`.toLocaleLowerCase('ro-RO')
      return matchesStatus && (!query || haystack.includes(query))
    })
  }, [data, propertyFilter, search])

  const agents = useMemo(
    () => data?.users.filter((item) => item.role === 'AGENT' && item.is_active) || [],
    [data],
  )

  const activeLeads = useMemo(
    () => data?.leads.filter((item) => !['CLOSED', 'LOST', 'WON'].includes(item.status)).slice(0, 8) || [],
    [data],
  )
  const activeAppointments = useMemo(
    () => data?.appointments.filter((item) => ['PENDING', 'REQUESTED', 'CONFIRMED', 'CHECKED_IN'].includes(item.status)).slice(0, 8) || [],
    [data],
  )
  const pendingRedemptions = useMemo(
    () => data?.redemptions.filter((item) => item.status === 'REQUESTED') || [],
    [data],
  )

  const workItems = useMemo<WorkItem[]>(() => {
    if (!data) return []

    const items: WorkItem[] = []
    const pendingAppointments = data.appointments.filter((item) => ['PENDING', 'REQUESTED'].includes(item.status)).length

    if (data.stats.overdueLeads > 0) {
      items.push({
        id: 'overdue-leads',
        title: 'Lead-uri fără răspuns la timp',
        description: 'Repartizează un agent și stabilește următorul follow-up.',
        count: data.stats.overdueLeads,
        priority: 'urgent',
        destination: 'crm',
        actionLabel: 'Deschide CRM',
        icon: Handshake,
      })
    }
    if (!data.health.legalProfileReady) {
      items.push({
        id: 'legal-profile',
        title: 'Profilul juridic trebuie verificat',
        description: 'Datele firmei sau informarea GDPR nu sunt pregătite pentru documentele finale.',
        count: 1,
        priority: 'urgent',
        destination: 'compliance',
        actionLabel: 'Verifică profilul',
        icon: ShieldAlert,
      })
    }
    if (data.stats.templatesPendingReview > 0) {
      items.push({
        id: 'legal-templates',
        title: 'Șabloane juridice fără aviz',
        description: 'Contractele rămân ciorne până la aprobarea nominală a profesionistului juridic.',
        count: data.stats.templatesPendingReview,
        priority: 'urgent',
        destination: 'compliance',
        actionLabel: 'Vezi conformitatea',
        icon: FileWarning,
      })
    }
    if (data.stats.draftProperties > 0) {
      items.push({
        id: 'draft-properties',
        title: 'Proprietăți în ciornă',
        description: 'Verifică informațiile, agentul repartizat și starea publicării.',
        count: data.stats.draftProperties,
        priority: 'normal',
        destination: 'properties',
        actionLabel: 'Verifică proprietățile',
        icon: Building2,
      })
    }
    if (pendingAppointments > 0) {
      items.push({
        id: 'pending-appointments',
        title: 'Vizionări care așteaptă confirmare',
        description: 'Confirmă responsabilul, ora și documentele necesare vizionării.',
        count: pendingAppointments,
        priority: 'normal',
        destination: 'transactions',
        actionLabel: 'Vezi vizionările',
        icon: CalendarDays,
      })
    }
    if (data.stats.pendingDocuments > 0) {
      items.push({
        id: 'pending-documents',
        title: 'Documente solicitate sau restante',
        description: 'Verifică responsabilul și următorul termen în Deal Room.',
        count: data.stats.pendingDocuments,
        priority: 'normal',
        destination: 'documents',
        actionLabel: 'Deschide documentele',
        icon: FileCheck2,
      })
    }
    if (data.stats.pendingRedemptions > 0) {
      items.push({
        id: 'coin-redemptions',
        title: 'Solicitări HQS Coins',
        description: 'Onorează recompensa sau respinge cererea cu restituire automată.',
        count: data.stats.pendingRedemptions,
        priority: 'normal',
        destination: 'transactions',
        actionLabel: 'Soluționează cererile',
        icon: Coins,
      })
    }

    return items
  }, [data])

  const globalSearchResults = useMemo<GlobalSearchResult[]>(() => {
    if (!data || globalSearch.trim().length < 2) return []
    const query = globalSearch.trim().toLocaleLowerCase('ro-RO')
    const includesQuery = (value: string) => value.toLocaleLowerCase('ro-RO').includes(query)
    const results: GlobalSearchResult[] = []

    data.users.forEach((account) => {
      const label = account.full_name || account.name || account.email || 'Utilizator HQS'
      if (includesQuery(`${label} ${account.email || ''} ${account.phone || ''}`)) {
        results.push({ id: `user-${account.id}`, label, meta: `${ACCOUNT_ROLE_DEFINITIONS[account.role].label} · ${account.email || 'fără email'}`, kind: 'Persoană', tab: 'people', localSearch: account.email || label, icon: Users })
      }
    })
    data.properties.forEach((property) => {
      if (includesQuery(`${property.title} ${property.city || ''} ${property.zone || ''}`)) {
        results.push({ id: `property-${property.id}`, label: property.title, meta: `${PROPERTY_STATUS_LABELS[property.status]} · ${property.city || property.zone || 'zonă nespecificată'}`, kind: 'Proprietate', tab: 'properties', localSearch: property.title, icon: Building2 })
      }
    })
    data.leads.forEach((lead) => {
      if (includesQuery(`${lead.name} ${lead.email} ${lead.phone || ''}`)) {
        results.push({ id: `lead-${lead.id}`, label: lead.name, meta: `${STATUS_LABELS[lead.status] || lead.status} · ${lead.source}`, kind: 'Lead', tab: 'transactions', icon: Handshake })
      }
    })
    data.deals.forEach((deal) => {
      if (includesQuery(`${deal.title} ${deal.next_step || ''}`)) {
        results.push({ id: `deal-${deal.id}`, label: deal.title, meta: `${STATUS_LABELS[deal.stage] || deal.stage} · ${deal.next_step || 'fără pas următor'}`, kind: 'Tranzacție', tab: 'transactions', icon: ClipboardCheck })
      }
    })

    return results.slice(0, 8)
  }, [data, globalSearch])

  const pendingWorkCount = useMemo(
    () => workItems.reduce((total, item) => total + item.count, 0),
    [workItems],
  )

  const openTab = (tab: AdminTab) => {
    setActiveTab(tab)
    setSearch('')
  }

  const openWorkItem = (destination: WorkDestination) => {
    if (destination === 'crm') {
      navigateTo('crm')
      return
    }
    if (destination === 'documents') {
      navigateTo('documente')
      return
    }
    if (destination === 'properties') {
      setPropertyFilter('DRAFT')
      openTab('properties')
      return
    }
    if (destination === 'compliance') {
      openTab('compliance')
      return
    }
    openTab('transactions')
  }

  const openSearchResult = (result: GlobalSearchResult) => {
    if (result.tab === 'people') setRoleFilter('ALL')
    if (result.tab === 'properties') setPropertyFilter('ALL')
    setSearch(result.localSearch || '')
    setActiveTab(result.tab)
    setGlobalSearch('')
  }

  const handleSignOut = async () => {
    await signOut()
    navigateTo('acasa')
  }

  if (!authLoading && profile && profile.role !== 'ADMIN') {
    return <RoleAccessDenied currentRole={profile.role} allowedRoles={['ADMIN']} />
  }

  if (authLoading || (loading && !data)) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Se sincronizează centrul operațional...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-xl flex-col items-center justify-center px-4 text-center">
        <ShieldAlert className="h-10 w-10 text-destructive" />
        <h1 className="mt-4 text-xl font-semibold">Panoul nu este disponibil</h1>
        <p className="mt-2 text-sm text-muted-foreground">{loadError || 'Reîncearcă după reautentificare.'}</p>
        <Button className="mt-5" onClick={() => void fetchDashboard()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Reîncearcă
        </Button>
      </div>
    )
  }

  const stats = data.stats
  const PrimaryWorkIcon = workItems[0]?.icon || ListTodo

  return (
    <div className="min-h-screen">
      <PageHero
        variant="border"
        icon={Shield}
        title="Centru de administrare"
        description={`${user?.email || 'Administrator'} · sincronizat ${formatDate(data.generatedAt)}`}
        breadcrumb={[{ label: 'Acasă', page: 'acasa' }, { label: 'Administrare' }]}
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void fetchDashboard()} disabled={loading}>
            <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} /> Actualizează
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateTo('acasa')}>
            <Building2 className="mr-2 h-4 w-4" /> Site public
          </Button>
          <Button variant="destructive" size="sm" onClick={() => void handleSignOut()}>
            <LogOut className="mr-2 h-4 w-4" /> Deconectare
          </Button>
        </div>
      </PageHero>

      <main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="relative z-20 mb-5">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={globalSearch}
            onChange={(event) => setGlobalSearch(event.target.value)}
            placeholder="Caută un client, agent, proprietate sau tranzacție..."
            aria-label="Căutare globală în administrare"
            className="h-12 rounded-xl bg-card pl-12 text-base shadow-sm"
          />
          {globalSearch.trim().length >= 2 ? (
            <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] max-h-96 overflow-y-auto rounded-2xl border bg-popover p-2 shadow-xl">
              {globalSearchResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => openSearchResult(result)}
                  className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-muted"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><result.icon className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{result.label}</p><p className="truncate text-xs text-muted-foreground">{result.meta}</p></div>
                  <Badge variant="outline">{result.kind}</Badge>
                </button>
              ))}
              {globalSearchResults.length === 0 ? <p className="px-3 py-6 text-center text-sm text-muted-foreground">Niciun rezultat. Încearcă un nume, email sau titlu.</p> : null}
            </div>
          ) : null}
        </div>

        <Tabs value={activeTab} onValueChange={(value) => openTab(value as AdminTab)}>
          <TabsList className="mb-6 grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-muted/60 p-1.5 md:grid-cols-3 xl:grid-cols-6">
            <TabsTrigger value="home" className="gap-2"><LayoutDashboard className="h-4 w-4" /> Acasă</TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2"><ListTodo className="h-4 w-4" /> De rezolvat {pendingWorkCount > 0 ? <Badge variant="destructive">{pendingWorkCount}</Badge> : null}</TabsTrigger>
            <TabsTrigger value="properties" className="gap-2"><Building2 className="h-4 w-4" /> Proprietăți</TabsTrigger>
            <TabsTrigger value="people" className="gap-2"><Users className="h-4 w-4" /> Clienți și agenți</TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2"><Handshake className="h-4 w-4" /> Tranzacții</TabsTrigger>
            <TabsTrigger value="settings" className="gap-2"><Settings2 className="h-4 w-4" /> Setări</TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard icon={ListTodo} label="De rezolvat" value={pendingWorkCount} note={`${workItems.length} categorii de lucru`} tone="bg-rose-500/10 text-rose-600" />
              <MetricCard icon={Handshake} label="Lead-uri deschise" value={stats.openLeads} note={`${stats.overdueLeads} necesită răspuns`} tone="bg-amber-500/10 text-amber-600" />
              <MetricCard icon={Building2} label="Proprietăți active" value={stats.publishedProperties} note={`${stats.draftProperties} așteaptă verificarea`} tone="bg-emerald-500/10 text-emerald-600" />
              <MetricCard icon={CalendarDays} label="Tranzacții" value={stats.activeDeals} note={`${stats.upcomingViewings} vizionări viitoare`} tone="bg-violet-500/10 text-violet-600" />
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
              <Card className={cn(workItems[0]?.priority === 'urgent' && 'border-amber-300/70 bg-amber-50/30 dark:bg-amber-950/10')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><ListTodo className="h-5 w-5 text-primary" /> Ce faci acum</CardTitle>
                  <CardDescription>Următoarea acțiune recomandată, calculată din situația curentă.</CardDescription>
                </CardHeader>
                <CardContent>
                  {workItems[0] ? (
                    <div className="flex flex-col gap-4 rounded-xl border bg-background p-4 sm:flex-row sm:items-center">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><PrimaryWorkIcon className="h-5 w-5" /></div>
                      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{workItems[0].title}</p><Badge variant={workItems[0].priority === 'urgent' ? 'destructive' : 'secondary'}>{workItems[0].count}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{workItems[0].description}</p></div>
                      <Button onClick={() => openWorkItem(workItems[0].destination)}>{workItems[0].actionLabel}<ArrowRight className="ml-2 h-4 w-4" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50/50 p-4 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-200"><CheckCircle2 className="h-5 w-5" /><p className="text-sm font-medium">Nu există sarcini administrative restante.</p></div>
                  )}
                  {workItems.length > 1 ? <Button variant="link" className="mt-3 px-0" onClick={() => openTab('tasks')}>Vezi întreaga listă ({workItems.length} categorii)</Button> : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Acțiuni rapide</CardTitle><CardDescription>Cele mai frecvente operațiuni, fără navigare inutilă.</CardDescription></CardHeader>
                <CardContent className="grid gap-2 sm:grid-cols-2">
                  {[
                    { icon: Handshake, title: 'Repartizează lead-uri', run: () => navigateTo('crm') },
                    { icon: Building2, title: 'Verifică proprietăți', run: () => openTab('properties') },
                    { icon: Users, title: 'Gestionează echipa', run: () => openTab('people') },
                    { icon: FileCheck2, title: 'Documente și contracte', run: () => navigateTo('documente') },
                  ].map((item) => (
                    <button key={item.title} type="button" onClick={item.run} className="flex items-center gap-3 rounded-xl border p-3 text-left text-sm font-medium transition-colors hover:border-primary/50 hover:bg-muted/30"><item.icon className="h-4 w-4 text-primary" />{item.title}</button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <SectionHeader icon={ListTodo} title="De rezolvat" description="O singură listă cu tot ce necesită o decizie sau o acțiune administrativă." />
            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
              <div className="space-y-3">
                {workItems.map((item) => (
                  <Card key={item.id} className={cn(item.priority === 'urgent' && 'border-amber-300/70')}>
                    <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', item.priority === 'urgent' ? 'bg-amber-500/10 text-amber-700' : 'bg-primary/10 text-primary')}><item.icon className="h-5 w-5" /></div>
                      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{item.title}</p><Badge variant={item.priority === 'urgent' ? 'destructive' : 'secondary'}>{item.count}</Badge>{item.priority === 'urgent' ? <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Prioritate ridicată</span> : null}</div><p className="mt-1 text-sm text-muted-foreground">{item.description}</p></div>
                      <Button variant={item.priority === 'urgent' ? 'default' : 'outline'} onClick={() => openWorkItem(item.destination)}>{item.actionLabel}<ArrowRight className="ml-2 h-4 w-4" /></Button>
                    </CardContent>
                  </Card>
                ))}
                {workItems.length === 0 ? <EmptyState icon={CheckCircle2} title="Totul este la zi" description="Nu există proprietăți, documente, lead-uri sau cereri care să necesite intervenția administratorului." /> : null}
              </div>
              <Card className="h-fit lg:sticky lg:top-24">
                <CardHeader><CardTitle className="text-base">Flux recomandat</CardTitle><CardDescription>Rezolvă lista în această ordine.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  {[
                    ['1', 'Deblochează', 'Rezolvă întâi elementele marcate cu prioritate ridicată.'],
                    ['2', 'Repartizează', 'Confirmă agentul sau persoana responsabilă.'],
                    ['3', 'Închide pasul', 'Actualizează statusul și termenul următor.'],
                  ].map(([step, title, description]) => <div key={step} className="flex gap-3"><div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{step}</div><div><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 text-xs text-muted-foreground">{description}</p></div></div>)}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="people" className="space-y-5">
            <SectionHeader icon={Users} title="Utilizatori și roluri" description="Controlează accesul fără a modifica datele de autentificare sau parolele." />
            <div className="flex flex-wrap gap-3">
              <div className="relative min-w-64 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Caută după nume, email sau telefon..." className="pl-9" />
              </div>
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as 'ALL' | AccountRole)} className="h-9 rounded-md border bg-background px-3 text-sm">
                <option value="ALL">Toate rolurile</option>
                {ACCOUNT_ROLES.map((role) => <option key={role} value={role}>{ACCOUNT_ROLE_DEFINITIONS[role].label}</option>)}
              </select>
            </div>
            <div className="overflow-hidden rounded-2xl border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-sm">
                  <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                    <tr><th className="px-4 py-3">Utilizator</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Rol</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Creat</th><th className="px-4 py-3 text-right">Acțiuni</th></tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((account) => {
                      const isSelf = account.id === user?.id
                      const key = `user:${account.id}`
                      return (
                        <tr key={account.id} className="border-t align-middle">
                          <td className="px-4 py-3"><div className="font-medium">{account.full_name || account.name || 'Utilizator HQS'}</div><div className="mt-1 flex gap-2">{isSelf ? <Badge variant="outline">Sesiunea curentă</Badge> : null}<span className="font-mono text-[10px] text-muted-foreground">{account.id.slice(0, 8)}</span></div></td>
                          <td className="px-4 py-3"><div>{account.email || '—'}</div><div className="text-xs text-muted-foreground">{account.phone || 'Fără telefon'}</div></td>
                          <td className="px-4 py-3">
                            <select
                              aria-label={`Rol pentru ${account.email || account.id}`}
                              value={account.role}
                              disabled={busyKey === key || isSelf}
                              onChange={(event) => {
                                const role = event.target.value as AccountRole
                                setConfirmation({
                                  title: 'Schimbă rolul contului',
                                  description: `${account.email || account.id} va primi accesul specific rolului ${ACCOUNT_ROLE_DEFINITIONS[role].label}.`,
                                  confirmLabel: 'Schimbă rolul',
                                  run: () => runAction(key, { action: 'UPDATE_USER', userId: account.id, role }, 'Rolul a fost actualizat.'),
                                })
                              }}
                              className={cn('h-8 rounded-md border px-2 text-xs font-semibold', ROLE_TONES[account.role])}
                            >
                              {ACCOUNT_ROLES.map((role) => <option key={role} value={role}>{ACCOUNT_ROLE_DEFINITIONS[role].label}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-3"><Badge variant={account.is_active ? 'default' : 'destructive'}>{account.is_active ? 'Activ' : 'Dezactivat'}</Badge></td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(account.created_at)}</td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busyKey === key || isSelf}
                              onClick={() => setConfirmation({
                                title: account.is_active ? 'Dezactivează contul' : 'Reactivează contul',
                                description: account.is_active
                                  ? 'Contul nu va mai putea accesa funcțiile protejate până la reactivare.'
                                  : 'Contul va primi din nou acces conform rolului său.',
                                confirmLabel: account.is_active ? 'Dezactivează' : 'Reactivează',
                                destructive: account.is_active,
                                run: () => runAction(key, { action: 'UPDATE_USER', userId: account.id, isActive: !account.is_active }, account.is_active ? 'Contul a fost dezactivat.' : 'Contul a fost reactivat.'),
                              })}
                            >
                              {busyKey === key ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : account.is_active ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                              {account.is_active ? 'Dezactivează' : 'Reactivează'}
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length === 0 ? <EmptyState icon={Users} title="Niciun utilizator găsit" description="Modifică filtrul sau termenul de căutare." /> : null}
            </div>
          </TabsContent>

          <TabsContent value="properties" className="space-y-5">
            <SectionHeader
              icon={Building2}
              title="Moderare proprietăți"
              description="Datele provin din Supabase, aceeași sursă folosită de publicare și paginile publice."
              action={<Button onClick={() => navigateTo('adauga-proprietate')}><Building2 className="mr-2 h-4 w-4" /> Adaugă proprietate</Button>}
            />
            <div className="flex flex-wrap gap-3">
              <div className="relative min-w-64 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Caută după titlu, oraș, zonă sau tip..." className="pl-9" /></div>
              <select value={propertyFilter} onChange={(event) => setPropertyFilter(event.target.value as 'ALL' | AdminPropertyStatus)} className="h-9 rounded-md border bg-background px-3 text-sm">
                <option value="ALL">Toate statusurile</option>
                {ADMIN_PROPERTY_STATUSES.map((status) => <option key={status} value={status}>{PROPERTY_STATUS_LABELS[status]}</option>)}
              </select>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredProperties.map((property) => {
                const key = `property:${property.id}`
                return (
                  <Card key={property.id} className="gap-4 py-5">
                    <CardHeader className="px-5">
                      <div className="flex items-start justify-between gap-3">
                        <div><CardTitle className="text-base">{property.title}</CardTitle><CardDescription className="mt-1">{[property.city, property.zone, property.type].filter(Boolean).join(' · ')}</CardDescription></div>
                        <StatusBadge status={property.status} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 px-5">
                      <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xl font-bold">{formatPrice(property.price, property.currency)}</span><span className="text-xs text-muted-foreground">Actualizat {formatDate(property.updated_at)}</span></div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-1.5 text-xs font-medium text-muted-foreground">Status
                          <select
                            aria-label={`Status pentru ${property.title}`}
                            value={property.status}
                            disabled={busyKey === key}
                            onChange={(event) => {
                              const status = event.target.value as AdminPropertyStatus
                              setConfirmation({
                                title: 'Actualizează statusul proprietății',
                                description: status === 'PUBLISHED' ? 'Anunțul va deveni vizibil public.' : `Proprietatea va trece în starea ${PROPERTY_STATUS_LABELS[status]}.`,
                                confirmLabel: 'Actualizează',
                                destructive: status === 'ARCHIVED',
                                run: () => runAction(key, { action: 'UPDATE_PROPERTY', propertyId: property.id, status }, 'Statusul proprietății a fost actualizat.'),
                              })
                            }}
                            className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm text-foreground"
                          >
                            {ADMIN_PROPERTY_STATUSES.map((status) => <option key={status} value={status}>{PROPERTY_STATUS_LABELS[status]}</option>)}
                          </select>
                        </label>
                        <label className="space-y-1.5 text-xs font-medium text-muted-foreground">Agent responsabil
                          <select
                            aria-label={`Agent pentru ${property.title}`}
                            value={property.agent_id || 'UNASSIGNED'}
                            disabled={busyKey === key}
                            onChange={(event) => void runAction(key, { action: 'UPDATE_PROPERTY', propertyId: property.id, agentId: event.target.value === 'UNASSIGNED' ? null : event.target.value }, 'Agentul proprietății a fost actualizat.')}
                            className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm text-foreground"
                          >
                            <option value="UNASSIGNED">Nerepartizată</option>
                            {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.full_name || agent.email}</option>)}
                          </select>
                        </label>
                      </div>
                      <div className="flex justify-end">
                        <a href={`/proprietati/${property.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">Vezi pagina publică <ExternalLink className="h-4 w-4" /></a>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            {filteredProperties.length === 0 ? <EmptyState icon={Building2} title="Nicio proprietate găsită" description="Modifică filtrul sau publică o proprietate nouă." /> : null}
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <SectionHeader icon={Activity} title="Operațiuni în desfășurare" description="Lead-uri, vizionări, tranzacții, documente, Coins și audit într-un singur loc." />
            <div className="grid gap-5 xl:grid-cols-2">
              <Card>
                <CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-base"><Handshake className="h-5 w-5 text-primary" /> Lead-uri active</CardTitle><CardDescription>{stats.overdueLeads} depășesc timpul de răspuns.</CardDescription></div><Button variant="outline" size="sm" onClick={() => navigateTo('crm')}>Deschide CRM</Button></div></CardHeader>
                <CardContent className="space-y-2">
                  {activeLeads.map((lead) => <div key={lead.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{lead.name}</p><p className="truncate text-xs text-muted-foreground">{lead.email} · scor {lead.score}</p></div><StatusBadge status={lead.status} /></div>)}
                  {activeLeads.length === 0 ? <EmptyState icon={Handshake} title="Pipeline liber" description="Nu există lead-uri active." /> : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="h-5 w-5 text-primary" /> Vizionări active</CardTitle><CardDescription>Confirmări, prezență și următorul pas.</CardDescription></div><Button variant="outline" size="sm" onClick={() => navigateTo('vizionarile-mele')}>Gestionează</Button></div></CardHeader>
                <CardContent className="space-y-2">
                  {activeAppointments.map((appointment) => <div key={appointment.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{appointment.property_title || 'Proprietate nespecificată'}</p><p className="truncate text-xs text-muted-foreground">{appointment.client_name} · {formatDate(appointment.start_at || appointment.requested_at)}</p></div><StatusBadge status={appointment.status} /></div>)}
                  {activeAppointments.length === 0 ? <EmptyState icon={CalendarDays} title="Nicio vizionare activă" description="Programările noi vor apărea aici." /> : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="h-5 w-5 text-primary" /> Deal Rooms și documente</CardTitle><CardDescription>{stats.activeDeals} tranzacții · {stats.pendingDocuments} documente restante.</CardDescription></div><Button variant="outline" size="sm" onClick={() => navigateTo('deal-room')}>Deschide</Button></div></CardHeader>
                <CardContent className="space-y-2">
                  {data.deals.slice(0, 6).map((deal) => <div key={deal.id} className="rounded-xl border p-3"><div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-medium">{deal.title}</p><StatusBadge status={deal.stage} /></div><p className="mt-1 truncate text-xs text-muted-foreground">{deal.next_step || 'Următorul pas nu este setat'} · {formatDate(deal.next_step_due_at)}</p></div>)}
                  {data.deals.length === 0 ? <EmptyState icon={ClipboardCheck} title="Nicio tranzacție" description="Deal Room-ul se creează la programarea vizionării." /> : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Coins className="h-5 w-5 text-primary" /> Cereri HQS Coins</CardTitle><CardDescription>Onorează recompensa sau respinge cererea cu restituirea automată a monedelor.</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  {pendingRedemptions.map((redemption) => {
                    const title = String(redemption.reward_snapshot?.title || redemption.reward_id)
                    const key = `redemption:${redemption.id}`
                    return <div key={redemption.id} className="space-y-3 rounded-xl border p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{title}</p><p className="text-xs text-muted-foreground">{redemption.cost} monede · {formatDate(redemption.requested_at)}</p></div><StatusBadge status={redemption.status} /></div><Input value={redemptionNotes[redemption.id] || ''} onChange={(event) => setRedemptionNotes((current) => ({ ...current, [redemption.id]: event.target.value }))} placeholder="Notă de soluționare (obligatorie la respingere)" maxLength={1000} /><div className="flex justify-end gap-2"><Button variant="outline" size="sm" disabled={busyKey === key} onClick={() => setConfirmation({ title: 'Respinge recompensa', description: 'Costul va fi restituit automat în portofelul utilizatorului.', confirmLabel: 'Respinge și restituie', destructive: true, run: () => runAction(key, { action: 'RESOLVE_REDEMPTION', redemptionId: redemption.id, status: 'REJECTED', note: redemptionNotes[redemption.id] || '' }, 'Cererea a fost respinsă și monedele au fost restituite.') })}>Respinge</Button><Button size="sm" disabled={busyKey === key} onClick={() => setConfirmation({ title: 'Confirmă onorarea recompensei', description: 'Cererea va fi marcată ca onorată și nu va mai putea fi modificată.', confirmLabel: 'Marchează onorată', run: () => runAction(key, { action: 'RESOLVE_REDEMPTION', redemptionId: redemption.id, status: 'FULFILLED', note: redemptionNotes[redemption.id] || '' }, 'Recompensa a fost marcată ca onorată.') })}>Onorează</Button></div></div>
                  })}
                  {pendingRedemptions.length === 0 ? <EmptyState icon={Coins} title="Nicio cerere Coins" description="Cererile de recompense vor apărea aici." /> : null}
                </CardContent>
              </Card>
            </div>

          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SectionHeader icon={Settings2} title="Setări și instrumente avansate" description="Configurările folosite ocazional sunt grupate aici, separat de activitatea zilnică." />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { id: 'inbox' as const, icon: Inbox, title: 'Mesaje și abonamente', description: 'Contacte, newsletter și alerte de preț.', badge: `${stats.totalContacts} contacte` },
                { id: 'compliance' as const, icon: FileCheck2, title: 'Juridic și GDPR', description: 'Profilul firmei și avizele șabloanelor.', badge: stats.templatesPendingReview ? `${stats.templatesPendingReview} de verificat` : 'La zi' },
                { id: 'virtual-tours' as const, icon: Rotate3D, title: 'Tururi virtuale', description: 'Moderarea tururilor 360° încărcate.', badge: 'Moderare' },
                { id: 'audit' as const, icon: Activity, title: 'Jurnal administrativ', description: 'Istoricul operațiunilor sensibile.', badge: `${data.audit.length} evenimente` },
              ].map((item) => (
                <button key={item.id} type="button" onClick={() => openTab(item.id)} className="group rounded-2xl border bg-card p-5 text-left shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><item.icon className="h-5 w-5" /></div><Badge variant="secondary">{item.badge}</Badge></div>
                  <p className="mt-4 font-semibold">{item.title}</p><p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  <span className="mt-4 inline-flex items-center text-sm font-medium text-primary">Deschide <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
                </button>
              ))}
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Starea platformei</CardTitle><CardDescription>Aceste informații sunt tehnice și nu necesită verificare în activitatea zilnică.</CardDescription></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1.5 px-3 py-1.5"><span className={cn('h-2 w-2 rounded-full', data.health.supabase === 'online' ? 'bg-emerald-500' : 'bg-amber-500')} />Supabase {data.health.supabase === 'online' ? 'online' : 'degradat'}</Badge>
                <Badge variant="outline" className="gap-1.5 px-3 py-1.5"><span className={cn('h-2 w-2 rounded-full', data.health.d1 === 'online' ? 'bg-emerald-500' : 'bg-amber-500')} />Mesaje D1 {data.health.d1 === 'online' ? 'online' : 'fallback'}</Badge>
                <Badge variant="outline" className="gap-1.5 px-3 py-1.5"><span className={cn('h-2 w-2 rounded-full', data.health.legalProfileReady ? 'bg-emerald-500' : 'bg-rose-500')} />Profil juridic {data.health.legalProfileReady ? 'configurat' : 'incomplet'}</Badge>
                {data.health.warnings.length > 0 ? <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300"><AlertTriangle className="mr-1.5 h-3.5 w-3.5" />{data.health.warnings.length} avertismente</Badge> : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inbox" className="space-y-6">
            <SectionHeader icon={Inbox} title="Mesaje și abonamente" description="Contacte, newsletter și alerte de preț păstrate în baza operațională D1." action={<Button variant="outline" onClick={() => openTab('settings')}><ArrowRight className="mr-2 h-4 w-4 rotate-180" /> Înapoi la setări</Button>} />
            <div className="grid gap-5 xl:grid-cols-3">
              <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="h-5 w-5 text-primary" /> Contacte <Badge variant="secondary">{data.contacts.length}</Badge></CardTitle></CardHeader><CardContent className="space-y-3">{data.contacts.slice(0, 30).map((contact) => <div key={contact.id} className="rounded-xl border p-3"><div className="flex justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{contact.name}</p><a href={`mailto:${contact.email}`} className="truncate text-xs text-primary hover:underline">{contact.email}</a>{contact.propertyTitle ? <div className="mt-2"><Badge variant="outline" className="max-w-full truncate">{contact.propertyTitle}</Badge></div> : null}</div><Button variant="ghost" size="sm" className="text-destructive" onClick={() => setConfirmation({ title: 'Șterge mesajul', description: 'Mesajul va fi eliminat definitiv din D1.', confirmLabel: 'Șterge', destructive: true, run: () => runAction(`contact:${contact.id}`, { action: 'DELETE_LEGACY', entity: 'CONTACT', id: contact.id }, 'Mesajul a fost șters.') })}>Șterge</Button></div><p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{contact.message}</p><p className="mt-2 text-[11px] text-muted-foreground">{formatDate(contact.createdAt)}</p></div>)}{data.contacts.length === 0 ? <EmptyState icon={MessageSquare} title="Fără mesaje" description="Cererile de contact vor apărea aici." /> : null}</CardContent></Card>
              <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Mail className="h-5 w-5 text-primary" /> Newsletter <Badge variant="secondary">{data.newsletters.length}</Badge></CardTitle></CardHeader><CardContent className="space-y-2">{data.newsletters.slice(0, 40).map((subscriber) => <div key={subscriber.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{subscriber.email}</p><p className="text-[11px] text-muted-foreground">{formatDate(subscriber.createdAt)}</p></div><Button variant="ghost" size="sm" className="text-destructive" onClick={() => setConfirmation({ title: 'Dezabonează adresa', description: 'Adresa va fi eliminată din lista newsletter.', confirmLabel: 'Dezabonează', destructive: true, run: () => runAction(`newsletter:${subscriber.id}`, { action: 'DELETE_LEGACY', entity: 'NEWSLETTER', id: subscriber.id }, 'Adresa a fost dezabonată.') })}>Elimină</Button></div>)}{data.newsletters.length === 0 ? <EmptyState icon={Mail} title="Fără abonați" description="Abonările noi vor apărea aici." /> : null}</CardContent></Card>
              <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Bell className="h-5 w-5 text-primary" /> Alerte preț <Badge variant="secondary">{data.alerts.length}</Badge></CardTitle></CardHeader><CardContent className="space-y-2">{data.alerts.slice(0, 40).map((alert) => <div key={alert.id} className="rounded-xl border p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{alert.email}</p><p className="truncate text-xs text-muted-foreground">{[alert.zone, alert.propertyType].filter(Boolean).join(' · ') || 'Toate proprietățile'}</p></div><StatusBadge status={alert.active ? 'ACTIVE' : 'ARCHIVED'} /></div><div className="mt-3 flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => void runAction(`alert:${alert.id}`, { action: 'TOGGLE_ALERT', id: alert.id, active: !alert.active }, alert.active ? 'Alerta a fost dezactivată.' : 'Alerta a fost activată.')}>{alert.active ? 'Dezactivează' : 'Activează'}</Button><Button variant="ghost" size="sm" className="text-destructive" onClick={() => setConfirmation({ title: 'Șterge alerta', description: 'Alerta va fi eliminată definitiv.', confirmLabel: 'Șterge', destructive: true, run: () => runAction(`alert:${alert.id}`, { action: 'DELETE_LEGACY', entity: 'ALERT', id: alert.id }, 'Alerta a fost ștearsă.') })}>Șterge</Button></div></div>)}{data.alerts.length === 0 ? <EmptyState icon={Bell} title="Fără alerte" description="Alertele active ale clienților vor apărea aici." /> : null}</CardContent></Card>
            </div>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <SectionHeader icon={FileCheck2} title="Conformitate juridică și documente" description="Starea profilului agenției, informarea GDPR și avizele nominale ale șabloanelor." action={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => openTab('settings')}><ArrowRight className="mr-2 h-4 w-4 rotate-180" /> Înapoi la setări</Button><Button variant="outline" onClick={() => navigateTo('documente')}><FileCheck2 className="mr-2 h-4 w-4" /> Deschide documentele</Button></div>} />
            <LegalCompliancePanel userId={user?.id || ''} />
            <div className="grid gap-5 lg:grid-cols-3">
              <Card className="lg:col-span-1"><CardHeader><CardTitle className="text-base">Profil juridic agenție</CardTitle><CardDescription>Date folosite în contracte și fișe de vizionare.</CardDescription></CardHeader><CardContent className="space-y-3">{data.legalProfile ? <><div className="flex justify-between gap-3"><span className="text-sm text-muted-foreground">Status</span><StatusBadge status={data.legalProfile.status} /></div><div><p className="text-xs text-muted-foreground">Denumire legală</p><p className="mt-1 text-sm font-medium">{data.legalProfile.legal_name || data.legalProfile.trade_name || 'Necompletată'}</p></div><div><p className="text-xs text-muted-foreground">CUI / Registrul Comerțului</p><p className="mt-1 text-sm">{[data.legalProfile.cui, data.legalProfile.trade_registry_number].filter(Boolean).join(' · ') || 'Necompletat'}</p></div><div><p className="text-xs text-muted-foreground">Informare GDPR</p>{data.legalProfile.privacy_notice_url ? <a href={data.legalProfile.privacy_notice_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline">Deschide versiunea {data.legalProfile.privacy_notice_version || 'curentă'} <ExternalLink className="h-3.5 w-3.5" /></a> : <p className="mt-1 text-sm text-destructive">URL lipsă</p>}</div><p className="text-[11px] text-muted-foreground">Actualizat {formatDate(data.legalProfile.updated_at)}</p></> : <EmptyState icon={ShieldAlert} title="Profil juridic lipsă" description="Programările și contractele finale trebuie blocate până la completare." />}</CardContent></Card>
              <Card className="lg:col-span-2"><CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle className="text-base">Șabloane contractuale</CardTitle><CardDescription>Avizul trebuie să identifice nominal juristul sau avocatul.</CardDescription></div><Badge variant={stats.templatesPendingReview ? 'destructive' : 'default'}>{stats.templatesApproved} aprobate · {stats.templatesPendingReview} blocate</Badge></div></CardHeader><CardContent className="space-y-2">{data.templates.map((template) => <div key={template.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{template.name}</p><p className="text-xs text-muted-foreground">{template.type} · v{template.version} · versiune legală {template.legal_version || 'nespecificată'}</p>{template.legal_reviewer_name ? <p className="mt-1 text-xs text-muted-foreground">Revizuit de {template.legal_reviewer_name} · {formatDate(template.legal_reviewed_at)}</p> : null}</div><StatusBadge status={template.legal_review_status} /></div>)}{data.templates.length === 0 ? <EmptyState icon={FileCheck2} title="Fără șabloane" description="Adaugă șabloanele juridice înainte de generarea documentelor." /> : null}</CardContent></Card>
            </div>
            {stats.templatesPendingReview > 0 ? <div className="flex items-start gap-3 rounded-2xl border border-rose-300 bg-rose-50/50 p-4 text-rose-800 dark:bg-rose-950/20 dark:text-rose-200"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Generarea documentelor finale rămâne blocată</p><p className="mt-1 text-sm">Administratorul poate pregăti ciornele, însă numai un profesionist juridic identificat nominal poate acorda avizul șablonului.</p></div></div> : <div className="flex items-start gap-3 rounded-2xl border border-emerald-300 bg-emerald-50/50 p-4 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-200"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Șabloanele juridice sunt aprobate</p><p className="mt-1 text-sm">Verifică periodic termenele de valabilitate și versiunile informărilor.</p></div></div>}
          </TabsContent>

          <TabsContent value="virtual-tours" className="space-y-5">
            <div><Button variant="outline" onClick={() => openTab('settings')}><ArrowRight className="mr-2 h-4 w-4 rotate-180" /> Înapoi la setări</Button></div>
            <VirtualTourReviewPanel accessToken={session?.access_token || ''} />
          </TabsContent>

          <TabsContent value="audit" className="space-y-5">
            <SectionHeader icon={Activity} title="Jurnal administrativ" description="Ultimele acțiuni sensibile realizate din centrul de administrare." action={<Button variant="outline" onClick={() => openTab('settings')}><ArrowRight className="mr-2 h-4 w-4 rotate-180" /> Înapoi la setări</Button>} />
            <Card>
              <CardContent className="space-y-2 p-4 sm:p-6">
                {data.audit.slice(0, 50).map((event) => <div key={event.id} className="flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-start"><div className="flex min-w-0 flex-1 items-start gap-3"><div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Activity className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="text-sm font-medium">{event.action.replaceAll('_', ' ')}</p><p className="truncate text-xs text-muted-foreground">{event.entity} · {event.actor || 'sistem'}</p></div></div><span className="pl-11 text-[11px] text-muted-foreground sm:pl-0">{formatDate(event.created_at)}</span></div>)}
                {data.audit.length === 0 ? <EmptyState icon={Activity} title="Jurnal gol" description="Prima acțiune administrativă va crea o înregistrare." /> : null}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={Boolean(confirmation)} onOpenChange={(open) => { if (!open && !busyKey) setConfirmation(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmation?.title}</DialogTitle>
            <DialogDescription>{confirmation?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmation(null)} disabled={Boolean(busyKey)}>Renunță</Button>
            <Button
              variant={confirmation?.destructive ? 'destructive' : 'default'}
              disabled={Boolean(busyKey)}
              onClick={async () => {
                if (!confirmation) return
                await confirmation.run()
                setConfirmation(null)
              }}
            >
              {busyKey ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {confirmation?.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
