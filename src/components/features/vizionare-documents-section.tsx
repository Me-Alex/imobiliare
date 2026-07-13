'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Eye, File, Trash2 } from 'lucide-react'
import { loadFromLS, saveToLS } from '@/lib/storage'
import { DOC_TYPE_LABELS, LS_KEYS } from '@/lib/constants'
import type { UploadedDocument } from '@/lib/types'
import { toast } from 'sonner'

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDocFileIcon(fileType: string) {
  if (fileType.includes('pdf')) return FileText
  if (fileType.includes('image')) return Eye
  return File
}

// ─── Document Badge ─────────────────────────────────────────────────────────

function DocTypeBadge({ docType }: { docType: UploadedDocument['docType'] }) {
  return (
    <span className="text-[10px] px-2 py-0 h-5 inline-flex items-center rounded-full bg-secondary text-secondary-foreground font-medium">
      {DOC_TYPE_LABELS[docType]}
    </span>
  )
}

// ─── Document List ──────────────────────────────────────────────────────────

export function VizionareDocumentsSection({ vizionareId }: { vizionareId: string }) {
  const [refreshKey, setRefreshKey] = useState(0)
  const documents = useMemo(() => {
    const allDocs = loadFromLS<UploadedDocument[]>(LS_KEYS.DOCUMENTS, [])
    return allDocs.filter(d => d.vizionareId === vizionareId)
  }, [vizionareId, refreshKey])

  if (documents.length === 0) return null

  const handleDownload = (doc: UploadedDocument) => {
    const link = document.createElement('a')
    link.href = doc.filePreview || `data:application/octet-stream;base64,${doc.fileData}`
    link.download = doc.fileName
    link.click()
  }

  const handlePreview = (doc: UploadedDocument) => {
    if (doc.fileType.includes('image')) {
      const w = window.open('')
      if (w) {
        w.document.write(`
          <html><head><title>${doc.fileName}</title><style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#111;}</style></head>
          <body><img src="${doc.filePreview}" style="max-width:100%;max-height:100vh;" /></body></html>
        `)
      }
    } else {
      handleDownload(doc)
    }
  }

  const handleDelete = (docId: string) => {
    const allDocs = loadFromLS<UploadedDocument[]>(LS_KEYS.DOCUMENTS, [])
    saveToLS(LS_KEYS.DOCUMENTS, allDocs.filter(d => d.id !== docId))
    setRefreshKey(k => k + 1)
    toast.success('Document sters')
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <FileText className="h-3 w-3" />
        Documente ({documents.length})
      </p>
      <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
        {documents.map((doc) => {
          const Icon = getDocFileIcon(doc.fileType)
          return (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 group"
            >
              <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-xs truncate flex-1">{doc.fileName}</span>
              <DocTypeBadge docType={doc.docType} />
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {doc.fileType.includes('image') && (
                  <button
                    type="button"
                    onClick={() => handlePreview(doc)}
                    className="p-1 rounded hover:bg-muted transition-colors"
                    title="Previzualizeaza"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDownload(doc)}
                  className="p-1 rounded hover:bg-muted transition-colors"
                  title="Descarca"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 transition-colors"
                  title="Sterge"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}