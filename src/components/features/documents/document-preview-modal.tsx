'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Download,
  FileText,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { ViewingDocument } from '@/lib/types'
import { DocumentEventTimeline } from './document-event-timeline'

interface DocumentPreviewModalProps {
  document: ViewingDocument | null
  signedUrl: string | null
  loading: boolean
  error: string | null
  onClose: () => void
  onDownload: () => void
}

export function DocumentPreviewModal({
  document,
  signedUrl,
  loading,
  error,
  onClose,
  onDownload,
}: DocumentPreviewModalProps) {
  return (
    <Dialog open={Boolean(document)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 flex flex-col gap-0">
        <DialogHeader className="px-4 py-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-medium flex items-center gap-2 truncate pr-4">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate">{document?.title}</span>
            </DialogTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" aria-label="Inchide previzualizarea" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        {/* key remounts inner component when document changes, resetting scale/rotation */}
        <DocumentPreviewInner
          key={document?.id ?? 'null'}
          document={document}
          signedUrl={signedUrl}
          loading={loading}
          error={error}
          onDownload={onDownload}
        />
      </DialogContent>
    </Dialog>
  )
}

function DocumentPreviewInner({
  document,
  signedUrl,
  loading,
  error,
  onDownload,
}: Omit<DocumentPreviewModalProps, 'onClose'>) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const isPdf = document?.fileType === 'application/pdf'
  const isImage = document?.fileType?.startsWith('image/')

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3))
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5))
  const handleRotate = () => setRotation((r) => (r + 90) % 360)

  return (
    <>
      <div className="shrink-0 border-b px-4 py-2 flex items-center gap-2 bg-background">
        <Button variant="ghost" size="icon" aria-label="Micsoreaza" className="h-8 w-8" onClick={handleZoomOut} disabled={!signedUrl || loading}>
          <ZoomOut className="h-4 w-4" aria-hidden="true" />
        </Button>
        <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(scale * 100)}%</span>
        <Button variant="ghost" size="icon" aria-label="Mareste" className="h-8 w-8" onClick={handleZoomIn} disabled={!signedUrl || loading}>
          <ZoomIn className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Roteste" className="h-8 w-8" onClick={handleRotate} disabled={!signedUrl || loading}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button variant="ghost" size="icon" aria-label="Descarca" className="h-8 w-8" onClick={onDownload} disabled={!signedUrl || loading}>
          <Download className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto bg-muted/30 flex items-center justify-center relative">
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Se încarcă documentul...</p>
            </motion.div>
          )}

          {error && !loading && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2 text-center px-4"
            >
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm">Inchide</Button>
            </motion.div>
          )}

          {signedUrl && !loading && !error && isPdf && (
            <motion.iframe
              key="pdf"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src={signedUrl}
              className="w-full h-full border-0"
              title={document?.title ?? 'Document'}
            />
          )}

          {signedUrl && !loading && !error && isImage && (
            <motion.img
              key="image"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, scale, rotate: rotation }}
              exit={{ opacity: 0 }}
              src={signedUrl}
              alt={document?.title ?? 'Document'}
              className="max-w-full max-h-full object-contain transition-transform"
              style={{ transform: `scale(${scale}) rotate(${rotation}deg)` }}
            />
          )}

          {signedUrl && !loading && !error && !isPdf && !isImage && (
            <motion.div
              key="unsupported"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 text-center px-4"
            >
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Prevualizare indisponibila pentru acest format.
              </p>
              <Button onClick={onDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Descarca documentul
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {document && (
        <div className="shrink-0 border-t px-4 py-3 bg-background">
          <DocumentEventTimeline document={document} />
        </div>
      )}
    </>
  )
}
