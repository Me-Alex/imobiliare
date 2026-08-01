'use client'

import { Home, ChevronRight, ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/store/use-app-store'
import type { PageKey } from '@/store/slices/navigation'
import { PageContainer } from './page-shell'

// ─── PageBreadcrumb ──────────────────────────────────────────────────────────

export interface PageBreadcrumbItem {
  label: string
  /** PageKey to navigate to; omit on the last (current) item */
  page?: PageKey
}

export function PageBreadcrumb({ items, className }: {
  items: PageBreadcrumbItem[]
  className?: string
}) {
  const navigateTo = useAppStore((s) => s.navigateTo)
  const visibleItems = items[0]?.page === 'acasa' ? items.slice(1) : items

  return (
    <nav
      className={`scroll-horizontal flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-1 text-xs text-muted-foreground ${className ?? 'mb-5'}`}
      aria-label="Breadcrumb"
    >
      <button
        type="button"
        onClick={() => navigateTo('acasa')}
        className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
      >
        <Home className="h-3.5 w-3.5" />
        <span>Acasă</span>
      </button>
      {visibleItems.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          <ChevronRight className="h-3.5 w-3.5" />
          {item.page ? (
            <button
              type="button"
              onClick={() => navigateTo(item.page!)}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

// ─── PageHero ────────────────────────────────────────────────────────────────

export interface PageHeroProps {
  /** Visual variant */
  variant?: 'full' | 'border' | 'simple'
  /** Lucide icon component rendered in the icon box */
  icon?: React.ComponentType<{ className?: string }>
  /** Page title (h1) */
  title: string
  /** Optional subtitle */
  description?: string
  /** Breadcrumb items; first is always "Acasa" */
  breadcrumb?: PageBreadcrumbItem[]
  /** Show a back-arrow button above the title (variant "simple") */
  showBackButton?: boolean
  /** Click handler for the back button */
  onBack?: () => void
  /** Label for the back button */
  backLabel?: string
  /** Extra content rendered alongside or below the hero (action buttons, stat pills, etc.) */
  children?: React.ReactNode
}

export function PageHero({
  variant = 'full',
  icon: Icon,
  title,
  description,
  breadcrumb,
  showBackButton,
  onBack,
  backLabel = 'Înapoi',
  children,
}: PageHeroProps) {
  // ── variant="simple" ─────────────────────────────────────────────────────
  if (variant === 'simple') {
    return (
      <div className="mb-6">
        {showBackButton && onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </button>
        )}
        {breadcrumb && <PageBreadcrumb items={breadcrumb} className="mb-4" />}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
            {description && (
              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
            )}
          </div>
          {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
        </div>
      </div>
    )
  }

  // ── variant="full" ───────────────────────────────────────────────────────
  if (variant === 'full') {
    return (
      <section className="border-b bg-background py-8 sm:py-9">
        <PageContainer>
          {breadcrumb && <PageBreadcrumb items={breadcrumb} />}

          <div className="mb-4 flex items-start gap-3">
            {Icon && <Icon className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />}
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
              {description && (
                <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
              )}
            </div>
          </div>

          {children}
        </PageContainer>
      </section>
    )
  }

  // ── variant="border" ─────────────────────────────────────────────────────
  return (
    <section className="border-b bg-background">
      <PageContainer className="py-5 sm:py-6">
        {breadcrumb && <PageBreadcrumb items={breadcrumb} className="mb-4" />}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && <Icon className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />}
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">{title}</h1>
              {description && (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          {children}
        </div>
      </PageContainer>
    </section>
  )
}
