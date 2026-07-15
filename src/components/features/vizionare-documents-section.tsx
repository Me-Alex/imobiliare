'use client'

import { useEffect, useState } from 'react'
import { Download, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { DOC_TYPE_LABELS } from '@/lib/constants'
import type { ViewingDocument } from '@/lib/types'
import { createDocumentUrl, listViewingDocuments } from '@/lib/viewing-documents'

export function VizionareDocumentsSection({ vizionareId }: { vizionareId: string }) {
  const [documents, setDocuments] = useState<ViewingDocument[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    listViewingDocuments(vizionareId)
      .then((rows) => active && setDocuments(rows))
      .catch(() => active && setDocuments([]))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [vizionareId])

  const handleDownload = async (document: ViewingDocument) => {
    try {
      const url = await createDocumentUrl(document, true)
      const link = window.document.createElement('a')
      link.href = url
      link.download = document.fileName
      link.rel = 'noopener'
      link.click()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Documentul nu poate fi descarcat.')
    }
  }

  if (loading) {
    return <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Se incarca documentele...</div>
  }
  if (documents.length === 0) return null

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <FileText className="h-3 w-3" /> Documente ({documents.length})
      </p>
      <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
        {documents.slice(0, 4).map((document) => (
          <div key={document.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs truncate flex-1">{document.title}</span>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0">{DOC_TYPE_LABELS[document.docType]}</Badge>
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{document.status === 'SIGNED' ? 'Semnat' : document.status === 'READY_TO_SIGN' ? 'De semnat' : 'Incarcat'}</Badge>
            <button type="button" onClick={() => void handleDownload(document)} className="p-1 rounded hover:bg-muted" title="Descarca">
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
