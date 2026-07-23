'use client'

/**
 * Vertical timeline that groups documents by their visual bucket.
 *
 * The five sections (Draft, În lucru, Gata de semnat, Semnat, Închis)
 * are listed in the canonical order. Empty sections are hidden by
 * default so the page never shows gaps. Each section has:
 *   - a one-line label with the count
 *   - a subtle hairline separator
 *   - a list of `DocumentCard` rows
 *
 * The layout is intentionally vertical and left-aligned. It reads like
 * a table of contents for a legal folder.
 */

import { Fragment, useMemo } from 'react'
import {
  DOCUMENT_BUCKET_DESCRIPTION,
  DOCUMENT_BUCKET_LABEL,
  DOCUMENT_BUCKET_ORDER,
  type DocumentBucket,
  groupByBucket,
} from '@/lib/documents/bucketing'
import type { DocumentStatus } from '@/lib/documents/types'
import { DocumentCard, type DocumentCardProps } from './document-card'
import { cn } from '@/lib/utils'

export interface TimelineItem {
  id: string
  status: DocumentStatus
  /** Extra props forwarded to `DocumentCard`. */
  card: Omit<DocumentCardProps, 'bucket'>
}

export interface DocumentTimelineProps {
  documents: readonly TimelineItem[]
  /** Buckets to skip rendering even if they have items (rare). */
  hiddenBuckets?: readonly DocumentBucket[]
  className?: string
}

export function DocumentTimeline({ documents, hiddenBuckets = [], className }: DocumentTimelineProps) {
  const grouped = useMemo(
    () => groupByBucket(documents),
    [documents],
  )

  const sections = DOCUMENT_BUCKET_ORDER
    .filter((b) => !hiddenBuckets.includes(b))
    .map((bucket) => ({ bucket, items: grouped[bucket] }))
    .filter((s) => s.items.length > 0)

  if (sections.length === 0) {
    return (
      <div className={cn('rounded-md border border-dashed border-border/80 bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground', className)}>
        Nu există documente în tranzacție.
      </div>
    )
  }

  return (
    <div className={cn('divide-y divide-border/40', className)}>
      {sections.map(({ bucket, items }) => (
        <section key={bucket} aria-label={DOCUMENT_BUCKET_LABEL[bucket]} className="py-3 first:pt-0 last:pb-0">
          <header className="mb-2 flex items-baseline justify-between gap-3">
            <h2 className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
              {DOCUMENT_BUCKET_LABEL[bucket]}
            </h2>
            <span className="text-[0.7rem] tabular-nums text-muted-foreground/70">
              {items.length} {items.length === 1 ? 'document' : 'documente'}
            </span>
          </header>
          <p className="mb-2 text-xs text-muted-foreground/80">{DOCUMENT_BUCKET_DESCRIPTION[bucket]}</p>
          <div>
            {items.map((item) => (
              <Fragment key={item.id}>
                <DocumentCard bucket={bucket} {...item.card} />
              </Fragment>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
