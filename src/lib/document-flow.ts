import type { AccountRole } from '@/lib/account-roles'
import {
  getLegalDocumentDefinition,
  getLegalRequestKindsForRole,
  type LegalDocumentKind,
} from '@/lib/legal-documents'
import type {
  DocumentSigner,
  LegalDocumentRequest,
  ViewingDocument,
  Vizionare,
} from '@/lib/types'

export type DocumentFlowActionType =
  | 'SIGN'
  | 'EXTERNAL_SIGNATURE'
  | 'EDIT_REQUEST'
  | 'CREATE_REQUEST'
  | 'GENERATE_DOCUMENT'
  | 'UPLOAD_IDENTITY'
  | 'OPEN_TOOLS'
  | 'OPEN_ARCHIVE'

export interface DocumentFlowAction {
  type: DocumentFlowActionType
  label: string
  description: string
  document?: ViewingDocument
  signer?: DocumentSigner
  request?: LegalDocumentRequest
  kind?: LegalDocumentKind
}

export interface DocumentFlowStep {
  label: string
  description: string
  state: 'complete' | 'current' | 'pending'
}

export interface DocumentFlowSummary {
  action: DocumentFlowAction
  progress: number
  documentsCount: number
  openRequestsCount: number
  pendingSignaturesCount: number
  steps: DocumentFlowStep[]
}

interface DocumentFlowInput {
  role: AccountRole
  userId: string
  viewing: Vizionare
  documents: ViewingDocument[]
  requests: LegalDocumentRequest[]
}

const OPEN_REQUEST_STATUSES = new Set(['REQUESTED', 'IN_REVIEW', 'NEEDS_INFO'])
const USABLE_DOCUMENT_STATUSES = new Set([
  'UPLOADED',
  'READY_TO_SIGN',
  'PARTIALLY_SIGNED',
  'SIGNED',
  'APPROVED',
])

function pendingSignerFor(document: ViewingDocument, userId: string) {
  return document.signers.find((signer) =>
    signer.userId === userId && signer.required && signer.status === 'PENDING',
  )
}

function participantDefaultKind(role: 'CLIENT' | 'OWNER'): LegalDocumentKind {
  return role === 'CLIENT' ? 'brokerage_agreement' : 'owner_mandate'
}

function actionForParticipant(
  role: 'CLIENT' | 'OWNER',
  userId: string,
  activeDocuments: ViewingDocument[],
  requests: LegalDocumentRequest[],
): DocumentFlowAction {
  const ownRequests = requests.filter((request) => request.requesterId === userId)
  const needsInfo = ownRequests.find((request) => request.status === 'NEEDS_INFO')
  if (needsInfo) {
    return {
      type: 'EDIT_REQUEST',
      label: 'Completează informațiile cerute',
      description: needsInfo.staffNote || 'Agentul a indicat ce date trebuie corectate înainte de generare.',
      request: needsInfo,
      kind: needsInfo.documentKind,
    }
  }

  const inReview = ownRequests.find((request) =>
    request.status === 'REQUESTED' || request.status === 'IN_REVIEW',
  )
  if (inReview) {
    const definition = getLegalDocumentDefinition(inReview.documentKind)
    return {
      type: 'OPEN_TOOLS',
      label: 'Urmărește verificarea datelor',
      description: `${definition.shortTitle} este la agent. Vezi starea și eventualele observații într-un singur loc.`,
      request: inReview,
      kind: inReview.documentKind,
    }
  }

  const allowedKinds = getLegalRequestKindsForRole(role)
  const hasAnyWorkflow = ownRequests.some((request) =>
    allowedKinds.includes(request.documentKind) && !['CANCELLED', 'REJECTED'].includes(request.status),
  )
  if (!hasAnyWorkflow && activeDocuments.length === 0) {
    const kind = participantDefaultKind(role)
    const definition = getLegalDocumentDefinition(kind)
    return {
      type: 'CREATE_REQUEST',
      label: role === 'CLIENT' ? 'Completează datele o singură dată' : 'Confirmă datele proprietarului',
      description: `Începem cu ${definition.shortTitle.toLowerCase()}; agentul va reutiliza datele verificate în dosar.`,
      kind,
    }
  }

  const hasIdentity = activeDocuments.some((document) => document.docType === 'id_card')
  if (!hasIdentity) {
    return {
      type: 'UPLOAD_IDENTITY',
      label: role === 'OWNER' ? 'Încarcă primul act al proprietății' : 'Încarcă actul de identitate',
      description: role === 'OWNER'
        ? 'Poți încărca actul de proprietate, extrasul CF, certificatul fiscal sau certificatul energetic.'
        : 'Fișierul rămâne privat și este disponibil numai participanților autorizați.',
    }
  }

  return {
    type: 'OPEN_ARCHIVE',
    label: 'Dosarul tău este la zi',
    description: 'Nu ai completări sau semnături restante. Poți consulta oricând versiunile și jurnalul.',
  }
}

function actionForStaff(
  viewing: Vizionare,
  activeDocuments: ViewingDocument[],
  requests: LegalDocumentRequest[],
): DocumentFlowAction {
  const readyRequest = requests.find((request) =>
    request.status === 'REQUESTED' || request.status === 'IN_REVIEW',
  )
  if (readyRequest) {
    const definition = getLegalDocumentDefinition(readyRequest.documentKind)
    return {
      type: 'GENERATE_DOCUMENT',
      label: `Verifică și generează: ${definition.shortTitle}`,
      description: 'Datele participantului sunt pregătite. Verifică-le înainte de a crea versiunea oficială.',
      request: readyRequest,
      kind: readyRequest.documentKind,
    }
  }

  const viewingReport = activeDocuments.find((document) => document.docType === 'vizionare_sign')
  if (viewing.status === 'completed' && !viewingReport) {
    return {
      type: 'GENERATE_DOCUMENT',
      label: 'Generează fișa de vizionare',
      description: 'Prezența este confirmată și vizionarea este finalizată. Fișa poate fi pregătită pentru semnare.',
      kind: 'viewing_report',
    }
  }

  const blockedRequest = requests.find((request) => request.status === 'NEEDS_INFO')
  if (blockedRequest) {
    const definition = getLegalDocumentDefinition(blockedRequest.documentKind)
    return {
      type: 'OPEN_TOOLS',
      label: `Așteaptă completările: ${definition.shortTitle}`,
      description: blockedRequest.staffNote || 'Participantul trebuie să retrimită informațiile solicitate.',
      request: blockedRequest,
      kind: blockedRequest.documentKind,
    }
  }

  return {
    type: activeDocuments.length ? 'OPEN_ARCHIVE' : 'OPEN_TOOLS',
    label: activeDocuments.length ? 'Dosarul este pregătit pentru următoarea etapă' : 'Pregătește dosarul tranzacției',
    description: activeDocuments.length
      ? 'Verifică versiunile, semnăturile și jurnalul înainte de a continua tranzacția.'
      : 'Vezi ce date lipsesc și pornește documentul potrivit pentru etapa curentă.',
  }
}

export function getDocumentFlowSummary({
  role,
  userId,
  viewing,
  documents,
  requests,
}: DocumentFlowInput): DocumentFlowSummary {
  const activeDocuments = documents.filter((document) => document.status !== 'SUPERSEDED')
  const pendingForUser = activeDocuments.flatMap((document) => {
    const signer = pendingSignerFor(document, userId)
    return signer ? [{ document, signer }] : []
  })
  const simpleSignature = pendingForUser.find(({ document }) =>
    document.signatureRequirement === 'SIMPLE'
    && ['READY_TO_SIGN', 'PARTIALLY_SIGNED'].includes(document.status),
  )
  const externalSignature = pendingForUser.find(({ document }) =>
    document.signatureRequirement !== 'SIMPLE',
  )

  let action: DocumentFlowAction
  if (simpleSignature) {
    action = {
      type: 'SIGN',
      label: `Verifică și semnează: ${simpleSignature.document.title}`,
      description: 'Deschide versiunea exactă, verifică datele și confirmă semnătura electronică.',
      document: simpleSignature.document,
      signer: simpleSignature.signer,
    }
  } else if (externalSignature) {
    action = {
      type: 'EXTERNAL_SIGNATURE',
      label: 'Vezi pașii pentru semnarea verificată',
      description: 'Acest document cere semnătură avansată sau calificată; semnarea simplă din platformă nu este disponibilă.',
      document: externalSignature.document,
      signer: externalSignature.signer,
    }
  } else if (role === 'CLIENT' || role === 'OWNER') {
    action = actionForParticipant(role, userId, activeDocuments, requests)
  } else {
    action = actionForStaff(viewing, activeDocuments, requests)
  }

  const openRequestsCount = requests.filter((request) => OPEN_REQUEST_STATUSES.has(request.status)).length
  const hasData = requests.some((request) =>
    ['REQUESTED', 'IN_REVIEW', 'FULFILLED'].includes(request.status),
  ) || activeDocuments.length > 0
  const hasVerifiedDocument = activeDocuments.some((document) => USABLE_DOCUMENT_STATUSES.has(document.status))
  const documentsWithRequiredSigners = activeDocuments.filter((document) =>
    document.signers.some((signer) => signer.required),
  )
  const signaturesComplete = documentsWithRequiredSigners.length > 0
    && documentsWithRequiredSigners.every((document) =>
      document.signers.filter((signer) => signer.required).every((signer) => signer.status === 'SIGNED'),
    )

  const completed = [hasData, hasVerifiedDocument, signaturesComplete]
  const currentIndex = completed.findIndex((value) => !value)
  const stepCopy = [
    ['Date', 'Completează o singură dată'],
    ['Verificare', 'Agentul validează versiunea'],
    ['Semnare', 'Semnează documentul exact'],
  ] as const
  const steps: DocumentFlowStep[] = stepCopy.map(([label, description], index) => ({
    label,
    description,
    state: completed[index]
      ? 'complete'
      : index === (currentIndex === -1 ? stepCopy.length - 1 : currentIndex)
        ? 'current'
        : 'pending',
  }))

  return {
    action,
    progress: Math.round(completed.filter(Boolean).length / completed.length * 100),
    documentsCount: activeDocuments.length,
    openRequestsCount,
    pendingSignaturesCount: pendingForUser.length,
    steps,
  }
}
