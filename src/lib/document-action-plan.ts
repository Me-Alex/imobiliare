import type { AccountRole } from '@/lib/account-roles'
import type { LegalDocumentRequest, ViewingDocument, Vizionare } from '@/lib/types'
import { isDocumentWorkspaceClosed } from '@/lib/document-workspace'

export type DocumentActionPlanState = 'complete' | 'current' | 'waiting' | 'blocked' | 'pending'
export type DocumentActionPlanOwner = AccountRole | 'AGENCY' | 'SYSTEM'

export interface DocumentActionPlanItem {
  id: 'data' | 'evidence' | 'review' | 'signature' | 'archive'
  title: string
  description: string
  state: DocumentActionPlanState
  owner: DocumentActionPlanOwner
}

export interface DocumentActionPlan {
  headline: string
  description: string
  readOnly: boolean
  primaryItemId: DocumentActionPlanItem['id'] | null
  items: DocumentActionPlanItem[]
}

interface DocumentActionPlanInput {
  role: AccountRole
  userId: string
  viewing: Vizionare
  documents: readonly ViewingDocument[]
  requests: readonly LegalDocumentRequest[]
}

const OPEN_REQUEST_STATUSES = new Set<LegalDocumentRequest['status']>(['REQUESTED', 'IN_REVIEW', 'NEEDS_INFO'])
const WAITING_REQUEST_STATUSES = new Set<LegalDocumentRequest['status']>(['REQUESTED', 'IN_REVIEW'])
const OWNER_EVIDENCE_TYPES = new Set<ViewingDocument['docType']>([
  'ownership_title',
  'land_registry_excerpt',
  'fiscal_certificate',
  'energy_certificate',
])
const GENERATED_DOCUMENT_TYPES = new Set<ViewingDocument['docType']>([
  'vizionare_sign',
  'brokerage_contract',
  'owner_mandate',
  'reservation_offer',
  'rental_contract',
  'handover_protocol',
  'addendum',
  'termination_notice',
])

function isActiveDocument(document: ViewingDocument) {
  return document.status !== 'SUPERSEDED'
}

function hasGeneratedDocument(documents: readonly ViewingDocument[]) {
  return documents.some((document) =>
    GENERATED_DOCUMENT_TYPES.has(document.docType)
    || ['READY_TO_SIGN', 'PARTIALLY_SIGNED', 'SIGNED', 'APPROVED'].includes(document.status),
  )
}

function hasSupportEvidence(role: AccountRole, documents: readonly ViewingDocument[]) {
  if (role === 'OWNER') {
    return documents.some((document) => OWNER_EVIDENCE_TYPES.has(document.docType))
  }
  if (role === 'CLIENT') {
    return documents.some((document) => document.docType === 'id_card')
  }
  return documents.some((document) =>
    document.docType === 'id_card' || OWNER_EVIDENCE_TYPES.has(document.docType),
  )
}

function getPendingSignatures(documents: readonly ViewingDocument[]) {
  return documents.flatMap((document) =>
    document.signers
      .filter((signer) => signer.required && signer.status === 'PENDING')
      .map((signer) => ({ document, signer })),
  )
}

function allRequiredSignaturesComplete(documents: readonly ViewingDocument[]) {
  const signingDocuments = documents.filter((document) => document.signers.some((signer) => signer.required))
  return signingDocuments.length > 0
    && signingDocuments.every((document) =>
      document.signers.filter((signer) => signer.required).every((signer) => signer.status === 'SIGNED'),
    )
}

function primaryItemId(items: readonly DocumentActionPlanItem[]): DocumentActionPlan['primaryItemId'] {
  const priority: DocumentActionPlanItem['id'][] = ['signature', 'data', 'evidence', 'review', 'archive']
  return priority.map((id) => items.find((item) => item.id === id && item.state === 'current')).find(Boolean)?.id
    ?? priority.map((id) => items.find((item) => item.id === id && item.state === 'blocked')).find(Boolean)?.id
    ?? priority.map((id) => items.find((item) => item.id === id && item.state === 'waiting')).find(Boolean)?.id
    ?? null
}

function ownerLabel(role: AccountRole): DocumentActionPlanOwner {
  return role === 'ADMIN' ? 'AGENCY' : role
}

function closedPlan(viewing: Vizionare, documents: readonly ViewingDocument[]): DocumentActionPlan {
  const noShow = viewing.status === 'no_show'
  const items: DocumentActionPlanItem[] = [
    {
      id: 'data',
      title: noShow ? 'Neprezentare consemnată' : 'Programare închisă',
      description: noShow
        ? 'Nu se mai cer date noi pentru această vizionare.'
        : 'Nu se mai cer completări pentru o programare anulată.',
      state: 'complete',
      owner: 'SYSTEM',
    },
    {
      id: 'signature',
      title: noShow ? 'Fișă de vizionare blocată' : 'Semnături oprite',
      description: noShow
        ? 'Fișa de vizionare nu se generează dacă vizionarea nu a avut loc.'
        : 'Semnarea este oprită după anulare.',
      state: 'blocked',
      owner: 'SYSTEM',
    },
    {
      id: 'archive',
      title: 'Arhivă disponibilă',
      description: documents.length > 0
        ? `${documents.length} documente rămân disponibile pentru consultare.`
        : 'Nu există documente atașate acestui dosar.',
      state: 'complete',
      owner: 'SYSTEM',
    },
  ]

  return {
    headline: noShow ? 'Dosar închis — neprezentare' : 'Dosar închis — consultare',
    description: 'Nu mai există acțiuni noi. Istoricul rămâne disponibil pentru participanții autorizați.',
    readOnly: true,
    primaryItemId: primaryItemId(items),
    items,
  }
}

function participantPlan(input: DocumentActionPlanInput, activeDocuments: readonly ViewingDocument[]): DocumentActionPlan {
  const ownRequests = input.requests.filter((request) => request.requesterId === input.userId)
  const needsInfo = ownRequests.find((request) => request.status === 'NEEDS_INFO')
  const waitingRequest = ownRequests.find((request) => WAITING_REQUEST_STATUSES.has(request.status))
  const fulfilledRequest = ownRequests.some((request) => request.status === 'FULFILLED')
  const hasOpenWorkflow = ownRequests.some((request) => OPEN_REQUEST_STATUSES.has(request.status))
  const supportEvidence = hasSupportEvidence(input.role, activeDocuments)
  const generated = hasGeneratedDocument(activeDocuments)
  const pendingSignatures = getPendingSignatures(activeDocuments)
  const myPendingSignature = pendingSignatures.find(({ signer }) => signer.userId === input.userId)
  const signaturesComplete = allRequiredSignaturesComplete(activeDocuments)
  const participantOwner = ownerLabel(input.role)

  const items: DocumentActionPlanItem[] = [
    {
      id: 'data',
      title: input.role === 'OWNER' ? 'Date proprietar' : 'Date client',
      description: needsInfo
        ? needsInfo.staffNote || 'Agentul a cerut corecturi înainte de generarea documentului.'
        : waitingRequest
          ? 'Datele sunt trimise și sunt verificate de agent.'
          : fulfilledRequest || generated
            ? 'Datele au fost acceptate și pot fi reutilizate în dosar.'
            : 'Completează o singură dată informațiile cerute pentru documentele tranzacției.',
      state: needsInfo ? 'current' : waitingRequest ? 'waiting' : fulfilledRequest || generated || hasOpenWorkflow ? 'complete' : 'current',
      owner: needsInfo || !fulfilledRequest && !waitingRequest && !generated ? participantOwner : 'AGENCY',
    },
    {
      id: 'evidence',
      title: input.role === 'OWNER' ? 'Acte proprietate' : 'Act identitate',
      description: supportEvidence
        ? 'Documentul suport este în dosarul privat.'
        : input.role === 'OWNER'
          ? 'Încarcă actul de proprietate, extrasul CF, certificatul fiscal sau certificatul energetic.'
          : 'Încarcă actul de identitate o singură dată în dosarul vizionării.',
      state: supportEvidence ? 'complete' : needsInfo ? 'pending' : 'current',
      owner: supportEvidence ? 'AGENCY' : participantOwner,
    },
    {
      id: 'review',
      title: 'Verificare agenție',
      description: needsInfo
        ? 'Agenția a pus dosarul pe pauză până primește corecturile.'
        : waitingRequest
          ? 'Agentul verifică datele și pregătește versiunea oficială.'
          : generated
            ? 'Versiunea oficială este pregătită.'
            : 'După completare, agentul verifică și generează documentul.',
      state: needsInfo ? 'blocked' : waitingRequest ? 'waiting' : generated ? 'complete' : 'pending',
      owner: waitingRequest || !generated ? 'AGENCY' : 'SYSTEM',
    },
    {
      id: 'signature',
      title: 'Semnături',
      description: myPendingSignature
        ? myPendingSignature.document.signatureRequirement === 'SIMPLE'
          ? 'Ai un document pregătit pentru semnătură simplă în platformă.'
          : 'Semnarea trebuie continuată prin furnizorul avansat/calificat.'
        : pendingSignatures.length > 0
          ? 'Se așteaptă semnătura altui participant.'
          : signaturesComplete
            ? 'Toate semnăturile obligatorii sunt colectate.'
            : 'Semnarea apare după ce agentul generează versiunea oficială.',
      state: myPendingSignature ? 'current' : pendingSignatures.length > 0 ? 'waiting' : signaturesComplete ? 'complete' : 'pending',
      owner: myPendingSignature ? participantOwner : pendingSignatures.length > 0 ? 'AGENCY' : 'SYSTEM',
    },
    {
      id: 'archive',
      title: 'Arhivă și jurnal',
      description: activeDocuments.length > 0
        ? 'Documentele și istoricul acțiunilor pot fi consultate oricând.'
        : 'Arhiva se creează automat când apare primul document.',
      state: activeDocuments.length > 0 ? 'complete' : 'pending',
      owner: 'SYSTEM',
    },
  ]

  return {
    headline: 'Plan simplificat al dosarului',
    description: 'Un singur fir: completezi datele, agenția verifică, apoi semnezi versiunea finală.',
    readOnly: false,
    primaryItemId: primaryItemId(items),
    items,
  }
}

function staffPlan(input: DocumentActionPlanInput, activeDocuments: readonly ViewingDocument[]): DocumentActionPlan {
  const readyRequests = input.requests.filter((request) => WAITING_REQUEST_STATUSES.has(request.status))
  const needsInfoRequests = input.requests.filter((request) => request.status === 'NEEDS_INFO')
  const fulfilledRequests = input.requests.filter((request) => request.status === 'FULFILLED')
  const supportEvidence = hasSupportEvidence(input.role, activeDocuments)
  const generated = hasGeneratedDocument(activeDocuments)
  const viewingReport = activeDocuments.find((document) => document.docType === 'vizionare_sign')
  const shouldGenerateViewingReport = input.viewing.status === 'completed' && !viewingReport
  const pendingSignatures = getPendingSignatures(activeDocuments)
  const signaturesComplete = allRequiredSignaturesComplete(activeDocuments)

  const items: DocumentActionPlanItem[] = [
    {
      id: 'data',
      title: 'Date participanți',
      description: needsInfoRequests.length > 0
        ? `${needsInfoRequests.length} solicitări așteaptă corecturi de la participanți.`
        : readyRequests.length > 0
          ? `${readyRequests.length} solicitări sunt gata de verificare.`
          : fulfilledRequests.length > 0 || generated
            ? 'Datele necesare au fost preluate în dosar.'
            : 'Pornește o solicitare sau așteaptă completarea de la client/proprietar.',
      state: needsInfoRequests.length > 0 ? 'waiting' : readyRequests.length > 0 ? 'current' : fulfilledRequests.length > 0 || generated ? 'complete' : 'pending',
      owner: readyRequests.length > 0 ? 'AGENCY' : needsInfoRequests.length > 0 ? 'CLIENT' : 'AGENCY',
    },
    {
      id: 'evidence',
      title: 'Documente suport',
      description: supportEvidence
        ? 'Există acte suport în dosar.'
        : 'Verifică dacă lipsesc actul de identitate sau actele proprietății.',
      state: supportEvidence ? 'complete' : 'pending',
      owner: supportEvidence ? 'SYSTEM' : 'CLIENT',
    },
    {
      id: 'review',
      title: shouldGenerateViewingReport ? 'Generează fișa de vizionare' : 'Generare și verificare',
      description: shouldGenerateViewingReport
        ? 'Vizionarea este finalizată; fișa poate fi pregătită pentru semnare.'
        : readyRequests.length > 0
          ? 'Verifică datele și generează documentul oficial.'
          : generated
            ? 'Există o versiune oficială în dosar.'
            : 'Documentele oficiale apar după verificarea datelor.',
      state: shouldGenerateViewingReport || readyRequests.length > 0 ? 'current' : generated ? 'complete' : needsInfoRequests.length > 0 ? 'blocked' : 'pending',
      owner: shouldGenerateViewingReport || readyRequests.length > 0 ? 'AGENCY' : 'SYSTEM',
    },
    {
      id: 'signature',
      title: 'Semnături',
      description: pendingSignatures.length > 0
        ? `${pendingSignatures.length} semnături sunt încă în așteptare.`
        : signaturesComplete
          ? 'Toate semnăturile obligatorii sunt colectate.'
          : 'Trimite documentul la semnat după verificare.',
      state: pendingSignatures.length > 0 ? 'waiting' : signaturesComplete ? 'complete' : 'pending',
      owner: pendingSignatures.length > 0 ? 'AGENCY' : 'SYSTEM',
    },
    {
      id: 'archive',
      title: 'Arhivă și audit',
      description: activeDocuments.length > 0
        ? 'Versiunile, semnăturile și jurnalul sunt disponibile în arhivă.'
        : 'Arhiva va include automat primul document generat sau încărcat.',
      state: activeDocuments.length > 0 ? 'complete' : 'pending',
      owner: 'SYSTEM',
    },
  ]

  return {
    headline: 'Control operațional al dosarului',
    description: 'Vezi rapid ce poți rezolva tu și ce așteaptă de la participant.',
    readOnly: false,
    primaryItemId: primaryItemId(items),
    items,
  }
}

export function getDocumentActionPlan(input: DocumentActionPlanInput): DocumentActionPlan {
  const activeDocuments = input.documents.filter(isActiveDocument)

  if (isDocumentWorkspaceClosed(input.viewing.status)) {
    return closedPlan(input.viewing, activeDocuments)
  }

  if (input.role === 'CLIENT' || input.role === 'OWNER') {
    return participantPlan(input, activeDocuments)
  }

  return staffPlan(input, activeDocuments)
}
