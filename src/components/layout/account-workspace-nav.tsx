'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
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
  const items = getAccountMenuItems(role)
  const current = items.find(item => item.page === currentPage)
  const quickPages: PageKey[] = ['dashboard', role === 'OWNER' ? 'proprietatile-mele' : role === 'CLIENT' ? 'vizionarile-mele' : 'crm', 'documente']
  const quickItems = quickPages.map(page => items.find(item => item.page === page)!).filter(Boolean)
  const [open, setOpen] = useState(false)
  const navigate = (page: PageKey) => { setOpen(false); onNavigate(page) }

  return <div className="sticky top-16 z-30 border-b bg-background">
    <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
      <nav aria-label="Acces rapid în cont" className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
        {quickItems.map(item => <button key={item.page} type="button" onClick={() => navigate(item.page)} aria-current={currentPage === item.page ? 'page' : undefined} className={cn('flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-lg px-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm', currentPage === item.page ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
          <item.icon className="hidden h-4 w-4 shrink-0 sm:block" />
          <span className="truncate">{item.page === 'dashboard' ? 'Dosare' : item.page === 'proprietatile-mele' ? 'Proprietăți' : item.label}</span>
        </button>)}
      </nav>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild><button type="button" className="flex min-h-11 min-w-11 justify-center items-center gap-2 shrink-0 text-sm text-muted-foreground" aria-label="Deschide meniul contului"><Menu className="h-4 w-4" /><span className="hidden sm:inline">{current && !quickPages.includes(currentPage) ? current.label : 'Mai multe'}</span></button></SheetTrigger>
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
