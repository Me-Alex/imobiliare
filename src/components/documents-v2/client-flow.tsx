'use client'

/**
 * Client-flow workspace — the new minimal surface for the customer.
 *
 * Two layouts, one component:
 *   1. RENTAL — a single form (the viewing report). 9 fields, one screen.
 *      The agency handles the rental contract and handover protocol in
 *      the background; the client never sees them until they're ready
 *      to sign.
 *   2. SALE   — a three-stage progressive disclosure. Only the active
 *      stage is shown. Completing one unlocks the next.
 *
 * Both layouts share the same hero, identity handling, and submission
 * UX. The "identity-first" rule means we collect the participant's
 * contact details once and reuse them everywhere downstream.
 *
 * Style matches the rest of the new documents surface: white background,
 * charcoal text, emerald accent, serif heading, generous whitespace.
 * No modals, no tabs, no drawers.
 */

import { useMemo, useState, type ReactNode } from 'react'
import { Check, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  RENTAL_SHAPE,
  SALE_SHAPE,
  activeSaleStage,
  getTransactionShape,
  type ClientField,
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
   * If false, the live document preview is hidden. Defaults to true.
   * Use this in dense layouts where the parent already shows the
   * preview elsewhere.
   */
  showPreview?: boolean
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
  showPreview = true,
  className,
}: ClientFlowProps) {
  const shape = getTransactionShape(kind)
  const [values, setValues] = useState<Record<string, ClientFieldValue>>(() => ({
    ...(prefill ?? {}),
  }))
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<readonly string[]>([])

  // RENTAL: a single form, the viewing report.
  if (shape.kind === 'RENTAL') {
    return (
      <ClientFormLayout
        className={className}
        summary={summary}
        title={RENTAL_SHAPE.title}
        blurb={RENTAL_SHAPE.blurb}
        kind="RENTAL"
        stageLabel="Singur"
        fields={RENTAL_SHAPE.fields}
        values={values}
        setValues={setValues}
        submitting={submitting}
        actionLabel="Am terminat"
        onAction={async () => {
          setSubmitting(true)
          try {
            await onSubmit({ values, submittedAt: new Date().toISOString() })
            setDone(['rental'])
          } finally {
            setSubmitting(false)
          }
        }}
        done={done.includes('rental')}
        preview={
          showPreview ? (
            <DocumentPreview
              kind="RENTAL"
              values={values}
              propertyTitle={summary.propertyTitle}
            />
          ) : null
        }
      />
    )
  }

  // SALE: progressive three-stage flow.
  const active = activeSaleStage(SALE_SHAPE, done)
  return (
    <ClientFormLayout
      className={className}
      summary={summary}
      title={SALE_SHAPE.stages.find((s) => s.id === active.id)?.title ?? ''}
      blurb={SALE_SHAPE.stages.find((s) => s.id === active.id)?.blurb ?? ''}
      kind="SALE"
      stageLabel={STAGE_LABEL[active.id]}
      stageIndex={SALE_SHAPE.stages.findIndex((s) => s.id === active.id)}
      stageCount={SALE_SHAPE.stages.length}
      fields={SALE_SHAPE.stages.find((s) => s.id === active.id)?.fields ?? []}
      values={values}
      setValues={setValues}
      submitting={submitting}
      actionLabel={active.id === 'contract' ? 'Confirm și trimite' : 'Continuă'}
      onAction={async () => {
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
      done={done.includes(active.id) && active.unlocks === null}
      onBack={
        SALE_SHAPE.stages.findIndex((s) => s.id === active.id) > 0
          ? () => {
              const idx = SALE_SHAPE.stages.findIndex((s) => s.id === active.id)
              setDone((prev) =>
                prev.filter((id) => id !== SALE_SHAPE.stages[idx]!.id),
              )
            }
          : undefined
      }
      preview={
        showPreview ? (
          <DocumentPreview
            kind="SALE"
            stage={active.id satisfies DocumentPreviewStage}
            values={values}
            propertyTitle={summary.propertyTitle}
          />
        ) : null
      }
    />
  )
}

interface ClientFormLayoutProps {
  className?: string
  summary: { propertyTitle: string; propertyZone?: string }
  title: string
  blurb: string
  kind: TransactionKind
  stageLabel: string
  stageIndex?: number
  stageCount?: number
  fields: readonly ClientField[]
  values: Record<string, ClientFieldValue>
  setValues: React.Dispatch<React.SetStateAction<Record<string, ClientFieldValue>>>
  submitting: boolean
  actionLabel: string
  onAction: () => void | Promise<void>
  onBack?: () => void
  done: boolean
  /** Optional live preview rendered after the form card. */
  preview?: ReactNode
}

function ClientFormLayout({
  className,
  summary,
  title,
  blurb,
  kind,
  stageLabel,
  stageIndex,
  stageCount,
  fields,
  values,
  setValues,
  submitting,
  actionLabel,
  onAction,
  onBack,
  done,
  preview,
}: ClientFormLayoutProps) {
  const requiredMissing = useMemo(
    () => fields.filter((f) => f.required && isEmpty(values[f.key])).map((f) => f.key),
    [fields, values],
  )
  const canSubmit = requiredMissing.length === 0 && !submitting

  return (
    <div className={cn('mx-auto w-full max-w-2xl space-y-6', className)}>
      {/* Hero */}
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

      {/* Stage indicator (SALE only) */}
      {kind === 'SALE' && stageIndex !== undefined && stageCount !== undefined ? (
        <ol className="flex items-center gap-2 text-xs" aria-label="Etape">
          {Array.from({ length: stageCount }).map((_, i) => {
            const isPast = i < stageIndex
            const isCurrent = i === stageIndex
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
                  {stageLabel}
                </span>
                {i < stageCount - 1 ? (
                  <ChevronRight className="size-3 text-muted-foreground/40" aria-hidden />
                ) : null}
              </li>
            )
          })}
        </ol>
      ) : null}

      {/* Form card */}
      <section className="rounded-lg border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <header className="mb-5">
          <h2 className="text-base font-medium text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
        </header>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-700/30">
              <Check className="size-6" aria-hidden />
            </span>
            <h3 className="text-base font-medium text-foreground">Gata, mulțumim!</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              {kind === 'RENTAL'
                ? 'Agentul pregătește contractul de închiriere și procesul verbal de predare. Te contactăm în cel mult 24 de ore.'
                : 'Datele au ajuns la agent. Te contactăm cu pașii următori.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field) => (
              <ClientFieldInput
                key={field.key}
                field={field}
                value={values[field.key]}
                onChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
              />
            ))}
            {requiredMissing.length > 0 ? (
              <p className="text-xs text-amber-700">
                Mai ai {requiredMissing.length} câmpuri de completat.
              </p>
            ) : null}
          </div>
        )}
      </section>

      {/* Live document preview — paper-style rendering of the same
          values, updates on every keystroke. Hidden in dense layouts
          via `showPreview={false}` on `ClientFlow`. */}
      {preview}

      {/* Footer actions */}
      {!done ? (
        <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
          {onBack ? (
            <Button type="button" variant="ghost" onClick={onBack} disabled={submitting}>
              Înapoi
            </Button>
          ) : (
            <span className="hidden sm:block" />
          )}
          <Button type="button" onClick={onAction} disabled={!canSubmit} size="lg">
            {submitting ? 'Se trimite…' : actionLabel}
            <ChevronRight className="ml-1.5 size-4" aria-hidden />
          </Button>
        </div>
      ) : null}

      {/* Trust footer */}
      <footer className="flex items-center gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
        <Sparkles className="size-3.5 text-emerald-700" aria-hidden />
        Datele tale sunt folosite doar pentru dosar. Nu le partajăm cu terți.
      </footer>
    </div>
  )
}

function isEmpty(v: unknown): boolean {
  return v === undefined || v === null || v === ''
}

interface ClientFieldInputProps {
  field: ClientField
  value: unknown
  onChange: (next: string | number | boolean | undefined) => void
}

function ClientFieldInput({ field, value, onChange }: ClientFieldInputProps) {
  const id = `flow-${field.key}`

  if (field.type === 'checkbox') {
    return (
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 size-4 rounded border-border text-emerald-700 focus:ring-emerald-700"
        />
        <div className="flex-1">
          <label htmlFor={id} className="text-sm text-foreground">
            {field.label}
            {!field.required ? (
              <span className="ml-1 text-xs text-muted-foreground">(opțional)</span>
            ) : null}
          </label>
          {field.hint ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{field.hint}</p>
          ) : null}
        </div>
      </div>
    )
  }

  if (field.type === 'textarea') {
    return (
      <div>
        <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted-foreground">
          {field.label}
          {!field.required ? (
            <span className="ml-1 text-xs text-muted-foreground/70">(opțional)</span>
          ) : null}
        </label>
        <textarea
          id={id}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          maxLength={field.maxLength}
          rows={3}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700/40"
        />
        {field.hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{field.hint}</p>
        ) : null}
      </div>
    )
  }

  if (field.type === 'select') {
    return (
      <div>
        <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted-foreground">
          {field.label}
          {!field.required ? (
            <span className="ml-1 text-xs text-muted-foreground/70">(opțional)</span>
          ) : null}
        </label>
        <select
          id={id}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700/40"
        >
          <option value="">Alege…</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {field.hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{field.hint}</p>
        ) : null}
      </div>
    )
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted-foreground">
        {field.label}
        {!field.required ? (
          <span className="ml-1 text-xs text-muted-foreground/70">(opțional)</span>
        ) : null}
      </label>
      <Input
        id={id}
        type={field.type === 'number' ? 'number' : (field.type as 'text' | 'email' | 'tel' | 'date')}
        value={value === undefined || value === null ? '' : String(value)}
        onChange={(e) => {
          const raw = e.target.value
          if (field.type === 'number') {
            onChange(raw === '' ? undefined : Number(raw))
          } else {
            onChange(raw)
          }
        }}
        maxLength={field.maxLength}
        className="h-9 text-sm"
      />
      {field.hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{field.hint}</p>
      ) : null}
    </div>
  )
}
