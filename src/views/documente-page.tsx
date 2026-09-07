'use client'


import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { documentSectionUrl, readDocumentSection, type DocumentSection } from '@/lib/document-section-navigation'
import {
  FileCheck2,
  FileSignature,
  FolderLock,
  Loader2,
  ShieldCheck,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PageContainer, PageHero, PageShell } from '@/components/layout'
import { PageState } from '@/components/ui/page-state'
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
import { LS_KEYS } from '@/lib/constants'
import { saveToLS } from '@/lib/storage'
import { getDocumentFlowSummary } from '@/lib/document-flow'
import { getDocumentActionPlan } from '@/lib/document-action-plan'
import { type DocumentQuickActionTarget } from '@/lib/document-quick-actions'
import {
  clearDocumentFocusContext,
  openDealRoomForViewing,
  readAppointmentContext,
  readDealContext,
  readDocumentFocusContext,
  returnToWorkflow,
  selectDocumentAppointment,
  type DocumentFocusTarget,
} from '@/lib/document-navigation'
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
import {
  getViewingWorkspaceLabel,
  isDocumentWorkspaceClosed,
} from '@/lib/document-workspace'
import { getDocumentWorkspaceEmptyState } from '@/lib/document-workspace-empty-state'

interface SigningState {
  document: ViewingDocument
  signer: DocumentSigner
}

export function DocumentePage() {
  const [requestedAppointment, setRequestedAppointment] = useState(() => readAppointmentContext())
  const [choosingDossier, setChoosingDossier] = useState(() => !readAppointmentContext())
  const { user, profile, loading: authLoading } = useAuth()
  const navigateTo = useAppStore((state) => state.navigateTo)
  const uploadAreaRef = useRef<DocumentUploadAreaRef>(null)
  const [viewings, setViewings] = useState<Vizionare[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const activeAppointment = useRef<string | null>(null)
  useEffect(() => { activeAppointment.current = selectedId }, [selectedId])
  const [documents, setDocuments] = useState<ViewingDocument[]>([])
  const [requests, setRequests] = useState<LegalDocumentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const documentsSequence = useRef(0)
  const requestsSequence = useRef(0)
  const [builderKind, setBuilderKind] = useState<LegalDocumentKind | null>(null)
  const [builderRequests, setBuilderRequests] = useState<LegalDocumentRequest[]>([])
  const [requestKind, setRequestKind] = useState<Exclude<LegalDocumentKind, 'viewing_report'> | null>(null)
  const [editingRequest, setEditingRequest] = useState<LegalDocumentRequest | null>(null)
  const [requestBusyId, setRequestBusyId] = useState<string | null>(null)
  const [section, setSection] = useState<DocumentSection>(() => typeof window === 'undefined' ? 'overview' : readDocumentSection(new URL(window.location.href)))
  const [dossierQuery, setDossierQuery] = useState('')
  const tool = ['requests', 'generate', 'upload'].includes(section) ? section : null
  const navigateSection = (next: DocumentSection) => {
    const url = documentSectionUrl(new URL(window.location.href), selectedId, next)
    if (url.href !== window.location.href) window.history.pushState({ ...window.history.state, hqsPage: 'documente' }, '', url)
    setSection(next)
  }
  const setTool = (next: 'requests' | 'generate' | 'upload' | null) => navigateSection(next || 'overview')
  const chooseDossier = (appointmentId: string | null) => {
    const url = documentSectionUrl(new URL(window.location.href), appointmentId)
    if (appointmentId !== selectedId) url.searchParams.delete('deal')
    window.history.pushState({ ...window.history.state, hqsPage: 'documente' }, '', url)
    setRequestedAppointment(appointmentId)
    setSelectedId(appointmentId)
    setChoosingDossier(!appointmentId)
    setSection('overview')
    setDocuments([]); setRequests([]); setLoadError('')
    setDocumentsLoading(Boolean(appointmentId)); setRequestsLoading(Boolean(appointmentId))
    setFilter({ search: '', types: new Set(), statuses: new Set() })
  }
  const [reviewingSignature, setReviewingSignature] = useState<SigningState | null>(null)
  const [signing, setSigning] = useState<SigningState | null>(null)
  const [signatureName, setSignatureName] = useState('')
  const [signatureAccepted, setSignatureAccepted] = useState(false)
  const [signingBusy, setSigningBusy] = useState(false)
  const [, setFocusedDocumentTarget] = useState<DocumentFocusTarget | null>(null)

  // Document preview modal state
  const previewSequence = useRef(0)
  const [previewDoc, setPreviewDoc] = useState<ViewingDocument | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  // Search & filter state
  const [filter, setFilter] = useState<DocumentFilterState>({ search: '', types: new Set(), statuses: new Set() })

  useEffect(() => {
    const restore = () => {
      const url = new URL(window.location.href)
      if (url.searchParams.get('page') !== 'documente') return
      const appointmentId = url.searchParams.get('appointment')
      setRequestedAppointment(appointmentId)
      setChoosingDossier(!appointmentId)
      if (selectedId !== appointmentId) {
        documentsSequence.current++; requestsSequence.current++
        setDocuments([]); setRequests([]); setLoadError('')
        setDocumentsLoading(Boolean(appointmentId)); setRequestsLoading(Boolean(appointmentId))
      }
      setSelectedId(appointmentId)
      setSection(readDocumentSection(url))
      setRequestKind(null); setBuilderKind(null); setSigning(null); setReviewingSignature(null)
      setPreviewDoc(null); setPreviewUrl(null)
      previewSequence.current++
    }
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [selectedId])

  const selectedViewing = useMemo(
    () => viewings.find((viewing) => viewing.id === selectedId) ?? null,
    [selectedId, viewings],
  )

  const actionableViewings = useMemo(
    () => viewings.filter((viewing) => !isDocumentWorkspaceClosed(viewing.status)),
    [viewings],
  )
  const closedViewings = useMemo(
    () => viewings.filter((viewing) => isDocumentWorkspaceClosed(viewing.status)),
    [viewings],
  )
  const selectedWorkspaceClosed = selectedViewing
    ? isDocumentWorkspaceClosed(selectedViewing.status)
    : false

  const canGenerateDocuments = profile?.role === 'AGENT' || profile?.role === 'ADMIN'
  const canUploadDocuments = Boolean(profile) && !selectedWorkspaceClosed
  const uploadedTypes = useMemo(
    () => new Set(documents.filter((document) => document.status !== 'SUPERSEDED').map((document) => document.docType)),
    [documents],
  )

  const filteredDocuments = useMemo(
    () => filterDocuments(documents, filter),
    [documents, filter],
  )

  const refreshDocuments = useCallback(async (appointmentId: string) => {
    if (activeAppointment.current !== appointmentId) return
    const sequence = ++documentsSequence.current
    setDocumentsLoading(true)
    try {
      const result = await listViewingDocuments(appointmentId)
      if (sequence === documentsSequence.current && activeAppointment.current === appointmentId) setDocuments(result)
    } catch (error) {
      if (sequence !== documentsSequence.current) return
      setLoadError('Documentele nu au putut fi încărcate. Reîncearcă înainte de a continua.')
      toast.error('Documentele nu au putut fi incarcate.', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      if (sequence === documentsSequence.current) setDocumentsLoading(false)
    }
  }, [])

  const refreshRequests = useCallback(async (appointmentId: string) => {
    if (activeAppointment.current !== appointmentId) return
    const sequence = ++requestsSequence.current
    setRequestsLoading(true)
    try {
      const result = await listLegalDocumentRequests(appointmentId)
      if (sequence === requestsSequence.current && activeAppointment.current === appointmentId) setRequests(result)
    } catch (error) {
      if (sequence !== requestsSequence.current) return
      setLoadError('Datele trimise agentului nu au putut fi încărcate. Reîncearcă înainte de a continua.')
      toast.error('Solicitările de documente nu au putut fi încărcate.', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      if (sequence === requestsSequence.current) setRequestsLoading(false)
    }
  }, [])

  const refreshViewings = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const rows = await listViewings()
      setViewings(rows)
      const requestedId = readAppointmentContext()
      setSelectedId(requestedId && rows.some(row => row.id === requestedId) ? requestedId : null)
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
    documentsSequence.current++
    requestsSequence.current++
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
    queueMicrotask(() => { setDocuments([]); setRequests([]); setLoadError('') })
    queueMicrotask(() => void Promise.all([
      refreshDocuments(selectedId),
      refreshRequests(selectedId),
    ]))
  }, [selectedId, refreshDocuments, refreshRequests])

  const handleFileReady = useCallback(async (docType: DocType, file: File) => {
    if (!user || !selectedViewing) throw new Error('Selecteaza o vizionare.')
    if (isDocumentWorkspaceClosed(selectedViewing.status)) {
      throw new Error('Dosarul unei programări închise este disponibil numai pentru consultare.')
    }
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
    const sequence = ++previewSequence.current
    setPreviewDoc(document)
    setPreviewLoading(true)
    setPreviewError(null)
    setPreviewUrl(null)
    try {
      const url = await createDocumentUrl(document)
      if (sequence === previewSequence.current) setPreviewUrl(url)
    } catch (error) {
      if (sequence === previewSequence.current) setPreviewError(error instanceof Error ? error.message : 'Documentul nu poate fi deschis.')
    } finally {
      if (sequence === previewSequence.current) setPreviewLoading(false)
    }
  }, [])

  const handlePreviewClose = useCallback(() => {
    previewSequence.current++
    setReviewingSignature(null)
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
    if (isDocumentWorkspaceClosed(selectedViewing.status)) return
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
    setReviewingSignature({ document, signer })
    void handleView(document)
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

  const flowSummary = !choosingDossier && !documentsLoading && !requestsLoading && !loadError && selectedViewing && user && profile
    ? getDocumentFlowSummary({
        role: profile.role,
        userId: user.id,
        viewing: selectedViewing,
        documents,
        requests,
      })
    : null
  const actionPlan = selectedViewing && user && profile
    ? getDocumentActionPlan({
        role: profile.role,
        userId: user.id,
        viewing: selectedViewing,
        documents,
        requests,
      })
    : null
  useEffect(() => {
    if (!selectedViewing || !actionPlan || loading || documentsLoading) return

    const focus = readDocumentFocusContext()
    if (!focus) return

    setFocusedDocumentTarget(focus)
    if (focus === 'advanced' && !actionPlan.readOnly) {
      setSection('requests')
    }

    const focusedSection = focus === 'archive' || (focus === 'advanced' && actionPlan.readOnly) ? 'files' : focus === 'advanced' ? 'requests' : 'overview'
    setSection(focusedSection)
    const focusedUrl = documentSectionUrl(new URL(window.location.href), selectedViewing.id, focusedSection)
    window.history.replaceState(window.history.state, '', focusedUrl)

    const targetId = focus === 'archive' || (focus === 'advanced' && actionPlan.readOnly)
      ? 'document-archive'
      : focus === 'advanced'
        ? 'document-tools'
        : 'document-simple-actions'

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    })
    clearDocumentFocusContext()

    const timer = window.setTimeout(() => {
      setFocusedDocumentTarget((current) => current === focus ? null : current)
    }, 4500)

    return () => window.clearTimeout(timer)
  }, [actionPlan, documentsLoading, loading, selectedViewing])

  const openTools = (uploadType?: DocType) => {
    flushSync(() => setTool(uploadType ? 'upload' : 'requests'))
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
      if (canGenerateDocuments && requests.length === 0) setTool('generate')
      else openTools()
      return
    }
    navigateSection('files')
  }

  const handleQuickAction = (target: DocumentQuickActionTarget) => {
    if (target === 'primary') {
      handlePrimaryAction()
      return
    }
    if (target === 'deal-room') {
      if (selectedViewing) openDealRoomForViewing(navigateTo, selectedViewing.id, readDealContext())
      else navigateTo('deal-room')
      return
    }
    if (target === 'advanced') {
      openTools()
      return
    }
    navigateSection('files')
  }

  if (authLoading) {
    return (
      <PageShell>
        <PageContainer width="narrow" className="py-10">
          <PageState
            tone="loading"
            title="Încărcăm dosarul digital"
            description="Sincronizăm vizionările, documentele și semnăturile disponibile pentru contul tău."
          />
        </PageContainer>
      </PageShell>
    )
  }

  if (!user || !profile) {
    return (
      <PageShell>
        <PageContainer width="narrow" className="py-10">
          <PageState
            tone="neutral"
            icon={User}
            title="Autentifică-te"
            description="Documentele sunt disponibile numai utilizatorilor autentificați."
            action={<Button onClick={() => navigateTo('login')}>Autentificare</Button>}
          />
        </PageContainer>
      </PageShell>
    )
  }

  const emptyDocumentState = getDocumentWorkspaceEmptyState(profile.role)

  return (
    <PageShell>
      <PageContainer width="default" className="py-8">
        <PageHero
          variant="simple"
          title="Documente"
          description={choosingDossier || !selectedViewing ? 'Alege dosarul în care vrei să lucrezi.' : undefined}
          showBackButton
          onBack={() => choosingDossier || !selectedViewing ? returnToWorkflow(navigateTo, 'dashboard') : chooseDossier(null)}
          backLabel={choosingDossier || !selectedViewing ? 'Înapoi la cont' : 'Toate dosarele'}
        />

        {loading ? (
          <PageState
            tone="loading"
            title="Se încarcă dosarele"
            description="Pregătim lista de vizionări și documentele asociate."
          />
        ) : viewings.length === 0 ? (
          <PageState
            tone="empty"
            icon={FolderLock}
            title={emptyDocumentState.title}
            description={emptyDocumentState.description}
            action={(
              <div className="flex max-w-lg flex-col items-center gap-3">
                <Button onClick={() => navigateTo(emptyDocumentState.actionPage)}>
                  {emptyDocumentState.actionLabel}
                </Button>
                <p className="text-xs leading-5 text-muted-foreground">{emptyDocumentState.secondaryHint}</p>
              </div>
            )}
          />
        ) : (
          <>
            {choosingDossier || !selectedViewing ? <section aria-label="Alege dosarul" className="space-y-5">
              <div><h2 className="text-lg font-semibold">Pentru ce proprietate?</h2><p className="mt-1 text-sm text-muted-foreground">Alege dosarul în care vrei să completezi date sau să consulți documente.</p></div>
              {requestedAppointment && !selectedViewing && <p role="alert" className="text-sm text-destructive">Dosarul din link nu este disponibil pentru acest cont. Alege un dosar din listă.</p>}
              {viewings.length > 3 && <Input aria-label="Caută un dosar" placeholder="Proprietate sau client" value={dossierQuery} onChange={event => setDossierQuery(event.target.value)} />}
              {[{ title: 'În lucru', items: actionableViewings }, { title: 'Închise · doar consultare', items: closedViewings }].map(group => ({ ...group, items: group.items.filter(viewing => [viewing.propertyTitle, viewing.userName, viewing.userEmail].join(' ').toLocaleLowerCase('ro').includes(dossierQuery.trim().toLocaleLowerCase('ro'))) })).filter(group => group.items.length).map(group => <section key={group.title}>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">{group.title}</h3>
                <div className="divide-y rounded-xl border">{group.items.map(viewing => <button type="button" key={viewing.id} className="block min-h-20 w-full p-4 text-left hover:bg-muted focus-visible:outline-ring" onClick={() => {
                  chooseDossier(viewing.id)
                }}>
                  <span className="block font-medium">{viewing.propertyTitle}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{formatDateRO(viewing.date)}, {viewing.startTime} · {getViewingWorkspaceLabel(viewing.status)}{canGenerateDocuments ? ` · ${viewing.userName || viewing.userEmail}` : ''}</span>
                </button>)}</div>
              </section>)}
              {dossierQuery && !viewings.some(viewing => [viewing.propertyTitle, viewing.userName, viewing.userEmail].join(' ').toLocaleLowerCase('ro').includes(dossierQuery.trim().toLocaleLowerCase('ro'))) && <p role="status" className="py-6 text-sm text-muted-foreground">Niciun dosar găsit. Încearcă alt nume sau altă proprietate.</p>}
            </section> : <>
              <div className="mb-5 flex items-start justify-between gap-3 border-b pb-4">
                <div className="min-w-0"><h2 className="break-words font-semibold">{selectedViewing.propertyTitle}</h2><p className="mt-1 text-sm text-muted-foreground">{formatDateRO(selectedViewing.date)}, {selectedViewing.startTime}</p></div>

              </div>
              {(documentsLoading || requestsLoading) && <p role="status" className="mb-5 text-sm text-muted-foreground">Verificăm documentele și datele trimise agentului…</p>}
              {loadError && <div role="alert" className="mb-5"><p>{loadError}</p><Button variant="outline" className="mt-2" onClick={() => { setLoadError(''); void Promise.all([refreshDocuments(selectedViewing.id), refreshRequests(selectedViewing.id)]) }}>Reîncearcă</Button></div>}
              <Tabs value={section === 'upload' ? 'files' : section === 'generate' ? 'overview' : section} onValueChange={value => navigateSection(value as DocumentSection)} className="mb-6">
                <TabsList aria-label="Navigare documente" className="grid h-auto w-full grid-cols-3">
                  <TabsTrigger id="document-overview-tab" aria-controls={section === 'generate' ? 'document-tools' : 'document-overview'} value="overview" onClick={() => navigateSection('overview')} className="min-h-11 whitespace-normal text-xs sm:text-sm">De făcut</TabsTrigger>
                  <TabsTrigger id="document-files-tab" aria-controls={section === 'upload' ? 'document-tools' : 'document-archive'} value="files" onClick={() => navigateSection('files')} className="min-h-11 whitespace-normal text-xs sm:text-sm">Fișiere ({documents.length})</TabsTrigger>
                  <TabsTrigger id="document-requests-tab" aria-controls="document-tools" value="requests" onClick={() => navigateSection('requests')} className="min-h-11 whitespace-normal text-xs sm:text-sm">Date pentru agent</TabsTrigger>
                </TabsList>
              </Tabs>

              {section === 'overview' && <section id="document-overview" role="tabpanel" aria-labelledby="document-overview-tab">
                {flowSummary && <DocumentActionCenter summary={flowSummary} onPrimaryAction={handlePrimaryAction} primaryLabel={flowSummary.action.type === 'OPEN_TOOLS' && canGenerateDocuments && requests.length === 0 ? 'Alege documentul de pregătit' : undefined} />}
                {readDealContext() && <Button variant="link" className="mb-5 h-auto p-0" onClick={() => handleQuickAction('deal-room')}>Înapoi la tranzacție</Button>}
                {canGenerateDocuments && !(flowSummary?.action.type === 'OPEN_TOOLS' && requests.length === 0) && !selectedWorkspaceClosed && !documentsLoading && !requestsLoading && !loadError && <Button variant="outline" onClick={() => setTool('generate')}>Pregătește un document</Button>}
              </section>}

              {tool && !selectedWorkspaceClosed && !documentsLoading && !requestsLoading && !loadError && <section aria-label={tool === 'upload' ? 'Încarcă un fișier' : tool === 'generate' ? 'Pregătește un document' : 'Date pentru agent'}>
                {tool !== 'requests' && <Button variant="link" className="mb-4 h-auto p-0" onClick={() => navigateSection(tool === 'upload' ? 'files' : 'overview')}>{tool === 'upload' ? 'Înapoi la fișiere' : 'Înapoi la ce ai de făcut'}</Button>}
                <div className="mb-5">
                  <h2 className="text-lg font-semibold">{tool === 'upload' ? 'Încarcă un fișier' : tool === 'generate' ? 'Pregătește un document' : 'Date pentru agent'}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{tool === 'upload' ? 'Alege tipul actului, apoi fișierul de pe dispozitiv.' : tool === 'generate' ? 'Alege documentul necesar. Vei verifica datele înainte de generare.' : 'Completează datele cerute sau urmărește verificarea lor de către agent.'}</p>
                </div>
                <div id="document-tools" role="tabpanel" aria-labelledby={tool === 'upload' ? 'document-files-tab' : tool === 'generate' ? 'document-overview-tab' : 'document-requests-tab'}>
            {selectedViewing && tool === 'requests' && (
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

            {tool === 'generate' && !canGenerateDocuments && <p className="text-sm text-muted-foreground">Agentul pregătește documentele. Tu poți completa informațiile din secțiunea „Date pentru agent”.</p>}

            {selectedViewing && canGenerateDocuments && tool === 'generate' && (
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

            {selectedViewing && canUploadDocuments && tool === 'upload' && (
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
              </section>}
              {tool && selectedWorkspaceClosed && <p id="document-tools" role="tabpanel" aria-labelledby="document-requests-tab" className="text-sm text-muted-foreground">Dosar închis. Poți consulta documentele din secțiunea Fișiere.</p>}

            {section === 'files' && <section id="document-archive" role="tabpanel" aria-labelledby="document-files-tab">
              {!selectedWorkspaceClosed && !documentsLoading && !requestsLoading && !loadError && <Button className="mb-5" onClick={() => setTool('upload')}>Încarcă un fișier</Button>}
            <Card className="scroll-mt-24">
              <CardHeader>
                <h2 className="text-base font-semibold">Documentele dosarului</h2>
                <CardDescription>Deschide un document pentru a-l citi. Dacă trebuie să semnezi, acțiunea apare lângă el.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {documentsLoading ? (
                  <div className="py-14 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : documents.length === 0 ? (
                  <div className="py-8 px-4 text-center text-sm text-muted-foreground">
                    {selectedWorkspaceClosed
                      ? 'Programarea s-a închis fără documente asociate. Nu mai este necesară nicio acțiune.'
                      : 'Nu există încă documente în acest dosar.'}
                  </div>
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
                                  canDelete={!selectedWorkspaceClosed && !document.lockedAt && document.userId === user.id && !['SIGNED', 'PARTIALLY_SIGNED'].includes(document.status)}
                                  canSign={!selectedWorkspaceClosed}
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
                              canDelete={!selectedWorkspaceClosed && !document.lockedAt && document.userId === user.id && !['SIGNED', 'PARTIALLY_SIGNED'].includes(document.status)}
                              canSign={!selectedWorkspaceClosed}
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
            </section>}
            </>}
          </>
        )}
      </PageContainer>

      {user && profile && selectedViewing && !selectedWorkspaceClosed && (profile.role === 'CLIENT' || profile.role === 'OWNER') && (
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

      {user && selectedViewing && !selectedWorkspaceClosed && canGenerateDocuments && (
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
        onContinueSigning={reviewingSignature && previewDoc?.id === reviewingSignature.document.id ? () => {
          const reviewed = reviewingSignature
          handlePreviewClose()
          setSigning(reviewed)
        } : undefined}
        onDownload={() => previewDoc && void handleDownload(previewDoc)}
      />

      <Dialog open={Boolean(signing)} onOpenChange={(open) => !open && !signingBusy && setSigning(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmă semnătura</DialogTitle>
            <DialogDescription>{signing?.document.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <details className="text-xs text-muted-foreground"><summary className="cursor-pointer py-2">Identificatorul versiunii verificate</summary>
              Hash document: <span className="font-mono break-all text-foreground">{signing?.document.checksum || 'indisponibil'}</span>
            </details>
            <div className="space-y-2">
              <label htmlFor="signature-name" className="text-sm font-medium">Numele complet</label>
              <Input id="signature-name" value={signatureName} onChange={(event) => setSignatureName(event.target.value)} autoComplete="name" />
            </div>
            <label className="flex items-start gap-3 text-sm cursor-pointer">
              <input type="checkbox" checked={signatureAccepted} onChange={(event) => setSignatureAccepted(event.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
              <span>Confirm că am citit documentul, că datele sunt corecte și că doresc să îl semnez electronic.</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={signingBusy} onClick={() => setSigning(null)}>Renunță</Button>
            <Button disabled={signingBusy || !signatureAccepted || signatureName.trim().length < 3} onClick={() => void handleSign()} className="gap-2">
              {signingBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />}
              Confirmă și semnează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
