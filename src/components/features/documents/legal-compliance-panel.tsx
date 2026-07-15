'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Loader2, Save, Scale, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  approveLegalTemplate,
  getAgencyLegalProfile,
  listLegalTemplates,
  saveAgencyLegalProfile,
  type AgencyLegalProfile,
  type AgencyLegalProfileInput,
  type LegalTemplateSummary,
} from '@/lib/viewing-documents'

const EMPTY_PROFILE: AgencyLegalProfileInput = {
  legalName: '',
  tradeName: 'HQS Imobiliare',
  legalForm: '',
  cui: '',
  tradeRegistryNumber: '',
  registeredOffice: '',
  correspondenceAddress: '',
  email: '',
  phone: '',
  representativeName: '',
  representativeCapacity: 'Administrator',
  iban: '',
  bankName: '',
  privacyNoticeUrl: '',
  privacyNoticeVersion: '1.0',
  consumerNoticeVersion: '1.0',
}

function toInput(profile: AgencyLegalProfile): AgencyLegalProfileInput {
  const { id: _id, status: _status, ...input } = profile
  return input
}

const PROFILE_FIELDS: Array<{
  key: keyof AgencyLegalProfileInput
  label: string
  required?: boolean
  type?: string
}> = [
  { key: 'legalName', label: 'Denumire juridică completă', required: true },
  { key: 'tradeName', label: 'Denumire comercială', required: true },
  { key: 'legalForm', label: 'Formă juridică', required: true },
  { key: 'cui', label: 'CUI/CIF', required: true },
  { key: 'tradeRegistryNumber', label: 'Nr. Registrul Comerțului', required: true },
  { key: 'registeredOffice', label: 'Sediu social', required: true },
  { key: 'correspondenceAddress', label: 'Adresă corespondență' },
  { key: 'email', label: 'E-mail juridic', required: true, type: 'email' },
  { key: 'phone', label: 'Telefon', required: true, type: 'tel' },
  { key: 'representativeName', label: 'Reprezentant legal', required: true },
  { key: 'representativeCapacity', label: 'Calitatea reprezentantului', required: true },
  { key: 'iban', label: 'IBAN' },
  { key: 'bankName', label: 'Banca' },
  { key: 'privacyNoticeUrl', label: 'URL informare GDPR', required: true, type: 'url' },
  { key: 'privacyNoticeVersion', label: 'Versiune informare GDPR', required: true },
  { key: 'consumerNoticeVersion', label: 'Versiune informare retragere', required: true },
]

export function LegalCompliancePanel({ userId }: { userId: string }) {
  const [profileId, setProfileId] = useState<string>()
  const [profile, setProfile] = useState<AgencyLegalProfileInput>(EMPTY_PROFILE)
  const [templates, setTemplates] = useState<LegalTemplateSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [approvingId, setApprovingId] = useState<string>()
  const [reviewerName, setReviewerName] = useState('')
  const [reviewConfirmed, setReviewConfirmed] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [nextProfile, nextTemplates] = await Promise.all([
        getAgencyLegalProfile(),
        listLegalTemplates(),
      ])
      if (nextProfile) {
        setProfileId(nextProfile.id)
        setProfile(toInput(nextProfile))
      }
      setTemplates(nextTemplates)
    } catch (error) {
      toast.error('Configurația juridică nu a putut fi încărcată.', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { queueMicrotask(() => void refresh()) }, [refresh])

  const requiredMissing = PROFILE_FIELDS.some(
    (field) => field.required && !profile[field.key].trim(),
  )

  const handleSave = async () => {
    setSaving(true)
    try {
      const saved = await saveAgencyLegalProfile(userId, profile, profileId)
      setProfileId(saved.id)
      setProfile(toInput(saved))
      toast.success('Profilul juridic al agenției este activ.')
    } catch (error) {
      toast.error('Profilul juridic nu a putut fi salvat.', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (templateId: string) => {
    setApprovingId(templateId)
    try {
      await approveLegalTemplate(templateId, userId, reviewerName)
      await refresh()
      toast.success('Revizuirea juridică a șablonului a fost înregistrată.')
    } catch (error) {
      toast.error('Șablonul nu a putut fi aprobat.', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setApprovingId(undefined)
    }
  }

  if (loading) {
    return <Card><CardContent className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></CardContent></Card>
  }

  return (
    <div className="space-y-6 mb-6">
      <Alert>
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Control juridic obligatoriu</AlertTitle>
        <AlertDescription>
          Aprobarea confirmă faptul că textul exact și versiunea indicată au fost verificate de un profesionist juridic. Nu aproba șabloane nerevizuite.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Scale className="h-4 w-4 text-primary" /> Identitatea juridică a agenției</CardTitle>
          <CardDescription>Aceste date sunt inserate automat și nu pot fi modificate de client în formularul documentului.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {PROFILE_FIELDS.map((field) => (
            <div key={field.key}>
              <label htmlFor={`agency-legal-${field.key}`} className="mb-1.5 block text-xs font-medium">
                {field.label}{field.required && <span className="text-destructive"> *</span>}
              </label>
              <Input
                id={`agency-legal-${field.key}`}
                type={field.type || 'text'}
                value={profile[field.key]}
                onChange={(event) => setProfile((current) => ({ ...current, [field.key]: event.target.value }))}
              />
            </div>
          ))}
          <div className="sm:col-span-2 flex justify-end">
            <Button disabled={saving || requiredMissing} onClick={() => void handleSave()} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvează și activează
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revizuirea șabloanelor</CardTitle>
          <CardDescription>Fiecare versiune este aprobată nominal; modificarea textului va necesita o versiune și o aprobare nouă.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input value={reviewerName} onChange={(event) => setReviewerName(event.target.value)} placeholder="Numele complet al avocatului/consilierului juridic" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={reviewConfirmed} onChange={(event) => setReviewConfirmed(event.target.checked)} className="h-4 w-4 accent-primary" />
              Confirm revizuirea textului exact
            </label>
          </div>

          <div className="divide-y rounded-lg border">
            {templates.map((template) => (
              <div key={template.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{template.name}</p>
                    <Badge variant="outline">{template.legalVersion}</Badge>
                    <Badge variant={template.legalReviewStatus === 'APPROVED' ? 'default' : 'secondary'}>
                      {template.legalReviewStatus === 'APPROVED' ? 'Revizuit' : 'Necesită revizuire'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {template.signatureRequirement === 'SIMPLE' ? 'Semnătură simplă' : 'Semnătură avansată/calificată'}
                    {template.legalReviewerName ? ` · ${template.legalReviewerName}` : ''}
                  </p>
                </div>
                {template.legalReviewStatus !== 'APPROVED' ? (
                  <Button
                    size="sm"
                    disabled={!reviewConfirmed || reviewerName.trim().length < 3 || Boolean(approvingId)}
                    onClick={() => void handleApprove(template.id)}
                    className="gap-2"
                  >
                    {approvingId === template.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Înregistrează aprobarea
                  </Button>
                ) : (
                  <span className="text-xs text-emerald-700">Aprobat {template.legalReviewedAt ? new Date(template.legalReviewedAt).toLocaleDateString('ro-RO') : ''}</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
