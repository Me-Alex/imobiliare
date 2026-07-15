'use client'

import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { AlertTriangle, Loader2, Send, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import type { AccountProfile } from '@/contexts/auth-context'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  getLegalDocumentDefinition,
  getLegalRequestFields,
  type LegalDocumentKind,
  type LegalDocumentRequestRole,
  type LegalDocumentField,
} from '@/lib/legal-documents'
import { saveLegalDocumentRequest } from '@/lib/legal-document-requests'
import type { LegalDocumentRequest, Vizionare } from '@/lib/types'

type RequestableKind = Exclude<LegalDocumentKind, 'viewing_report'>

interface LegalDocumentRequestDialogProps {
  kind: RequestableKind | null
  role: LegalDocumentRequestRole
  user: User
  profile: AccountProfile
  viewing: Vizionare
  request?: LegalDocumentRequest | null
  onOpenChange: (open: boolean) => void
  onSaved: () => Promise<void> | void
}

function RequestField({
  field,
  value,
  onChange,
}: {
  field: LegalDocumentField
  value: string
  onChange: (value: string) => void
}) {
  const id = `request-field-${field.key}`
  if (field.type === 'textarea') {
    return (
      <Textarea
        id={id}
        value={value}
        rows={3}
        required={field.required}
        placeholder={field.placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    )
  }
  if (field.type === 'select') {
    return (
      <select
        id={id}
        value={value}
        required={field.required}
        onChange={(event) => onChange(event.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Selectează</option>
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    )
  }
  return (
    <Input
      id={id}
      value={value}
      type={field.type || 'text'}
      required={field.required}
      placeholder={field.placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

export function LegalDocumentRequestDialog({
  kind,
  role,
  user,
  profile,
  viewing,
  request,
  onOpenChange,
  onSaved,
}: LegalDocumentRequestDialogProps) {
  const open = Boolean(kind)
  const [values, setValues] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const fields = useMemo(() => kind ? getLegalRequestFields(kind, role) : [], [kind, role])
  const definition = kind ? getLegalDocumentDefinition(kind) : null

  useEffect(() => {
    if (!kind || !open) return
    const identityPrefix = role === 'CLIENT' ? 'client' : 'owner'
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      setValues({
        [`${identityPrefix}_name`]: profile.fullName,
        [`${identityPrefix}_email`]: profile.email || user.email || '',
        [`${identityPrefix}_phone`]: profile.phone,
        ...request?.submittedData,
      })
      setNotes(request?.notes || '')
    })
    return () => {
      cancelled = true
    }
  }, [kind, open, profile, request, role, user.email])

  if (!kind || !definition) return null

  const missingRequired = fields.some((field) => field.required && !values[field.key]?.trim())
  const canEdit = !request || ['REQUESTED', 'NEEDS_INFO'].includes(request.status)

  const handleSubmit = async () => {
    if (missingRequired || !canEdit) return
    setSubmitting(true)
    try {
      const submittedData = Object.fromEntries(
        fields.map((field) => [field.key, String(values[field.key] || '').trim()]),
      )
      await saveLegalDocumentRequest({
        id: request?.id,
        appointmentId: viewing.id,
        requesterId: user.id,
        documentKind: kind,
        submittedData,
        notes,
      })
      await onSaved()
      onOpenChange(false)
      toast.success(request ? 'Solicitarea a fost actualizată.' : 'Solicitarea a fost trimisă agentului.')
    } catch (error) {
      toast.error('Solicitarea nu a putut fi salvată.', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role === 'CLIENT' ? 'Solicită' : 'Confirmă date pentru'}: {definition.shortTitle}</DialogTitle>
          <DialogDescription>
            Datele sunt transmise agentului alocat. Ele nu devin contract până când agentul nu le verifică și nu generează documentul controlat.
          </DialogDescription>
        </DialogHeader>

        {request?.status === 'NEEDS_INFO' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Sunt necesare completări</AlertTitle>
            <AlertDescription>{request.staffNote}</AlertDescription>
          </Alert>
        )}

        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Declarația ta rămâne în audit</AlertTitle>
          <AlertDescription>
            Agentul poate folosi datele în generator, dar nu poate modifica această declarație. Orice contract va fi afișat separat pentru verificare și semnare.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
              <label htmlFor={`request-field-${field.key}`} className="mb-1.5 block text-xs font-medium">
                {field.label}{field.required && <span className="text-destructive"> *</span>}
              </label>
              <RequestField
                field={field}
                value={values[field.key] || ''}
                onChange={(value) => setValues((current) => ({ ...current, [field.key]: value }))}
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label htmlFor="request-notes" className="mb-1.5 block text-xs font-medium">Observații pentru agent</label>
            <Textarea
              id="request-notes"
              value={notes}
              rows={3}
              maxLength={2000}
              placeholder="Precizări sau documente care urmează să fie încărcate."
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>Renunță</Button>
          <Button disabled={submitting || missingRequired || !canEdit} onClick={() => void handleSubmit()} className="gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Trimite agentului
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
