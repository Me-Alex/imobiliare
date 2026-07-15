'use client'

import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'
import { AlertCircle, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { DocumentTypeSelector, type DocType } from './document-type-selector'

const MAX_FILE_SIZE = 15 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

export interface DocumentUploadAreaRef {
  triggerUpload: (type: DocType) => void
}

interface DocumentUploadAreaProps {
  uploadedTypes: Set<DocType>
  allowedTypes?: DocType[]
  onFileReady: (docType: DocType, file: File) => Promise<void>
}

export const DocumentUploadArea = forwardRef<DocumentUploadAreaRef, DocumentUploadAreaProps>(
  function DocumentUploadArea({ uploadedTypes, allowedTypes, onFileReady }, ref) {
    const [uploadingType, setUploadingType] = useState<DocType | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const pendingTypeRef = useRef<DocType | null>(null)

    useImperativeHandle(ref, () => ({
      triggerUpload: (type: DocType) => {
        pendingTypeRef.current = type
        fileInputRef.current?.click()
      },
    }))

    const handleTypeClick = useCallback((type: DocType) => {
      pendingTypeRef.current = type
      fileInputRef.current?.click()
    }, [])

    const validateAndUpload = useCallback(async (file: File, docType: DocType) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error('Fisier prea mare (maximum 15MB).')
        return
      }
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        toast.error('Format neacceptat. Foloseste PDF, JPG, PNG, WebP, DOC sau DOCX.')
        return
      }

      setUploadingType(docType)
      setUploadProgress(25)
      try {
        await onFileReady(docType, file)
        setUploadProgress(100)
      } finally {
        setUploadingType(null)
        setUploadProgress(0)
        pendingTypeRef.current = null
      }
    }, [onFileReady])

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      const docType = pendingTypeRef.current
      if (!file || !docType) return
      await validateAndUpload(file, docType)
      event.target.value = ''
    }, [validateAndUpload])

    const handleDragOver = useCallback((event: React.DragEvent) => {
      event.preventDefault()
      event.stopPropagation()
      setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((event: React.DragEvent) => {
      event.preventDefault()
      event.stopPropagation()
      setIsDragging(false)
    }, [])

    const handleDrop = useCallback((event: React.DragEvent) => {
      event.preventDefault()
      event.stopPropagation()
      setIsDragging(false)

      const files = event.dataTransfer.files
      if (!files || files.length === 0) return

      const file = files[0]
      // When dropping without explicit type selection, default to 'other'
      const docType: DocType = 'other'
      pendingTypeRef.current = docType
      void validateAndUpload(file, docType)
    }, [validateAndUpload])

    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Incarca documente</h2>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,.pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileChange}
        />

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'rounded-xl border-2 border-dashed p-6 transition-colors text-center',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border bg-muted/30 hover:bg-muted/50',
          )}
        >
          <Upload className={cn('h-8 w-8 mx-auto mb-2 transition-colors', isDragging ? 'text-primary' : 'text-muted-foreground')} />
          <p className="text-sm font-medium">
            {isDragging ? 'Lasa fisierul aici…' : 'Trage fisierele aici sau selecteaza tipul de mai jos'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Maximum 15MB. Formate: PDF, JPG, PNG, WebP, DOC, DOCX.
          </p>
        </div>

        <div className="mt-4">
          <DocumentTypeSelector
            uploadedTypes={uploadedTypes}
            allowedTypes={allowedTypes}
            uploadingType={uploadingType}
            uploadProgress={uploadProgress}
            onTypeClick={handleTypeClick}
          />
        </div>

        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
          <AlertCircle className="h-3 w-3" />
          Maximum 15MB per fisier. Formate: PDF, JPG, PNG, WebP, DOC si DOCX.
        </p>
      </div>
    )
  },
)
