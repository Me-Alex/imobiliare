'use client'

import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { AlertTriangle, FileCheck2, Loader2, Scale } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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
  type LegalDocumentField,
  type LegalDocumentKind,
} from '@/lib/legal-documents'
import {
  generateLegalDocument,
  loadLegalDocumentContext,
  type LegalDocumentContext,
} from '@/lib/viewing-documents'
import type { Vizionare } from '@/lib/types'

interface LegalDocumentBuilderDialogProps {
  kind: LegalDocumentKind | null
  user: User
  viewing: Vizionare
  onOpenChange: (open: boolean) => void
  onCreated: () => Promise<void> | void
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: LegalDocumentField
  value: string
  onChange: (value: string) => void
}) {
  const common = {
    id: `legal-field-${field.key}`,
    value,
    disabled: field.readOnly,
    required: field.required,
    placeholder: field.placeholder,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value),
  }

  if (field.type === 'textarea') {
    return <Textarea {...common} rows={3} />
  }
  if (field.type === 'select') {
    return (
      <select
        id={common.id}
        value={value}
        disabled={field.readOnly}
        required={field.required}
        onChange={(event) => onChange(event.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">Selectează</option>
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    )
  }
  return <Input {...common} type={field.type || 'text'} />
}

export function LegalDocumentBuilderDialog({
  kind,
  user,
  viewing,
  onOpenChange,
  onCreated,
}: LegalDocumentBuilderDialogProps) {
  const open = Boolean(kind)
  const definition = kind ? getLegalDocumentDefinition(kind) : null
  const [context, setContext] = useState<LegalDocumentContext | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [consumerContract, setConsumerContract] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!kind || !open) return
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      setLoading(true)
      setContext(null)
      loadLegalDocumentContext(kind, user, viewing)
        .then((next) => {
          if (cancelled) return
          setContext(next)
          setValues(next.values)
          setConsumerContract(getLegalDocumentDefinition(kind).consumerWithdrawalRequired)
        })
        .catch((error) => {
          if (!cancelled) toast.error('Configurația documentului nu a putut fi încărcată.', {
            description: error instanceof Error ? error.message : undefined,
          })
        })
        .finally(() => !cancelled && setLoading(false))
    })
    return () => { cancelled = true }
  }, [kind, open, user, viewing])

  const groups = useMemo(() => {
    if (!definition) return []
    const result: Array<{ name: string; fields: LegalDocumentField[] }> = []
    for (const field of definition.fields) {
      const existing = result.find((group) => group.name === field.group)
      if (existing) existing.fields.push(field)
      else result.push({ name: field.group, fields: [field] })
    }
    return result
  }, [definition])

  if (!definition || !kind) return null

  const missingRequired = definition.fields.some(
    (field) => field.required && !values[field.key]?.trim(),
  )
  const reviewed = context?.template.legalReviewStatus === 'APPROVED'

  const handleGenerate = async () => {
    if (!context) return
    setSubmitting(true)
    try {
      await generateLegalDocument({ kind, user, viewing, values, consumerContract })
      await onCreated()
      onOpenChange(false)
      toast.success(reviewed
        ? 'Documentul juridic a fost generat.'
        : 'Ciorna a fost generată și rămâne blocată până la revizuirea juridică.')
    } catch (error) {
      toast.error('Documentul nu a putut fi generat.', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <DialogTitle>{definition.title}</DialogTitle>
          </div>
          <DialogDescription>{definition.description}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : !context ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Configurație indisponibilă</AlertTitle>
            <AlertDescription>Verifică șablonul și profilul juridic al agenției.</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Versiune {context.template.legalVersion}</Badge>
              <Badge variant="outline">
                {context.template.signatureRequirement === 'SIMPLE'
                  ? 'Semnătură simplă permisă'
                  : 'Semnătură avansată/calificată necesară'}
              </Badge>
              <Badge variant={reviewed ? 'default' : 'secondary'}>
                {reviewed ? `Revizuit: ${context.template.legalReviewerName}` : 'Revizuire juridică necesară'}
              </Badge>
            </div>

            {!context.agencyReady && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Profil juridic incomplet</AlertTitle>
                <AlertDescription>
                  Administratorul trebuie să completeze identitatea societății și informarea GDPR înainte de generare.
                </AlertDescription>
              </Alert>
            )}

            {!reviewed && (
              <Alert>
                <FileCheck2 className="h-4 w-4" />
                <AlertTitle>Document blocat pentru semnare</AlertTitle>
                <AlertDescription>
                  Poți genera o ciornă pentru verificare. Semnarea va fi disponibilă numai după aprobarea nominală a unui revizor juridic.
                </AlertDescription>
              </Alert>
            )}

            {definition.consumerWithdrawalRequired && (
              <label className="flex items-start gap-3 rounded-lg border p-4 text-sm">
                <input
                  type="checkbox"
                  checked={consumerContract}
                  onChange={(event) => setConsumerContract(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary"
                />
                <span>
                  Beneficiarul este consumator. Platforma va marca documentul pentru informarea separată privind retragerea de 14 zile și cererea expresă de începere a serviciilor.
                </span>
              </label>
            )}

            {groups.map((group) => (
              <fieldset key={group.name} className="rounded-xl border p-4">
                <legend className="px-2 text-sm font-semibold">{group.name}</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  {group.fields.map((field) => (
                    <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                      <label htmlFor={`legal-field-${field.key}`} className="mb-1.5 block text-xs font-medium">
                        {field.label}{field.required && <span className="text-destructive"> *</span>}
                      </label>
                      <FieldControl
                        field={field}
                        value={values[field.key] || ''}
                        onChange={(value) => setValues((current) => ({ ...current, [field.key]: value }))}
                      />
                    </div>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>Renunță</Button>
          <Button
            disabled={loading || submitting || !context || !context.agencyReady || missingRequired}
            onClick={() => void handleGenerate()}
            className="gap-2"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
            {reviewed ? 'Generează documentul' : 'Generează ciorna'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
