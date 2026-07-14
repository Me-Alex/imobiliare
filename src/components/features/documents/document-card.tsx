'use client'

import { File, Eye, Download, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DOC_TYPE_LABELS } from '@/lib/constants'
import type { UploadedDocument } from '@/lib/types'
import { cn } from '@/lib/utils'
import { DOC_TYPE_CONFIG } from './document-type-selector'

// ─── Helpers ───────────────────────────────────────────────────────────

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

function base64ToBytes(base64: string): number {
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64
  return Math.ceil((base64Data.length * 3) / 4)
}

// ─── Props ──────────────────────────────────────────────────────────────

interface DocumentCardProps {
  document: UploadedDocument
  onView: (doc: UploadedDocument) => void
  onDownload: (doc: UploadedDocument) => void
  onDelete: (docId: string) => void
}

// ─── Component ──────────────────────────────────────────────────────────

export function DocumentCard({ document: doc, onView, onDownload, onDelete }: DocumentCardProps) {
  const config = DOC_TYPE_CONFIG.find((c) => c.type === doc.docType)
  const Icon = config?.icon ?? File
  const fileSize = base64ToBytes(doc.fileData)

  return (
    <>
      {/* Desktop table row */}
      <tr className="hover:bg-muted/30 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                config?.bgColor ?? 'bg-muted',
              )}
            >
              <Icon className={cn('h-4 w-4', config?.color ?? 'text-muted-foreground')} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate max-w-[200px]">{doc.fileName}</p>
              <p className="text-[10px] text-muted-foreground">{doc.fileType}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <Badge variant="outline" className="text-[11px]">
            {DOC_TYPE_LABELS[doc.docType]}
          </Badge>
        </td>
        <td className="px-4 py-3">
          <span className="text-sm text-muted-foreground">{formatFileSize(fileSize)}</span>
        </td>
        <td className="px-4 py-3">
          <span className="text-sm text-muted-foreground">{formatUploadDate(doc.uploadedAt)}</span>
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(doc)}
              className="h-8 w-8 p-0"
              aria-label="Vezi document"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownload(doc)}
              className="h-8 w-8 p-0"
              aria-label="Descarca document"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(doc.id)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              aria-label="Sterge document"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>

      {/* Mobile card */}
      <div className="flex items-center justify-between p-4 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              config?.bgColor ?? 'bg-muted',
            )}
          >
            <Icon className={cn('h-5 w-5', config?.color ?? 'text-muted-foreground')} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{doc.fileName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {DOC_TYPE_LABELS[doc.docType]}
              </Badge>
              <span className="text-[10px] text-muted-foreground">{formatFileSize(fileSize)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {formatUploadDate(doc.uploadedAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(doc)}
            className="h-8 w-8 p-0"
            aria-label="Vezi"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDownload(doc)}
            className="h-8 w-8 p-0"
            aria-label="Descarca"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(doc.id)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            aria-label="Sterge"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  )
}