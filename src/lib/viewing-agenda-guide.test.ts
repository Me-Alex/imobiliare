import { describe, expect, it } from 'vitest'

import { getViewingAgendaGuide } from '@/lib/viewing-agenda-guide'
import type { Vizionare } from '@/lib/types'

function viewing(input: Partial<Vizionare> = {}): Vizionare {
  return {
    id: 'viewing-1',
    clientId: 'client-1',
    ownerId: 'owner-1',
    propertyId: 'property-1',
    propertyTitle: 'Apartament demo',
    userId: 'client-1',
    userName: 'Client Demo',
    userEmail: 'client@example.test',
    staffId: 'agent-1',
    staffName: 'Agent Demo',
    date: '2026-08-03',
    startTime: '10:00',
    endTime: '10:30',
    status: 'pending',
    notes: '',
    createdAt: '2026-08-01T10:00:00Z',
    ...input,
  }
}

describe('getViewingAgendaGuide', () => {
  it('starts empty client agendas with a scheduling CTA', () => {
    const guide = getViewingAgendaGuide({
      role: 'CLIENT',
      userId: 'client-1',
      viewings: [],
    })

    expect(guide.primaryAction).toMatchObject({ target: 'schedule' })
    expect(guide.metrics.active).toBe(0)
    expect(guide.cards[0]).toMatchObject({
      id: 'now',
      tone: 'neutral',
    })
  })

  it('prioritizes staff confirmations before other agenda work', () => {
    const guide = getViewingAgendaGuide({
      role: 'AGENT',
      userId: 'agent-1',
      viewings: [
        viewing({ id: 'confirmed-1', status: 'confirmed', date: '2026-08-02' }),
        viewing({ id: 'pending-1', status: 'pending', date: '2026-08-03' }),
      ],
    })

    expect(guide.primaryAction).toMatchObject({
      target: 'confirm',
      viewingId: 'pending-1',
    })
    expect(guide.cards.find((card) => card.id === 'queue')).toMatchObject({
      badgeLabel: '1 pending',
      tone: 'warning',
    })
  })

  it('moves checked-in staff appointments toward completion', () => {
    const guide = getViewingAgendaGuide({
      role: 'ADMIN',
      userId: 'admin-1',
      viewings: [
        viewing({ id: 'checked-1', status: 'checked_in' }),
      ],
    })

    expect(guide.primaryAction).toMatchObject({
      target: 'complete',
      viewingId: 'checked-1',
    })
  })

  it('asks clients for feedback before Deal Room', () => {
    const guide = getViewingAgendaGuide({
      role: 'CLIENT',
      userId: 'client-1',
      viewings: [
        viewing({ id: 'completed-1', status: 'completed' }),
        viewing({ id: 'deal-1', status: 'completed', rating: 5, wouldProceed: true }),
      ],
    })

    expect(guide.primaryAction).toMatchObject({
      target: 'feedback',
      viewingId: 'completed-1',
    })
    expect(guide.metrics.needsFeedback).toBe(1)
  })

  it('lets clients resume cancelled or no-show appointments', () => {
    const guide = getViewingAgendaGuide({
      role: 'CLIENT',
      userId: 'client-1',
      viewings: [
        viewing({ id: 'cancelled-1', status: 'cancelled_by_agent' }),
      ],
    })

    expect(guide.primaryAction).toMatchObject({
      target: 'reschedule',
      viewingId: 'cancelled-1',
    })
    expect(guide.cards.find((card) => card.id === 'history')).toMatchObject({
      badgeLabel: '1 de reluat',
      tone: 'warning',
    })
  })

  it('keeps owners in observer mode for active viewings', () => {
    const guide = getViewingAgendaGuide({
      role: 'OWNER',
      userId: 'owner-1',
      viewings: [
        viewing({ id: 'owner-viewing-1', status: 'confirmed', clientId: 'client-1', ownerId: 'owner-1' }),
      ],
    })

    expect(guide.primaryAction).toMatchObject({
      target: 'active_tab',
      viewingId: 'owner-viewing-1',
    })
    expect(guide.cards[0]).toMatchObject({
      title: 'Totul este la zi',
    })
  })
})
