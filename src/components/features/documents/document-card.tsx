'use client'

import { useState } from 'react'
import { Download, Eye, File, FileSignature, LockKeyhole, ShieldCheck, Trash2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DOC_TYPE_LABELS } from '@/lib/constants'
import type { DocumentSigner, ViewingDocument } from '@/lib/types'
import { cn } from '@/lib/utils'
import { DOC_TYPE_CONFIG } from './document-type-selector'
import { DocumentEventTimeline } from './document-event-timeline'

const STATUS_LABELS: Record<ViewingDocument['status'], string> = {
  DRAFT: 'Ciorna',
  PENDING: 'In asteptare',
  UPLOADED: 'Incarcat',
  READY_TO_SIGN: 'De semnat',
  PARTIALLY_SIGNED: 'Semnat partial',
  SIGNED: 'Semnat',
  DECLINED: 'Refuzat',
  APPROVED: 'Aprobat',
  REJECTED: 'Respins',
  EXPIRED: 'Expirat',
  SUPERSEDED: 'Versiune veche',
}

function formatUploadDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function statusClass(status: ViewingDocument['status']): string {
  if (status === 'SIGNED' || status === 'APPROVED') return 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
  if (status === 'READY_TO_SIGN' || status === 'PARTIALLY_SIGNED') return 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
  if (status === 'DECLINED' || status === 'REJECTED' || status === 'EXPIRED') return 'border-red-300 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
  return 'border-border bg-muted/50 text-muted-foreground'
}

// ─── Shared: Document meta info ────────────────────────────────────────────────

function DocumentMeta({ doc }: { doc: ViewingDocument }) {
  const config = DOC_TYPE_CONFIG.find((item) => item.type === doc.docType)
  const Icon = config?.icon ?? File

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', config?.bgColor ?? 'bg-muted')}>
        <Icon className={cn('h-4 w-4', config?.color ?? 'text-muted-foreground')} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{doc.title}</p>
        <p className="text-[10px] text-muted-foreground truncate">{doc.fileName}</p>
        {doc.legalVersion && <p className="text-[10px] text-muted-foreground">Versiune {doc.legalVersion}</p>}
      </div>
    </div>
  )
}

function StatusBadge({ doc }: { doc: ViewingDocument }) {
  return (
    <div className="flex flex-col gap-1">
      <Badge variant="outline" className={cn('text-[11px] w-fit', statusClass(doc.status))}>
        {doc.lockedAt && <LockKeyhole className="h-3 w-3 mr-1" />}
        {STATUS_LABELS[doc.status]}
      </Badge>
      {doc.signatureRequirement !== 'SIMPLE' && (
        <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300 w-fit">
          <ShieldCheck className="mr-1 h-3 w-3" /> Semnatura avansata/calificata
        </Badge>
      )}
    </div>
  )
}

// ─── Shared: Actions ───────────────────────────────────────────────────────────

interface DocumentActionsProps {
  document: ViewingDocument
  currentUserId: string
  canDelete: boolean
  onView: (document: ViewingDocument) => void
  onDownload: (document: ViewingDocument) => void
  onDelete: (document: ViewingDocument) => void
  onSign: (document: ViewingDocument, signer: DocumentSigner) => void
}

function DocumentActions({
  document,
  currentUserId,
  canDelete,
  onView,
  onDownload,
  onDelete,
  onSign,
}: DocumentActionsProps) {
  const pendingSigner = document.signers.find(
    (signer) => signer.userId === currentUserId && signer.status === 'PENDING',
  )
  const canSignHere = pendingSigner
    && document.signatureRequirement === 'SIMPLE'
    && ['READY_TO_SIGN', 'PARTIALLY_SIGNED'].includes(document.status)

  return (
    <div className="flex items-center justify-end gap-1">
      {canSignHere && (
        <Button
          size="sm"
          onClick={() => onSign(document, pendingSigner)}
          className="h-8 gap-1.5 px-2.5"
        >
          <FileSignature className="h-3.5 w-3.5" />
          <span className="hidden xl:inline">Semneaza</span>
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={() => onView(document)} className="h-8 w-8 p-0" aria-label="Vezi documentul">
        <Eye className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onDownload(document)} className="h-8 w-8 p-0" aria-label="Descarca documentul">
        <Download className="h-4 w-4" />
      </Button>
      {canDelete && (
        <Button variant="ghost" size="sm" onClick={() => onDelete(document)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" aria-label="Sterge documentul">
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

// ─── Desktop: Table Row ────────────────────────────────────────────────────────

export type DocumentTableRowProps = DocumentActionsProps

export function DocumentTableRow(props: DocumentTableRowProps) {
  const { document: doc } = props

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <DocumentMeta doc={doc} />
      </td>
      <td className="px-4 py-3">
        <Badge variant="outline" className="text-[11px]">{DOC_TYPE_LABELS[doc.docType]}</Badge>
      </td>
      <td className="px-4 py-3">
        <StatusBadge doc={doc} />
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{formatFileSize(doc.byteSize)}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{formatUploadDate(doc.uploadedAt)}</td>
      <td className="px-4 py-3 text-right">
        <DocumentActions {...props} />
      </td>
    </tr>
  )
}

// ─── Mobile: Card ──────────────────────────────────────────────────────────────

export type DocumentMobileCardProps = DocumentActionsProps

export function DocumentMobileCard(props: DocumentMobileCardProps) {
  const { document: doc } = props
  const [expanded, setExpanded] = useState(false)
  const config = DOC_TYPE_CONFIG.find((item) => item.type === doc.docType)
  const Icon = config?.icon ?? File

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', config?.bgColor ?? 'bg-muted')}>
          <Icon className={cn('h-5 w-5', config?.color ?? 'text-muted-foreground')} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{doc.title}</p>
          <p className="text-[10px] text-muted-foreground truncate">{doc.fileName}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <Badge variant="outline" className="text-[10px]">{DOC_TYPE_LABELS[doc.docType]}</Badge>
            <Badge variant="outline" className={cn('text-[10px]', statusClass(doc.status))}>{STATUS_LABELS[doc.status]}</Badge>
            {doc.signatureRequirement !== 'SIMPLE' && <Badge variant="outline" className="text-[10px]">Semnatura avansata/calificata</Badge>}
            <span className="text-[10px] text-muted-foreground">{formatFileSize(doc.byteSize)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown className={cn('h-3 w-3 transition-transform', expanded && 'rotate-180')} />
          Istoric
        </button>
        <span className="text-[10px] text-muted-foreground">{formatUploadDate(doc.uploadedAt)}</span>
        <DocumentActions {...props} />
      </div>

      {expanded && (
        <DocumentEventTimeline document={doc} />
      )}
    </div>
  )
}

// ─── Legacy export for backward compatibility ──────────────────────────────────

export function DocumentCard(props: DocumentActionsProps) {
  return (
    <>
      <DocumentTableRow {...props} />
      <DocumentMobileCard {...props} />
    </>
  )
}
