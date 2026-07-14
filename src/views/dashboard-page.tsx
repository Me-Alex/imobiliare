'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Building2, CalendarCheck, FileText, Eye, Plus, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { ActivityTimeline } from '@/components/features/activity-timeline'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'
import { loadFromLS } from '@/lib/storage'
import { LS_KEYS } from '@/lib/constants'
import type { Vizionare, UserProperty, UploadedDocument } from '@/lib/types'

export function DashboardPage() {
  const { user } = useAuth()
  const navigateTo = useAppStore((s) => s.navigateTo)

  const properties = useMemo(() => loadFromLS<UserProperty[]>(LS_KEYS.USER_PROPERTIES, []), [])
  const vizionari = useMemo(() => loadFromLS<Array<Vizionare>>(LS_KEYS.VIZIONARI, []), [])
  const documents = useMemo(() => loadFromLS<Array<UploadedDocument>>(LS_KEYS.DOCUMENTS, []), [])

  const activeVizionari = vizionari.filter(v => v.status === 'pending' || v.status === 'confirmed')

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-12 px-4">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Eye className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold">Autentifica-te</h2>
          <p className="text-sm text-muted-foreground">Trebuie sa fii autentificat pentru a accesa dashboard-ul.</p>
          <Button onClick={() => navigateTo('login')}>Autentifica-te</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Bine ai venit, {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilizator'}!
          </h1>
          <p className="text-muted-foreground mt-1">Iata un rezumat al activitatii tale.</p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Button onClick={() => navigateTo('adauga-proprietate')} className="gap-2">
              <Plus className="h-4 w-4" /> Adauga Proprietate
            </Button>
            <Button variant="outline" onClick={() => navigateTo('programare-vizionare')} className="gap-2">
              <CalendarCheck className="h-4 w-4" /> Programeaza Vizionare
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Proprietati', value: properties.length, icon: Building2, color: 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30' },
            { label: 'Vizionari Active', value: activeVizionari.length, icon: CalendarCheck, color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30' },
            { label: 'Documente', value: documents.length, icon: FileText, color: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30' },
            { label: 'Vizualizari', value: 0, icon: Eye, color: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Two Column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Vizionari */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-primary" />
                Vizionari Viitoare
              </h2>
              {activeVizionari.length > 0 && (
                <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigateTo('vizionarile-mele')}>
                  Vezi toate <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </div>
            {activeVizionari.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarCheck className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nicio vizionare programata</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => navigateTo('programare-vizionare')}>
                  Programeaza acum
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {activeVizionari.slice(0, 3).map((v) => (
                  <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      <CalendarCheck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{v.propertyTitle}</p>
                      <p className="text-xs text-muted-foreground">{v.staffName} · {v.date} {v.startTime}</p>
                    </div>
                    <Badge variant={v.status === 'confirmed' ? 'default' : 'secondary'} className="text-[10px]">
                      {v.status === 'confirmed' ? 'Confirmata' : 'In asteptare'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Recent Properties */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Proprietatile Mele
              </h2>
              {properties.length > 0 && (
                <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigateTo('adauga-proprietate')}>
                  Vezi toate <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </div>
            {properties.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nu ai publicat nicio proprietate</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => navigateTo('adauga-proprietate')}>
                  Adauga prima proprietate
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {properties.slice(-3).reverse().map((prop) => (
                  <div key={prop.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="h-12 w-12 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 overflow-hidden">
                      {prop.cover_url ? (
                        <img src={prop.cover_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Building2 className="h-5 w-5 text-primary/50" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{prop.title}</p>
                      <p className="text-xs text-muted-foreground">{prop.zone ?? ''}{prop.sector ? `, ${prop.sector}` : ''}</p>
                      <span className="text-sm font-semibold text-primary">
                        {Number(prop.price ?? 0).toLocaleString('ro-RO')} {prop.currency ?? ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity Timeline — full width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <ActivityTimeline
            onViewAll={() => toast.info('Toata activitatea — in curand disponibila!')}
          />
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t py-6 text-center text-sm text-muted-foreground">
        © 2025 HQS Imobiliare. Toate drepturile rezervate.
      </footer>
    </div>
  )
}