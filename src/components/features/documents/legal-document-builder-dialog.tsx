'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { AlertTriangle, ArrowLeft, ArrowRight, FileCheck2, Loader2, RefreshCw, X } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getLegalDocumentDefinition, getLegalRequestFields, type LegalDocumentField, type LegalDocumentKind } from '@/lib/legal-documents'
import { getDraftIssues, mergeDraftSubmissions, prepareDraftValues, renderDraftText, type DraftIssue } from '@/lib/documents/drafting'
import { generateLegalDocument, loadLegalDocumentContext, type LegalDocumentContext } from '@/lib/viewing-documents'
import type { LegalDocumentRequest, ViewingDocument, Vizionare } from '@/lib/types'

interface LegalDocumentBuilderDialogProps {
  kind: LegalDocumentKind | null
  user: User
  viewing: Vizionare
  requestSubmissions?: LegalDocumentRequest[]
  onOpenChange: (open: boolean) => void
  onCreated: (document: ViewingDocument) => Promise<void> | void
}

function FieldControl({ field, value, issue, required, onChange }: {
  field: LegalDocumentField
  value: string
  issue?: DraftIssue
  required: boolean
  onChange: (value: string) => void
}) {
  const common = {
    id: `legal-field-${field.key}`,
    value,
    required,
    placeholder: field.placeholder,
    'aria-invalid': Boolean(issue),
    'aria-describedby': issue ? `legal-error-${field.key}` : undefined,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value),
  }
  if (field.type === 'textarea') return <Textarea {...common} rows={3} />
  if (field.type === 'select') {
    return <select
      id={common.id}
      value={value}
      required={required}
      aria-invalid={Boolean(issue)}
      aria-describedby={common['aria-describedby']}
      onChange={event => onChange(event.target.value)}
      className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive"
    >
      <option value="">Selectează</option>
      {field.options?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  }
  return <Input {...common} className="min-h-11" type={field.type || 'text'} min={field.key === 'rent_due_day' ? 1 : undefined} max={field.key === 'rent_due_day' ? 31 : undefined} />
}

/** A new dossier or document kind owns a fresh editing session; parent refreshes cannot erase edits. */
export function LegalDocumentBuilderDialog(props: LegalDocumentBuilderDialogProps) {
  if (!props.kind) return null
  return <LegalDocumentDraft key={`${props.kind}:${props.viewing.id}:${props.user.id}`} {...props} kind={props.kind} />
}

function LegalDocumentDraft({ kind, user, viewing, requestSubmissions = [], onOpenChange, onCreated }: Omit<LegalDocumentBuilderDialogProps, 'kind'> & { kind: LegalDocumentKind }) {
  const definition = getLegalDocumentDefinition(kind)
  const [source] = useState(() => ({ user, viewing, submissions: requestSubmissions }))
  const [context, setContext] = useState<LegalDocumentContext | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [initialValues, setInitialValues] = useState<Record<string, string>>({})
  const [consumerContract, setConsumerContract] = useState(definition.consumerWithdrawalRequired)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [stage, setStage] = useState<'data' | 'review'>('data')
  const [showValidation, setShowValidation] = useState(false)
  const [discardPrompt, setDiscardPrompt] = useState(false)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const stageRef = useRef<HTMLHeadingElement>(null)
  const issueRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const trustedRef = useRef<HTMLDetailsElement>(null)
  const editedKeysRef = useRef(new Set<string>())
  const savingRef = useRef(false)
  const createdRef = useRef(false)

  const fieldOwnership = useMemo(() => {
    const ownership: Record<string, string[]> = {}
    for (const [id, role] of [[source.viewing.clientId, 'CLIENT'], [source.viewing.ownerId, 'OWNER']] as const) {
      if (id) ownership[id] = [...(ownership[id] || []), ...getLegalRequestFields(kind, role).map(field => field.key)]
    }
    return ownership
  }, [kind, source])

  useEffect(() => {
    let cancelled = false
    loadLegalDocumentContext(kind, source.user, source.viewing)
      .then(next => {
        if (cancelled) return
        const nextValues = mergeDraftSubmissions(definition, source.viewing.id, source.submissions, next.values, fieldOwnership)
        setContext(next)
        setValues(current => reload > 0 ? prepareDraftValues(definition, nextValues, Object.fromEntries(Object.entries(current).filter(([key]) => editedKeysRef.current.has(key)))) : nextValues)
        setInitialValues(nextValues)
      })
      .catch(error => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Datele documentului nu au putut fi încărcate.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [definition, fieldOwnership, kind, reload, source])

  const groups = useMemo(() => {
    const result: Array<{ name: string; fields: LegalDocumentField[] }> = []
    for (const field of definition.fields.filter(field => !field.readOnly)) {
      const existing = result.find(group => group.name === field.group)
      if (existing) existing.fields.push(field)
      else result.push({ name: field.group, fields: [field] })
    }
    return result
  }, [definition])
  const trustedFields = definition.fields.filter(field => field.readOnly)
  const preparedValues = context ? prepareDraftValues(definition, context.values, values) : {}
  const issues = context ? getDraftIssues(definition, context.template, preparedValues) : []
  const requiredKeys = new Set([...definition.fields.filter(field => field.required).map(field => field.key), ...(context?.template.requiredFields || [])])
  const reviewed = context?.template.legalReviewStatus === 'APPROVED'
  const dirty = definition.fields.some(field => !field.readOnly && (values[field.key] || '') !== (initialValues[field.key] || ''))
    || consumerContract !== definition.consumerWithdrawalRequired
  const submissionCount = source.submissions.filter(request => request.appointmentId === viewing.id && request.documentKind === kind && ['REQUESTED', 'IN_REVIEW'].includes(request.status)).length
  const reviewText = context ? renderDraftText(context.template.body || '', preparedValues) : ''

  const requestClose = () => {
    if (savingRef.current) return
    if (dirty && !createdRef.current) setDiscardPrompt(true)
    else onOpenChange(false)
  }
  const focusStage = () => requestAnimationFrame(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    stageRef.current?.focus({ preventScroll: true })
  })
  const focusIssue = (issue: DraftIssue) => {
    if (issue.readOnly && trustedRef.current) trustedRef.current.open = true
    requestAnimationFrame(() => {
      const field = document.getElementById(`legal-field-${issue.key}`)
      if (field) { field.focus({ preventScroll: true }); field.scrollIntoView({ block: 'center' }) }
      else trustedRef.current?.scrollIntoView({ block: 'center' })
    })
  }
  const reloadContext = () => {
    setLoading(true)
    setLoadError(null)
    setSubmitError(null)
    setStage('data')
    setReload(current => current + 1)
  }
  const reviewDraft = () => {
    setShowValidation(true)
    if (issues.length > 0) {
      requestAnimationFrame(() => { issueRef.current?.focus(); issueRef.current?.scrollIntoView({ block: 'start' }) })
      return
    }
    setSubmitError(null)
    setStage('review')
    focusStage()
  }
  const handleGenerate = async () => {
    if (!context || stage !== 'review' || issues.length || !context.agencyReady || savingRef.current || createdRef.current) return
    savingRef.current = true
    setSubmitting(true)
    setSubmitError(null)
    try {
      const created = await generateLegalDocument({ kind, user, viewing, values: preparedValues, consumerContract, expectedContext: context })
      createdRef.current = true
      try {
        await onCreated(created)
        toast.success(reviewed ? 'Documentul a fost creat în dosar.' : 'Ciorna a fost creată. Așteaptă revizuirea juridică înainte de semnare.')
      } catch {
        toast.warning('Documentul a fost creat, dar lista nu s-a actualizat.', { description: 'Reîncarcă dosarul pentru a-l vedea. Nu este nevoie să îl creezi din nou.' })
      }
      onOpenChange(false)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Documentul nu a putut fi creat. Datele completate sunt păstrate.')
    } finally {
      savingRef.current = false
      setSubmitting(false)
    }
  }

  return <>
    <Dialog open onOpenChange={next => { if (!next) requestClose() }}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[calc(100dvh-1rem)] max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-h-[calc(100dvh-3rem)] sm:max-w-4xl"
        onOpenAutoFocus={event => { event.preventDefault(); titleRef.current?.focus({ preventScroll: true }) }}
      >
        <DialogHeader className="relative shrink-0 border-b px-4 py-4 pr-16 text-left sm:px-6 sm:pr-16">
          <DialogTitle ref={titleRef} tabIndex={-1} className="leading-snug outline-none">{definition.shortTitle}</DialogTitle>
          <DialogDescription className="break-words">
            {viewing.propertyTitle} · {viewing.userName || viewing.userEmail || 'Client fără nume'}
            <span className="mt-1 block">{viewing.date} · {viewing.startTime}–{viewing.endTime}</span>
          </DialogDescription>
          <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-2 h-11 w-11" aria-label="Închide redactarea documentului" disabled={submitting} onClick={requestClose}><X className="h-5 w-5" /></Button>
        </DialogHeader>

        <ol aria-label="Pașii redactării" className="flex shrink-0 gap-5 border-b px-4 py-3 text-sm sm:px-6">
          <li aria-current={stage === 'data' ? 'step' : undefined} className={stage === 'data' ? 'font-semibold text-foreground' : 'text-muted-foreground'}>1. Datele documentului</li>
          <li aria-current={stage === 'review' ? 'step' : undefined} className={stage === 'review' ? 'font-semibold text-foreground' : 'text-muted-foreground'}>2. Verifică textul</li>
        </ol>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
          {loading ? <div role="status" className="flex items-center justify-center gap-3 py-16 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" /> Se încarcă datele documentului…</div>
            : loadError || !context ? <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Datele nu au putut fi încărcate</AlertTitle><AlertDescription><p>{loadError || 'Verifică șablonul și profilul juridic al agenției.'}</p><Button type="button" variant="outline" className="mt-3 min-h-11" onClick={reloadContext}><RefreshCw className="mr-2 h-4 w-4" />Încearcă din nou</Button></AlertDescription></Alert>
              : <div className="space-y-6">
                {!context.agencyReady && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Profilul agenției este incomplet</AlertTitle><AlertDescription>Administratorul trebuie să completeze și să activeze profilul juridic. Datele tale rămân în acest formular cât timp îl ții deschis.</AlertDescription></Alert>}
                {submitError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Documentul nu a fost creat</AlertTitle><AlertDescription><p>{submitError}</p><Button type="button" variant="outline" className="mt-3 min-h-11 whitespace-normal" onClick={reloadContext}>Actualizează datele dosarului</Button></AlertDescription></Alert>}
                <div>
                  <h2 ref={stageRef} tabIndex={-1} className="text-base font-semibold outline-none">{stage === 'data' ? 'Completează și verifică datele' : 'Verifică documentul'}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{stage === 'data' ? 'Câmpurile marcate cu * sunt obligatorii. În pasul următor poți citi textul complet.' : 'Verifică părțile, sumele și termenele.'}</p>
                </div>

                {stage === 'data' ? <>
                  {showValidation && issues.length > 0 && <div ref={issueRef} tabIndex={-1} role="alert" className="rounded-lg border border-destructive/50 p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <p className="font-medium">Verifică {issues.length === 1 ? 'următorul câmp' : `următoarele ${issues.length} câmpuri`}</p>
                    <ul className="mt-2 space-y-1">
                      {issues.map(issue => <li key={issue.key}><button type="button" onClick={() => focusIssue(issue)} className="min-h-11 text-left text-sm underline decoration-muted-foreground underline-offset-4 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring">{issue.label}: {issue.readOnly ? 'Verifică datele din dosar sau configurația agenției.' : issue.message}</button></li>)}
                    </ul>
                  </div>}
                  {submissionCount > 0 && <p className="text-sm text-muted-foreground">Date preluate din {submissionCount === 1 ? 'declarația participantului' : `${submissionCount} declarații ale participanților`}. Corecturile din formular se aplică documentului; declarațiile originale rămân în dosar.</p>}
                  <form id="legal-draft-data" autoComplete="off" noValidate onSubmit={event => { event.preventDefault(); reviewDraft() }} className="space-y-7">
                    {groups.map(group => <fieldset key={group.name} className="min-w-0 border-t pt-5">
                      <legend className="pr-3 text-sm font-semibold">{group.name}</legend>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {group.fields.map(field => {
                          const issue = showValidation ? issues.find(item => item.key === field.key) : undefined
                          return <div key={field.key} className={field.type === 'textarea' ? 'min-w-0 sm:col-span-2' : 'min-w-0'}>
                            <label htmlFor={`legal-field-${field.key}`} className="mb-1.5 block text-sm font-medium">{field.label}{requiredKeys.has(field.key) ? <span aria-hidden="true"> *</span> : <span className="font-normal text-muted-foreground"> (opțional)</span>}</label>
                            <FieldControl field={field} value={values[field.key] || ''} issue={issue} required={requiredKeys.has(field.key)} onChange={value => { if (value === (initialValues[field.key] || '')) editedKeysRef.current.delete(field.key); else editedKeysRef.current.add(field.key); setValues(current => ({ ...current, [field.key]: value })) }} />
                            {issue && <p id={`legal-error-${field.key}`} className="mt-1.5 text-sm text-destructive">{issue.message}</p>}
                          </div>
                        })}
                      </div>
                    </fieldset>)}
                  </form>
                  {definition.consumerWithdrawalRequired && <label className="flex min-h-11 items-start gap-3 border-t pt-5 text-sm"><input type="checkbox" checked={consumerContract} onChange={event => setConsumerContract(event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-primary" /><span><span className="block font-medium">Beneficiarul este consumator</span><span className="mt-1 block text-muted-foreground">Documentul va fi marcat pentru informarea separată privind retragerea de 14 zile și cererea expresă de începere a serviciilor.</span></span></label>}
                </> : <article aria-label="Textul documentului" className="max-w-prose whitespace-pre-wrap break-words text-sm leading-7">{reviewText}</article>}

                <details ref={trustedRef} className="border-t pt-1">
                  <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring">Date din dosar și șablon</summary>
                  <div className="space-y-4 pb-2 pt-2 text-sm">
                    <p className="text-muted-foreground">Versiune {context.template.legalVersion} · {reviewed ? `Revizuit de ${context.template.legalReviewerName || 'revizorul juridic'}` : 'Revizuire juridică necesară'}.</p>
                    <p className="text-muted-foreground">{context.template.signatureRequirement === 'SIMPLE' ? 'Șablonul permite semnătură simplă.' : context.template.signatureRequirement === 'QUALIFIED' ? 'Șablonul necesită semnătură calificată.' : 'Șablonul necesită semnătură avansată sau calificată.'}</p>
                    {trustedFields.length > 0 && <><p className="text-muted-foreground">Aceste date se preiau automat. Administratorul actualizează datele agenției; prezența și finalizarea se confirmă în vizionare.</p><dl className="grid gap-4 sm:grid-cols-2">{trustedFields.map(field => <div key={field.key} id={`legal-field-${field.key}`} tabIndex={-1} className="min-w-0 rounded-sm outline-none focus:ring-2 focus:ring-ring"><dt className="text-muted-foreground">{field.label}</dt><dd className="mt-1 break-words font-medium">{preparedValues[field.key] || 'Lipsește din dosar'}</dd></div>)}</dl></>}
                    <Button type="button" variant="outline" className="min-h-11" disabled={submitting} onClick={reloadContext}><RefreshCw className="mr-2 h-4 w-4" />Actualizează datele din dosar</Button>
                  </div>
                </details>
              </div>}
        </div>

        <div className="shrink-0 space-y-3 border-t bg-background px-4 py-4 sm:px-6">
          {context && !loading && !loadError && <p role="status" className="text-sm text-muted-foreground">{stage === 'data' ? issues.length > 0 ? `${issues.length} ${issues.length === 1 ? 'câmp de verificat' : 'câmpuri de verificat'}.` : 'Datele sunt complete. Continuă cu citirea documentului.' : reviewed ? 'PDF-ul va fi adăugat în dosarul selectat.' : 'Se va crea o ciornă. Semnarea rămâne blocată până la revizuirea juridică.'}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" className="min-h-11" disabled={submitting} onClick={stage === 'review' ? () => { setStage('data'); setSubmitError(null); focusStage() } : requestClose}>{stage === 'review' && <ArrowLeft className="mr-2 h-4 w-4" />}{stage === 'review' ? 'Înapoi la date' : 'Renunță'}</Button>
            {stage === 'data' ? <Button type="submit" form="legal-draft-data" className="min-h-11 gap-2" disabled={loading || Boolean(loadError) || !context?.agencyReady}>Verifică textul<ArrowRight className="h-4 w-4" /></Button>
              : <Button type="button" className="min-h-11 gap-2" disabled={submitting || issues.length > 0 || !context?.agencyReady} onClick={() => void handleGenerate()}>{submitting ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <FileCheck2 className="h-4 w-4" />}{submitting ? 'Se creează documentul…' : reviewed ? 'Creează PDF în dosar' : 'Creează ciorna în dosar'}</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    <Dialog open={discardPrompt} onOpenChange={setDiscardPrompt}>
      <DialogContent role="alertdialog" showCloseButton={false} onCloseAutoFocus={event => { event.preventDefault(); stageRef.current?.focus({ preventScroll: true }) }}>
        <DialogHeader><DialogTitle>Renunți la modificări?</DialogTitle><DialogDescription>Datele editate nu au fost salvate. Poți continua redactarea sau închide formularul.</DialogDescription></DialogHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end"><Button type="button" className="min-h-11" onClick={() => setDiscardPrompt(false)}>Continuă redactarea</Button><Button type="button" variant="outline" className="min-h-11" onClick={() => onOpenChange(false)}>Renunță la modificări</Button></div>
      </DialogContent>
    </Dialog>
  </>
}
