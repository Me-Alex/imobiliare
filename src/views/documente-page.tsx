'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { motion } from 'framer-motion'
import {
  Building2,
  CalendarDays,
  ChevronDown,
  FileCheck2,
  FileSignature,
  FolderLock,
  Loader2,
  RefreshCw,
  Settings2,
  ShieldCheck,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PageHero } from '@/components/layout/page-hero'
import {
  DocumentUploadArea,
  type DocumentUploadAreaRef,
} from '@/components/features/documents/document-upload-area'
import { DocumentTableRow, DocumentMobileCard } from '@/components/features/documents/document-card'
import { DocumentSearchBar, filterDocuments, type DocumentFilterState } from '@/components/features/documents/document-search-bar'
import { DocumentPreviewModal } from '@/components/features/documents/document-preview-modal'
import { DocumentActionCenter } from '@/components/features/documents/document-action-center'
import { LegalDocumentBuilderDialog } from '@/components/features/documents/legal-document-builder-dialog'
import { LegalDocumentRequestDialog } from '@/components/features/documents/legal-document-request-dialog'
import { LegalDocumentRequestPanel } from '@/components/features/documents/legal-document-request-panel'
import type { DocType } from '@/components/features/documents/document-type-selector'
import type { DocumentSigner, LegalDocumentRequest, ViewingDocument, Vizionare } from '@/lib/types'
import {
  getLegalDocumentDefinition,
  LEGAL_DOCUMENT_ORDER,
  LEGAL_REQUEST_REQUIRED_ROLES,
  type LegalDocumentKind,
} from '@/lib/legal-documents'
import { DOC_TYPE_LABELS, LS_KEYS } from '@/lib/constants'
import { loadFromLS, saveToLS } from '@/lib/storage'
import { getDocumentFlowSummary } from '@/lib/document-flow'
import { readAppointmentContext, readDealContext, selectDocumentAppointment } from '@/lib/document-navigation'
import {
  createDocumentUrl,
  deleteViewingDocument,
  listViewingDocuments,
  listViewings,
  signViewingDocument,
  uploadViewingDocument,
} from '@/lib/viewing-documents'
import {
  cancelLegalDocumentRequest,
  claimLegalDocumentRequests,
  listLegalDocumentRequests,
  setLegalDocumentRequestStatus,
} from '@/lib/legal-document-requests'
import { formatDateRO } from '@/lib/utils'

const ROLE_COPY = {
  CLIENT: 'Completează datele, solicită documentele și semnează numai versiunea verificată de agent.',
  OWNER: 'Confirmă datele proprietății și semnează documentele partajate care te privesc.',
  AGENT: 'Pregătește dosarele vizionărilor alocate și urmărește semnăturile participanților.',
  ADMIN: 'Administrează documentele, contractele și jurnalul de audit al tuturor vizionărilor.',
} as const

interface SigningState {
  document: ViewingDocument
  signer: DocumentSigner
}

export function DocumentePage() {
  const { user, profile, loading: authLoading } = useAuth()
  const navigateTo = useAppStore((state) => state.navigateTo)
  const uploadAreaRef = useRef<DocumentUploadAreaRef>(null)
  const [viewings, setViewings] = useState<Vizionare[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [documents, setDocuments] = useState<ViewingDocument[]>([])
  const [requests, setRequests] = useState<LegalDocumentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [builderKind, setBuilderKind] = useState<LegalDocumentKind | null>(null)
  const [builderRequests, setBuilderRequests] = useState<LegalDocumentRequest[]>([])
  const [requestKind, setRequestKind] = useState<Exclude<LegalDocumentKind, 'viewing_report'> | null>(null)
  const [editingRequest, setEditingRequest] = useState<LegalDocumentRequest | null>(null)
  const [requestBusyId, setRequestBusyId] = useState<string | null>(null)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [signing, setSigning] = useState<SigningState | null>(null)
  const [signatureName, setSignatureName] = useState('')
  const [signatureAccepted, setSignatureAccepted] = useState(false)
  const [signingBusy, setSigningBusy] = useState(false)

  // Document preview modal state
  const [previewDoc, setPreviewDoc] = useState<ViewingDocument | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  // Search & filter state
  const [filter, setFilter] = useState<DocumentFilterState>({ search: '', types: new Set(), statuses: new Set() })

  const selectedViewing = useMemo(
    () => viewings.find((viewing) => viewing.id === selectedId) ?? null,
    [selectedId, viewings],
  )

  const canGenerateDocuments = profile?.role === 'AGENT' || profile?.role === 'ADMIN'
  const canUploadDocuments = Boolean(profile)
  const uploadedTypes = useMemo(
    () => new Set(documents.filter((document) => document.status !== 'SUPERSEDED').map((document) => document.docType)),
    [documents],
  )

  const filteredDocuments = useMemo(
    () => filterDocuments(documents, filter),
    [documents, filter],
  )

  const refreshDocuments = useCallback(async (appointmentId: string) => {
    setDocumentsLoading(true)
    try {
      setDocuments(await listViewingDocuments(appointmentId))
    } catch (error) {
      toast.error('Documentele nu au putut fi incarcate.', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setDocumentsLoading(false)
    }
  }, [])

  const refreshRequests = useCallback(async (appointmentId: string) => {
    try {
      setRequests(await listLegalDocumentRequests(appointmentId))
    } catch (error) {
      toast.error('Solicitările de documente nu au putut fi încărcate.', {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }, [])

  const refreshViewings = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const rows = await listViewings()
      setViewings(rows)
      const requestedId = readAppointmentContext()
      const storedId = loadFromLS<string | null>(LS_KEYS.SELECTED_VIZIONARE, null)
      const preferredId = requestedId || storedId
      const nextId = rows.some((row) => row.id === preferredId) ? preferredId : rows[0]?.id || null
      setSelectedId(nextId)
    } catch (error) {
      toast.error('Vizionarile nu au putut fi incarcate.', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) queueMicrotask(() => void refreshViewings())
  }, [user, refreshViewings])

  useEffect(() => {
    if (!selectedId) {
      queueMicrotask(() => setDocuments([]))
      queueMicrotask(() => setRequests([]))
      return
    }
    saveToLS(LS_KEYS.SELECTED_VIZIONARE, selectedId)
    if (readAppointmentContext() !== selectedId) {
      selectDocumentAppointment(selectedId)
    } else {
      selectDocumentAppointment(selectedId, readDealContext())
    }
    queueMicrotask(() => void Promise.all([
      refreshDocuments(selectedId),
      refreshRequests(selectedId),
    ]))
  }, [selectedId, refreshDocuments, refreshRequests])

  const handleFileReady = useCallback(async (docType: DocType, file: File) => {
    if (!user || !selectedViewing) throw new Error('Selecteaza o vizionare.')
    try {
      await uploadViewingDocument({
        user,
        viewing: selectedViewing,
        docType,
        file,
        documentOwnerId: profile?.role === 'OWNER' ? user.id : undefined,
      })
      await refreshDocuments(selectedViewing.id)
      toast.success('Document incarcat in dosarul privat.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Incarcarea a esuat.'
      toast.error('Documentul nu a putut fi incarcat.', { description: message })
      throw error
    }
  }, [profile?.role, refreshDocuments, selectedViewing, user])

  const handleView = useCallback(async (document: ViewingDocument) => {
    setPreviewDoc(document)
    setPreviewLoading(true)
    setPreviewError(null)
    setPreviewUrl(null)
    try {
      const url = await createDocumentUrl(document)
      setPreviewUrl(url)
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Documentul nu poate fi deschis.')
    } finally {
      setPreviewLoading(false)
    }
  }, [])

  const handlePreviewClose = useCallback(() => {
    setPreviewDoc(null)
    setPreviewUrl(null)
    setPreviewError(null)
    setPreviewLoading(false)
  }, [])

  const handleDownload = async (document: ViewingDocument) => {
    try {
      const url = await createDocumentUrl(document, true)
      const link = window.document.createElement('a')
      link.href = url
      link.download = document.fileName
      link.rel = 'noopener'
      link.click()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Documentul nu poate fi descarcat.')
    }
  }

  const handleDelete = async (document: ViewingDocument) => {
    if (!selectedViewing) return
    try {
      await deleteViewingDocument(document)
      await refreshDocuments(selectedViewing.id)
      toast.success('Document sters din dosar.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Documentul nu poate fi sters.')
    }
  }

  const activeRequestsForKind = (kind: LegalDocumentKind) => requests.filter((request) =>
    request.documentKind === kind && ['REQUESTED', 'IN_REVIEW'].includes(request.status),
  )

  const requiredRequesterId = (role: 'CLIENT' | 'OWNER') =>
    role === 'CLIENT' ? selectedViewing?.clientId : selectedViewing?.ownerId

  const missingRequestRoles = (kind: LegalDocumentKind) => {
    if (profile?.role === 'ADMIN' || kind === 'viewing_report') return []
    const matching = activeRequestsForKind(kind)
    return LEGAL_REQUEST_REQUIRED_ROLES[kind].filter((role) => {
      const requesterId = requiredRequesterId(role)
      return !requesterId || !matching.some((request) => request.requesterId === requesterId)
    })
  }

  const handleOpenBuilder = async (kind: LegalDocumentKind) => {
    if (!user || !selectedViewing || !canGenerateDocuments) return
    if (kind === 'viewing_report' && selectedViewing.status !== 'completed') return
    const missing = missingRequestRoles(kind)
    if (missing.length > 0) {
      toast.error('Lipsesc datele participanților.', {
        description: `Așteaptă completarea de la: ${missing.map((role) => role === 'CLIENT' ? 'client' : 'proprietar').join(' și ')}.`,
      })
      return
    }

    const matching = activeRequestsForKind(kind)
    try {
      await claimLegalDocumentRequests(
        matching.map((request) => request.id),
      )
      const claimed = matching.map((request) => ({
        ...request,
        status: 'IN_REVIEW' as const,
        handledBy: user.id,
      }))
      setBuilderRequests(claimed)
      setBuilderKind(kind)
      await refreshRequests(selectedViewing.id)
    } catch (error) {
      toast.error('Solicitările nu au putut fi preluate.', {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  const handleCancelRequest = async (request: LegalDocumentRequest) => {
    if (!selectedViewing) return
    setRequestBusyId(request.id)
    try {
      await cancelLegalDocumentRequest(request.id)
      await refreshRequests(selectedViewing.id)
      toast.success('Solicitarea a fost anulată.')
    } catch (error) {
      toast.error('Solicitarea nu a putut fi anulată.', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setRequestBusyId(null)
    }
  }

  const handleStaffRequestStatus = async (
    request: LegalDocumentRequest,
    status: 'NEEDS_INFO' | 'REJECTED',
    note: string,
  ) => {
    if (!selectedViewing) return
    try {
      await setLegalDocumentRequestStatus(request.id, status, note)
      await refreshRequests(selectedViewing.id)
      toast.success(status === 'NEEDS_INFO' ? 'Completările au fost solicitate.' : 'Solicitarea a fost respinsă.')
    } catch (error) {
      toast.error('Starea solicitării nu a putut fi schimbată.', {
        description: error instanceof Error ? error.message : undefined,
      })
      throw error
    }
  }

  const openSigningDialog = (document: ViewingDocument, signer: DocumentSigner) => {
    setSigning({ document, signer })
    setSignatureName(profile?.fullName || user?.email?.split('@')[0] || '')
    setSignatureAccepted(false)
  }

  const handleSign = async () => {
    if (!signing || !user || !selectedViewing) return
    if (signatureName.trim().length < 3 || !signatureAccepted) return
    setSigningBusy(true)
    try {
      await signViewingDocument(signing.signer.id, user.id, signatureName)
      await refreshDocuments(selectedViewing.id)
      setSigning(null)
      toast.success('Semnatura a fost inregistrata in jurnalul documentului.')
    } catch (error) {
      toast.error('Documentul nu a putut fi semnat.', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setSigningBusy(false)
    }
  }

  const flowSummary = selectedViewing && user && profile
    ? getDocumentFlowSummary({
        role: profile.role,
        userId: user.id,
        viewing: selectedViewing,
        documents,
        requests,
      })
    : null

  const openTools = (uploadType?: DocType) => {
    flushSync(() => setToolsOpen(true))
    window.requestAnimationFrame(() => {
      document.getElementById('document-tools')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    if (uploadType) uploadAreaRef.current?.triggerUpload(uploadType)
  }

  const handlePrimaryAction = () => {
    if (!flowSummary) return
    const { action } = flowSummary

    if (action.type === 'SIGN' && action.document && action.signer) {
      openSigningDialog(action.document, action.signer)
      return
    }
    if (action.type === 'EXTERNAL_SIGNATURE' && action.document) {
      void handleView(action.document)
      toast.info('Semnarea se continuă prin furnizorul verificat.', {
        description: 'Poți consulta versiunea exactă aici; agentul sau administratorul coordonează semnarea avansată/calificată.',
      })
      return
    }
    if (action.type === 'EDIT_REQUEST' && action.request) {
      setEditingRequest(action.request)
      setRequestKind(action.request.documentKind)
      return
    }
    if (action.type === 'CREATE_REQUEST' && action.kind && action.kind !== 'viewing_report') {
      setEditingRequest(null)
      setRequestKind(action.kind)
      return
    }
    if (action.type === 'GENERATE_DOCUMENT' && action.kind) {
      void handleOpenBuilder(action.kind)
      return
    }
    if (action.type === 'UPLOAD_IDENTITY') {
      openTools(profile?.role === 'OWNER' ? 'ownership_title' : 'id_card')
      return
    }
    if (action.type === 'OPEN_TOOLS') {
      openTools()
      return
    }
    document.getElementById('document-archive')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (authLoading) {
    return <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  if (!user || !profile) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><User className="h-6 w-6" /></div>
            <CardTitle>Autentifică-te</CardTitle>
            <CardDescription>Documentele sunt disponibile numai utilizatorilor autentificați.</CardDescription>
          </CardHeader>
          <CardContent><Button onClick={() => navigateTo('login')}>Autentificare</Button></CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <PageHero
          variant="simple"
          title="Dosar digital"
          description={ROLE_COPY[profile.role]}
          showBackButton
          onBack={() => navigateTo(profile.role === 'CLIENT' ? 'vizionarile-mele' : 'dashboard')}
          backLabel="Înapoi"
        />

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : viewings.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <FolderLock className="h-10 w-10 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="font-semibold">Nu există vizionări asociate contului</h2>
              <p className="text-sm text-muted-foreground mt-1 mb-5">Dosarul digital va fi creat după programarea unei vizionări.</p>
              {profile.role === 'CLIENT' && <Button onClick={() => navigateTo('programare-vizionare')}>Programează o vizionare</Button>}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Dosarul vizionării</CardTitle>
                    <CardDescription>Alege tranzacția; contextul rămâne păstrat între Deal Room și documente.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => void refreshViewings()} className="gap-2">
                    <RefreshCw className="h-3.5 w-3.5" /> Actualizează
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <select
                  value={selectedId || ''}
                  onChange={(event) => setSelectedId(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Vizionare selectata"
                >
                  {viewings.map((viewing) => (
                    <option key={viewing.id} value={viewing.id}>
                      {viewing.propertyTitle} - {formatDateRO(viewing.date)}, {viewing.startTime}
                    </option>
                  ))}
                </select>

                {selectedViewing && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" /> {selectedViewing.propertyTitle}</span>
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {formatDateRO(selectedViewing.date)}, {selectedViewing.startTime}-{selectedViewing.endTime}</span>
                    <Badge variant="outline">{selectedViewing.staffName}</Badge>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {flowSummary && (
              <DocumentActionCenter summary={flowSummary} onPrimaryAction={handlePrimaryAction} />
            )}

            <Collapsible open={toolsOpen} onOpenChange={setToolsOpen} className="mb-6">
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="h-auto min-h-12 w-full justify-between gap-3 whitespace-normal px-4 py-3">
                  <span className="flex items-center gap-2 text-left">
                    <Settings2 className="h-4 w-4 shrink-0 text-primary" />
                    <span>
                      <span className="block font-medium">Toate acțiunile dosarului</span>
                      <span className="block text-xs font-normal text-muted-foreground">Solicitări, generare și încărcări manuale</span>
                    </span>
                  </span>
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${toolsOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div id="document-tools" className="scroll-mt-24 pt-4">
            {selectedViewing && (
              <LegalDocumentRequestPanel
                role={profile.role}
                requests={requests}
                busyId={requestBusyId}
                onCreate={(kind) => {
                  setEditingRequest(null)
                  setRequestKind(kind)
                }}
                onEdit={(request) => {
                  setEditingRequest(request)
                  setRequestKind(request.documentKind)
                }}
                onCancel={handleCancelRequest}
                onStaffStatus={handleStaffRequestStatus}
              />
            )}

            {selectedViewing && canGenerateDocuments && (
              <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Generează alt document</CardTitle>
                    <CardDescription>Datele verificate sunt reutilizate; alegi doar documentul necesar etapei.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid sm:grid-cols-2 gap-3">
                    {LEGAL_DOCUMENT_ORDER.map((kind) => {
                      const definition = getLegalDocumentDefinition(kind)
                      const viewingReportBlocked = kind === 'viewing_report'
                        && selectedViewing.status !== 'completed'
                      const missingRoles = missingRequestRoles(kind)
                      const requestBlocked = profile.role === 'AGENT' && missingRoles.length > 0
                      const blocked = viewingReportBlocked || requestBlocked
                      const readyRequests = activeRequestsForKind(kind)
                      return (
                        <Button
                          key={kind}
                          variant="outline"
                          className="h-auto min-h-20 py-4 justify-start gap-3 whitespace-normal"
                          onClick={() => void handleOpenBuilder(kind)}
                          disabled={blocked}
                        >
                          {kind === 'viewing_report'
                            ? <FileCheck2 className="h-5 w-5 shrink-0 text-primary" />
                            : <FileSignature className="h-5 w-5 shrink-0 text-primary" />}
                          <span className="text-left">
                            <span className="block font-medium">{definition.shortTitle}</span>
                            <span className="block text-xs font-normal text-muted-foreground">
                              {viewingReportBlocked
                                ? 'Disponibilă numai după confirmarea prezenței și finalizarea vizionării.'
                                : requestBlocked
                                  ? `Așteaptă datele de la: ${missingRoles.map((role) => role === 'CLIENT' ? 'client' : 'proprietar').join(' și ')}.`
                                  : readyRequests.length > 0
                                    ? 'Datele participanților sunt pregătite pentru verificare.'
                                    : definition.description}
                            </span>
                          </span>
                        </Button>
                      )
                    })}
                  </CardContent>
                </Card>

                <Alert>
                  <ShieldCheck className="h-4 w-4" />
                  <AlertTitle>Nivelul semnăturii este impus de șablon</AlertTitle>
                  <AlertDescription>
                    Fișa de vizionare poate utiliza semnătura simplă auditată. Contractele și documentele cu obligații financiare rămân blocate pentru semnătură avansată sau calificată.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {selectedViewing && canUploadDocuments && (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <DocumentUploadArea
                    ref={uploadAreaRef}
                    uploadedTypes={uploadedTypes}
                    allowedTypes={profile.role === 'CLIENT'
                      ? ['id_card', 'proof_of_income', 'other']
                      : profile.role === 'OWNER'
                        ? ['id_card', 'ownership_title', 'land_registry_excerpt', 'fiscal_certificate', 'energy_certificate', 'other']
                        : undefined}
                    onFileReady={handleFileReady}
                  />
                </CardContent>
              </Card>
            )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Card id="document-archive" className="scroll-mt-24">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><FolderLock className="h-4 w-4 text-primary" /> Arhiva dosarului</CardTitle>
                <CardDescription>Fișiere private, versiuni și jurnal, disponibile numai participanților autorizați.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {documentsLoading ? (
                  <div className="py-14 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : documents.length === 0 ? (
                  <div className="py-14 px-4 text-center text-sm text-muted-foreground">Nu există încă documente în acest dosar.</div>
                ) : (
                  <div className="p-4 space-y-3">
                    {documents.length > 4 && <DocumentSearchBar documents={documents} filter={filter} onFilterChange={setFilter} />}
                    {filteredDocuments.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">Niciun document nu corespunde filtrelor selectate.</div>
                    ) : (
                      <>
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead><tr className="border-b bg-muted/30 text-left"><th className="px-4 py-3 font-medium">Document</th><th className="px-4 py-3 font-medium">Tip</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Marime</th><th className="px-4 py-3 font-medium">Data</th><th className="px-4 py-3 font-medium text-right">Actiuni</th></tr></thead>
                            <tbody>
                              {filteredDocuments.map((document) => (
                                <DocumentTableRow
                                  key={document.id}
                                  document={document}
                                  currentUserId={user.id}
                                  canDelete={!document.lockedAt && document.userId === user.id && !['SIGNED', 'PARTIALLY_SIGNED'].includes(document.status)}
                                  onView={handleView}
                                  onDownload={handleDownload}
                                  onDelete={handleDelete}
                                  onSign={openSigningDialog}
                                />
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="md:hidden divide-y">
                          {filteredDocuments.map((document) => (
                            <DocumentMobileCard
                              key={document.id}
                              document={document}
                              currentUserId={user.id}
                              canDelete={!document.lockedAt && document.userId === user.id && !['SIGNED', 'PARTIALLY_SIGNED'].includes(document.status)}
                              onView={handleView}
                              onDownload={handleDownload}
                              onDelete={handleDelete}
                              onSign={openSigningDialog}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {user && profile && selectedViewing && (profile.role === 'CLIENT' || profile.role === 'OWNER') && (
        <LegalDocumentRequestDialog
          kind={requestKind}
          role={profile.role}
          user={user}
          profile={profile}
          viewing={selectedViewing}
          request={editingRequest}
          onOpenChange={(open) => {
            if (!open) {
              setRequestKind(null)
              setEditingRequest(null)
            }
          }}
          onSaved={() => refreshRequests(selectedViewing.id)}
        />
      )}

      {user && selectedViewing && canGenerateDocuments && (
        <LegalDocumentBuilderDialog
          kind={builderKind}
          user={user}
          viewing={selectedViewing}
          requestSubmissions={builderRequests}
          onOpenChange={(open) => {
            if (!open) {
              setBuilderKind(null)
              setBuilderRequests([])
            }
          }}
          onCreated={async () => {
            await Promise.all([
              refreshDocuments(selectedViewing.id),
              refreshRequests(selectedViewing.id),
            ])
          }}
        />
      )}

      <DocumentPreviewModal
        document={previewDoc}
        signedUrl={previewUrl}
        loading={previewLoading}
        error={previewError}
        onClose={handlePreviewClose}
        onDownload={() => previewDoc && void handleDownload(previewDoc)}
      />

      <Dialog open={Boolean(signing)} onOpenChange={(open) => !open && !signingBusy && setSigning(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Semneaza documentul</DialogTitle>
            <DialogDescription>{signing?.document.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              Hash document: <span className="font-mono break-all text-foreground">{signing?.document.checksum || 'indisponibil'}</span>
            </div>
            <div className="space-y-2">
              <label htmlFor="signature-name" className="text-sm font-medium">Numele complet</label>
              <Input id="signature-name" value={signatureName} onChange={(event) => setSignatureName(event.target.value)} autoComplete="name" />
            </div>
            <label className="flex items-start gap-3 text-sm cursor-pointer">
              <input type="checkbox" checked={signatureAccepted} onChange={(event) => setSignatureAccepted(event.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
              <span>Confirm ca am citit documentul, ca datele sunt corecte si ca doresc sa il semnez electronic.</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={signingBusy} onClick={() => setSigning(null)}>Renunta</Button>
            <Button disabled={signingBusy || !signatureAccepted || signatureName.trim().length < 3} onClick={() => void handleSign()} className="gap-2">
              {signingBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />}
              Semneaza
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
