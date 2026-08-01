'use client'

import { Check, Calendar, Clock, User, Building, FileText, FileSignature } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Appointment, DocumentChecklist, Signature } from '../../lib/types'

interface ConfirmStepProps {
  appointment: Appointment
  documents: DocumentChecklist[]
  signatures: Signature[]
  onConfirm: () => void
  onEdit?: () => void
  onCancel: () => void
  isLoading?: boolean
  error?: string | null
}

export function ConfirmStep({
  appointment,
  documents,
  signatures,
  onConfirm,
  onEdit,
  onCancel,
  isLoading,
  error,
}: ConfirmStepProps) {
  const scheduledDate = new Date(appointment.scheduled_at)
  const formattedDate = scheduledDate.toLocaleDateString('ro-RO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formattedTime = scheduledDate.toLocaleTimeString('ro-RO', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const uploadedDocs = documents.filter(d => d.status === 'UPLOADED' || d.status === 'VERIFIED')

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Rezumat Programare
        </h2>
        <p className="text-muted-foreground">
          Verificați detaliile înainte de confirmare.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          {error}
        </div>
      )}

      {/* Appointment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Detalii Programare
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Dată</p>
                <p className="font-medium capitalize">{formattedDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Oră</p>
                <p className="font-medium">{formattedTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Proprietate</p>
                <p className="font-medium">{appointment.property_title}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Agent</p>
                <p className="font-medium">{appointment.agent_name}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Informații Client
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nume</p>
              <p className="font-medium">{appointment.client_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{appointment.client_email}</p>
            </div>
            {appointment.client_phone && (
              <div>
                <p className="text-sm text-muted-foreground">Telefon</p>
                <p className="font-medium">{appointment.client_phone}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documente Încărcate
          </CardTitle>
        </CardHeader>
        <CardContent>
          {uploadedDocs.length > 0 ? (
            <ul className="space-y-2">
              {uploadedDocs.map((doc) => (
                <li key={doc.id} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>{doc.document_type.replace(/_/g, ' ')}</span>
                  {doc.required && <span className="text-xs text-muted-foreground">(Obligatoriu)</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">Nuexistă documente încărcate.</p>
          )}
        </CardContent>
      </Card>

      {/* Signatures */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Semnături
          </CardTitle>
        </CardHeader>
        <CardContent>
          {signatures.length > 0 ? (
            <ul className="space-y-2">
              {signatures.map((sig) => (
                <li key={sig.id} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>{sig.document_type.replace(/_/g, ' ')}</span>
                  <span className="text-sm text-muted-foreground">
                    - semnat de {sig.signer_name}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">Nu există semnături.</p>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Message */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            După confirmare, veți primi un email cu detaliile programării.
            <br />
            Vă așteptăm la proprietate!
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between gap-3 pt-4">
        <div>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Anulează
          </Button>
        </div>
        <div className="flex gap-3">
          {onEdit && (
            <Button
              variant="outline"
              onClick={onEdit}
              disabled={isLoading}
            >
              Modifică
            </Button>
          )}
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="min-w-[200px]"
          >
            Confirmă Programare
          </Button>
        </div>
      </div>
    </div>
  )
}
