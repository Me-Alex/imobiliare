'use client'

import { useState } from 'react'
import { Upload, FileText, Check, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { DocumentChecklist, DocumentType } from '../../lib/types'
import { DOCUMENT_TYPE_LABELS } from '../../lib/types'

interface PrepareStepProps {
  checklists: DocumentChecklist[]
  onUploadDocument: (documentType: DocumentType) => void
  onVerifyDocument: (checklistId: string) => void
  onRejectDocument: (checklistId: string, reason: string) => void
  onComplete: () => void
  isStaff?: boolean
  isLoading?: boolean
  error?: string | null
}

export function PrepareStep({
  checklists,
  onUploadDocument,
  onVerifyDocument,
  onRejectDocument,
  onComplete,
  isStaff = false,
  isLoading,
  error,
}: PrepareStepProps) {
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const requiredDocuments = checklists.filter(d => d.required)
  const optionalDocuments = checklists.filter(d => !d.required)
  const uploadedRequired = requiredDocuments.filter(d => d.status === 'UPLOADED' || d.status === 'VERIFIED')
  const allRequiredUploaded = uploadedRequired.length === requiredDocuments.length

  const getStatusIcon = (status: DocumentChecklist['status']) => {
    switch (status) {
      case 'VERIFIED':
        return <Check className="h-5 w-5 text-emerald-500" />
      case 'UPLOADED':
        return <FileText className="h-5 w-5 text-primary" />
      case 'REJECTED':
        return <X className="h-5 w-5 text-destructive" />
      default:
        return <Upload className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: DocumentChecklist['status']) => {
    switch (status) {
      case 'VERIFIED':
        return 'border-emerald-500/50 bg-emerald-500/5'
      case 'UPLOADED':
        return 'border-primary/50 bg-primary/5'
      case 'REJECTED':
        return 'border-destructive/50 bg-destructive/5'
      default:
        return 'border-border'
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Pregătește Documentele
        </h2>
        <p className="text-muted-foreground">
          Încărcați documentele necesare pentru vizionare.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Progress */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Documente necesare</span>
            <span className="text-sm text-muted-foreground">
              {uploadedRequired.length} / {requiredDocuments.length}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${requiredDocuments.length > 0 ? (uploadedRequired.length / requiredDocuments.length) * 100 : 0}%` }}
            />
          </div>
          {allRequiredUploaded && (
            <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1">
              <Check className="h-4 w-4" />
              Toate documentele necesare au fost încărcate
            </p>
          )}
        </CardContent>
      </Card>

      {/* Required Documents */}
      {requiredDocuments.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Documente Obligatorii</h3>
          {requiredDocuments.map((doc) => (
            <Card key={doc.id} className={getStatusColor(doc.status)}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  {getStatusIcon(doc.status)}
                  <div>
                    <p className="font-medium">
                      {DOCUMENT_TYPE_LABELS[doc.documentType as DocumentType] || doc.document_type}
                    </p>
                    {doc.rejection_reason && (
                      <p className="text-sm text-destructive mt-1">
                        Motivul respingerii: {doc.rejection_reason}
                      </p>
                    )}
                    {doc.uploaded_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Încărcat: {new Date(doc.uploaded_at).toLocaleDateString('ro-RO')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {doc.status === 'PENDING' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUploadDocument(doc.document_type as DocumentType)}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Încărcare
                    </Button>
                  )}
                  {doc.status === 'UPLOADED' && isStaff && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-emerald-600 hover:text-emerald-700"
                        onClick={() => onVerifyDocument(doc.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Verifică
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setRejectingId(doc.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Respinge
                      </Button>
                    </>
                  )}
                  {doc.status === 'VERIFIED' && (
                    <span className="text-sm text-emerald-600 font-medium">Verificat</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Optional Documents */}
      {optionalDocuments.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-muted-foreground">Documente Opționale</h3>
          {optionalDocuments.map((doc) => (
            <Card key={doc.id} className={getStatusColor(doc.status)}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  {getStatusIcon(doc.status)}
                  <div>
                    <p className="font-medium">
                      {DOCUMENT_TYPE_LABELS[doc.document_type as DocumentType] || doc.document_type}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {doc.status === 'PENDING' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onUploadDocument(doc.document_type as DocumentType)}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Încărcare
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rejection Dialog */}
      {rejectingId && (
        <Card className="border-destructive">
          <CardContent className="pt-6 space-y-4">
            <h4 className="font-semibold">Motivul Respingerii</h4>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Descrieți motivul pentru care documentul este respins..."
              className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectingId(null)
                  setRejectReason('')
                }}
              >
                Anulează
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onRejectDocument(rejectingId, rejectReason)
                  setRejectingId(null)
                  setRejectReason('')
                }}
              >
                Respinge Document
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Continue Button */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          onClick={onComplete}
          disabled={!allRequiredUploaded || isLoading}
          className="min-w-[200px]"
        >
          {isLoading ? 'Se procesează...' : 'Continuă'}
        </Button>
      </div>
    </div>
  )
}
