import { describe, expect, it } from 'vitest'
import {
  canSubmitDealOffer,
  getActiveDealOffer,
  getAllowedDealOfferActions,
  getDealStageGate,
  getDealRequirementState,
  summarizeDealRequirements,
  type DealOffer,
  type DealRequirement,
  type DealRoom,
} from './transaction-workspace'

const room = {
  id: 'deal-1',
  property_id: 'property-1',
  primary_client_id: 'client-1',
  owner_id: 'owner-1',
  agent_id: 'agent-1',
  title: 'Deal demo',
  stage: 'OFFER',
  status: 'ACTIVE',
  created_at: '2026-07-18T09:00:00Z',
  updated_at: '2026-07-18T09:00:00Z',
} as DealRoom

function offer(input: Partial<DealOffer>): DealOffer {
  return {
    id: input.id || 'offer-1',
    user_id: input.user_id || 'client-1',
    created_by: input.created_by || 'client-1',
    offer_kind: input.offer_kind || 'OFFER',
    offer_price: input.offer_price || 100000,
    list_price: input.list_price || 110000,
    currency: input.currency || 'EUR',
    status: input.status || 'SUBMITTED',
    submitted_at: input.submitted_at || '2026-07-18T10:00:00Z',
    created_at: input.created_at || '2026-07-18T10:00:00Z',
    ...input,
  }
}

function requirement(input: Partial<DealRequirement> = {}): DealRequirement {
  return {
    id: input.id || 'req-1',
    document_type: input.document_type || 'client_identity',
    label: input.label || 'Act identitate',
    responsible_role: input.responsible_role || 'CLIENT',
    status: input.status || 'REQUIRED',
    ...input,
  }
}

describe('Deal Room negotiation helpers', () => {
  it('lets the owner answer a buyer offer and the client answer a counter-offer', () => {
    const buyerOffer = offer({ offer_kind: 'OFFER', created_by: 'client-1' })
    const ownerCounter = offer({ id: 'counter-1', offer_kind: 'COUNTER_OFFER', created_by: 'owner-1' })

    expect(getAllowedDealOfferActions(buyerOffer, 'OWNER', 'owner-1', room)).toEqual([
      'ACCEPTED',
      'REJECTED',
      'COUNTERED',
    ])
    expect(getAllowedDealOfferActions(ownerCounter, 'CLIENT', 'client-1', room)).toEqual([
      'ACCEPTED',
      'REJECTED',
      'COUNTERED',
    ])
  })

  it('does not allow inactive offers to drive new decisions', () => {
    const accepted = offer({ status: 'ACCEPTED' })

    expect(getAllowedDealOfferActions(accepted, 'OWNER', 'owner-1', room)).toEqual([])
    expect(canSubmitDealOffer('OWNER', accepted)).toBe(false)
    expect(canSubmitDealOffer('CLIENT', accepted)).toBe(true)
  })

  it('selects the newest non-terminal offer as active', () => {
    const active = offer({ id: 'active', submitted_at: '2026-07-18T12:00:00Z' })
    const old = offer({ id: 'old', submitted_at: '2026-07-18T09:00:00Z' })
    const rejected = offer({ id: 'rejected', status: 'REJECTED', submitted_at: '2026-07-18T13:00:00Z' })

    expect(getActiveDealOffer([old, rejected, active])?.id).toBe('active')
  })
})

describe('Deal Room stage gate', () => {
  it('blocks Contract without an accepted offer', () => {
    expect(getDealStageGate('CONTRACT', [offer({ status: 'SUBMITTED' })], [])).toMatchObject({
      ok: false,
      reason: expect.stringContaining('oferta'),
    })
  })

  it('allows Contract after offer acceptance while documents are still in progress', () => {
    const gate = getDealStageGate('CONTRACT', [offer({ status: 'ACCEPTED' })], [
      requirement({ id: 'missing', status: 'REQUIRED' }),
    ])

    expect(gate).toEqual({ ok: true })
  })

  it('blocks closing the Deal Room until documents and signatures are complete', () => {
    const gate = getDealStageGate('CLOSED_WON', [offer({ status: 'ACCEPTED' })], [
      requirement({
        id: 'signing',
        status: 'UNDER_REVIEW',
        client_documents: {
          id: 'doc-1',
          title: 'Contract',
          type: 'contract_sale',
          status: 'READY_TO_SIGN',
          version: 1,
          document_signers: [{ id: 'signer-1', user_id: 'client-1', signer_role: 'CLIENT', status: 'PENDING' }],
        },
      }),
    ])

    expect(gate).toMatchObject({
      ok: false,
      reason: expect.stringContaining('semnaturi'),
    })
  })

  it('allows closing the Deal Room when accepted offer and checklist are complete', () => {
    const gate = getDealStageGate('CLOSED_WON', [offer({ status: 'ACCEPTED' })], [
      requirement({
        id: 'signed',
        status: 'APPROVED',
        client_documents: {
          id: 'doc-1',
          title: 'Contract final',
          type: 'contract_sale',
          status: 'SIGNED',
          version: 1,
          document_signers: [{ id: 'signer-1', user_id: 'client-1', signer_role: 'CLIENT', status: 'SIGNED' }],
        },
      }),
    ])

    expect(gate).toEqual({ ok: true })
  })
})

describe('Deal Room document summary', () => {
  it('treats uploaded requirements as received but not complete', () => {
    const requirement = {
      id: 'req-1',
      document_type: 'client_identity',
      label: 'Act identitate',
      responsible_role: 'CLIENT',
      status: 'UPLOADED',
    } as DealRequirement

    expect(getDealRequirementState(requirement)).toMatchObject({
      bucket: 'received',
      isReceived: true,
      isComplete: false,
    })
  })

  it('summarizes missing, signature and complete document states separately', () => {
    const requirements = [
      {
        id: 'missing',
        document_type: 'ownership_title',
        label: 'Act proprietate',
        responsible_role: 'OWNER',
        status: 'REQUIRED',
      },
      {
        id: 'signing',
        document_type: 'viewing_sheet',
        label: 'Fisa vizionare',
        responsible_role: 'AGENT',
        status: 'UNDER_REVIEW',
        client_documents: {
          id: 'doc-1',
          title: 'Fisa',
          type: 'vizionare_sign',
          status: 'READY_TO_SIGN',
          version: 1,
          document_signers: [{ id: 'signer-1', user_id: 'client-1', signer_role: 'CLIENT', status: 'PENDING' }],
        },
      },
      {
        id: 'complete',
        document_type: 'client_identity',
        label: 'Act identitate',
        responsible_role: 'CLIENT',
        status: 'APPROVED',
      },
    ] as DealRequirement[]

    expect(summarizeDealRequirements(requirements)).toMatchObject({
      total: 3,
      received: 2,
      complete: 1,
      missing: 1,
      signatures: 1,
    })
  })
})
