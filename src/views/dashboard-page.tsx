'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageState } from '@/components/ui/page-state'
import { PageContainer, PageShell } from '@/components/layout'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'
import { fetchDealRooms, type DealRoom } from '@/lib/transaction-workspace'
import { listViewings } from '@/lib/viewing-documents'
import { getAccountCases, groupAccountCases, type AccountCase } from '@/lib/account-cases'
import { Input } from '@/components/ui/input'
import { openDealRoomForViewing, selectDealRoom } from '@/lib/document-navigation'
import type { Vizionare } from '@/lib/types'

export function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const navigateTo = useAppStore(state => state.navigateTo)
  const [viewings, setViewings] = useState<Vizionare[]>([])
  const [rooms, setRooms] = useState<DealRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
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
  const cases = getAccountCases(viewings, rooms, profile.role, user.id)
  const matches = (item: AccountCase) => `${item.title} ${item.person}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .includes(search.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim())
  const active = cases.filter(item => !item.closed && matches(item))
  const closed = cases.filter(item => item.closed && matches(item))
  const start = profile.role === 'CLIENT' ? { page: 'proprietati' as const, label: 'Caută o proprietate' }
    : profile.role === 'OWNER' ? { page: 'proprietatile-mele' as const, label: 'Proprietățile tale' }
      : { page: 'crm' as const, label: 'Clienți și solicitări' }
  const renderCase = (item: AccountCase, showTitle = true) => <button key={item.id} aria-label={`${item.title}: ${item.status}`} data-case-id={item.id} type="button" className="flex min-h-24 w-full items-center justify-between gap-4 border-b py-5 text-left hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => {
    if (item.target === 'viewing' && item.appointmentId) openViewing(item.appointmentId)
    else if (item.dealId && item.appointmentId) openDealRoomForViewing(navigateTo, item.appointmentId, item.dealId)
    else if (item.dealId) { navigateTo('deal-room'); selectDealRoom(item.dealId, null) }
  }}><span className="min-w-0">{showTitle && <span className="block font-semibold">{item.title}</span>}
    {item.person && profile.role !== 'CLIENT' && <span className="mt-1 block text-xs text-muted-foreground">{item.person}</span>}
    {item.detail && <span className="mt-1 block text-xs text-muted-foreground">{item.detail}</span>}
    <span className="mt-2 block text-sm text-muted-foreground">{item.status}</span>
    <span className="mt-2 block text-sm font-medium text-primary">{item.actionLabel}</span>
  </span><ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></button>
  return <PageShell><PageContainer width="narrow" className="py-8">
    <header className="mb-7 flex flex-wrap items-center justify-between gap-4"><h1 className="text-2xl font-semibold">Dosarele mele</h1><Button variant="outline" onClick={() => navigateTo(start.page)}>{start.label}</Button></header>
    {error ? <div role="alert"><p>{error}</p><Button variant="outline" className="mt-3" onClick={() => void load()}>Încearcă din nou</Button></div> : <>
      {cases.length > 4 && <Input aria-label="Caută un dosar" value={search} onChange={event => setSearch(event.target.value)} placeholder="Caută după proprietate sau client" className="mb-4" />}
      <section aria-label="Dosare în lucru">{groupAccountCases(active).map(group => <article key={group.id} className="mb-6">
        <h2 className="text-lg font-semibold">{group.title}</h2>
        {renderCase(group.cases[0], false)}
        {group.cases.length > 1 && <details className="mt-2"><summary className="cursor-pointer py-3 text-sm text-muted-foreground">Alte programări și dosare · {group.cases.length - 1}</summary>{group.cases.slice(1).map(item => renderCase(item, false))}</details>}
      </article>)}
        {!active.length && <p className="py-7 text-muted-foreground">{search ? 'Niciun dosar pentru această căutare.' : 'Nu ai dosare în lucru.'}</p>}
      </section>
      {closed.length > 0 && <details className="mt-6"><summary className="cursor-pointer py-3 text-sm text-muted-foreground">Dosare închise · {closed.length}</summary>{closed.map(item => renderCase(item))}</details>}
    </>}
  </PageContainer></PageShell>
}
