import type { ElementType, ReactNode } from 'react'
import { AlertCircle, Inbox, LoaderCircle } from 'lucide-react'

import { cn } from '@/lib/utils'

type PageStateTone = 'loading' | 'empty' | 'error' | 'neutral'

const TONE_STYLES: Record<PageStateTone, { icon: string; surface: string }> = {
  loading: {
    icon: 'bg-primary/10 text-primary',
    surface: 'border-primary/10',
  },
  empty: {
    icon: 'bg-muted text-muted-foreground',
    surface: 'border-border/70',
  },
  error: {
    icon: 'bg-destructive/10 text-destructive',
    surface: 'border-destructive/20',
  },
  neutral: {
    icon: 'bg-primary/10 text-primary',
    surface: 'border-border/70',
  },
}

interface PageStateProps {
  title: string
  description?: string
  tone?: PageStateTone
  icon?: ElementType
  action?: ReactNode
  compact?: boolean
  className?: string
}

export function PageState({
  title,
  description,
  tone = 'empty',
  icon,
  action,
  compact = false,
  className,
}: PageStateProps) {
  const Icon = icon ?? (tone === 'loading' ? LoaderCircle : tone === 'error' ? AlertCircle : Inbox)
  const styles = TONE_STYLES[tone]

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'loading' ? 'polite' : undefined}
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card/75 text-center shadow-sm',
        compact ? 'min-h-40 px-5 py-8' : 'min-h-72 px-6 py-12',
        styles.surface,
        className,
      )}
    >
      <span className={cn('mb-4 flex h-12 w-12 items-center justify-center rounded-2xl', styles.icon)}>
        <Icon aria-hidden="true" className={cn('h-5 w-5', tone === 'loading' && 'animate-spin')} />
      </span>
      <h2 className="text-base font-semibold tracking-tight sm:text-lg">{title}</h2>
      {description ? <p className="mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  )
}
