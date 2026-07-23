'use client'

/**
 * The new documents workspace — the single screen that replaces the
 * sprawling `documente-page.tsx`.
 *
 * Layout, top to bottom:
 *   1. Hero strip    — property + transaction summary, one line
 *   2. Identity card — collected once, reused everywhere (optional)
 *   3. Timeline      — the 5-bucket vertical timeline
 *   4. Footer note   — a single line about who to contact
 *
 * No dialogs, no tabs, no modals. Everything fits in one page.
 *
 * Style: minimal, documentary. The single emerald accent appears on
 * the active timeline step and the "ready" / "signed" pills. The rest
 * is grayscale and warm neutrals. The page is meant to read like the
 * cover sheet of a paper folder.
 */

import type { ReactNode } from 'react'
import { FileSignature } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DocumentTimeline, type TimelineItem } from './document-timeline'
import { IdentityCard, type IdentityValue } from './identity-card'
import { StatePill } from './state-pill'
import {
  mostAdvancedBucket,
  type DocumentBucket,
} from '@/lib/documents/bucketing'
import { cn } from '@/lib/utils'

export interface DocumentWorkspaceProps {
  /** Property + transaction summary shown in the hero strip. */
  summary: {
    propertyTitle: string
    propertyZone?: string
    transactionType: 'SALE' | 'RENTAL'
    transactionStage: string
  }
  /** Optional identity card. Hide it by passing null. */
  identity?: {
    role: 'CLIENT' | 'OWNER'
    value: IdentityValue | null
    onSave: (next: IdentityValue) => void | Promise<void>
  } | null
  /** The documents to render in the timeline. */
  documents: readonly TimelineItem[]
  /** Primary CTA on the right side of the hero strip. */
  heroAction?: ReactNode
  /** Footer line. */
  footerNote?: ReactNode
  className?: string
}

const STAGE_LABEL: Record<string, string> = {
  VIEWING: 'Vizionare',
  NEGOTIATION: 'Negociere',
  CONTRACT: 'Contract',
  HANDOVER: 'Predare',
  CLOSED: 'Încheiată',
}

export function DocumentWorkspace({
  summary,
  identity,
  documents,
  heroAction,
  footerNote,
  className,
}: DocumentWorkspaceProps) {
  const advanced: DocumentBucket | null = mostAdvancedBucket(documents)
  const total = documents.length

  return (
    <div className={cn('mx-auto w-full max-w-3xl space-y-8', className)}>
      {/* Hero strip */}
      <header className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Dosar tranzacție
          </p>
          <h1 className="mt-1 truncate font-serif text-2xl text-foreground" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {summary.propertyTitle}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {summary.propertyZone ? `${summary.propertyZone} · ` : ''}
            {summary.transactionType === 'SALE' ? 'Vânzare' : 'Închiriere'} · Etapă: {STAGE_LABEL[summary.transactionStage] ?? summary.transactionStage}
            {total > 0 ? ` · ${total} ${total === 1 ? 'document' : 'documente'}` : ''}
          </p>
          {advanced ? (
            <div className="mt-3">
              <StatePill bucket={advanced} />
            </div>
          ) : null}
        </div>
        {heroAction ? <div className="shrink-0">{heroAction}</div> : null}
      </header>

      {/* Identity */}
      {identity ? (
        <IdentityCard
          role={identity.role}
          value={identity.value}
          onSave={identity.onSave}
        />
      ) : null}

      {/* Timeline */}
      <section>
        <header className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-medium text-foreground">Documente</h2>
          <span className="text-xs text-muted-foreground">
            {total} {total === 1 ? 'intrare' : 'intrări'}
          </span>
        </header>
        <DocumentTimeline documents={documents} />
      </section>

      {/* Footer */}
      <footer className="flex flex-col gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        {footerNote ?? (
          <span>
            Orice modificare este înregistrată în jurnalul tranzacției. Contact:&nbsp;
            <a className="link-underline" href="mailto:office@hqs.ro">
              office@hqs.ro
            </a>
          </span>
        )}
        {advanced === 'closed' ? null : (
          <Button variant="ghost" size="sm" className="self-start sm:self-auto">
            <FileSignature className="mr-1.5 size-3.5" aria-hidden="true" />
            Istoric semnături
          </Button>
        )}
      </footer>
    </div>
  )
}
