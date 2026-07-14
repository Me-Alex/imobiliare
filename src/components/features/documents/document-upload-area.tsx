'use client'

import { useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Upload, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { DocumentTypeSelector, type DocType } from './document-type-selector'

// ─── Constants ──────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// ─── Public ref API ─────────────────────────────────────────────────────

export interface DocumentUploadAreaRef {
  /** Programmatically trigger file picker for a specific doc type (e.g. contract signing) */
  triggerUpload: (type: DocType) => void
}

// ─── Props ──────────────────────────────────────────────────────────────

interface DocumentUploadAreaProps {
  uploadedTypes: Set<DocType>
  onFileReady: (docType: DocType, fileData: string, fileName: string, fileType: string) => void
}

// ─── Component ──────────────────────────────────────────────────────────

export const DocumentUploadArea = forwardRef<DocumentUploadAreaRef, DocumentUploadAreaProps>(
  function DocumentUploadArea({ uploadedTypes, onFileReady }, ref) {
    const [uploadingType, setUploadingType] = useState<DocType | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const pendingTypeRef = useRef<DocType | null>(null)

    // Expose triggerUpload to parent via ref
    useImperativeHandle(ref, () => ({
      triggerUpload: (type: DocType) => {
        pendingTypeRef.current = type
        fileInputRef.current?.click()
      },
    }))

    // Called when user clicks a type pill in the selector
    const handleTypeClick = useCallback((type: DocType) => {
      pendingTypeRef.current = type
      fileInputRef.current?.click()
    }, [])

    // File input change — validate, read as base64, report back
    const handleFileChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !pendingTypeRef.current) return

        if (file.size > MAX_FILE_SIZE) {
          toast.error('Fisier prea mare (max 5MB)')
          e.target.value = ''
          return
        }

        const docType = pendingTypeRef.current
        setUploadingType(docType)
        setUploadProgress(0)

        const reader = new FileReader()

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return 90
            }
            return prev + Math.random() * 20 + 5
          })
        }, 100)

        reader.onload = () => {
          clearInterval(progressInterval)
          setUploadProgress(100)

          const base64data = reader.result as string

          setTimeout(() => {
            onFileReady(docType, base64data, file.name, file.type)
            setUploadingType(null)
            setUploadProgress(0)
            pendingTypeRef.current = null
          }, 300)
        }

        reader.onerror = () => {
          clearInterval(progressInterval)
          setUploadingType(null)
          setUploadProgress(0)
          pendingTypeRef.current = null
          toast.error('Eroare la incarcarea fisierului')
        }

        reader.readAsDataURL(file)
        e.target.value = ''
      },
      [onFileReady],
    )

    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Incarca Documente</h2>
        </div>

        {/* Single hidden file input shared across all types */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileChange}
        />

        <DocumentTypeSelector
          uploadedTypes={uploadedTypes}
          uploadingType={uploadingType}
          uploadProgress={uploadProgress}
          onTypeClick={handleTypeClick}
        />

        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
          <AlertCircle className="h-3 w-3" />
          Dimensiune maxima: 5MB per fisier. Formate acceptate: imagine, PDF, DOC.
        </p>
      </div>
    )
  },
)