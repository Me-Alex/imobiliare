import { describe, expect, it } from 'vitest'

import { getDealRoomJourney } from '@/lib/deal-room-journey'
import type { DealAppointment, DealOffer, DealParticipant, DealRequirement, DealRoom } from '@/lib/transaction-workspace'

const baseRoom = {
  id: 'deal-1',
  property_id: 'property-1',
  title: 'Deal test',
  stage: 'VIEWING',
  status: 'ACTIVE',
  next_step: null,
  next_step_due_at: null,
  created_at: '2026-08-01T09:00:00.000Z',
  updated_at: '2026-08-01T09:00:00.000Z',
} as DealRoom

function appointment(status: string): DealAppointment {
  return {
    appointment_id: `appointment-${status}`,
    appointments: {
      id: `appointment-${status}`,
      requested_at: '2026-08-01T09:00:00.000Z',
      start_at: '2026-08-02T12:00:00.000Z',
      status,
    },
  }
}

function participant(status = 'CONFIRMED'): DealParticipant {
  return {
    profile_id: `profile-${status}`,
    participant_role: 'CLIENT',
    attendance_status: status,
  }
}

function offer(status: string, kind: DealOffer['offer_kind'] = 'OFFER'): DealOffer {
  return {
    id: `offer-${status}`,
    offer_kind: kind,
    offer_price: 140000,
    list_price: 150000,
    currency: 'EUR',
    status,
    created_at: '2026-08-01T10:00:00.000Z',
  }
}

function requirement(status: string, extra: Partial<DealRequirement> = {}): DealRequirement {
  return {
    id: `requirement-${status}`,
    document_type: 'viewing_sheet',
    label: 'Fișă vizionare',
    responsible_role: 'CLIENT',
    status,
    ...extra,
  }
}

describe('getDealRoomJourney', () => {
  it('surfaces cancelled or no-show viewings before the rest of the transaction', () => {
    const journey = getDealRoomJourney({
      room: baseRoom,
      appointments: [appointment('NO_SHOW')],
      participants: [participant()],
      offers: [],
      requirements: [],
    })

    expect(journey.primaryStage).toMatchObject({
      id: 'viewing',
      state: 'blocked',
      target: 'viewing',
    })
    expect(journey.description).toContain('reprogramează')
  })

  it('keeps missing documents visible after an accepted offer', () => {
    const journey = getDealRoomJourney({
      room: { ...baseRoom, stage: 'CONTRACT', next_step: 'Pregătește contractul' },
      appointments: [appointment('COMPLETED')],
      participants: [participant()],
      offers: [offer('ACCEPTED')],
      requirements: [requirement('REQUIRED')],
    })

    expect(journey.primaryStage).toMatchObject({
      id: 'documents',
      state: 'attention',
      value: '1 lipsă',
      target: 'documents',
    })
    expect(journey.stages.find((stage) => stage.id === 'offer')).toMatchObject({
      state: 'complete',
      value: 'acceptată',
    })
  })

  it('prioritizes pending signatures over a generic next step', () => {
    const journey = getDealRoomJourney({
      room: { ...baseRoom, stage: 'CONTRACT', next_step: 'Stabilește data semnării' },
      appointments: [appointment('COMPLETED')],
      participants: [participant()],
      offers: [offer('ACCEPTED')],
      requirements: [
        requirement('UNDER_REVIEW', {
          client_documents: {
            id: 'document-1',
            title: 'Contract',
            type: 'sale_contract',
            status: 'READY_TO_SIGN',
            version: 1,
            document_signers: [
              {
                id: 'signer-1',
                user_id: 'client-1',
                signer_role: 'CLIENT',
                status: 'PENDING',
              },
            ],
          },
        }),
      ],
    })

    expect(journey.primaryStage).toMatchObject({
      id: 'documents',
      state: 'attention',
      value: '1 semnături',
    })
  })

  it('marks a fully closed transaction as complete when requirements are approved', () => {
    const journey = getDealRoomJourney({
      room: { ...baseRoom, stage: 'CLOSED_WON', next_step: null },
      appointments: [appointment('COMPLETED')],
      participants: [participant()],
      offers: [offer('ACCEPTED')],
      requirements: [requirement('APPROVED')],
    })

    expect(journey.completedCount).toBe(5)
    expect(journey.progressPercent).toBe(100)
    expect(journey.stages.every((stage) => stage.state === 'complete')).toBe(true)
  })
})
