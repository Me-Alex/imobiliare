'use client'

import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'
import { AlertCircle, Upload } from 'lucide-react'
import { toast } from 'sonner'
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

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      const docType = pendingTypeRef.current
      if (!file || !docType) return

      if (file.size > MAX_FILE_SIZE) {
        toast.error('Fisier prea mare (maximum 15MB).')
        event.target.value = ''
        return
      }

      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        toast.error('Format neacceptat. Foloseste PDF, JPG, PNG, WebP, DOC sau DOCX.')
        event.target.value = ''
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
        event.target.value = ''
      }
    }, [onFileReady])

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

        <DocumentTypeSelector
          uploadedTypes={uploadedTypes}
          allowedTypes={allowedTypes}
          uploadingType={uploadingType}
          uploadProgress={uploadProgress}
          onTypeClick={handleTypeClick}
        />

        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
          <AlertCircle className="h-3 w-3" />
          Maximum 15MB per fisier. Formate: PDF, JPG, PNG, WebP, DOC si DOCX.
        </p>
      </div>
    )
  },
)
