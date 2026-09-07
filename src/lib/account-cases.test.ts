import { expect, it } from 'vitest'
import { getAccountCases, groupAccountCases } from './account-cases'
import type { Vizionare } from './types'
import type { DealRoom } from './transaction-workspace'

const visit = (id: string, patch: Partial<Vizionare> = {}): Vizionare => ({
  id, clientId: 'client', propertyId: 'property', propertyTitle: 'Home', userId: 'client',
  userName: 'Client', userEmail: '', staffId: 'agent', staffName: 'Agent', date: '2026-09-10',
  startTime: '10:00', endTime: '11:00', status: 'confirmed', notes: '', createdAt: '', ...patch,
})
const room = (id: string, visitId: string): DealRoom => ({
  id, property_id: 'property', title: 'Home', stage: 'VIEWING', status: 'ACTIVE', created_at: '', updated_at: '',
  deal_appointments: [{ appointment_id: visitId }],
})
it('shows one dossier for a room and its linked visit, including waiting states', () => {
  const cases = getAccountCases([visit('v')], [room('d', 'v')], 'CLIENT', 'client')
  expect(cases).toHaveLength(1)
  expect(cases[0]).toMatchObject({ id: 'd', appointmentId: 'v', dealId: 'd', target: 'viewing', actionable: false, closed: false })
})
it('preserves an independent visit even at the same property', () => {
  expect(getAccountCases([visit('v'), visit('other')], [room('d', 'v')], 'CLIENT', 'client')).toHaveLength(2)
})
it('never merges different client dossiers just because the property is shared', () => {
  const cases = getAccountCases([visit('v'), visit('other', { clientId: 'another' })], [room('d', 'v'), room('second', 'other')], 'AGENT', 'agent')
  expect(cases.map(item => item.id)).toEqual(['d', 'second'])
})
it('retains closed dossiers for consultation', () => {
  const cases = getAccountCases([visit('v')], [{ ...room('d', 'v'), stage: 'CLOSED_LOST' }], 'CLIENT', 'client')
  expect(cases[0]).toMatchObject({ closed: true, actionable: false, target: 'deal' })
})
it('opens the negotiation rather than asking for the visit decision again', () => {
  const deal = { ...room('d', 'v'), property_offers: [{ id: 'offer', status: 'SUBMITTED', offer_kind: 'COUNTER_OFFER', created_at: '', user_id: 'client' }] } as DealRoom
  expect(getAccountCases([visit('v', { status: 'completed' })], [deal], 'CLIENT', 'client')[0]).toMatchObject({ target: 'deal', dealId: 'd', appointmentId: 'v' })
})

it('groups a property visually while preserving separate actionable records', () => {
  const cases = getAccountCases([visit('v'), visit('other')], [room('d', 'v')], 'CLIENT', 'client')
  const groups = groupAccountCases(cases)
  expect(groups).toHaveLength(1)
  expect(groups[0].cases.map(item => item.id)).toEqual(['d', 'other'])
  expect(groups[0].cases[1].detail).toContain('10:00')
})

it('keeps every open appointment accessible when one dossier has several visits', () => {
  const deal = { ...room('d', 'v'), deal_appointments: [{ appointment_id: 'v' }, { appointment_id: 'second' }] }
  const cases = getAccountCases([visit('v'), visit('second', { status: 'pending' })], [deal], 'AGENT', 'agent')
  expect(cases.map(item => item.appointmentId).sort()).toEqual(['second', 'v'])
  expect(groupAccountCases(cases)).toHaveLength(1)
})
