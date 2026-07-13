'use client'

import { motion } from 'framer-motion'
import { Home, ChevronRight, ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/store/use-app-store'

// ─── PageBreadcrumb ──────────────────────────────────────────────────────────

export interface PageBreadcrumbItem {
  label: string
  /** PageKey to navigate to; omit on the last (current) item */
  page?: string
}

export function PageBreadcrumb({ items, className }: {
  items: PageBreadcrumbItem[]
  className?: string
}) {
  const navigateTo = useAppStore((s) => s.navigateTo)

  return (
    <nav
      className={`flex items-center gap-2 text-sm text-muted-foreground ${className ?? 'mb-6'}`}
      aria-label="Breadcrumb"
    >
      <Home className="h-4 w-4" />
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          <ChevronRight className="h-3.5 w-3.5" />
          {item.page ? (
            <button
              type="button"
              onClick={() => navigateTo(item.page as 'acasa')}
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
  backLabel = 'Inapoi',
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
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        )}
      </div>
    )
  }

  // ── variant="full" ───────────────────────────────────────────────────────
  if (variant === 'full') {
    return (
      <>
        <section className="relative py-16 lg:py-20 bg-gradient-to-b from-primary/5 via-transparent to-transparent overflow-hidden">
          <div className="absolute inset-0 dots-pattern opacity-30" />
          <div
            className="floating-blob w-[400px] h-[400px] -top-32 -right-32"
            style={{ background: 'radial-gradient(circle, oklch(0.527 0.14 160 / 10%) 0%, transparent 70%)' }}
          />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {breadcrumb && <PageBreadcrumb items={breadcrumb} />}

              <div className="flex items-center gap-4 mb-4">
                {Icon && (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">{title}</h1>
                  {description && (
                    <p className="text-muted-foreground mt-1">{description}</p>
                  )}
                </div>
              </div>

              {children}
            </motion.div>
          </div>
        </section>

        <hr className="section-divider" />
      </>
    )
  }

  // ── variant="border" ─────────────────────────────────────────────────────
  return (
    <section className="border-b bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {breadcrumb && <PageBreadcrumb items={breadcrumb} className="mb-4" />}

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {Icon && (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
              )}
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{title}</h1>
                {description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                )}
              </div>
            </div>
            {children}
          </div>
        </motion.div>
      </div>
    </section>
  )
}