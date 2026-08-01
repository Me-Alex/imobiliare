'use client'

import { ArrowRight, CheckCircle2, CircleDot, Sparkles } from 'lucide-react'

import { PageSurface } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { AccountGuidance, AccountProcessStep } from '@/lib/account-guidance'
import { cn } from '@/lib/utils'
import type { PageKey } from '@/store/slices/navigation'

interface AccountGuidancePanelProps {
  guidance: AccountGuidance
  steps: readonly AccountProcessStep[]
  onNavigate: (page: PageKey) => void
}

const STATUS_META = {
  done: {
    label: 'Gata',
    className: 'border-emerald-200 bg-emerald-50/70 text-emerald-950 dark:border-emerald-900/70 dark:bg-emerald-950/25 dark:text-emerald-100',
    markerClassName: 'bg-emerald-600 text-white',
    badgeClassName: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200',
  },
  active: {
    label: 'Acum',
    className: 'border-primary/35 bg-primary/[0.08] text-foreground shadow-sm shadow-primary/10',
    markerClassName: 'bg-primary text-primary-foreground',
    badgeClassName: 'bg-primary/10 text-primary',
  },
  next: {
    label: 'Următor',
    className: 'border-border/80 bg-background/70 text-foreground hover:border-primary/25 hover:bg-primary/[0.04]',
    markerClassName: 'bg-muted text-muted-foreground',
    badgeClassName: 'bg-muted text-muted-foreground',
  },
} satisfies Record<AccountProcessStep['status'], {
  label: string
  className: string
  markerClassName: string
  badgeClassName: string
}>

export function AccountGuidancePanel({
  guidance,
  steps,
  onNavigate,
}: AccountGuidancePanelProps) {
  return (
    <PageSurface
      tone="elevated"
      className={cn(
        'mb-8 overflow-hidden border-primary/15',
        guidance.priority === 'high' && 'border-amber-400/40',
      )}
    >
      <div className={cn(
        'grid gap-5 bg-gradient-to-r from-primary/[0.08] via-transparent to-transparent p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center',
        guidance.priority === 'high' && 'from-amber-500/[0.12]',
      )}>
        <div className="flex min-w-0 items-start gap-4">
          <span className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary',
            guidance.priority === 'high' && 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
          )}>
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <Badge
              variant={guidance.priority === 'high' ? 'destructive' : 'secondary'}
              className="mb-2"
            >
              {guidance.priority === 'high' ? 'Prioritate ridicată' : 'Recomandat acum'}
            </Badge>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{guidance.title}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{guidance.description}</p>
          </div>
        </div>
        <Button className="h-11 gap-2 lg:min-w-52" onClick={() => onNavigate(guidance.page)}>
          {guidance.actionLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="border-t bg-muted/15 px-4 py-4 sm:px-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Proces simplificat</p>
            <p className="mt-1 text-xs text-muted-foreground">Un singur fir: ce e gata, ce faci acum și ce urmează.</p>
          </div>
          <span className="text-[11px] text-muted-foreground">Poți intra direct în orice etapă</span>
        </div>
        <div className={cn('grid gap-3', steps.length >= 5 ? 'md:grid-cols-5' : 'md:grid-cols-4')}>
          {steps.map((step, index) => {
            const meta = STATUS_META[step.status]
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onNavigate(step.page)}
                aria-current={step.status === 'active' ? 'step' : undefined}
                className={cn(
                  'group flex min-h-40 flex-col rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  meta.className,
                )}
                aria-label={`${step.label}: ${step.description} ${step.actionLabel}`}
              >
                <span className="mb-4 flex items-center justify-between gap-3">
                  <span className={cn('flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold', meta.markerClassName)}>
                    {step.status === 'done' ? (
                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    ) : step.status === 'active' ? (
                      <CircleDot className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <Badge className={cn('hover:bg-current/10', meta.badgeClassName)}>{meta.label}</Badge>
                </span>

                <span className="text-base font-semibold">{step.label}</span>
                <span className="mt-2 flex-1 text-sm leading-5 text-muted-foreground">{step.description}</span>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  {step.actionLabel}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </PageSurface>
  )
}
