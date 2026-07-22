'use client'

import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import { ACCOUNT_ROLE_DEFINITIONS } from '@/lib/account-roles'
import { getWorkspaceNavigation } from '@/lib/navigation-config'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/use-app-store'

export function AccountWorkspaceNav() {
  const { user, profile } = useAuth()
  const { currentPage, navigateTo } = useAppStore()

  if (!user || !profile) return null

  const items = getWorkspaceNavigation(profile.role)

  return (
    <nav
      aria-label="Spațiul contului"
      className="sticky top-16 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85"
    >
      <div className="mx-auto flex h-12 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="hidden shrink-0 items-center gap-2 border-r pr-4 xl:flex">
          <span className="text-xs font-semibold text-muted-foreground">Spațiul meu</span>
          <Badge variant="secondary" className="text-[10px]">
            {ACCOUNT_ROLE_DEFINITIONS[profile.role].label}
          </Badge>
        </div>

        <div className="scroll-horizontal flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-1">
          {items.map((item) => {
            const Icon = item.icon
            const active = currentPage === item.page
            return (
              <button
                key={item.page}
                type="button"
                onClick={() => navigateTo(item.page)}
                aria-current={active ? 'page' : undefined}
                title={item.description}
                className={cn(
                  'inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-medium transition-colors sm:text-sm',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
