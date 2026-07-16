'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  LogOut, Building2, Users, Mail, Bell, BarChart3,
  MessageSquare, ArrowUpRight, ArrowDownRight, Eye, Trash2, RefreshCw,
  Shield, Loader2, TrendingUp, AlertTriangle, CheckCircle2,
  Table2, Search, Filter, Rotate3D
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { PageHero } from '@/components/layout/page-hero'
import { RoleAccessDenied } from '@/components/account/role-access-denied'
import { VirtualTourReviewPanel } from '@/components/admin/virtual-tour-review-panel'

interface DashboardData {
  contacts: Array<{
    id: string; name: string; email: string; phone?: string; message: string; propertyTitle?: string; createdAt: string
  }>
  newsletters: Array<{ id: string; email: string; createdAt: string }>
  alerts: Array<{
    id: string; email: string; zone?: string; propertyType?: string; minPrice?: number; maxPrice?: number; minRooms?: number; active: boolean; createdAt: string
  }>
  properties: Array<{
    id: string; title: string; slug: string; price: number; type: string; transaction: string; status: string; zone: string; createdAt: string
  }>
  stats: {
    totalContacts: number
    totalNewsletters: number
    totalAlerts: number
    totalProperties: number
    activeProperties: number
    soldProperties: number
  }
}

function formatPrice(price: number): string {
  if (price >= 1000000) return `€${(price / 1000000).toFixed(1)}M`
  if (price >= 1000) return `€${(price / 1000).toFixed(0)}K`
  return `€${price}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ro-RO', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function StatCard({ icon: Icon, label, value, trend, color }: {
  icon: React.ElementType; label: string; value: number | string; trend?: 'up' | 'down'; color: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', color)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-2 text-xs">
          {trend === 'up' ? <ArrowUpRight className="h-3 w-3 text-emerald-500" /> : <ArrowDownRight className="h-3 w-3 text-rose-500" />}
          <span className={trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}>
            {trend === 'up' ? '+12%' : '-3%'}
          </span>
          <span className="text-muted-foreground">vs. luna trecuta</span>
        </div>
      )}
    </motion.div>
  )
}

function DataTable<T extends { id: string }>({ data, columns, onDelete, emptyMessage, title, icon: Icon }: {
  data: T[]
  columns: Array<{ key: keyof T | 'actions'; label: string; render?: (item: T) => React.ReactNode }>
  onDelete?: (id: string) => void
  emptyMessage: string
  title: string
  icon: React.ElementType
}) {
  const [search, setSearch] = useState('')
  const filtered = search
    ? data.filter((item) => Object.values(item).some((v) => String(v).toLowerCase().includes(search.toLowerCase())))
    : data

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl overflow-hidden"
    >
      <div className="p-4 border-b border-border/50 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">{title}</h3>
          <Badge variant="secondary" className="text-xs">{data.length}</Badge>
        </div>
        <div className="relative w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Cauta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Icon className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">{emptyMessage}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                {columns.map((col) => (
                  <th key={String(col.key)} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 20).map((item) => (
                <tr key={item.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  {columns.map((col) => {
                    if (col.key === 'actions') {
                      return (
                        <td key="actions" className="px-4 py-2.5">
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => onDelete(item.id)}
                              aria-label="Sterge"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </td>
                      )
                    }
                    return (
                      <td key={String(col.key)} className="px-4 py-2.5 text-xs whitespace-nowrap max-w-[200px] truncate">
                        {col.render ? col.render(item) : String(item[col.key] ?? '')}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  )
}

export function AdminPage() {
  const { user, session, profile, signOut, loading: authLoading } = useAuth()
  const navigateTo = useAppStore((s) => s.navigateTo)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const fetchDashboard = useCallback(async () => {
    if (!session?.access_token) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else if (res.status === 403) {
        toast.error('Contul tau nu are drepturi de administrator')
      } else {
        toast.error('Eroare la incarcarea datelor')
      }
    } catch {
      toast.error('Eroare de conexiune')
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (user && profile?.role === 'ADMIN' && session) {
      const frame = requestAnimationFrame(() => void fetchDashboard())
      return () => cancelAnimationFrame(frame)
    }
  }, [user, profile, session, fetchDashboard])

  useEffect(() => {
    if (!authLoading && !user) navigateTo('login')
  }, [authLoading, user, navigateTo])

  const handleSignOut = async () => {
    await signOut()
    toast.success('Te-ai deconectat')
    navigateTo('acasa')
  }

  // Not logged in — redirect to login
  if (!authLoading && !user) {
    return null
  }

  if (!authLoading && profile && profile.role !== 'ADMIN') {
    return <RoleAccessDenied currentRole={profile.role} allowedRoles={['ADMIN']} />
  }

  if (authLoading || !data) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Se incarca panoul de administrare...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <PageHero
        variant="border"
        icon={Shield}
        title="Panou de Administrare"
        description={`${user?.email ?? 'Administrator'} \u00b7 Ultima actualizare: ${new Date().toLocaleTimeString('ro-RO')}`}
        breadcrumb={[{ label: 'Acasa', page: 'acasa' }, { label: 'Admin' }]}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchDashboard} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4 mr-1.5', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateTo('acasa')}>
            <Building2 className="h-4 w-4 mr-1.5" />
            Site
          </Button>
          <Button variant="destructive" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-1.5" />
            Deconectare
          </Button>
        </div>
      </PageHero>

      {/* Dashboard Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 h-auto flex-wrap">
            <TabsTrigger value="overview" className="gap-1.5">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-1.5">
              <MessageSquare className="h-4 w-4" />
              Contacte
              {data.stats.totalContacts > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-[10px]">{data.stats.totalContacts}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="newsletters" className="gap-1.5">
              <Mail className="h-4 w-4" />
              Newsletter
              {data.stats.totalNewsletters > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-[10px]">{data.stats.totalNewsletters}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-1.5">
              <Bell className="h-4 w-4" />
              Alerte
            </TabsTrigger>
            <TabsTrigger value="properties" className="gap-1.5">
              <Building2 className="h-4 w-4" />
              Proprietati
            </TabsTrigger>
            <TabsTrigger value="virtual-tours" className="gap-1.5">
              <Rotate3D className="h-4 w-4" />
              Tururi virtuale
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard icon={MessageSquare} label="Contacte" value={data.stats.totalContacts} trend="up" color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
              <StatCard icon={Mail} label="Abonati Newsletter" value={data.stats.totalNewsletters} trend="up" color="bg-amber-500/10 text-amber-600 dark:text-amber-400" />
              <StatCard icon={Bell} label="Alerte Active" value={data.stats.totalAlerts} color="bg-rose-500/10 text-rose-600 dark:text-rose-400" />
              <StatCard icon={Building2} label="Total Proprietati" value={data.stats.totalProperties} color="bg-teal-500/10 text-teal-600 dark:text-teal-400" />
              <StatCard icon={CheckCircle2} label="Proprietati Active" value={data.stats.activeProperties} color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
              <StatCard icon={TrendingUp} label="Vanzari" value={data.stats.soldProperties} trend="up" color="bg-violet-500/10 text-violet-600 dark:text-violet-400" />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Contacts */}
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Ultimele Contacte</h3>
                </div>
                {data.contacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Niciun contact inca</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {data.contacts.slice(0, 8).map((c) => (
                      <div key={c.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {c.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{c.name}</span>
                            {c.propertyTitle && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">{c.propertyTitle}</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.message}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDate(c.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Alerts */}
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Ultimele Alerte</h3>
                </div>
                {data.alerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Nicio alerta inca</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {data.alerts.slice(0, 8).map((a) => (
                      <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                          a.active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
                        )}>
                          {a.active ? <Bell className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{a.email}</span>
                            <Badge variant={a.active ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0 shrink-0">
                              {a.active ? 'Activ' : 'Inactiv'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {[a.zone, a.propertyType, a.minPrice ? `de la ${formatPrice(a.minPrice)}` : null, a.maxPrice ? `pana la ${formatPrice(a.maxPrice)}` : null].filter(Boolean).join(' · ') || 'Fara filtre'}
                          </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDate(a.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts">
            <DataTable
              data={data.contacts}
              title="Cereri de Contact"
              icon={MessageSquare}
              emptyMessage="Niciun contact primit inca"
              columns={[
                { key: 'name', label: 'Nume' },
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Telefon', render: (item) => item.phone || '—' },
                { key: 'propertyTitle', label: 'Proprietate', render: (item) => item.propertyTitle || '—' },
                { key: 'message', label: 'Mesaj', render: (item) => (
                  <span className="max-w-[200px] truncate block" title={item.message}>{item.message}</span>
                )},
                { key: 'createdAt', label: 'Data', render: (item) => formatDate(item.createdAt) },
                { key: 'actions', label: '' },
              ]}
            />
          </TabsContent>

          {/* Newsletters Tab */}
          <TabsContent value="newsletters">
            <DataTable
              data={data.newsletters}
              title="Abonati Newsletter"
              icon={Mail}
              emptyMessage="Niciun abonat inca"
              columns={[
                { key: 'email', label: 'Email' },
                { key: 'createdAt', label: 'Data Abonare', render: (item) => formatDate(item.createdAt) },
                { key: 'actions', label: '' },
              ]}
            />
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <DataTable
              data={data.alerts}
              title="Alerte de Pret"
              icon={Bell}
              emptyMessage="Nicio alerta creata inca"
              columns={[
                { key: 'email', label: 'Email' },
                { key: 'zone', label: 'Zona', render: (item) => item.zone || 'Toate' },
                { key: 'propertyType', label: 'Tip', render: (item) => item.propertyType || 'Toate' },
                { key: 'minPrice', label: 'Pret Min', render: (item) => item.minPrice ? formatPrice(item.minPrice) : '—' },
                { key: 'maxPrice', label: 'Pret Max', render: (item) => item.maxPrice ? formatPrice(item.maxPrice) : '—' },
                { key: 'active', label: 'Status', render: (item) => (
                  <Badge variant={item.active ? 'default' : 'secondary'} className="text-[10px]">
                    {item.active ? 'Activ' : 'Inactiv'}
                  </Badge>
                )},
                { key: 'createdAt', label: 'Data', render: (item) => formatDate(item.createdAt) },
                { key: 'actions', label: '' },
              ]}
            />
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties">
            <DataTable
              data={data.properties}
              title="Proprietati"
              icon={Building2}
              emptyMessage="Nicio proprietate inca"
              columns={[
                { key: 'title', label: 'Titlu', render: (item) => (
                  <span className="font-medium max-w-[200px] truncate block">{item.title}</span>
                )},
                { key: 'zone', label: 'Zona' },
                { key: 'type', label: 'Tip', render: (item) => (
                  <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
                )},
                { key: 'transaction', label: 'Tranzactie', render: (item) => (
                  <Badge variant={item.transaction === 'RENT' ? 'secondary' : 'default'} className="text-[10px]">
                    {item.transaction === 'RENT' ? 'Inchiriere' : 'Vanzare'}
                  </Badge>
                )},
                { key: 'price', label: 'Pret', render: (item) => (
                  <span className="font-semibold">{formatPrice(item.price)}</span>
                )},
                { key: 'status', label: 'Status', render: (item) => {
                  const colors: Record<string, string> = { ACTIVE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', SOLD: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', PENDING: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' }
                  return <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', colors[item.status] || 'bg-muted text-muted-foreground')}>{item.status}</span>
                }},
                { key: 'createdAt', label: 'Creat', render: (item) => formatDate(item.createdAt) },
              ]}
            />
          </TabsContent>

          <TabsContent value="virtual-tours">
            <VirtualTourReviewPanel accessToken={session?.access_token || ''} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
