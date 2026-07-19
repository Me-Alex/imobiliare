'use client'

import {
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  FileSignature,
  FileText,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { DocumentFlowSummary } from '@/lib/document-flow'

export function DocumentActionCenter({
  summary,
  onPrimaryAction,
}: {
  summary: DocumentFlowSummary
  onPrimaryAction: () => void
}) {
  const isComplete = summary.action.type === 'OPEN_ARCHIVE'

  return (
    <Card data-testid="document-action-center" className="mb-6 overflow-hidden border-primary/25 bg-gradient-to-br from-primary/[0.08] via-background to-background shadow-sm">
      <CardContent className="p-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="border-0 bg-primary text-primary-foreground">Următorul pas</Badge>
              {summary.pendingSignaturesCount > 0 && (
                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                  {summary.pendingSignaturesCount} de semnat
                </Badge>
              )}
            </div>
            <h2 className="max-w-2xl text-xl font-bold tracking-tight sm:text-2xl">{summary.action.label}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{summary.action.description}</p>
            <Button
              className="mt-5 gap-2"
              variant={isComplete ? 'outline' : 'default'}
              onClick={onPrimaryAction}
            >
              {summary.action.type === 'SIGN' ? <FileSignature className="h-4 w-4" /> : isComplete ? <FileText className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              {summary.action.type === 'SIGN'
                ? 'Verifică și semnează'
                : isComplete
                  ? 'Vezi arhiva'
                  : 'Continuă acum'}
            </Button>
          </div>

          <div className="rounded-2xl border bg-background/85 p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">Progresul dosarului</span>
              <span className="text-sm font-bold text-primary">{summary.progress}%</span>
            </div>
            <div className="mb-5 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${summary.progress}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {summary.steps.map((step) => (
                <div key={step.label} className="min-w-0 text-center">
                  <div className={cn(
                    'mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full border-2',
                    step.state === 'complete' && 'border-primary bg-primary text-primary-foreground',
                    step.state === 'current' && 'border-primary bg-background text-primary',
                    step.state === 'pending' && 'border-border bg-muted text-muted-foreground',
                  )}>
                    {step.state === 'complete' ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-2.5 w-2.5 fill-current" />}
                  </div>
                  <p className="truncate text-xs font-semibold">{step.label}</p>
                  <p className="mt-0.5 hidden text-[10px] leading-snug text-muted-foreground sm:block">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 border-t pt-4 text-center sm:max-w-xl sm:text-left">
          <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground"><strong className="text-foreground">{summary.documentsCount}</strong> documente</span>
          </div>
          <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground"><strong className="text-foreground">{summary.openRequestsCount}</strong> în lucru</span>
          </div>
          <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
            {summary.pendingSignaturesCount === 0 ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <FileSignature className="h-4 w-4 text-amber-600" />}
            <span className="text-xs text-muted-foreground"><strong className="text-foreground">{summary.pendingSignaturesCount}</strong> semnături</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
