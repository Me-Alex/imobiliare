'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/contexts/auth-context'
import { ACCOUNT_ROLE_DEFINITIONS, type AccountRole } from '@/lib/account-roles'
import { getAccountMenuItems } from '@/lib/navigation-config'
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
  const navigate = (page: PageKey) => { setOpen(false); onNavigate(page) }

  return <div className="sticky top-16 z-30 border-b bg-background">
    <div className="mx-auto flex min-h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
      <button type="button" className="min-h-11 text-sm font-medium hover:text-primary" onClick={() => navigate('dashboard')} aria-current={currentPage === 'dashboard' ? 'page' : undefined}>Dosarele mele</button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild><button type="button" className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground" aria-label="Deschide meniul contului"><Menu className="h-4 w-4" />Instrumente și cont</button></SheetTrigger>
        <SheetContent side="right" className="w-[min(24rem,100vw-1rem)] gap-0">
          <SheetHeader className="border-b p-5"><SheetTitle>Instrumente și cont</SheetTitle><SheetDescription>{ACCOUNT_ROLE_DEFINITIONS[role].label}</SheetDescription></SheetHeader>
          <nav aria-label="Secțiunile contului" className="min-h-0 flex-1 overflow-y-auto p-3">
            {getAccountMenuItems(role).map(item => <button key={item.page} type="button" data-page={item.page} onClick={() => navigate(item.page)} aria-current={currentPage === item.page ? 'page' : undefined} className={cn('flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted', currentPage === item.page && 'bg-muted font-semibold')}>
              <item.icon className="h-4 w-4" /><span>{item.label}</span>
            </button>)}
            <button className="mt-4 min-h-11 px-3 text-sm" onClick={() => { setOpen(false); useAppStore.getState().setChatOpen(true) }}>Ajutor</button>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  </div>
}
