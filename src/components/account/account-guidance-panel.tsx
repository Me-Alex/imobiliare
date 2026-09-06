'use client'

import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AccountHelp } from '@/components/account/account-help'
import type { AccountGuidance, AccountProcessStep } from '@/lib/account-guidance'
import type { PageKey } from '@/store/slices/navigation'

interface AccountGuidancePanelProps {
  guidance: AccountGuidance
  steps: readonly AccountProcessStep[]
  onNavigate: (page: PageKey) => void
}

export function AccountGuidancePanel({ guidance, steps, onNavigate }: AccountGuidancePanelProps) {
  return <section aria-label="Următorul pas" className="mb-6">
    <div className="mb-4 flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold">{guidance.title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{guidance.description}</p>
        {guidance.priority === 'high' && <p className="mt-2 text-sm font-medium text-destructive">Necesită atenție</p>}
      </div>
      <Button className="min-h-11 shrink-0 gap-2 whitespace-normal" onClick={() => onNavigate(guidance.page)}>{guidance.actionLabel}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></Button>
    </div>
    <AccountHelp title="Vezi toți pașii contului">
      <ol className="divide-y">
        {steps.map(step => <li key={step.id}>
          <button type="button" onClick={() => onNavigate(step.page)} aria-current={step.status === 'active' ? 'step' : undefined}
            className="flex min-h-14 w-full items-center gap-3 rounded-lg px-2 py-3 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {step.status === 'done' && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
            <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{step.label}{step.status === 'active' ? ' · Acum' : ''}</span><span className="mt-1 block text-sm text-muted-foreground">{step.description}</span></span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </button>
        </li>)}
      </ol>
    </AccountHelp>
  </section>
}
