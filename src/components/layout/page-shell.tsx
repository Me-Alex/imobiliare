import type { ElementType, ReactNode } from 'react'

import { cn } from '@/lib/utils'

type PageWidth = 'narrow' | 'default' | 'wide'

const WIDTH_CLASSES: Record<PageWidth, string> = {
  narrow: 'max-w-4xl',
  default: 'max-w-6xl',
  wide: 'max-w-7xl',
}

interface PageShellProps {
  children: ReactNode
  className?: string
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div
      className={cn(
        'min-h-[calc(100vh-10rem)] bg-[linear-gradient(180deg,var(--background)_0%,color-mix(in_oklch,var(--muted)_22%,var(--background))_100%)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface PageContainerProps {
  children: ReactNode
  className?: string
  width?: PageWidth
  as?: 'div' | 'section'
}

export function PageContainer({
  children,
  className,
  width = 'wide',
  as: Component = 'div',
}: PageContainerProps) {
  return (
    <Component className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', WIDTH_CLASSES[width], className)}>
      {children}
    </Component>
  )
}

interface SectionHeaderProps {
  title: string
  description?: string
  eyebrow?: string
  icon?: ElementType
  actions?: ReactNode
  className?: string
}

export function SectionHeader({
  title,
  description,
  eyebrow,
  icon: Icon,
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
        ) : null}
        <div className="flex items-center gap-2.5">
          {Icon ? (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon aria-hidden="true" className="h-4.5 w-4.5" />
            </span>
          ) : null}
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
        </div>
        {description ? <p className={cn('text-sm text-muted-foreground', Icon && 'mt-1.5 sm:ml-11')}>{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

interface PageSectionProps {
  children: ReactNode
  className?: string
}

export function PageSection({ children, className }: PageSectionProps) {
  return <section className={cn('mb-8 last:mb-0', className)}>{children}</section>
}

interface PageSurfaceProps {
  children: ReactNode
  className?: string
  tone?: 'default' | 'subtle' | 'elevated'
  as?: 'div' | 'section' | 'article'
}

const SURFACE_CLASSES: Record<NonNullable<PageSurfaceProps['tone']>, string> = {
  default: 'border-border/70 bg-card/90 shadow-sm',
  subtle: 'border-border/60 bg-muted/25 shadow-none',
  elevated: 'border-primary/10 bg-card/95 shadow-md',
}

export function PageSurface({
  children,
  className,
  tone = 'default',
  as: Component = 'div',
}: PageSurfaceProps) {
  return (
    <Component className={cn('rounded-2xl border', SURFACE_CLASSES[tone], className)}>
      {children}
    </Component>
  )
}
