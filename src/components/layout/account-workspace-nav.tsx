'use client'

import { Check, ChevronDown, LayoutGrid } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/auth-context'
import { ACCOUNT_ROLE_DEFINITIONS, type AccountRole } from '@/lib/account-roles'
import { getAccountMenuItems, getWorkspaceNavigation } from '@/lib/navigation-config'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/use-app-store'
import type { PageKey } from '@/store/slices/navigation'

export function AccountWorkspaceNav() {
  const { user, profile } = useAuth()
  const { currentPage, navigateTo } = useAppStore()

  if (!user || !profile) return null

  return (
    <AccountWorkspaceNavContent
      role={profile.role}
      currentPage={currentPage}
      onNavigate={navigateTo}
    />
  )
}

interface AccountWorkspaceNavContentProps {
  role: AccountRole
  currentPage: PageKey
  onNavigate: (page: PageKey) => void
}

export function AccountWorkspaceNavContent({
  role,
  currentPage,
  onNavigate,
}: AccountWorkspaceNavContentProps) {
  const items = getWorkspaceNavigation(role)
  const menuItems = getAccountMenuItems(role)
  const itemPages = new Set(items.map((item) => item.page))
  const overflowItems = menuItems.filter((item) => !itemPages.has(item.page))
  const currentItem = menuItems.find((item) => item.page === currentPage)
  const CurrentIcon = currentItem?.icon ?? LayoutGrid
  const currentIsOverflow = overflowItems.some((item) => item.page === currentPage)

  return (
    <nav
      aria-label="Spațiul contului"
      className="sticky top-16 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85"
    >
      <div className="mx-auto flex min-h-12 max-w-7xl items-center gap-3 px-4 py-1.5 sm:px-6 sm:py-0 lg:px-8">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-10 w-full min-w-0 items-center gap-3 rounded-xl border bg-card px-3 text-left shadow-sm sm:hidden"
              aria-label={`Secțiunea curentă: ${currentItem?.label ?? 'Spațiul meu'}`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CurrentIcon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{currentItem?.label ?? 'Spațiul meu'}</span>
                <span className="block truncate text-[10px] text-muted-foreground">
                  {currentItem?.description ?? ACCOUNT_ROLE_DEFINITIONS[role].description}
                </span>
              </span>
              <Badge variant="secondary" className="shrink-0 text-[9px]">
                {ACCOUNT_ROLE_DEFINITIONS[role].label}
              </Badge>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[calc(100vw-2rem)] max-w-sm">
            <DropdownMenuLabel>
              <span className="block text-xs font-semibold">Spațiul contului</span>
              <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">
                Alege ce vrei să rezolvi acum.
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = currentPage === item.page
              return (
                <DropdownMenuItem
                  key={item.page}
                  onClick={() => onNavigate(item.page)}
                  aria-current={active ? 'page' : undefined}
                  className="gap-3 py-2.5"
                >
                  <span className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{item.label}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{item.description}</span>
                  </span>
                  {active ? <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> : null}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="hidden shrink-0 items-center gap-2 border-r pr-4 xl:flex">
          <span className="text-xs font-semibold text-muted-foreground">Spațiul meu</span>
          <Badge variant="secondary" className="text-[10px]">
            {ACCOUNT_ROLE_DEFINITIONS[role].label}
          </Badge>
        </div>

        <div className="scroll-horizontal hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto py-1 sm:flex">
          {items.map((item) => {
            const Icon = item.icon
            const active = currentPage === item.page
            return (
              <button
                key={item.page}
                type="button"
                onClick={() => onNavigate(item.page)}
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

          {overflowItems.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-medium transition-colors sm:text-sm',
                    currentIsOverflow
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                  aria-current={currentIsOverflow ? 'page' : undefined}
                >
                  <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                  {currentIsOverflow ? currentItem?.label : 'Mai multe'}
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Alte secțiuni ale contului</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {overflowItems.map((item) => {
                  const Icon = item.icon
                  const active = currentPage === item.page
                  return (
                    <DropdownMenuItem
                      key={item.page}
                      onClick={() => onNavigate(item.page)}
                      aria-current={active ? 'page' : undefined}
                      className="gap-3 py-2.5"
                    >
                      <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{item.label}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">{item.description}</span>
                      </span>
                      {active ? <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> : null}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
    </nav>
  )
}
