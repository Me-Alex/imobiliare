'use client'

import { Download, Eye, File, FileSignature, LockKeyhole, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DOC_TYPE_LABELS } from '@/lib/constants'
import type { DocumentSigner, ViewingDocument } from '@/lib/types'
import { cn } from '@/lib/utils'
import { DOC_TYPE_CONFIG } from './document-type-selector'

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

interface DocumentCardProps {
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
}: DocumentCardProps) {
  const pendingSigner = document.signers.find(
    (signer) => signer.userId === currentUserId && signer.status === 'PENDING',
  )

  return (
    <div className="flex items-center justify-end gap-1">
      {pendingSigner && (
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

export function DocumentCard(props: DocumentCardProps) {
  const doc = props.document
  const config = DOC_TYPE_CONFIG.find((item) => item.type === doc.docType)
  const Icon = config?.icon ?? File

  return (
    <>
      <tr className="hover:bg-muted/30 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', config?.bgColor ?? 'bg-muted')}>
              <Icon className={cn('h-4 w-4', config?.color ?? 'text-muted-foreground')} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate max-w-[220px]">{doc.title}</p>
              <p className="text-[10px] text-muted-foreground truncate max-w-[220px]">{doc.fileName}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3"><Badge variant="outline" className="text-[11px]">{DOC_TYPE_LABELS[doc.docType]}</Badge></td>
        <td className="px-4 py-3">
          <Badge variant="outline" className={cn('text-[11px]', statusClass(doc.status))}>
            {doc.lockedAt && <LockKeyhole className="h-3 w-3 mr-1" />}
            {STATUS_LABELS[doc.status]}
          </Badge>
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground">{formatFileSize(doc.byteSize)}</td>
        <td className="px-4 py-3 text-sm text-muted-foreground">{formatUploadDate(doc.uploadedAt)}</td>
        <td className="px-4 py-3 text-right"><DocumentActions {...props} /></td>
      </tr>

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
              <span className="text-[10px] text-muted-foreground">{formatFileSize(doc.byteSize)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground">{formatUploadDate(doc.uploadedAt)}</span>
          <DocumentActions {...props} />
        </div>
      </div>
    </>
  )
}
