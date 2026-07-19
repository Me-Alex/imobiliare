'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
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
import { useAppStore, type PageKey } from '@/store/use-app-store'
import { loadFromLS } from '@/lib/storage'
import { LS_KEYS } from '@/lib/constants'
import type { Vizionare, UserProperty, UploadedDocument } from '@/lib/types'
import {
  ACCOUNT_ROLE_DEFINITIONS,
  type AccountRole,
} from '@/lib/account-roles'

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
}

function getActions(role: AccountRole): DashboardAction[] {
  if (role === 'OWNER') {
    return [
      { label: 'Performanta proprietatii', description: 'Vezi interesul, feedbackul si pretul', page: 'owner-dashboard', icon: BarChart3 },
      { label: 'Deal Room', description: 'Urmareste tranzactiile active', page: 'deal-room', icon: BriefcaseBusiness },
      { label: 'Dosar documente', description: 'Completeaza, incarca si semneaza intr-un singur loc', page: 'documente', icon: FileText },
      { label: 'Solicitari si vizionari', description: 'Urmareste interesul clientilor', page: 'vizionarile-mele', icon: CalendarCheck },
    ]
  }

  if (role === 'AGENT') {
    return [
      { label: 'CRM agent', description: 'Lead-uri, follow-up-uri si conversie', page: 'crm', icon: Users },
      { label: 'Deal Room', description: 'Coordoneaza tranzactiile active', page: 'deal-room', icon: BriefcaseBusiness },
      { label: 'Dosare de rezolvat', description: 'Verifica, genereaza si urmareste semnaturile', page: 'documente', icon: FileText },
      { label: 'Agenda mea', description: 'Configureaza disponibilitatea', page: 'disponibilitate-staff', icon: CalendarCheck },
    ]
  }

  if (role === 'ADMIN') {
    return [
      { label: 'Panou administrare', description: 'Utilizatori, continut si rapoarte', page: 'admin', icon: ShieldCheck },
      { label: 'CRM si repartizare', description: 'Pipeline si alocare automata lead-uri', page: 'crm', icon: Users },
      { label: 'Deal Rooms', description: 'Auditul tuturor tranzactiilor', page: 'deal-room', icon: BriefcaseBusiness },
      { label: 'Blocaje documente', description: 'Rezolva verificari, versiuni si semnaturi', page: 'documente', icon: FileText },
    ]
  }

  return [
    { label: 'Cauta proprietati', description: 'Descopera ofertele disponibile', page: 'proprietati', icon: Search },
    { label: 'Programeaza vizionare', description: 'Alege proprietatea si intervalul', page: 'programare-vizionare', icon: CalendarCheck },
    { label: 'Deal Room', description: 'Vizionari, oferte si documente intr-un loc', page: 'deal-room', icon: BriefcaseBusiness },
    { label: 'Dosarul meu', description: 'Vezi imediat ce lipseste si ce ai de semnat', page: 'documente', icon: FileText },
  ]
}

export function DashboardPage() {
  const { user, profile, loading } = useAuth()
  const navigateTo = useAppStore((state) => state.navigateTo)
  const favorites = useAppStore((state) => state.favorites)

  const properties = useMemo(() => loadFromLS<UserProperty[]>(LS_KEYS.USER_PROPERTIES, []), [])
  const vizionari = useMemo(() => loadFromLS<Vizionare[]>(LS_KEYS.VIZIONARI, []), [])
  const documents = useMemo(() => loadFromLS<UploadedDocument[]>(LS_KEYS.DOCUMENTS, []), [])
  const savedSearches = useMemo(() => loadFromLS<Array<{ id: string }>>(LS_KEYS.SAVED_SEARCHES, []), [])
  const activeVizionari = vizionari.filter((item) => ['pending', 'confirmed', 'checked_in'].includes(item.status))

  if (loading) {
    return <div className="min-h-[calc(100vh-10rem)] animate-pulse bg-muted/10" />
  }

  if (!user || !profile) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
        <div className="text-center space-y-4">
          <Eye className="mx-auto h-10 w-10 text-primary" />
          <h2 className="text-xl font-bold">Autentifica-te</h2>
          <p className="text-sm text-muted-foreground">Dashboard-ul este disponibil dupa autentificare.</p>
          <Button onClick={() => navigateTo('login')}>Autentifica-te</Button>
        </div>
      </div>
    )
  }

  const role = profile.role
  const roleDefinition = ACCOUNT_ROLE_DEFINITIONS[role]
  const actions = getActions(role)

  const stats: DashboardStat[] = role === 'CLIENT'
    ? [
        { label: 'Favorite', value: favorites.length, icon: Heart, color: 'text-rose-600 bg-rose-100 dark:bg-rose-900/30' },
        { label: 'Vizionari active', value: activeVizionari.length, icon: CalendarCheck, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
        { label: 'Documente', value: documents.length, icon: FileText, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
        { label: 'Cautari salvate', value: savedSearches.length, icon: Search, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
      ]
    : role === 'OWNER'
      ? [
          { label: 'Proprietati proprii', value: properties.length, icon: Building2, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
          { label: 'Solicitari active', value: activeVizionari.length, icon: CalendarCheck, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
          { label: 'Documente', value: documents.length, icon: FileText, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
          { label: 'Vizualizari', value: 0, icon: Eye, color: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30' },
        ]
      : role === 'AGENT'
        ? [
            { label: 'Portofoliu', value: properties.length, icon: Building2, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
            { label: 'Vizionari alocate', value: activeVizionari.length, icon: CalendarCheck, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
            { label: 'Documente clienti', value: documents.length, icon: FileText, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
            { label: 'Lead-uri active', value: 0, icon: Users, color: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30' },
          ]
        : [
            { label: 'Proprietati locale', value: properties.length, icon: Building2, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
            { label: 'Vizionari', value: vizionari.length, icon: CalendarCheck, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
            { label: 'Documente', value: documents.length, icon: FileText, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
            { label: 'Module active', value: 4, icon: Settings, color: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30' },
          ]

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
              Bine ai venit, {profile.fullName}!
            </h1>
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{roleDefinition.label}</Badge>
          </div>
          <p className="mt-2 max-w-2xl text-muted-foreground">{roleDefinition.description}</p>
        </motion.div>

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="glass-card rounded-2xl p-5"
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Instrumentele contului tau</h2>
              <p className="text-sm text-muted-foreground">Actiunile sunt adaptate profilului {roleDefinition.label.toLowerCase()}.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {actions.map((action) => (
              <button
                key={`${action.page}-${action.label}`}
                type="button"
                onClick={() => navigateTo(action.page)}
                className="glass-card group rounded-2xl p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30"
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
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card rounded-2xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <CalendarCheck className="h-5 w-5 text-primary" />
                {role === 'AGENT' ? 'Agenda de vizionari' : role === 'OWNER' ? 'Solicitari recente' : 'Vizionari viitoare'}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigateTo('vizionarile-mele')}>Vezi toate</Button>
            </div>
            {activeVizionari.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <CalendarCheck className="mx-auto mb-2 h-9 w-9 opacity-30" />
                Nu exista vizionari active.
              </div>
            ) : (
              <div className="space-y-3">
                {activeVizionari.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
                    <CalendarCheck className="h-5 w-5 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.propertyTitle}</p>
                      <p className="text-xs text-muted-foreground">{item.date} · {item.startTime}</p>
                    </div>
                    <Badge variant="secondary">{item.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              {role === 'CLIENT' ? <Heart className="h-5 w-5 text-primary" /> : <Building2 className="h-5 w-5 text-primary" />}
              {role === 'CLIENT' ? 'Experienta ta de cautare' : 'Portofoliu si responsabilitati'}
            </h2>
            <div className="space-y-3">
              {roleDefinition.features.map((feature) => (
                <div key={feature} className="flex items-start gap-3 rounded-xl bg-muted/30 p-3 text-sm">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
