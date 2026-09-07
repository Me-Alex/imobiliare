import type { AccountRole } from './account-roles'
import type { Vizionare } from './types'
import { getViewingGuidance, getViewingProcessGroup } from './viewing-guidance'
import { getTransactionProcess } from './transaction-process'
import { relationOne, type DealRoom } from './transaction-workspace'

export interface AccountTask {
  id: string
  title: string
  property: string
  appointmentId?: string
  dealId?: string
}

/** One entry per actionable visit or transaction; waiting is not a personal task. */
export function getAccountTasks(viewings: Vizionare[], rooms: DealRoom[], role: AccountRole, userId: string): AccountTask[] {
  const staff = role === 'ADMIN' || role === 'AGENT'
  const tasks: AccountTask[] = []
  const progressedVisits = new Set<string>()
  for (const room of rooms) {
    const process = getTransactionProcess(room, role, userId)
    if (['contract', 'negotiation', 'closed'].includes(process.phase)) for (const link of room.deal_appointments || []) progressedVisits.add(link.appointment_id)
    if (!process.actionable || !['contract', 'negotiation'].includes(process.phase)) continue
    tasks.push({ id: room.id, title: process.title, property: relationOne(room.properties)?.title || room.title,
      dealId: room.id, appointmentId: room.deal_appointments?.[0]?.appointment_id })
  }
  for (const viewing of viewings) {
    if (viewing.status === 'completed' && progressedVisits.has(viewing.id)) continue
    const isClient = viewing.clientId === userId
    if (!staff && !isClient) continue
    if (!(staff && ['pending', 'checked_in'].includes(viewing.status))
      && !(isClient && viewing.status === 'completed' && getViewingProcessGroup(viewing) === 'followup' && viewing.wouldProceed !== true)) continue
    const guidance = getViewingGuidance(viewing, staff ? 'staff' : 'client')
    tasks.push({ id: viewing.id, title: guidance.title, property: viewing.propertyTitle, appointmentId: viewing.id })
  }
  return tasks
}
