'use client'

/**
 * Minimal document card for the new documents workspace.
 *
 * Designed to be a single row in a vertical timeline. The layout is
 * deliberately low-density: one line of title, one pill for the state,
 * one line of metadata, one action. No decorative icons inside the card.
 *
 * The visual hierarchy is:
 *   title (medium weight)   — what the user is looking at
 *   pill (small)            — where it stands
 *   metadata (muted, small) — when, by whom, what kind
 *   action (right-aligned)  — what to do next
 */

import type { ReactNode } from 'react'
import type { DocumentBucket } from '@/lib/documents/bucketing'
import { StatePill } from './state-pill'
import { cn } from '@/lib/utils'

export interface DocumentCardProps {
  /** The visual bucket — drives the pill. */
  bucket: DocumentBucket
  /** Human title (already localized). */
  title: string
  /** Optional subtitle (e.g. "Versiunea 2", "Vizionare 14 iulie"). */
  subtitle?: string
  /** Optional pill label override. */
  stateLabel?: string
  /** Free-form metadata rendered in a small, muted line. */
  meta?: ReactNode
  /** Primary action button. */
  action?: ReactNode
  /** Optional secondary action rendered as a text link. */
  secondaryAction?: ReactNode
  onClick?: () => void
  className?: string
}

export function DocumentCard({
  bucket,
  title,
  subtitle,
  stateLabel,
  meta,
  action,
  secondaryAction,
  onClick,
  className,
}: DocumentCardProps) {
  return (
    <article
      onClick={onClick}
      className={cn(
        'group flex items-center gap-4 border-b border-border/60 py-4 last:border-b-0',
        onClick && 'cursor-pointer transition-colors hover:bg-muted/30',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <h3 className="truncate text-sm font-medium text-foreground">{title}</h3>
          <StatePill bucket={bucket} label={stateLabel} />
        </div>
        {subtitle ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
        {meta ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {meta}
          </div>
        ) : null}
        {secondaryAction ? (
          <div className="mt-1.5 text-xs">{secondaryAction}</div>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </article>
  )
}
