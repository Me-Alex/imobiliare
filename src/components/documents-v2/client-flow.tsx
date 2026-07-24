'use client'

/**
 * Client-flow workspace — the new minimal surface for the customer.
 *
 * Two layouts, one component:
 *   1. RENTAL — a single document (the viewing report). The client types
 *      directly into the document preview; there is no separate form.
 *      The agency handles the rental contract and handover protocol in
 *      the background; the client never sees them until they're ready
 *      to sign.
 *   2. SALE   — a three-stage progressive disclosure. Only the active
 *      stage is shown as an editable document. Completing one unlocks
 *      the next.
 *
 * Both layouts share the same hero, identity handling, and submission
 * UX. The "identity-first" rule means we collect the participant's
 * contact details once and reuse them everywhere downstream.
 *
 * Style matches the rest of the new documents surface: white background,
 * charcoal text, emerald accent, serif heading, generous whitespace.
 * No modals, no tabs, no drawers.
 */

import { useState } from 'react'
import { Check, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  RENTAL_SHAPE,
  SALE_SHAPE,
  activeSaleStage,
  getTransactionShape,
  type TransactionKind,
} from '@/lib/documents/flow-shape'
import { DocumentPreview, type DocumentPreviewStage } from './document-preview'

export type ClientFieldValue = string | number | boolean | undefined

export interface ClientSubmission {
  /** All values keyed by field.key. */
  values: Record<string, ClientFieldValue>
  /** The stage that produced this submission (SALE only). */
  stageId?: 'identity' | 'offer' | 'contract'
  /** ISO timestamp. */
  submittedAt: string
}

export interface ClientFlowProps {
  kind: TransactionKind
  /** Hero summary. */
  summary: {
    propertyTitle: string
    propertyZone?: string
  }
  /** Pre-filled values (e.g. from the booking step). Keys must match field keys. */
  prefill?: Record<string, ClientFieldValue>
  /** Which sale stages are already completed (SALE only). */
  completedSaleStages?: readonly ('identity' | 'offer' | 'contract')[]
  /** Called when the client submits a stage / the rental form. */
  onSubmit: (submission: ClientSubmission) => void | Promise<void>
  /**
   * If false, the editable document is hidden (no editing surface
   * rendered). Defaults to true. Use this only when the parent
   * already provides its own editing UI.
   */
  showEditor?: boolean
  className?: string
}

// `completedSaleStages` is accepted so the parent can hydrate the
// workspace from server-side state without owning the stage-tracking
// itself. The demo routes the state through `done` in the wrapper, so
// the prop is destructured with an underscore prefix to keep the
// public surface stable.
const STAGE_LABEL: Record<'identity' | 'offer' | 'contract', string> = {
  identity: 'Date',
  offer: 'Ofertă',
  contract: 'Contract',
}

export function ClientFlow({
  kind,
  summary,
  prefill,
  completedSaleStages: _completedSaleStages = [],
  onSubmit,
  showEditor = true,
  className,
}: ClientFlowProps) {
  const shape = getTransactionShape(kind)
  const [values, setValues] = useState<Record<string, ClientFieldValue>>(() => ({
    ...(prefill ?? {}),
  }))
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<readonly string[]>([])

  const handleValueChange = (key: string, value: ClientFieldValue) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  // RENTAL: a single document, the viewing report.
  if (shape.kind === 'RENTAL') {
    const isDone = done.includes('rental')
    const requiredFields = RENTAL_SHAPE.fields.filter((f) => f.required)
    const requiredMissing = requiredFields.filter((f) => isEmpty(values[f.key])).length
    const canSubmit = requiredMissing === 0 && !submitting

    return (
      <div className={cn('mx-auto w-full max-w-2xl space-y-6', className)}>
        <ClientHero kind="RENTAL" summary={summary} />

        {isDone ? (
          <DoneMessage kind="RENTAL" />
        ) : (
          <>
            {showEditor ? (
              <DocumentPreview
                kind="RENTAL"
                values={values}
                propertyTitle={summary.propertyTitle}
                editable
                onChange={handleValueChange}
              />
            ) : null}
            <SubmitRow
              submitting={submitting}
              canSubmit={canSubmit}
              label="Am terminat"
              onSubmit={async () => {
                setSubmitting(true)
                try {
                  await onSubmit({ values, submittedAt: new Date().toISOString() })
                  setDone(['rental'])
                } finally {
                  setSubmitting(false)
                }
              }}
            />
          </>
        )}

        <TrustFooter />
      </div>
    )
  }

  // SALE: progressive three-stage flow.
  const active = activeSaleStage(SALE_SHAPE, done)
  const activeStageDef = SALE_SHAPE.stages.find((s) => s.id === active.id)!
  const requiredFields = activeStageDef.fields.filter((f) => f.required)
  const requiredMissing = requiredFields.filter((f) => isEmpty(values[f.key])).length
  const canSubmit = requiredMissing === 0 && !submitting
  const isFinalDone = isEmpty(activeStageDef.unlocks) && done.includes(active.id)
  const stageIndex = SALE_SHAPE.stages.findIndex((s) => s.id === active.id)
  const canGoBack = stageIndex > 0

  const handleBack = () => {
    setDone((prev) => prev.filter((id) => id !== SALE_SHAPE.stages[stageIndex]!.id))
  }

  return (
    <div className={cn('mx-auto w-full max-w-2xl space-y-6', className)}>
      <ClientHero kind="SALE" summary={summary} />
      <StageIndicator currentIndex={stageIndex} total={SALE_SHAPE.stages.length} label={STAGE_LABEL[active.id]} />

      {isFinalDone ? (
        <DoneMessage kind="SALE" />
      ) : (
        <>
          {showEditor ? (
            <DocumentPreview
              kind="SALE"
              stage={active.id satisfies DocumentPreviewStage}
              values={values}
              propertyTitle={summary.propertyTitle}
              editable
              onChange={handleValueChange}
            />
          ) : null}
          <SubmitRow
            submitting={submitting}
            canSubmit={canSubmit}
            label={isEmpty(activeStageDef.unlocks) ? 'Confirm și trimite' : 'Continuă'}
            onSubmit={async () => {
              setSubmitting(true)
              try {
                await onSubmit({
                  values,
                  stageId: active.id,
                  submittedAt: new Date().toISOString(),
                })
                setDone((prev) => (prev.includes(active.id) ? prev : [...prev, active.id]))
              } finally {
                setSubmitting(false)
              }
            }}
            onBack={canGoBack ? handleBack : undefined}
            backLabel="Înapoi"
          />
        </>
      )}

      <TrustFooter />
    </div>
  )
}

function ClientHero({
  kind,
  summary,
}: {
  kind: TransactionKind
  summary: { propertyTitle: string; propertyZone?: string }
}) {
  return (
    <header className="border-b border-border/60 pb-5">
      <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {kind === 'RENTAL' ? 'Închiriere · un singur pas' : 'Vânzare · 3 pași'}
      </p>
      <h1
        className="mt-1 text-2xl text-foreground"
        style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
      >
        {summary.propertyTitle}
      </h1>
      {summary.propertyZone ? (
        <p className="mt-1 text-sm text-muted-foreground">{summary.propertyZone}</p>
      ) : null}
    </header>
  )
}

function StageIndicator({
  currentIndex,
  total,
  label,
}: {
  currentIndex: number
  total: number
  label: string
}) {
  return (
    <ol className="flex items-center gap-2 text-xs" aria-label="Etape">
      {Array.from({ length: total }).map((_, i) => {
        const isPast = i < currentIndex
        const isCurrent = i === currentIndex
        return (
          <li key={i} className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex size-6 items-center justify-center rounded-full text-[0.7rem] font-medium ring-1 ring-inset',
                isPast
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-700/30'
                  : isCurrent
                    ? 'bg-foreground text-background ring-foreground'
                    : 'bg-muted text-muted-foreground ring-border',
              )}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {isPast ? <Check className="size-3" /> : i + 1}
            </span>
            <span
              className={cn(
                'uppercase tracking-wider',
                isCurrent ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
            {i < total - 1 ? (
              <ChevronRight className="size-3 text-muted-foreground/40" aria-hidden />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

function DoneMessage({ kind }: { kind: TransactionKind }) {
  return (
    <div className="rounded-lg border border-emerald-700/20 bg-emerald-50/30 p-6 text-center">
      <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-700/30">
        <Check className="size-6" aria-hidden />
      </span>
      <h3 className="mt-3 text-base font-medium text-foreground">Gata, mulțumim!</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        {kind === 'RENTAL'
          ? 'Agentul pregătește contractul de închiriere și procesul verbal de predare. Te contactăm în cel mult 24 de ore.'
          : 'Datele au ajuns la agent. Te contactăm cu pașii următori.'}
      </p>
    </div>
  )
}

interface SubmitRowProps {
  submitting: boolean
  canSubmit: boolean
  label: string
  onSubmit: () => void | Promise<void>
  onBack?: () => void
  backLabel?: string
}

function SubmitRow({ submitting, canSubmit, label, onSubmit, onBack, backLabel }: SubmitRowProps) {
  return (
    <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
      {onBack ? (
        <Button type="button" variant="ghost" onClick={onBack} disabled={submitting}>
          {backLabel ?? 'Înapoi'}
        </Button>
      ) : (
        <span className="hidden sm:block" />
      )}
      <Button type="button" onClick={() => void onSubmit()} disabled={!canSubmit} size="lg">
        {submitting ? 'Se trimite…' : label}
        <ChevronRight className="ml-1.5 size-4" aria-hidden />
      </Button>
    </div>
  )
}

function TrustFooter() {
  return (
    <footer className="flex items-center gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
      <Sparkles className="size-3.5 text-emerald-700" aria-hidden />
      Datele tale sunt folosite doar pentru dosar. Nu le partajăm cu terți.
    </footer>
  )
}

function isEmpty(v: unknown): boolean {
  return v === undefined || v === null || v === ''
}
