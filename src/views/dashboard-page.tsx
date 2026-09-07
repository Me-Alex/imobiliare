'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, CalendarCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageState } from '@/components/ui/page-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { PageContainer, PageShell } from '@/components/layout'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'
import { fetchDealRooms, type DealRoom } from '@/lib/transaction-workspace'
import { listViewings } from '@/lib/viewing-documents'
import { getAccountTasks } from '@/lib/account-tasks'
import { openDealRoomForViewing, selectDealRoom } from '@/lib/document-navigation'
import type { Vizionare } from '@/lib/types'

export function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const navigateTo = useAppStore(state => state.navigateTo)
  const [viewings, setViewings] = useState<Vizionare[]>([])
  const [rooms, setRooms] = useState<DealRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAll, setShowAll] = useState(false)
  const load = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    setError('')
    try {
      const [visits, deals] = await Promise.all([listViewings(), fetchDealRooms()])
      setViewings(visits)
      setRooms(deals)
    } catch { setError('Activitatea nu a putut fi încărcată.') }
    finally { setLoading(false) }
  }, [user])
  useEffect(() => { void load() }, [load])
  const openViewing = (id: string) => {
    navigateTo('vizionarile-mele')
    const url = new URL(window.location.href)
    url.searchParams.set('appointment', id)
    window.history.replaceState(window.history.state, '', url)
  }
  if (authLoading || loading) return <PageShell><PageContainer className="py-8"><PageState tone="loading" title="Încărcăm activitatea" /></PageContainer></PageShell>
  if (!user || !profile) return <PageShell><PageContainer className="py-8"><PageState title="Intră în cont" action={<Button onClick={() => navigateTo('login')}>Autentificare</Button>} /></PageContainer></PageShell>
  const tasks = getAccountTasks(viewings, rooms, profile.role, user.id)
  const upcoming = viewings.filter(v => ['pending', 'confirmed', 'checked_in'].includes(v.status) && !tasks.some(task => task.id === v.id))
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)).slice(0, 3)
  const start = profile.role === 'CLIENT' ? { page: 'proprietati' as const, label: 'Caută o proprietate' }
    : profile.role === 'OWNER' ? { page: 'proprietatile-mele' as const, label: 'Vezi proprietățile tale' }
      : { page: 'crm' as const, label: 'Vezi solicitările clienților' }
  return <PageShell><PageContainer width="narrow" className="space-y-10 py-8">
    <header><h1 className="text-2xl font-semibold">Bună, {profile.fullName.split(' ')[0]}</h1><p className="mt-2 text-sm text-muted-foreground">Activitatea ta, într-un singur loc.</p></header>
    {error ? <div role="alert"><p>{error}</p><Button variant="outline" className="mt-3" onClick={() => void load()}>Încearcă din nou</Button></div> : <>
      <section aria-label="De făcut">
        <h2 className="text-lg font-semibold">De făcut{tasks.length ? ` · ${tasks.length}` : ''}</h2>
        {tasks.length ? <div className="mt-3 divide-y border-y">
          {(showAll ? tasks : tasks.slice(0, 5)).map(task => <button key={task.id} type="button" className="flex min-h-20 w-full items-center justify-between gap-4 py-4 text-left hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => {
            if (task.dealId && task.appointmentId) openDealRoomForViewing(navigateTo, task.appointmentId, task.dealId)
            else if (task.dealId) { navigateTo('deal-room'); selectDealRoom(task.dealId, null) }
            else if (task.appointmentId) openViewing(task.appointmentId)
          }}><span><span className="block font-medium">{task.title}</span><span className="mt-1 block text-sm text-muted-foreground">{task.property}</span></span><ArrowRight className="h-4 w-4 shrink-0" /></button>)}
        </div> : <div className="mt-3"><p className="text-muted-foreground">Nu ai acțiuni în așteptare.</p><Button variant="outline" className="mt-4" onClick={() => navigateTo(start.page)}>{start.label}</Button></div>}
        {tasks.length > 5 && <Button variant="ghost" className="mt-2" onClick={() => setShowAll(!showAll)}>{showAll ? 'Arată mai puține' : 'Vezi toate acțiunile'}</Button>}
      </section>
      <section aria-label="Programări deschise">
        <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Programări deschise</h2><Button variant="ghost" size="sm" onClick={() => navigateTo('vizionarile-mele')}>Vezi toate</Button></div>
        {upcoming.length ? <div className="mt-3 divide-y border-y">{upcoming.map(v => <button key={v.id} onClick={() => openViewing(v.id)} className="flex min-h-20 w-full items-center gap-3 py-4 text-left hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><CalendarCheck className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1"><span className="block font-medium">{v.propertyTitle}</span><span className="mt-1 block text-sm text-muted-foreground">{new Date(v.date + 'T00:00:00').toLocaleDateString('ro-RO')} · {v.startTime}</span></span><StatusBadge status={v.status} /></button>)}</div> : <p className="mt-3 text-sm text-muted-foreground">Nu ai programări în acest moment.</p>}
      </section>
    </>}
  </PageContainer></PageShell>
}
