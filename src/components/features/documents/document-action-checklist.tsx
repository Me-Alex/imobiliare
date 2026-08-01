'use client'

import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileSignature,
  Loader2,
  UserRoundCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type {
  DocumentActionPlan,
  DocumentActionPlanItem,
  DocumentActionPlanOwner,
  DocumentActionPlanState,
} from '@/lib/document-action-plan'

const STATE_COPY: Record<DocumentActionPlanState, { label: string; className: string }> = {
  complete: {
    label: 'Gata',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300',
  },
  current: {
    label: 'Acum',
    className: 'border-primary/30 bg-primary/10 text-primary',
  },
  waiting: {
    label: 'Așteaptă',
    className: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300',
  },
  blocked: {
    label: 'Blocat',
    className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300',
  },
  pending: {
    label: 'Urmează',
    className: 'border-border bg-muted/40 text-muted-foreground',
  },
}

const OWNER_COPY: Record<DocumentActionPlanOwner, string> = {
  CLIENT: 'Client',
  OWNER: 'Proprietar',
  AGENT: 'Agent',
  ADMIN: 'Admin',
  AGENCY: 'Agenție',
  SYSTEM: 'Sistem',
}

function itemIcon(item: DocumentActionPlanItem) {
  if (item.state === 'complete') return CheckCircle2
  if (item.state === 'blocked') return AlertTriangle
  if (item.state === 'waiting') return Clock3
  if (item.id === 'signature') return FileSignature
  if (item.id === 'archive') return Archive
  if (item.id === 'review') return FileCheck2
  return UserRoundCheck
}

export function DocumentActionChecklist({
  plan,
  onPrimaryAction,
}: {
  plan: DocumentActionPlan
  onPrimaryAction?: () => void
}) {
  const primaryItem = plan.primaryItemId
    ? plan.items.find((item) => item.id === plan.primaryItemId)
    : null

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">{plan.headline}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </div>
          {primaryItem && !plan.readOnly ? (
            <Button size="sm" className="gap-2 self-start" onClick={onPrimaryAction}>
              <Loader2 className="hidden h-3.5 w-3.5" />
              Rezolvă pasul curent
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-5">
          {plan.items.map((item, index) => {
            const Icon = itemIcon(item)
            const copy = STATE_COPY[item.state]
            const isPrimary = item.id === plan.primaryItemId
            return (
              <div
                key={item.id}
                className={cn(
                  'relative rounded-2xl border bg-background p-4 shadow-sm transition-colors',
                  isPrimary && 'border-primary/40 bg-primary/[0.04]',
                )}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl',
                    item.state === 'complete' && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
                    item.state === 'current' && 'bg-primary/10 text-primary',
                    item.state === 'waiting' && 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300',
                    item.state === 'blocked' && 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300',
                    item.state === 'pending' && 'bg-muted text-muted-foreground',
                  )}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <Badge variant="outline" className={cn('text-[10px]', copy.className)}>
                    {copy.label}
                  </Badge>
                </div>
                <p className="text-sm font-semibold">{index + 1}. {item.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                <div className="mt-3 border-t pt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                  Responsabil: <span className="font-semibold text-foreground">{OWNER_COPY[item.owner]}</span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
