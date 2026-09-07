import { expect, it } from 'vitest'
import { getAccountTasks } from './account-tasks'
import { getAccountNavigationGroups, getAccountMenuItems } from './navigation-config'
import type { AccountRole } from './account-roles'
import type { Vizionare } from './types'
import type { DealRoom } from './transaction-workspace'

const visit = (patch: Partial<Vizionare> = {}): Vizionare => ({
  id: 'v', clientId: 'client', propertyId: 'p', propertyTitle: 'Home', userId: 'client', userName: 'Client',
  userEmail: '', staffId: 'agent', staffName: 'Agent', date: '2026-09-10', startTime: '10:00', endTime: '11:00',
  status: 'pending', notes: '', createdAt: '', ...patch,
})
it('assigns confirmation to staff and decision to the client, not the owner', () => {
  expect(getAccountTasks([visit()], [], 'CLIENT', 'client')).toHaveLength(0)
  expect(getAccountTasks([visit()], [], 'AGENT', 'agent')[0].appointmentId).toBe('v')
  expect(getAccountTasks([visit({ status: 'completed' })], [], 'CLIENT', 'client')).toHaveLength(1)
  expect(getAccountTasks([visit({ status: 'completed', wouldProceed: false })], [], 'CLIENT', 'client')).toHaveLength(0)
  expect(getAccountTasks([visit({ status: 'completed', wouldProceed: false, rating: 5 })], [], 'CLIENT', 'client')).toHaveLength(0)
  expect(getAccountTasks([visit({ status: 'completed' })], [], 'OWNER', 'owner')).toHaveLength(0)
})
it('does not duplicate a visit as a transaction task before negotiation', () => {
  const room: DealRoom = { id: 'd', property_id: 'p', title: 'Home', stage: 'VIEWING', status: 'ACTIVE', created_at: '', updated_at: '' }
  expect(getAccountTasks([visit()], [room], 'AGENT', 'agent')).toHaveLength(1)
})
for (const role of ['CLIENT', 'OWNER', 'AGENT', 'ADMIN'] as AccountRole[]) {
  it(`keeps ${role} navigation to five primary destinations without losing tools`, () => {
    const groups = getAccountNavigationGroups(role)
    expect(groups[0].items.length).toBeLessThanOrEqual(5)
    expect(groups.flatMap(group => group.items.map(item => item.page)).sort()).toEqual(getAccountMenuItems(role).map(item => item.page).sort())
  })
}

it('suppresses an obsolete visit decision once its negotiation exists', () => {
  const room: DealRoom = { id: 'd', property_id: 'p', primary_client_id: 'client', title: 'Home', stage: 'OFFER', status: 'ACTIVE', created_at: '', updated_at: '',
    deal_appointments: [{ appointment_id: 'v' }] as DealRoom['deal_appointments'],
    property_offers: [{ id: 'offer', offer_kind: 'COUNTER_OFFER', status: 'SUBMITTED', created_at: '', user_id: 'client' }] as DealRoom['property_offers'] }
  const tasks = getAccountTasks([visit({ status: 'completed' })], [room], 'CLIENT', 'client')
  expect(tasks).toHaveLength(1)
  expect(tasks[0]).toMatchObject({ dealId: 'd', appointmentId: 'v' })
})
