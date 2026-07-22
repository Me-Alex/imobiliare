'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Bell, BellRing, Bookmark, Building2, CircleDollarSign, Heart, LogIn, LogOut, Menu, Moon, Plus, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { useAppStore, type PageKey } from '@/store/use-app-store'
import { useAuth } from '@/contexts/auth-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { LS_KEYS } from '@/lib/constants'
import { ACCOUNT_ROLE_DEFINITIONS, type AccountRole } from '@/lib/account-roles'
import { getAccountMenuItems, getWorkspaceNavigation, isAccountWorkspacePage, PUBLIC_NAVIGATION } from '@/lib/navigation-config'

function NotificationsBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const update = () => {
      try {
        const raw = localStorage.getItem(LS_KEYS.NOTIFICATIONS)
        const notifs = raw ? JSON.parse(raw) : []
        setCount(Array.isArray(notifs) ? notifs.filter((n: { read: boolean }) => !n.read).length : 0)
      } catch {
        setCount(0)
      }
    }
    update()
    window.addEventListener('hqs-notifications-updated', update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener('hqs-notifications-updated', update)
      window.removeEventListener('storage', update)
    }
  }, [])

  if (count === 0) return null
  return (
    <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center bg-red-500 text-white border-0 animate-pulse">
      {count > 9 ? '9+' : count}
    </Badge>
  )
}

interface SiteHeaderProps {
  onOpenFavorites?: () => void
  onOpenPriceAlerts?: () => void
  onOpenNotifications?: () => void
  onOpenSavedSearches?: () => void
}

export function SiteHeader({ onOpenFavorites, onOpenPriceAlerts, onOpenNotifications, onOpenSavedSearches }: SiteHeaderProps) {
  const [savedSearchCount, setSavedSearchCount] = useState(0)

  useEffect(() => {
    const update = () => {
      try {
        const raw = localStorage.getItem(LS_KEYS.SAVED_SEARCHES)
        const searches = raw ? JSON.parse(raw) : []
        setSavedSearchCount(Array.isArray(searches) ? searches.length : 0)
      } catch {
        setSavedSearchCount(0)
      }
    }
    update()
    window.addEventListener('pm-saved-searches-updated', update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener('pm-saved-searches-updated', update)
      window.removeEventListener('storage', update)
    }
  }, [])
  const { setTheme, resolvedTheme } = useTheme()
  const { favorites, currentPage, navigateTo, balance: coinBalance } = useAppStore()
  const { user, profile, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const accountRole = profile?.role ?? 'CLIENT'
  const roleDefinition = ACCOUNT_ROLE_DEFINITIONS[accountRole]
  const accountMenuItems = getAccountMenuItems(accountRole)
  const workspacePages = new Set(getWorkspaceNavigation(accountRole).map((item) => item.page))
  const visibleAccountMenuItems = isAccountWorkspacePage(currentPage)
    ? accountMenuItems.filter((item) => !workspacePages.has(item.page))
    : accountMenuItems

  const handleAuthClick = () => {
    if (user) {
      navigateTo('dashboard')
    } else {
      navigateTo('login')
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigateTo('acasa')
  }

  const handleMobileNav = (page: PageKey) => {
    navigateTo(page)
    setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <button
          onClick={() => navigateTo('acasa')}
          className="flex items-center gap-2 group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            HQS <span className="gradient-text">Imobiliare</span>
          </span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden xl:flex items-center gap-1" aria-label="Navigare principală">
          {PUBLIC_NAVIGATION.map((item) => {
            const isActive = currentPage === item.page || (currentPage === 'proprietate' && item.page === 'proprietati')
            return (
              <button
                key={item.page}
                onClick={() => navigateTo(item.page)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 relative',
                  isActive
                    ? 'text-foreground bg-accent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-primary" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Saved Searches */}
          <Button variant="ghost" size="icon" className="relative hidden lg:inline-flex" aria-label="Căutări salvate" onClick={onOpenSavedSearches}>
            <Bookmark className="h-5 w-5" />
            {savedSearchCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center bg-primary text-primary-foreground border-0">
                {savedSearchCount > 9 ? '9+' : savedSearchCount}
              </Badge>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative hidden lg:inline-flex"
            aria-label="Alerte de preț"
            onClick={onOpenPriceAlerts}
          >
            <BellRing className="h-5 w-5" />
          </Button>

          {/* Coins — navigates to full page */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="HQS Monede"
            onClick={() => navigateTo('monede')}
          >
            <CircleDollarSign className="h-5 w-5 text-amber-500" />
            {user && coinBalance > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center bg-amber-500 text-white border-0">
                {coinBalance > 999 ? '999+' : coinBalance}
              </Badge>
            )}
          </Button>

          {/* Favorites */}
          <Button variant="ghost" size="icon" className="relative hidden lg:inline-flex" aria-label="Favorite" onClick={onOpenFavorites}>
            <Heart className="h-5 w-5" />
            {favorites.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center bg-primary text-primary-foreground border-0">
                {favorites.length}
              </Badge>
            )}
          </Button>

          {/* Notifications Bell */}
          <Button variant="ghost" size="icon" className="relative hidden lg:inline-flex" aria-label="Notificări" onClick={onOpenNotifications}>
            <Bell className="h-5 w-5" />
            <NotificationsBadge />
          </Button>

          {/* Add Property button (logged in) */}
          {user && ['OWNER', 'AGENT', 'ADMIN'].includes(accountRole) && (
            <Button
              variant="default"
              size="sm"
              className="hidden xl:flex gap-1.5 h-9"
              onClick={() => navigateTo('adauga-proprietate')}
            >
              <Plus className="h-4 w-4" />
              Adaugă proprietate
            </Button>
          )}

          {/* Auth / User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hidden sm:inline-flex" aria-label="Meniu utilizator">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{profile?.fullName || user.user_metadata?.full_name || 'Utilizator'}</p>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">{roleDefinition.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                {visibleAccountMenuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <DropdownMenuItem
                      key={item.page}
                      onClick={() => navigateTo(item.page)}
                      className={cn('gap-2', currentPage === item.page && 'bg-accent text-foreground')}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </DropdownMenuItem>
                  )
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  Deconectare
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" className="relative hidden sm:inline-flex" aria-label="Autentificare" onClick={() => navigateTo('login')}>
              <LogIn className="h-5 w-5" />
            </Button>
          )}

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Schimbă tema"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="xl:hidden" aria-label="Meniu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  HQS Imobiliare
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 mt-4" aria-label="Navigare mobilă">
                {PUBLIC_NAVIGATION.map((item) => {
                  const isActive = currentPage === item.page || (currentPage === 'proprietate' && item.page === 'proprietati')
                  return (
                    <button
                      key={item.page}
                      onClick={() => handleMobileNav(item.page)}
                      className={cn(
                        'flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-accent text-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                    >
                      {item.label}
                      {isActive && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </button>
                  )
                })}
              </nav>
              <Separator className="my-4" />
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                onClick={() => {
                  setMobileMenuOpen(false)
                  onOpenFavorites?.()
                }}
              >
                <span className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Favorite
                </span>
                <Badge variant="secondary">{favorites.length}</Badge>
              </button>
              <button
                type="button"
                className="flex items-center justify-between w-full rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground mt-1"
                onClick={() => {
                  setMobileMenuOpen(false)
                  onOpenNotifications?.()
                }}
              >
                <span className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notificări
                </span>
              </button>
              <button
                type="button"
                className="flex items-center justify-between w-full rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground mt-1"
                onClick={() => {
                  setMobileMenuOpen(false)
                  navigateTo('monede')
                }}
              >
                <span className="flex items-center gap-2">
                  <CircleDollarSign className="h-4 w-4 text-amber-500" />
                  HQS Monede
                </span>
                {user && coinBalance > 0 && (
                  <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                    {coinBalance}
                  </Badge>
                )}
              </button>
              <button
                type="button"
                className="flex items-center justify-between w-full rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground mt-1"
                onClick={() => {
                  setMobileMenuOpen(false)
                  onOpenPriceAlerts?.()
                }}
              >
                <span className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Alerte de preț
                </span>
              </button>
              <button
                type="button"
                className="flex items-center justify-between w-full rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground mt-1"
                onClick={() => {
                  setMobileMenuOpen(false)
                  onOpenSavedSearches?.()
                }}
              >
                <span className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4" />
                  Căutări salvate
                </span>
                {savedSearchCount > 0 && (
                  <Badge variant="secondary" className="text-xs">{savedSearchCount}</Badge>
                )}
              </button>
              <button
                type="button"
                className="flex items-center justify-between w-full rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground mt-1"
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleAuthClick()
                }}
              >
                <span className="flex items-center gap-2">
                  {user ? (
                    <>
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                          {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex min-w-0 flex-col items-start">
                        <span className="max-w-32 truncate">{profile?.fullName || user.user_metadata?.full_name || 'Contul meu'}</span>
                        <span className="text-[10px] text-muted-foreground">{roleDefinition.label}</span>
                      </span>
                    </>
                  ) : (
                    <><LogIn className="h-4 w-4" />Autentificare</>
                  )}
                </span>
              </button>
              {user && (
                <>
                  {accountMenuItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.page}
                        type="button"
                        className={cn(
                          'flex items-center gap-2 w-full rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-foreground mt-1',
                          currentPage === item.page ? 'bg-accent text-foreground' : 'text-muted-foreground',
                        )}
                        onClick={() => handleMobileNav(item.page)}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    className="flex items-center gap-2 w-full rounded-md px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 mt-1"
                    onClick={() => { setMobileMenuOpen(false); handleSignOut() }}
                  >
                    <LogOut className="h-4 w-4" />
                    Deconectare
                  </button>
                </>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
