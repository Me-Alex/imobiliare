'use client'

/**
 * Live document preview — renders the in-progress client submission as a
 * paper-style document. Updates on every keystroke so the client can see
 * what they are filling in without having to scroll past the form.
 *
 * Two modes:
 *   - read-only (default) — each row shows the current value as static
 *     text. Used in dashboards and previews where the user should not
 *     edit inline.
 *   - editable — each row shows an input styled to look like document
 *     text. The parent owns the values state and updates it through
 *     `onChange`. This is the mode the client uses in the booking flow:
 *     the preview IS the form.
 *
 * For SALE, the preview follows the active stage: identity, then offer,
 * then contract. For RENTAL, the single shape's fields are shown.
 *
 * Visual style: white "paper" card, serif heading, Geist Mono for data,
 * generous whitespace. No icons inside the document body — the data is
 * the focus.
 */

import { useState, type ChangeEvent } from 'react'
import { cn } from '@/lib/utils'
import {
  RENTAL_SHAPE,
  SALE_SHAPE,
  type ClientField,
  type TransactionKind,
} from '@/lib/documents/flow-shape'
import type { ClientFieldValue } from './client-flow'

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
  /** When true, fields become inputs and call `onChange` on edit. */
  editable?: boolean
  /**
   * Called when the user edits a field. Required when `editable` is
   * true. Receives the field key and the new value.
   */
  onChange?: (key: string, value: ClientFieldValue) => void
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

function formatReadOnly(field: ClientField, value: ClientFieldValue): string {
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

function toInputValue(value: ClientFieldValue): string {
  if (value === undefined || value === null) return ''
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return String(value)
}

function toBool(value: ClientFieldValue): boolean {
  if (value === true || value === 'true') return true
  if (value === false || value === 'false' || value === undefined || value === null || value === '') {
    return false
  }
  return Boolean(value)
}

export function DocumentPreview({
  kind,
  stage = 'identity',
  values,
  propertyTitle,
  editable = false,
  onChange,
  className,
}: DocumentPreviewProps) {
  const fields = selectFields(kind, stage)
  const title = selectTitle(kind, stage)
  const docKind = selectDocKind(kind, stage)

  const filledCount = fields.filter((f) => !isEmpty(values[f.key])).length
  const totalCount = fields.length
  const requiredCount = fields.filter((f) => f.required).length
  const filledRequiredCount = fields.filter((f) => f.required && !isEmpty(values[f.key])).length
  const percent = totalCount === 0 ? 0 : Math.round((filledCount / totalCount) * 100)
  const allRequiredFilled = requiredCount > 0 && filledRequiredCount === requiredCount

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
        editable && 'ring-1 ring-emerald-700/10',
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

      {/* Document title + progress */}
      <div className="border-b border-border/60 px-5 py-4 sm:px-6">
        <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
          {editable ? 'Completează direct în document' : 'Previzualizare'}
        </p>
        <h4 className="mt-0.5 text-sm font-medium text-foreground">{title}</h4>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {editable ? (
            <>
              <span>
                {filledRequiredCount} din {requiredCount} obligatorii completate
              </span>
              {filledCount < totalCount ? (
                <span className="text-muted-foreground/70">
                  · {totalCount - filledCount} opționale
                </span>
              ) : null}
              {allRequiredFilled ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.7rem] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-700/20"
                  aria-live="polite"
                >
                  Gata de trimitere
                </span>
              ) : null}
            </>
          ) : (
            <span>
              {filledCount} din {totalCount} câmpuri completate · {percent}%
            </span>
          )}
        </div>
      </div>

      {/* Field list — paper-style rows */}
      <dl className="divide-y divide-border/40">
        {fields.map((field) => (
          <DocumentFieldRow
            key={field.key}
            field={field}
            value={values[field.key]}
            editable={editable}
            onChange={onChange}
          />
        ))}
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

interface DocumentFieldRowProps {
  field: ClientField
  value: ClientFieldValue
  editable: boolean
  onChange?: (key: string, value: ClientFieldValue) => void
}

function DocumentFieldRow({ field, value, editable, onChange }: DocumentFieldRowProps) {
  const isMissing = field.required && isEmpty(value)
  const [focused, setFocused] = useState(false)

  const handleInput = (next: ClientFieldValue) => onChange?.(field.key, next)

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-1 px-5 py-3 transition-colors sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:gap-4 sm:px-6',
        editable && focused && 'bg-emerald-50/40',
        editable && isMissing && 'border-l-2 border-l-amber-300',
      )}
    >
      <dt className="pt-1 text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground/80">
        <label htmlFor={editable ? `doc-${field.key}` : undefined}>{field.label}</label>
        {field.required ? null : (
          <span className="ml-1 normal-case tracking-normal text-muted-foreground/60">
            (opțional)
          </span>
        )}
        {field.hint ? (
          <p className="mt-0.5 text-[0.65rem] normal-case tracking-normal text-muted-foreground/60">
            {field.hint}
          </p>
        ) : null}
      </dt>
      <dd className="min-w-0">
        {editable ? (
          <EditableField field={field} value={value} onChange={handleInput} onFocus={setFocused} onBlur={setFocused} />
        ) : (
          <ReadOnlyValue field={field} value={value} />
        )}
      </dd>
    </div>
  )
}

function ReadOnlyValue({ field, value }: { field: ClientField; value: ClientFieldValue }) {
  const formatted = formatReadOnly(field, value)
  if (formatted === '') {
    return (
      <span className="italic text-muted-foreground/50" aria-label="necompletat">
        —
      </span>
    )
  }
  return (
    <span
      className="break-words text-[0.82rem] text-foreground/90"
      style={{ fontFamily: 'var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace' }}
    >
      {formatted}
    </span>
  )
}

interface EditableFieldProps {
  field: ClientField
  value: ClientFieldValue
  onChange: (next: ClientFieldValue) => void
  onFocus: (focused: boolean) => void
  onBlur: (focused: boolean) => void
}

const INPUT_CLASS =
  'block w-full min-w-0 border-0 bg-transparent px-0 py-0.5 text-[0.82rem] text-foreground/90 placeholder:text-muted-foreground/40 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60'

function EditableField({ field, value, onChange, onFocus, onBlur }: EditableFieldProps) {
  const id = `doc-${field.key}`

  if (field.type === 'checkbox') {
    const checked = toBool(value)
    return (
      <label
        htmlFor={id}
        className="inline-flex cursor-pointer items-center gap-2 text-[0.82rem] text-foreground/90"
        style={{ fontFamily: 'var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace' }}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          onFocus={() => onFocus(true)}
          onBlur={() => onBlur(false)}
          className="size-4 rounded border-border text-emerald-700 accent-emerald-700 focus:ring-emerald-700"
        />
        <span>{checked ? 'Da' : 'Nu'}</span>
      </label>
    )
  }

  if (field.type === 'select') {
    return (
      <select
        id={id}
        value={toInputValue(value)}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        onFocus={() => onFocus(true)}
        onBlur={() => onBlur(false)}
        className={cn(INPUT_CLASS, 'cursor-pointer appearance-none bg-transparent')}
        aria-label={field.label}
        style={{ fontFamily: 'var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace' }}
      >
        <option value="">Alege…</option>
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        id={id}
        value={toInputValue(value)}
        maxLength={field.maxLength}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => onFocus(true)}
        onBlur={() => onBlur(false)}
        rows={3}
        placeholder={field.hint ?? '—'}
        className={cn(INPUT_CLASS, 'resize-y')}
        aria-label={field.label}
        style={{ fontFamily: 'var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace' }}
      />
    )
  }

  const inputType =
    field.type === 'number'
      ? 'number'
      : (field.type as 'text' | 'email' | 'tel' | 'date')

  return (
    <input
      id={id}
      type={inputType}
      value={toInputValue(value)}
      maxLength={field.maxLength}
      onChange={(e) => {
        const raw = e.target.value
        if (field.type === 'number') {
          onChange(raw === '' ? undefined : Number(raw))
        } else {
          onChange(raw)
        }
      }}
      onFocus={() => onFocus(true)}
      onBlur={() => onBlur(false)}
      placeholder={field.hint ?? '—'}
      className={INPUT_CLASS}
      aria-label={field.label}
      style={{ fontFamily: 'var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace' }}
    />
  )
}

function isEmpty(v: unknown): boolean {
  return v === undefined || v === null || v === ''
}
