'use client'

/**
 * Small visual indicator for a document bucket.
 *
 * Five buckets, five treatments. The shape and color carry the meaning —
 * there is no "icon + label" combo because the pill itself is the icon.
 * Hover the pill to see a tooltip with the long description.
 */

import type { DocumentBucket } from '@/lib/documents/bucketing'
import {
  DOCUMENT_BUCKET_DESCRIPTION,
  DOCUMENT_BUCKET_LABEL,
} from '@/lib/documents/bucketing'
import { cn } from '@/lib/utils'

const TONE: Record<DocumentBucket, { dot: string; ring: string; text: string; bg: string }> = {
  draft: {
    dot: 'bg-warm-200',
    ring: 'ring-warm-200/60',
    text: 'text-warm-800',
    bg: 'bg-warm-50',
  },
  review: {
    dot: 'bg-amber-400',
    ring: 'ring-amber-400/40',
    text: 'text-amber-800',
    bg: 'bg-amber-50',
  },
  sign: {
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-500/40',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
  },
  signed: {
    dot: 'bg-emerald-700',
    ring: 'ring-emerald-700/30',
    text: 'text-emerald-900',
    bg: 'bg-emerald-50',
  },
  closed: {
    dot: 'bg-zinc-400',
    ring: 'ring-zinc-400/30',
    text: 'text-zinc-700',
    bg: 'bg-zinc-50',
  },
}

export interface StatePillProps {
  bucket: DocumentBucket
  /** Optional override for the label (e.g. "Necesită semnătura ta"). */
  label?: string
  /** Render the description as a tooltip on hover. Defaults to true. */
  showTooltip?: boolean
  className?: string
}

export function StatePill({ bucket, label, showTooltip = true, className }: StatePillProps) {
  const tone = TONE[bucket]
  const text = label ?? DOCUMENT_BUCKET_LABEL[bucket]
  const tip = DOCUMENT_BUCKET_DESCRIPTION[bucket]

  return (
    <span
      title={showTooltip ? tip : undefined}
      aria-label={tip}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        tone.bg,
        tone.text,
        tone.ring,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', tone.dot)} aria-hidden="true" />
      {text}
    </span>
  )
}
