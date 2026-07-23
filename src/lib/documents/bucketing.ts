/**
 * Visual state bucketing for the documents workspace.
 *
 * The internal state machine exposes 11 granular states (DRAFT, REQUESTED,
 * IN_REVIEW, NEEDS_INFO, READY_TO_SIGN, PARTIALLY_SIGNED, SIGNED, APPROVED,
 * REJECTED, CANCELLED, SUPERSEDED). That level of detail is necessary for
 * correctness — but it is far too much information for a user-facing
 * timeline. This module collapses them into five human-readable buckets.
 *
 * The mapping is total and deterministic: every internal status maps to
 * exactly one bucket. Bucket order is the order they should appear in a
 * timeline (left to right, top to bottom).
 *
 * The 5 buckets are:
 *   1. draft        — work in progress, only the creator can see
 *   2. review       — staff is validating (requested, in review, needs info)
 *   3. sign         — waiting for participant signatures
 *   4. signed       — fully signed, awaiting final approval
 *   5. closed       — terminal, no further action (approved, rejected, etc.)
 *
 * The bucketing is intentionally one-way (status → bucket, never the
 * reverse). UI code that needs the granular state should read it from the
 * document directly; the bucket is only for grouping and presentation.
 */

import type { DocumentStatus } from './types'

export type DocumentBucket = 'draft' | 'review' | 'sign' | 'signed' | 'closed'

export const DOCUMENT_BUCKETS = ['draft', 'review', 'sign', 'signed', 'closed'] as const satisfies readonly DocumentBucket[]

export const DOCUMENT_BUCKET_ORDER: readonly DocumentBucket[] = [
  'draft',
  'review',
  'sign',
  'signed',
  'closed',
]

/** Human-readable label shown in the UI. */
export const DOCUMENT_BUCKET_LABEL: Record<DocumentBucket, string> = {
  draft: 'Ciornă',
  review: 'În verificare',
  sign: 'Gata de semnat',
  signed: 'Semnat',
  closed: 'Închis',
}

/** Short description for tooltips. */
export const DOCUMENT_BUCKET_DESCRIPTION: Record<DocumentBucket, string> = {
  draft: 'Se completează. Doar autorul și agentul îl pot vedea.',
  review: 'Datele sunt la agent. Se verifică înainte de a genera versiunea oficială.',
  sign: 'Documentul este gata. Așteaptă semnături de la părți.',
  signed: 'Toate semnăturile au fost colectate. Urmează aprobarea finală.',
  closed: 'Dosar încheiat. Nu mai sunt acțiuni.',
}

/**
 * Maps a granular internal status to a user-facing bucket.
 *
 * The mapping is exhaustive — TypeScript will fail to compile if a new
 * status is added without an explicit bucket assignment.
 */
export function bucketForStatus(status: DocumentStatus): DocumentBucket {
  switch (status) {
    case 'DRAFT':
      return 'draft'
    case 'REQUESTED':
    case 'IN_REVIEW':
    case 'NEEDS_INFO':
      return 'review'
    case 'READY_TO_SIGN':
    case 'PARTIALLY_SIGNED':
      return 'sign'
    case 'SIGNED':
    case 'APPROVED':
      return 'signed'
    case 'REJECTED':
    case 'CANCELLED':
    case 'SUPERSEDED':
      return 'closed'
  }
}

/**
 * Groups documents into their buckets. Preserves bucket order. Empty
 * buckets are omitted from the returned object so the UI can render
 * only the buckets that actually have documents.
 */
export function groupByBucket<T extends { status: DocumentStatus }>(
  documents: readonly T[],
): Record<DocumentBucket, T[]> {
  const result: Record<DocumentBucket, T[]> = {
    draft: [],
    review: [],
    sign: [],
    signed: [],
    closed: [],
  }
  for (const doc of documents) {
    result[bucketForStatus(doc.status)].push(doc)
  }
  return result
}

/**
 * Returns the position (0-indexed) of a bucket in the canonical order.
 * Useful for progress bars and "X of N" indicators.
 */
export function bucketIndex(bucket: DocumentBucket): number {
  return DOCUMENT_BUCKET_ORDER.indexOf(bucket)
}

/**
 * Returns the most-advanced bucket present in a list of documents.
 *
 * The five buckets don't form a single linear progression: `signed` and
 * `closed` are both terminal, but `signed` is the happy path (APPROVED)
 * and `closed` is the unhappy path (REJECTED, CANCELLED, SUPERSEDED).
 *
 * Semantics:
 *   - If any document is in `signed`, return `signed`. The user has
 *     successfully completed at least one document — the happy path wins.
 *   - Otherwise, return the highest bucket present by index order. The
 *     index order is draft → review → sign → signed → closed.
 *   - Empty input returns null.
 */
export function mostAdvancedBucket(
  documents: readonly { status: DocumentStatus }[],
): DocumentBucket | null {
  if (documents.length === 0) return null

  const buckets = documents.map((d) => bucketForStatus(d.status))

  // Happy path wins: at least one document reached APPROVED/SIGNED.
  if (buckets.includes('signed')) return 'signed'

  let bestIndex = -1
  for (const bucket of buckets) {
    const idx = bucketIndex(bucket)
    if (idx > bestIndex) bestIndex = idx
  }
  return DOCUMENT_BUCKET_ORDER[bestIndex] ?? null
}
