'use client'

import { useState } from 'react'
import { Menu, ChevronRight } from 'lucide-react'
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
  const current = getAccountMenuItems(role).find(item => item.page === currentPage)
  const [open, setOpen] = useState(false)
  const navigate = (page: PageKey) => { setOpen(false); onNavigate(page) }

  return <div className="sticky top-16 z-30 border-b bg-background">
    <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-2"><button type="button" className="min-h-11 shrink-0 text-sm font-medium hover:text-primary" onClick={() => navigate('dashboard')} aria-current={currentPage === 'dashboard' ? 'page' : undefined}>Dosarele mele</button>{currentPage !== 'dashboard' && <><ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="truncate text-sm text-muted-foreground" aria-current="page">{current?.label}</span></>}</div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild><button type="button" className="flex min-h-11 items-center gap-2 shrink-0 text-sm text-muted-foreground" aria-label="Deschide meniul contului"><Menu className="h-4 w-4" /><span className="hidden sm:inline">Meniul contului</span><span className="sm:hidden">Meniu</span></button></SheetTrigger>
        <SheetContent side="right" className="w-[min(24rem,100vw-1rem)] gap-0">
          <SheetHeader className="border-b p-5"><SheetTitle>Meniul contului</SheetTitle><SheetDescription>{ACCOUNT_ROLE_DEFINITIONS[role].label}</SheetDescription></SheetHeader>
          <nav aria-label="Secțiunile contului" className="min-h-0 flex-1 overflow-y-auto p-3">
            {getAccountNavigationGroups(role).filter(group => group.items.length > 0).map(group => <div key={group.label} className="mb-5"><p className="px-3 pb-2 text-xs font-medium text-muted-foreground">{group.label}</p>{group.items.map(item => <button key={item.page} type="button" data-page={item.page} onClick={() => navigate(item.page)} aria-current={currentPage === item.page ? 'page' : undefined} className={cn('flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted', currentPage === item.page && 'bg-muted font-semibold')}>
              <item.icon className="h-4 w-4 shrink-0" /><span><span className="block">{item.label}</span><span className="mt-0.5 block text-xs font-normal text-muted-foreground">{item.description}</span></span>
            </button>)}</div>)}
            <button className="mt-4 min-h-11 px-3 text-sm" onClick={() => { setOpen(false); useAppStore.getState().setChatOpen(true) }}>Ajutor</button>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  </div>
}
