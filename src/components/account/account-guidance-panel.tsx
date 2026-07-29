'use client'

import { ArrowRight, Sparkles } from 'lucide-react'

import { PageSurface } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { AccountGuidance, AccountJourneyStep } from '@/lib/account-guidance'
import { cn } from '@/lib/utils'
import type { PageKey } from '@/store/slices/navigation'

interface AccountGuidancePanelProps {
  guidance: AccountGuidance
  journey: readonly AccountJourneyStep[]
  onNavigate: (page: PageKey) => void
}

export function AccountGuidancePanel({
  guidance,
  journey,
  onNavigate,
}: AccountGuidancePanelProps) {
  return (
    <PageSurface
      tone="elevated"
      className={cn(
        'mb-6 overflow-hidden border-primary/15',
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

      <div className="border-t bg-muted/15 px-5 py-4 sm:px-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Fluxul rolului tău</p>
          <span className="text-[11px] text-muted-foreground">Poți intra direct în orice etapă</span>
        </div>
        <div className="scroll-horizontal flex gap-2 overflow-x-auto pb-1">
          {journey.map((step, index) => {
            const active = guidance.page === step.page
            return (
              <button
                key={`${step.page}-${step.label}`}
                type="button"
                onClick={() => onNavigate(step.page)}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex min-w-48 flex-1 items-start gap-3 rounded-xl border bg-background px-3 py-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/[0.03]',
                  active && 'border-primary/30 bg-primary/[0.06] ring-1 ring-primary/10',
                )}
              >
                <span className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground',
                  active && 'bg-primary text-primary-foreground',
                )}>
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    {step.label}
                    {active ? <Badge variant="outline" className="px-1.5 py-0 text-[9px]">Acum</Badge> : null}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-4 text-muted-foreground">{step.description}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </PageSurface>
  )
}
