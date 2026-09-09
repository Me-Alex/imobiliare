'use client'

import { useRef, useState } from 'react'
import { Check, HelpCircle, Menu, Search, X } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/auth-context'
import { ACCOUNT_ROLE_DEFINITIONS, type AccountRole } from '@/lib/account-roles'
import { getAccountMenuItems, getAccountNavigationGroups } from '@/lib/navigation-config'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/use-app-store'
import type { PageKey } from '@/store/slices/navigation'

export function AccountWorkspaceNav() {
  const { user, profile } = useAuth()
  const { currentPage, navigateTo } = useAppStore()
  if (!user || !profile) return null
  return <AccountWorkspaceNavContent role={profile.role} currentPage={currentPage} onNavigate={navigateTo} />
}

interface AccountWorkspaceNavContentProps {
  role: AccountRole
  currentPage: PageKey
  onNavigate: (page: PageKey) => void
}

export function AccountWorkspaceNavContent({ role, currentPage, onNavigate }: AccountWorkspaceNavContentProps) {
  const items = getAccountMenuItems(role)
  const current = items.find(item => item.page === currentPage)
  const quickPages: PageKey[] = ['dashboard', role === 'OWNER' ? 'proprietatile-mele' : role === 'CLIENT' ? 'vizionarile-mele' : 'crm', 'documente']
  const quickItems = quickPages.map(page => items.find(item => item.page === page)!).filter(Boolean)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const navigationRef = useRef<HTMLElement>(null)
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('ro')
  const search = normalize(query.trim())
  const groups = getAccountNavigationGroups(role).map(group => ({
    ...group,
    items: group.items.filter(item => normalize(item.label + ' ' + item.description).includes(search)),
  })).filter(group => group.items.length > 0)
  const changeOpen = (next: boolean) => { setOpen(next); setQuery('') }
  const navigate = (page: PageKey) => { setOpen(false); onNavigate(page) }

  return <div className="sticky top-16 z-30 border-b bg-background">
    <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
      <nav aria-label="Acces rapid în cont" className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
        {quickItems.map(item => <button key={item.page} type="button" onClick={() => navigate(item.page)} aria-current={currentPage === item.page ? 'page' : undefined} className={cn('flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-lg px-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-4 sm:text-sm', currentPage === item.page ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
          <item.icon className="hidden h-4 w-4 shrink-0 sm:block" />
          <span className="whitespace-nowrap">{item.page === 'dashboard' ? 'Dosare' : item.page === 'proprietatile-mele' ? 'Proprietăți' : item.label}</span>
        </button>)}
      </nav>
      <Sheet open={open} onOpenChange={changeOpen}>
        <SheetTrigger asChild>
          <button type="button" className={cn('flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border px-2 text-sm sm:px-3 font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', open && 'border-primary/40 bg-primary/10 text-primary')} aria-label="Deschide meniul contului">
            <Menu className="hidden h-4 w-4 min-[360px]:block" aria-hidden="true" />
            <span>Meniu</span>
            {current && !quickPages.includes(currentPage) && <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />}
          </button>
        </SheetTrigger>
        <SheetContent ref={panelRef} side="right" className="h-dvh w-full gap-0 sm:max-w-md motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none motion-reduce:transition-none" overlayClassName="motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none" closeLabel="Închide meniul contului" closeButtonClassName="top-3 right-3 flex h-11 w-11 items-center justify-center rounded-lg" onOpenAutoFocus={event => {
          event.preventDefault()
          if (navigationRef.current) navigationRef.current.scrollTop = 0
          panelRef.current?.querySelector<HTMLButtonElement>('[data-slot="sheet-close-button"]')?.focus({ preventScroll: true })
        }}>
          <SheetHeader className="shrink-0 border-b px-5 pb-4 pt-5 pr-16">
            <SheetTitle className="text-lg">Meniul contului</SheetTitle>
            <SheetDescription>{ACCOUNT_ROLE_DEFINITIONS[role].label}{current ? ` · ${current.label}` : ''}</SheetDescription>
          </SheetHeader>
          <div className="relative mx-4 my-4 shrink-0">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input ref={searchRef} type="search" aria-label="Caută o secțiune în cont" placeholder="Caută o secțiune…" value={query} onChange={event => setQuery(event.target.value)} className="h-11 pl-9 pr-11 [&::-webkit-search-cancel-button]:appearance-none" />
            {query && <button type="button" aria-label="Șterge căutarea din meniu" onClick={() => { setQuery(''); searchRef.current?.focus() }} className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-lg focus-visible:outline-ring"><X className="h-4 w-4" /></button>}
          </div>
          <nav ref={navigationRef} aria-label="Secțiunile contului" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4">
            {groups.map(group => <section key={group.label} aria-label={group.label} className="mb-5 last:mb-0">
              <h2 className="px-3 pb-2 text-xs font-semibold text-muted-foreground">{group.label}</h2>
              {group.items.map(item => {
                const active = currentPage === item.page
                return <button key={item.page} type="button" data-page={item.page} onClick={() => navigate(item.page)} aria-current={active ? 'page' : undefined} className={cn('flex min-h-14 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring', active && 'bg-primary/10 text-primary')}>
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1"><span className={cn('block', active && 'font-semibold')}>{item.label}</span><span className="mt-0.5 block text-xs font-normal leading-5 text-muted-foreground">{item.description}</span></span>
                  {active && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                </button>
              })}
            </section>)}
            {groups.length === 0 && <p role="status" className="px-3 py-8 text-center text-sm text-muted-foreground">Nicio secțiune găsită. Încearcă „documente”, „profil” sau șterge căutarea.</p>}
          </nav>
          <div className="shrink-0 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button type="button" className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => { changeOpen(false); useAppStore.getState().setChatOpen(true) }}><HelpCircle className="h-4 w-4" aria-hidden="true" />Ajutor</button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  </div>
}
