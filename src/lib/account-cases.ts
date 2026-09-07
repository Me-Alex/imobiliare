import type { AccountRole } from './account-roles'
import type { Vizionare } from './types'
import { getViewingGuidance, getViewingProcessGroup } from './viewing-guidance'
import { getTransactionProcess } from './transaction-process'
import { relationOne, type DealRoom } from './transaction-workspace'

export interface AccountCase {
  id: string
  title: string
  propertyId: string
  detail?: string
  person: string
  status: string
  actionLabel: string
  actionable: boolean
  closed: boolean
  appointmentId?: string
  dealId?: string
  target: 'viewing' | 'deal'
}

/** Rooms are independent dossiers, even when two clients pursue the same property.
 * Linked appointments belong to that dossier; unmatched appointments remain visible.
 */
export function getAccountCases(viewings: Vizionare[], rooms: DealRoom[], role: AccountRole, userId: string): AccountCase[] {
  const linked = new Set(rooms.flatMap(room => (room.deal_appointments || []).map(link => link.appointment_id)))
  const represented = new Set<string>()
  const visitCase = (visit: Vizionare): AccountCase => {
    const audience = role === 'AGENT' || role === 'ADMIN' ? 'staff' : visit.clientId === userId ? 'client' : 'observer'
    const guidance = getViewingGuidance(visit, audience)
    return { id: visit.id, title: visit.propertyTitle, propertyId: visit.propertyUuid || visit.propertyId, detail: `${new Date(visit.date + 'T00:00:00').toLocaleDateString('ro-RO')} · ${visit.startTime}`, person: role === 'CLIENT' ? visit.staffName : visit.userName,
      status: guidance.title, actionLabel: guidance.actionLabel || 'Vezi programarea',
      actionable: !['none', 'documents'].includes(guidance.action), closed: getViewingProcessGroup(visit) === 'history',
      appointmentId: visit.id, target: 'viewing' }
  }
  const cases = rooms.map(room => {
    const process = getTransactionProcess(room, role, userId)
    const visits = viewings.filter(visit => room.deal_appointments?.some(link => link.appointment_id === visit.id))
      .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime))
    const relevantVisit = visits.find(v => ['pending', 'confirmed', 'checked_in'].includes(v.status))
      || (process.phase === 'decision' ? visits.find(v => v.status === 'completed') : visits[0])
    if (process.phase === 'closed') for (const visit of visits) represented.add(visit.id)
    if (['viewing', 'decision'].includes(process.phase) && relevantVisit) {
      represented.add(relevantVisit.id)
      return { ...visitCase(relevantVisit), id: room.id, dealId: room.id, propertyId: room.property_id }
    }
    return { id: room.id, propertyId: room.property_id, title: relationOne(room.properties)?.title || room.title,
      person: room.deal_appointments?.map(link => relationOne(link.appointments)?.client_name).find(Boolean) || '',
      status: process.title, actionLabel: process.actionable ? process.actionLabel : 'Vezi dosarul',
      actionable: process.actionable, closed: process.phase === 'closed',
      appointmentId: room.deal_appointments?.[0]?.appointment_id, dealId: room.id, target: 'deal' as const }
  })
  return [...cases, ...viewings.filter(v => !linked.has(v.id) || (!represented.has(v.id) && ['pending', 'confirmed', 'checked_in'].includes(v.status))).map(visitCase)]
    .sort((a, b) => Number(a.closed) - Number(b.closed) || Number(b.actionable) - Number(a.actionable))
}

export function groupAccountCases(cases: AccountCase[]) {
  const groups = new Map<string, { id: string; title: string; cases: AccountCase[] }>()
  for (const item of cases) {
    const id = item.propertyId || item.id
    const group = groups.get(id) || { id, title: item.title, cases: [] }
    group.cases.push(item)
    groups.set(id, group)
  }
  return [...groups.values()]
}
