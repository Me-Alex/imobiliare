/**
 * Transaction-shape definition.
 *
 * One of the goals of the new documents pipeline is to keep the
 * client-facing UI as small as possible. To do that we define, per
 * `TransactionKind`, exactly what the client is asked to provide and
 * what the agency handles internally.
 *
 * The shape is a plain data structure — no React, no DB, no network.
 * Any caller (the booking page, the document workspace, an email
 * reminder) can use it to decide what to render.
 *
 * RENTAL philosophy: the client fills out a single short form
 * (the "viewing report") and is done. The agency drafts the rental
 * contract and handover protocol in the background.
 *
 * SALE philosophy: a three-stage progressive disclosure. The client
 * only sees the next step, not the whole pipeline.
 *
 * The 11 internal document statuses still exist; they are bucketed
 * down to the 5 user-facing buckets in `bucketing.ts`. This module
 * only describes what the CLIENT is asked to do.
 */

import type { DocumentKind } from './types'

export type TransactionKind = 'RENTAL' | 'SALE'

/** A single field the client is asked to provide. */
export interface ClientField {
  /** Stable key for form state. */
  key: string
  /** Romanian label, single line. */
  label: string
  /** Optional helper text under the field. */
  hint?: string
  /** Field type for the form renderer. */
  type: 'text' | 'email' | 'tel' | 'date' | 'number' | 'textarea' | 'select' | 'checkbox'
  /** Pre-defined options for `select` fields. */
  options?: ReadonlyArray<{ value: string; label: string }>
  /** Whether the field must be filled before submission. */
  required: boolean
  /** Max length for text fields. */
  maxLength?: number
}

/** A single stage in the SALE flow. Stages unlock in order. */
export interface SaleStage {
  id: 'identity' | 'offer' | 'contract'
  /** Document kind that backs this stage. */
  documentKind: DocumentKind
  /** Romanian title shown in the workspace. */
  title: string
  /** Single-line description of what the client does. */
  blurb: string
  /** Fields the client fills in at this stage. */
  fields: readonly ClientField[]
  /** The next stage (last stage has no next). */
  unlocks: 'offer' | 'contract' | null
}

export interface RentalShape {
  kind: 'RENTAL'
  /** The single document the client is asked to sign. */
  documentKind: DocumentKind
  /** Romanian title shown in the workspace. */
  title: string
  /** Single-line description. */
  blurb: string
  /** Fields the client fills out (the entire client-side flow). */
  fields: readonly ClientField[]
}

export interface SaleShape {
  kind: 'SALE'
  /** The three progressive stages. */
  stages: readonly SaleStage[]
}

export type TransactionShape = RentalShape | SaleShape

// ─── RENTAL shape ─────────────────────────────────────────────
//
// 9 fields. Fits on one screen. The agency drafts the rental
// contract and handover protocol internally — the client never
// sees them until they're ready to sign.

const RENTAL_FIELDS: readonly ClientField[] = [
  { key: 'fullName', label: 'Nume complet', type: 'text', required: true, maxLength: 80 },
  { key: 'idDocument', label: 'Carte de identitate', hint: 'Seria și numărul', type: 'text', required: true, maxLength: 32 },
  { key: 'address', label: 'Adresa de domiciliu', type: 'text', required: true, maxLength: 120 },
  { key: 'email', label: 'Email', type: 'email', required: true, maxLength: 120 },
  { key: 'phone', label: 'Telefon', type: 'tel', required: true, maxLength: 24 },
  {
    key: 'moveInDate',
    label: 'Data estimată de mutare',
    hint: 'Când vrei să te muți',
    type: 'date',
    required: true,
  },
  {
    key: 'occupants',
    label: 'Număr de persoane',
    type: 'number',
    required: true,
  },
  {
    key: 'hasPets',
    label: 'Am animale de companie',
    type: 'checkbox',
    required: false,
  },
  {
    key: 'notes',
    label: 'Alte detalii',
    hint: 'Opțional — ce ar trebui să știe agentul',
    type: 'textarea',
    required: false,
    maxLength: 600,
  },
] as const

// ─── SALE shape ────────────────────────────────────────────────
//
// Three stages, progressive. The client only sees the active one.

const SALE_STAGE_IDENTITY: SaleStage = {
  id: 'identity',
  documentKind: 'brokerage_agreement',
  title: 'Cine ești și ce cauți',
  blurb: 'Completezi o singură dată. Pe baza acestor date agentul pregătește oferta.',
  unlocks: 'offer',
  fields: [
    { key: 'fullName', label: 'Nume complet', type: 'text', required: true, maxLength: 80 },
    { key: 'idDocument', label: 'Carte de identitate', type: 'text', required: true, maxLength: 32 },
    { key: 'address', label: 'Adresa de domiciliu', type: 'text', required: true, maxLength: 120 },
    { key: 'email', label: 'Email', type: 'email', required: true, maxLength: 120 },
    { key: 'phone', label: 'Telefon', type: 'tel', required: true, maxLength: 24 },
    {
      key: 'financing',
      label: 'Tip finanțare',
      type: 'select',
      required: true,
      options: [
        { value: 'cash', label: 'Integral din surse proprii' },
        { value: 'mortgage', label: 'Credit ipotecar' },
        { value: 'mixed', label: 'Mix (avans + credit)' },
      ],
    },
    {
      key: 'budgetMin',
      label: 'Buget minim (EUR)',
      type: 'number',
      required: false,
    },
    {
      key: 'budgetMax',
      label: 'Buget maxim (EUR)',
      type: 'number',
      required: true,
    },
    {
      key: 'preferredZones',
      label: 'Zone preferate',
      hint: 'Separate prin virgulă',
      type: 'text',
      required: false,
      maxLength: 200,
    },
    {
      key: 'timeline',
      label: 'Când vrei să cumperi',
      type: 'select',
      required: true,
      options: [
        { value: '1m', label: 'Sub 1 lună' },
        { value: '3m', label: '1–3 luni' },
        { value: '6m', label: '3–6 luni' },
        { value: '12m+', label: 'Peste 6 luni' },
      ],
    },
  ] as const,
}

const SALE_STAGE_OFFER: SaleStage = {
  id: 'offer',
  documentKind: 'reservation_offer',
  title: 'Ofertă și rezervare',
  blurb: 'Agentul a pregătit condițiile. Confirmă sau ajustează, apoi semnezi.',
  unlocks: 'contract',
  fields: [
    {
      key: 'amount',
      label: 'Suma oferită (EUR)',
      hint: 'Poate fi ajustată înainte de semnare',
      type: 'number',
      required: true,
    },
    {
      key: 'conditions',
      label: 'Condiții',
      hint: 'Ex: credit pre-aprobat, mobila rămâne, predare în 60 zile',
      type: 'textarea',
      required: false,
      maxLength: 800,
    },
    {
      key: 'deposit',
      label: 'Avans plătit acum (EUR)',
      type: 'number',
      required: false,
    },
  ] as const,
}

const SALE_STAGE_CONTRACT: SaleStage = {
  id: 'contract',
  documentKind: 'handover_protocol',
  title: 'Contract și predare',
  blurb: 'Actele notariale. Te contactăm pentru programare.',
  unlocks: null,
  fields: [
    {
      key: 'notaryPreference',
      label: 'Notar preferat',
      hint: 'Opțional — altfel folosim partenerul nostru',
      type: 'text',
      required: false,
      maxLength: 120,
    },
    {
      key: 'confirm',
      label: 'Confirm că datele sunt corecte',
      type: 'checkbox',
      required: true,
    },
  ] as const,
}

// ─── Public shape definitions ──────────────────────────────────

export const RENTAL_SHAPE: RentalShape = {
  kind: 'RENTAL',
  documentKind: 'viewing_report',
  title: 'Fișă de vizionare',
  blurb:
    'Completezi o singură dată. Agentul pregătește contractul și procesul verbal de predare.',
  fields: RENTAL_FIELDS,
}

export const SALE_SHAPE: SaleShape = {
  kind: 'SALE',
  stages: [SALE_STAGE_IDENTITY, SALE_STAGE_OFFER, SALE_STAGE_CONTRACT],
}

export function getTransactionShape(kind: TransactionKind): TransactionShape {
  return kind === 'RENTAL' ? RENTAL_SHAPE : SALE_SHAPE
}

/** Returns the active stage for a SALE transaction given the highest completed stage. */
export function activeSaleStage(shape: SaleShape, completedStageIds: readonly string[]): SaleStage {
  const completed = new Set(completedStageIds)
  for (const stage of shape.stages) {
    if (!completed.has(stage.id)) return stage
  }
  // All stages done — return the last one as a sentinel.
  return shape.stages[shape.stages.length - 1]!
}
