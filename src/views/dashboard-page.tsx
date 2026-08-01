'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CheckCircle2,
  CircleDot,
  Eye,
  FileText,
  Heart,
  Search,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import { StatusBadge } from '@/components/ui/status-badge'
import { PageState } from '@/components/ui/page-state'
import { PageContainer, PageHero, PageSection, PageShell, PageSurface, SectionHeader } from '@/components/layout'
import { useAppStore, type PageKey } from '@/store/use-app-store'
import { loadFromLS } from '@/lib/storage'
import { LS_KEYS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Vizionare } from '@/lib/types'
import {
  ACCOUNT_ROLE_DEFINITIONS,
  type AccountRole,
} from '@/lib/account-roles'
import {
  countDealRoomDocumentActions,
  fetchCrmSnapshot,
  fetchDealRooms,
  fetchOwnerSnapshot,
  type DealRoom,
} from '@/lib/transaction-workspace'
import { listViewings } from '@/lib/viewing-documents'
import {
  getAccountGuidance,
  getAccountJourney,
  getAccountProcessSteps,
  type AccountProcessStep,
} from '@/lib/account-guidance'
import { AccountGuidancePanel } from '@/components/account/account-guidance-panel'

interface DashboardAction {
  label: string
  description: string
  page: PageKey
  icon: React.ElementType
}

interface DashboardStat {
  label: string
  value: number
  icon: React.ElementType
  color: string
  page: PageKey
}

interface WorkspaceSummary {
  viewings: Vizionare[]
  deals: DealRoom[]
  propertyCount: number
  openRequirementCount: number
  totalViews: number
  leadCount: number
}

const EMPTY_SUMMARY: WorkspaceSummary = {
  viewings: [],
  deals: [],
  propertyCount: 0,
  openRequirementCount: 0,
  totalViews: 0,
  leadCount: 0,
}

function getActions(role: AccountRole): DashboardAction[] {
  if (role === 'OWNER') {
    return [
      { label: 'Performanța proprietății', description: 'Vezi interesul, feedbackul și prețul', page: 'owner-dashboard', icon: BarChart3 },
      { label: 'Tranzacții', description: 'Urmărește Deal Room-urile active', page: 'deal-room', icon: BriefcaseBusiness },
      { label: 'Dosar digital', description: 'Completează, încarcă și semnează într-un singur loc', page: 'documente', icon: FileText },
      { label: 'Solicitări și vizionări', description: 'Urmărește interesul clienților', page: 'vizionarile-mele', icon: CalendarCheck },
    ]
  }

  if (role === 'AGENT') {
    return [
      { label: 'CRM', description: 'Lead-uri, follow-up-uri și conversie', page: 'crm', icon: Users },
      { label: 'Tranzacții', description: 'Coordonează Deal Room-urile active', page: 'deal-room', icon: BriefcaseBusiness },
      { label: 'Dosare de rezolvat', description: 'Verifică, generează și urmărește semnăturile', page: 'documente', icon: FileText },
      { label: 'Disponibilitate', description: 'Configurează intervalele agenției', page: 'disponibilitate-staff', icon: CalendarCheck },
    ]
  }

  if (role === 'ADMIN') {
    return [
      { label: 'Administrare', description: 'Utilizatori, conținut și rapoarte', page: 'admin', icon: ShieldCheck },
      { label: 'CRM și repartizare', description: 'Pipeline și alocare automată de lead-uri', page: 'crm', icon: Users },
      { label: 'Tranzacții', description: 'Auditul tuturor Deal Room-urilor', page: 'deal-room', icon: BriefcaseBusiness },
      { label: 'Blocaje documente', description: 'Rezolvă verificări, versiuni și semnături', page: 'documente', icon: FileText },
    ]
  }

  return [
    { label: 'Caută proprietăți', description: 'Descoperă ofertele disponibile', page: 'proprietati', icon: Search },
    { label: 'Programează vizionare', description: 'Alege proprietatea și intervalul', page: 'programare-vizionare', icon: CalendarCheck },
    { label: 'Tranzacțiile mele', description: 'Vizionări, oferte și documente într-un loc', page: 'deal-room', icon: BriefcaseBusiness },
    { label: 'Dosarul meu digital', description: 'Vezi imediat ce lipsește și ce ai de semnat', page: 'documente', icon: FileText },
  ]
}

export function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const navigateTo = useAppStore((state) => state.navigateTo)
  const favorites = useAppStore((state) => state.favorites)
  const [workspace, setWorkspace] = useState<WorkspaceSummary>(EMPTY_SUMMARY)
  const [workspaceLoading, setWorkspaceLoading] = useState(false)
  const [workspaceError, setWorkspaceError] = useState('')

  const savedSearches = useMemo(() => loadFromLS<Array<{ id: string }>>(LS_KEYS.SAVED_SEARCHES, []), [])
  const activeVizionari = workspace.viewings.filter((item) => ['pending', 'confirmed', 'checked_in'].includes(item.status))

  useEffect(() => {
    if (!user || !profile) {
      setWorkspace(EMPTY_SUMMARY)
      setWorkspaceLoading(false)
      setWorkspaceError('')
      return
    }

    let cancelled = false
    const loadWorkspace = async () => {
      setWorkspaceLoading(true)
      setWorkspaceError('')
      try {
        const [viewings, deals] = await Promise.all([listViewings(), fetchDealRooms()])
        let propertyCount = new Set(deals.map((deal) => deal.property_id)).size
        const openRequirementCount = countDealRoomDocumentActions({
          role: profile.role,
          userId: user.id,
          rooms: deals,
        })
        let totalViews = 0
        let leadCount = 0

        if (profile.role === 'OWNER') {
          const ownerSnapshot = await fetchOwnerSnapshot(user.id)
          propertyCount = ownerSnapshot.properties.length
          totalViews = ownerSnapshot.metrics.reduce((sum, metric) => sum + Number(metric.views || 0), 0)
        }

        if (profile.role === 'AGENT' || profile.role === 'ADMIN') {
          const crmSnapshot = await fetchCrmSnapshot()
          leadCount = crmSnapshot.leads.filter((lead) => !['WON', 'CLOSED', 'LOST'].includes(lead.status)).length
        }

        if (!cancelled) {
          setWorkspace({ viewings, deals, propertyCount, openRequirementCount, totalViews, leadCount })
        }
      } catch (error) {
        if (!cancelled) {
          setWorkspaceError(error instanceof Error ? error.message : 'Datele operaționale nu au putut fi încărcate.')
        }
      } finally {
        if (!cancelled) setWorkspaceLoading(false)
      }
    }

    void loadWorkspace()
    return () => { cancelled = true }
  }, [profile, user])

  if (authLoading || workspaceLoading) {
    return (
      <PageShell>
        <PageContainer className="py-8">
          <PageState
            tone="loading"
            title="Pregătim spațiul tău de lucru"
            description="Sincronizăm vizionările, tranzacțiile și documentele asociate contului."
          />
        </PageContainer>
      </PageShell>
    )
  }

  if (!user || !profile) {
    return (
      <PageShell>
        <PageContainer width="narrow" className="py-8">
          <PageState
            tone="neutral"
            icon={Eye}
            title="Autentifică-te pentru a continua"
            description="Panoul contului reunește vizionările, documentele și următorii pași ai tranzacțiilor tale."
            action={<Button onClick={() => navigateTo('login')}>Autentificare</Button>}
          />
        </PageContainer>
      </PageShell>
    )
  }

  const role = profile.role
  const roleDefinition = ACCOUNT_ROLE_DEFINITIONS[role]
  const actions = getActions(role)
  const activeDealsCount = workspace.deals.filter((deal) => deal.status === 'ACTIVE').length
  const guidanceSnapshot = {
    dataAvailable: !workspaceError,
    favorites: favorites.length,
    activeViewings: activeVizionari.length,
    openRequirements: workspace.openRequirementCount,
    propertyCount: workspace.propertyCount,
    totalViews: workspace.totalViews,
    leadCount: workspace.leadCount,
    activeDeals: activeDealsCount,
  }
  const guidance = getAccountGuidance(role, guidanceSnapshot)
  const journey = getAccountJourney(role)
  const processSteps = getAccountProcessSteps(role, guidanceSnapshot)

  const stats: DashboardStat[] = role === 'CLIENT'
    ? [
          { label: 'Favorite', value: favorites.length, icon: Heart, color: 'text-rose-600 bg-rose-100 dark:bg-rose-900/30', page: 'proprietati' },
          { label: 'Vizionări active', value: activeVizionari.length, icon: CalendarCheck, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30', page: 'vizionarile-mele' },
          { label: 'Documente de rezolvat', value: workspace.openRequirementCount, icon: FileText, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30', page: 'documente' },
        { label: 'Căutări salvate', value: savedSearches.length, icon: Search, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30', page: 'proprietati' },
      ]
    : role === 'OWNER'
      ? [
          { label: 'Proprietăți proprii', value: workspace.propertyCount, icon: Building2, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30', page: 'proprietatile-mele' },
          { label: 'Solicitări active', value: activeVizionari.length, icon: CalendarCheck, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30', page: 'vizionarile-mele' },
          { label: 'Documente de rezolvat', value: workspace.openRequirementCount, icon: FileText, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30', page: 'documente' },
          { label: 'Vizualizări', value: workspace.totalViews, icon: Eye, color: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30', page: 'owner-dashboard' },
        ]
      : role === 'AGENT'
        ? [
            { label: 'Tranzacții active', value: activeDealsCount, icon: Building2, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30', page: 'deal-room' },
            { label: 'Vizionări alocate', value: activeVizionari.length, icon: CalendarCheck, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30', page: 'vizionarile-mele' },
            { label: 'Cerințe documente', value: workspace.openRequirementCount, icon: FileText, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30', page: 'documente' },
            { label: 'Lead-uri active', value: workspace.leadCount, icon: Users, color: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30', page: 'crm' },
          ]
        : [
            { label: 'Tranzacții active', value: activeDealsCount, icon: Building2, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30', page: 'deal-room' },
            { label: 'Vizionări', value: workspace.viewings.length, icon: CalendarCheck, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30', page: 'vizionarile-mele' },
            { label: 'Cerințe documente', value: workspace.openRequirementCount, icon: FileText, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30', page: 'documente' },
            { label: 'Lead-uri active', value: workspace.leadCount, icon: Settings, color: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30', page: 'crm' },
          ]

  return (
    <PageShell>
      <PageContainer className="py-8">
        <PageHero
          variant="simple"
          title={`Bine ai revenit, ${profile.fullName}!`}
          description={roleDefinition.description}
        >
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{roleDefinition.label}</Badge>
        </PageHero>

        {workspaceError && (
          <p role="status" className="mb-6 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            Datele live nu sunt disponibile momentan. Poți continua, iar datele vor fi reîncărcate în pagina destinației.
          </p>
        )}

        <AccountGuidancePanel guidance={guidance} journey={journey} onNavigate={navigateTo} />

        <RoleProcessOverview role={role} roleLabel={roleDefinition.label} steps={processSteps} onNavigate={navigateTo} />

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.button
              key={stat.label}
              type="button"
              onClick={() => navigateTo(stat.page)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="glass-card glass-card-interactive group rounded-2xl p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`${stat.label}: ${stat.value}. Deschide secțiunea.`}
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-100">
                Vezi detalii <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </span>
            </motion.button>
          ))}
        </div>

        <PageSection>
          <SectionHeader
            title="Spațiul contului tău"
            description={`Acțiunile sunt adaptate profilului ${roleDefinition.label.toLowerCase()}.`}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {actions.map((action) => (
              <button
                key={`${action.page}-${action.label}`}
                type="button"
                onClick={() => navigateTo(action.page)}
                className="glass-card glass-card-interactive group rounded-2xl p-5 text-left"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-2 font-semibold">
                  {action.label}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
              </button>
            ))}
          </div>
        </PageSection>

        <div className="grid gap-6 lg:grid-cols-2">
          <PageSurface tone="elevated" className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <CalendarCheck className="h-5 w-5 text-primary" />
                {role === 'AGENT' ? 'Agenda vizionărilor' : role === 'OWNER' ? 'Solicitări recente' : 'Vizionări viitoare'}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigateTo('vizionarile-mele')}>Vezi toate</Button>
            </div>
            {activeVizionari.length === 0 ? (
              <PageState
                compact
                icon={CalendarCheck}
                title="Nu există vizionări active"
                description="Programările noi vor apărea aici împreună cu statusul lor."
                action={(
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateTo(
                      role === 'CLIENT'
                        ? 'programare-vizionare'
                        : role === 'OWNER'
                          ? 'owner-dashboard'
                          : role === 'AGENT'
                            ? 'disponibilitate-staff'
                            : 'crm',
                    )}
                  >
                    {role === 'CLIENT'
                      ? 'Programează o vizionare'
                      : role === 'OWNER'
                        ? 'Vezi performanța'
                        : role === 'AGENT'
                          ? 'Setează disponibilitatea'
                          : 'Verifică repartizarea'}
                  </Button>
                )}
                className="min-h-36 border-0 bg-transparent shadow-none"
              />
            ) : (
              <div className="space-y-3">
                {activeVizionari.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
                    <CalendarCheck className="h-5 w-5 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.propertyTitle}</p>
                      <p className="text-xs text-muted-foreground">{item.date} · {item.startTime}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                ))}
              </div>
            )}
          </PageSurface>

          <PageSurface tone="elevated" className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              {role === 'CLIENT' ? <Heart className="h-5 w-5 text-primary" /> : <Building2 className="h-5 w-5 text-primary" />}
              {role === 'CLIENT' ? 'Experiența ta de căutare' : 'Portofoliu și responsabilități'}
            </h2>
            <div className="space-y-3">
              {roleDefinition.features.map((feature) => (
                <div key={feature} className="flex items-start gap-3 rounded-xl bg-muted/30 p-3 text-sm">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {feature}
                </div>
              ))}
            </div>
          </PageSurface>
        </div>
      </PageContainer>
    </PageShell>
  )
}

function RoleProcessOverview({
  role,
  roleLabel,
  steps,
  onNavigate,
}: {
  role: AccountRole
  roleLabel: string
  steps: readonly AccountProcessStep[]
  onNavigate: (page: PageKey) => void
}) {
  const copy: Record<AccountRole, { badge: string; title: string; description: string; actionPage: PageKey; actionLabel: string }> = {
    CLIENT: {
      badge: 'Flow client',
      title: 'Traseul tău simplificat',
      description: 'Vezi imediat unde ești: de la proprietăți salvate, la vizionare, Deal Room, documente și beneficii.',
      actionPage: 'vizionarile-mele',
      actionLabel: 'Vizionările mele',
    },
    OWNER: {
      badge: 'Flow proprietar',
      title: 'Drumul proprietății tale',
      description: 'Publicare, performanță, vizionări, ofertă și documente — toate legate într-un singur fir.',
      actionPage: 'owner-dashboard',
      actionLabel: 'Dashboard proprietar',
    },
    AGENT: {
      badge: 'Flow agent',
      title: 'Pipeline-ul tău operațional',
      description: 'Disponibilitate, lead-uri, vizionări, Deal Room și documente într-o ordine clară de lucru.',
      actionPage: 'crm',
      actionLabel: 'Deschide CRM',
    },
    ADMIN: {
      badge: 'Flow admin',
      title: 'Control operațional cap-coadă',
      description: 'Prioritizează blocajele, repartizează lead-uri, deblochează documente și auditează tranzacții.',
      actionPage: 'admin',
      actionLabel: 'Centrul admin',
    },
  }
  const roleCopy = copy[role]
  const statusMeta = {
    done: {
      label: 'Gata',
      className: 'border-emerald-200 bg-emerald-50/70 text-emerald-950 dark:border-emerald-900/70 dark:bg-emerald-950/25 dark:text-emerald-100',
      markerClassName: 'bg-emerald-600 text-white',
      badgeClassName: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200',
    },
    active: {
      label: 'Acum',
      className: 'border-primary/35 bg-primary/[0.08] text-foreground shadow-sm shadow-primary/10',
      markerClassName: 'bg-primary text-primary-foreground',
      badgeClassName: 'bg-primary/10 text-primary',
    },
    next: {
      label: 'Următor',
      className: 'border-border/80 bg-background/70 text-foreground hover:border-primary/25 hover:bg-primary/[0.04]',
      markerClassName: 'bg-muted text-muted-foreground',
      badgeClassName: 'bg-muted text-muted-foreground',
    },
  } satisfies Record<AccountProcessStep['status'], {
    label: string
    className: string
    markerClassName: string
    badgeClassName: string
  }>

  return (
    <PageSurface tone="elevated" className="mb-8 overflow-hidden border-primary/15">
      <div className="border-b border-border/70 bg-gradient-to-r from-primary/[0.08] via-background to-background p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/10">{roleCopy.badge}</Badge>
            <h2 className="text-2xl font-semibold tracking-tight">{roleCopy.title}</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {roleCopy.description}
            </p>
          </div>
          <Button variant="outline" onClick={() => onNavigate(roleCopy.actionPage)} aria-label={`${roleCopy.actionLabel} pentru ${roleLabel}`}>
            {roleCopy.actionLabel}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className={cn('grid gap-3 p-4 sm:p-5', steps.length >= 5 ? 'md:grid-cols-5' : 'md:grid-cols-4')}>
        {steps.map((step, index) => {
          const meta = statusMeta[step.status]
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onNavigate(step.page)}
              className={cn(
                'group flex min-h-44 flex-col rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                meta.className,
              )}
              aria-label={`${step.label}: ${step.description} ${step.actionLabel}`}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className={cn('flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold', meta.markerClassName)}>
                  {step.status === 'done' ? (
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  ) : step.status === 'active' ? (
                    <CircleDot className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    index + 1
                  )}
                </span>
                <Badge className={cn('hover:bg-current/10', meta.badgeClassName)}>{meta.label}</Badge>
              </div>

              <p className="text-base font-semibold">{step.label}</p>
              <p className="mt-2 flex-1 text-sm leading-5 text-muted-foreground">{step.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                {step.actionLabel}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </button>
          )
        })}
      </div>
    </PageSurface>
  )
}
