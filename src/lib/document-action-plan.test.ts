import { describe, expect, it } from 'vitest'
import { getDocumentActionPlan } from './document-action-plan'
import type { LegalDocumentRequest, ViewingDocument, Vizionare } from './types'

function viewing(input: Partial<Vizionare> = {}): Vizionare {
  return {
    id: 'viewing-1',
    propertyId: 'property-1',
    propertyTitle: 'Apartament demo',
    userId: 'client-1',
    userName: 'Client Demo',
    userEmail: 'client@example.test',
    staffId: 'agent-1',
    staffName: 'Agent Demo',
    date: '2026-08-02',
    startTime: '10:00',
    endTime: '10:30',
    status: 'confirmed',
    notes: '',
    createdAt: '2026-08-01T10:00:00Z',
    ...input,
  }
}

function request(input: Partial<LegalDocumentRequest> = {}): LegalDocumentRequest {
  return {
    id: 'request-1',
    appointmentId: 'viewing-1',
    requesterId: 'client-1',
    documentKind: 'brokerage_agreement',
    status: 'REQUESTED',
    submittedData: {},
    notes: '',
    staffNote: '',
    fulfilledDocumentId: null,
    handledBy: null,
    handledAt: null,
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z',
    events: [],
    ...input,
  }
}

function document(input: Partial<ViewingDocument> = {}): ViewingDocument {
  return {
    id: 'document-1',
    appointmentId: 'viewing-1',
    propertyId: 'property-1',
    templateId: null,
    userId: 'client-1',
    title: 'Document demo',
    docType: 'id_card',
    status: 'UPLOADED',
    visibility: 'PRIVATE',
    storageBucket: 'client-documents',
    storagePath: 'demo.pdf',
    fileName: 'demo.pdf',
    fileType: 'application/pdf',
    byteSize: 1000,
    checksum: 'sha256-demo',
    version: 1,
    uploadedAt: '2026-08-01T10:00:00Z',
    lockedAt: null,
    signedAt: null,
    signatureLevel: null,
    signatureRequirement: 'SIMPLE',
    templateName: null,
    templateVersion: null,
    legalVersion: null,
    consumerContract: false,
    fiscalRegistrationDueAt: null,
    retentionUntil: null,
    signers: [],
    events: [],
    ...input,
  }
}

describe('getDocumentActionPlan', () => {
  it('shows a first current data step for a client with an empty active dossier', () => {
    const plan = getDocumentActionPlan({
      role: 'CLIENT',
      userId: 'client-1',
      viewing: viewing(),
      documents: [],
      requests: [],
    })

    expect(plan.readOnly).toBe(false)
    expect(plan.primaryItemId).toBe('data')
    expect(plan.items[0]).toMatchObject({
      id: 'data',
      state: 'current',
      owner: 'CLIENT',
    })
  })

  it('moves owner evidence to current after owner data was fulfilled', () => {
    const plan = getDocumentActionPlan({
      role: 'OWNER',
      userId: 'owner-1',
      viewing: viewing({ ownerId: 'owner-1' }),
      documents: [],
      requests: [request({
        requesterId: 'owner-1',
        documentKind: 'owner_mandate',
        status: 'FULFILLED',
      })],
    })

    expect(plan.primaryItemId).toBe('evidence')
    expect(plan.items.find((item) => item.id === 'evidence')).toMatchObject({
      state: 'current',
      owner: 'OWNER',
    })
  })

  it('makes staff review the current action when participant data is ready', () => {
    const plan = getDocumentActionPlan({
      role: 'AGENT',
      userId: 'agent-1',
      viewing: viewing(),
      documents: [],
      requests: [request({ status: 'REQUESTED' })],
    })

    expect(plan.primaryItemId).toBe('data')
    expect(plan.items.find((item) => item.id === 'data')).toMatchObject({
      state: 'current',
      owner: 'AGENCY',
    })
    expect(plan.items.find((item) => item.id === 'review')).toMatchObject({
      state: 'current',
      owner: 'AGENCY',
    })
  })

  it('prioritizes the current participant signature', () => {
    const plan = getDocumentActionPlan({
      role: 'CLIENT',
      userId: 'client-1',
      viewing: viewing(),
      documents: [
        document({
          docType: 'vizionare_sign',
          status: 'READY_TO_SIGN',
          signers: [{
            id: 'signer-1',
            userId: 'client-1',
            role: 'CLIENT',
            status: 'PENDING',
            required: true,
            signatureName: null,
            signatureMethod: null,
            documentChecksum: null,
            signedAt: null,
          }],
        }),
      ],
      requests: [],
    })

    expect(plan.primaryItemId).toBe('signature')
    expect(plan.items.find((item) => item.id === 'signature')).toMatchObject({
      state: 'current',
      owner: 'CLIENT',
    })
  })

  it('turns a no-show dossier into a read-only archive plan', () => {
    const plan = getDocumentActionPlan({
      role: 'CLIENT',
      userId: 'client-1',
      viewing: viewing({ status: 'no_show' }),
      documents: [document()],
      requests: [request()],
    })

    expect(plan.readOnly).toBe(true)
    expect(plan.headline).toContain('neprezentare')
    expect(plan.items.find((item) => item.id === 'signature')).toMatchObject({
      state: 'blocked',
      owner: 'SYSTEM',
    })
  })
})
