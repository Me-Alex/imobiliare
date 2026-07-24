'use client'

/**
 * Live document preview — renders the in-progress client submission as a
 * paper-style document. Updates on every keystroke so the client can see
 * what they are filling in without having to scroll past the form.
 *
 * For SALE, the preview follows the active stage: identity, then offer,
 * then contract. For RENTAL, the single shape's fields are shown.
 *
 * The visual style matches the rest of the documents surface: white
 * "paper", serif heading, Geist Mono for data, generous whitespace.
 * No icons inside the document body — the data is the focus.
 */

import {
  RENTAL_SHAPE,
  SALE_SHAPE,
  type ClientField,
  type TransactionKind,
} from '@/lib/documents/flow-shape'
import type { ClientFieldValue } from './client-flow'
import { cn } from '@/lib/utils'

export type DocumentPreviewStage = 'identity' | 'offer' | 'contract'

export interface DocumentPreviewProps {
  kind: TransactionKind
  /**
   * Active SALE stage. Ignored for RENTAL. If omitted, defaults to
   * `identity` (the first stage) so the preview is never empty.
   */
  stage?: DocumentPreviewStage
  /** Current form values, keyed by `field.key`. */
  values: Readonly<Record<string, ClientFieldValue>>
  /** Property title shown in the document header. */
  propertyTitle?: string
  /** When the preview is the main focus (no form alongside), stretches to the parent width. */
  className?: string
}

const STAGE_TITLE: Record<DocumentPreviewStage, string> = {
  identity: 'Date de identificare',
  offer: 'Ofertă și rezervare',
  contract: 'Contract și predare',
}

const STAGE_DOC_KIND: Record<DocumentPreviewStage, string> = {
  identity: 'Contract de brokeraj',
  offer: 'Ofertă de rezervare',
  contract: 'Proces verbal de predare',
}

function selectFields(
  kind: TransactionKind,
  stage: DocumentPreviewStage,
): readonly ClientField[] {
  if (kind === 'RENTAL') return RENTAL_SHAPE.fields
  const found = SALE_SHAPE.stages.find((s) => s.id === stage)
  return found ? found.fields : SALE_SHAPE.stages[0]!.fields
}

function selectTitle(kind: TransactionKind, stage: DocumentPreviewStage): string {
  if (kind === 'RENTAL') return RENTAL_SHAPE.title
  return STAGE_TITLE[stage]
}

function selectDocKind(kind: TransactionKind, stage: DocumentPreviewStage): string {
  if (kind === 'RENTAL') return 'Fișă de vizionare'
  return STAGE_DOC_KIND[stage]
}

function formatField(field: ClientField, value: ClientFieldValue): string {
  if (value === undefined || value === null || value === '') return ''
  if (field.type === 'checkbox') return value ? 'Da' : 'Nu'
  if (field.type === 'select' && field.options) {
    const match = field.options.find((o) => o.value === String(value))
    return match ? match.label : String(value)
  }
  if (field.type === 'date') {
    try {
      const d = new Date(String(value))
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })
      }
    } catch {
      /* fall through */
    }
  }
  return String(value)
}

export function DocumentPreview({
  kind,
  stage = 'identity',
  values,
  propertyTitle,
  className,
}: DocumentPreviewProps) {
  const fields = selectFields(kind, stage)
  const title = selectTitle(kind, stage)
  const docKind = selectDocKind(kind, stage)

  const filledCount = fields.filter((f) => !isEmpty(values[f.key])).length
  const totalCount = fields.length
  const percent = totalCount === 0 ? 0 : Math.round((filledCount / totalCount) * 100)

  const today = new Date().toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <article
      aria-label="Previzualizare document"
      className={cn(
        'rounded-lg border border-border/70 bg-card shadow-sm',
        'overflow-hidden',
        className,
      )}
    >
      {/* Document header */}
      <header className="flex items-baseline justify-between border-b border-border/60 bg-muted/30 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
            HQS Imobiliare
          </p>
          <h3
            className="mt-0.5 truncate text-base text-foreground"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {docKind}
          </h3>
          {propertyTitle ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{propertyTitle}</p>
          ) : null}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">Emis</p>
          <p className="mt-0.5 text-xs font-medium text-foreground">{today}</p>
        </div>
      </header>

      {/* Document title */}
      <div className="border-b border-border/60 px-5 py-4 sm:px-6">
        <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Previzualizare
        </p>
        <h4 className="mt-0.5 text-sm font-medium text-foreground">{title}</h4>
        <p className="mt-2 text-xs text-muted-foreground">
          {filledCount} din {totalCount} câmpuri completate · {percent}%
        </p>
      </div>

      {/* Field list — paper-style rows */}
      <dl className="divide-y divide-border/40">
        {fields.map((field) => {
          const formatted = formatField(field, values[field.key])
          return (
            <div
              key={field.key}
              className="grid grid-cols-1 gap-1 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:gap-4 sm:px-6"
            >
              <dt className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground/80">
                {field.label}
                {field.required ? null : (
                  <span className="ml-1 normal-case tracking-normal text-muted-foreground/60">
                    (opțional)
                  </span>
                )}
              </dt>
              <dd
                className={cn(
                  'min-w-0 break-words text-[0.82rem] text-foreground/90',
                  'font-mono',
                  formatted === '' && 'italic text-muted-foreground/50',
                )}
                style={{ fontFamily: formatted === '' ? undefined : 'var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace' }}
              >
                {formatted === '' ? '—' : formatted}
              </dd>
            </div>
          )
        })}
      </dl>

      {/* Document footer — signature lines */}
      <footer className="border-t border-border/60 bg-muted/20 px-5 py-5 sm:px-6">
        <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Semnături
        </p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {['Client', 'Agent HQS'].map((role) => (
            <div key={role} className="space-y-2">
              <p className="text-[0.7rem] uppercase tracking-wider text-muted-foreground/70">
                {role}
              </p>
              <div className="h-10 border-b border-dashed border-border/80" aria-hidden="true" />
              <p className="text-[0.65rem] text-muted-foreground/60">
                Semnătura va fi aplicată electronic la trimitere
              </p>
            </div>
          ))}
        </div>
      </footer>
    </article>
  )
}

function isEmpty(v: unknown): boolean {
  return v === undefined || v === null || v === ''
}
