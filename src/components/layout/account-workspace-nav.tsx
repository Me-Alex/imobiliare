'use client'

import { useState } from 'react'
import { Check, Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
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
  const [open, setOpen] = useState(false)
  const groups = getAccountNavigationGroups(role)
  const currentItem = getAccountMenuItems(role).find(item => item.page === currentPage)
  const navigate = (page: PageKey) => { setOpen(false); onNavigate(page) }
  const sections = (mobile: boolean) => (
    <nav aria-label={mobile ? 'Secțiunile contului' : 'Spațiul contului'} className="space-y-5">
      {groups.map(group => (
        <details key={group.label} open={group.label === 'Activitate' || group.items.some(item => item.page === currentPage)} className="group">
          <summary className={cn('mb-2 cursor-pointer px-3 py-2 text-sm text-muted-foreground', group.label === 'Activitate' && 'hidden')}>{group.label}</summary>
          <div className="space-y-1">
            {group.items.map(item => {
              const active = currentPage === item.page
              const Icon = item.icon
              return <button key={item.page} data-page={item.page} type="button" onClick={() => navigate(item.page)}
                aria-current={active ? 'page' : undefined}
                className={cn('flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', active ? 'bg-primary/10 font-semibold text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1">{item.label}</span>
                {active && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
              </button>
            })}
          </div>
        </details>
      ))}
      <button type="button" className="min-h-11 px-3 text-sm text-muted-foreground hover:text-foreground" onClick={() => { setOpen(false); useAppStore.getState().setChatOpen(true) }}>Ajutor</button>
    </nav>
  )
  return <>
    <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-60 shrink-0 self-start overflow-y-auto border-r bg-background px-3 py-6 xl:block">
      <div className="mb-6 px-3"><p className="font-semibold">Spațiul meu</p><p className="mt-1 text-sm text-muted-foreground">{ACCOUNT_ROLE_DEFINITIONS[role].label}</p></div>
      {sections(false)}
    </aside>
    <div className="sticky top-16 z-30 border-b bg-background px-4 py-2 sm:px-6 xl:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button type="button" className="flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Deschide meniul contului">
            <Menu className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate font-medium">{currentItem?.label ?? 'Spațiul meu'}</span>
            <span className="text-sm text-muted-foreground">Meniu cont</span>
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[min(24rem,100vw-1rem)] gap-0">
          <SheetHeader className="border-b p-5"><SheetTitle>Spațiul meu</SheetTitle><SheetDescription>{ACCOUNT_ROLE_DEFINITIONS[role].label} · Alege o secțiune</SheetDescription></SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto p-3 pb-8">{sections(true)}</div>
        </SheetContent>
      </Sheet>
    </div>
  </>
}
