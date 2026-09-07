import { describe, expect, it } from 'vitest'
import { getTransactionProcess } from './transaction-process'
import { getViewingProcessGroup, getViewingGuidance } from './viewing-guidance'
import { isDealRequirementActionableFor, type DealRoom, type DealRequirement } from './transaction-workspace'

const room = (patch: Partial<DealRoom> = {}): DealRoom => ({
  id: 'deal', property_id: 'property', title: 'Home', stage: 'NEW', status: 'OPEN',
  created_at: '', updated_at: '', ...patch,
})
const visit = (decision: boolean | null) => room({
  deal_appointments: [{ appointment_id: 'visit', appointments: {
    id: 'visit', requested_at: '2026-09-01', status: 'COMPLETED', would_proceed: decision, rating: 5,
  } }] as DealRoom['deal_appointments'],
})
describe('coherent account process', () => {
  it('does not mistake an administrative contract stage for an accepted offer', () => {
    expect(getTransactionProcess(room({ stage: 'CONTRACT' }), 'CLIENT', 'client').phase).toBe('viewing')
  })
  it('keeps the client decision distinct from negotiation', () => {
    expect(getTransactionProcess(visit(null), 'CLIENT', 'client')).toMatchObject({ phase: 'decision', actionable: true, target: 'viewings' })
    expect(getTransactionProcess(visit(null), 'OWNER', 'owner').actionable).toBe(false)
    expect(getTransactionProcess(visit(true), 'CLIENT', 'client')).toMatchObject({ phase: 'negotiation', target: 'offers' })
    expect(getTransactionProcess(visit(false), 'CLIENT', 'client').phase).toBe('decision')
  })
  it('never requests new action on a closed room', () => {
    expect(getTransactionProcess(room({ stage: 'CLOSED_LOST' }), 'ADMIN', 'admin')).toMatchObject({ phase: 'closed', actionable: false, target: 'activity' })
  })
  it('keeps undecided and positive visits out of the archive', () => {
    expect(getViewingProcessGroup({ status: 'completed', wouldProceed: undefined })).toBe('followup')
    expect(getViewingProcessGroup({ status: 'completed', wouldProceed: false })).toBe('history')
    expect(getViewingProcessGroup({ status: 'completed', wouldProceed: true, rating: 5 })).toBe('followup')
    expect(getViewingProcessGroup({ status: 'completed', wouldProceed: false, rating: 5 })).toBe('history')
    expect(getViewingProcessGroup({ status: 'confirmed' })).toBe('active')
  })
  it('asks the client for a decision and staff to wait', () => {
    expect(getViewingGuidance({ status: 'completed' }, 'client').action).toBe('feedback')
    expect(getViewingGuidance({ status: 'completed' }, 'staff').title).toContain('decizia clientului')
    expect(getViewingGuidance({ status: 'completed', wouldProceed: true }, 'staff').action).toBe('deal_room')
  })
  it('honors an explicit assignee over a shared role', () => {
    const requirement: DealRequirement = { id: 'r', document_type: 'ID', label: 'Identity', responsible_role: 'CLIENT', assigned_to: 'other', status: 'MISSING' }
    expect(isDealRequirementActionableFor(requirement, 'CLIENT', 'client')).toBe(false)
    expect(isDealRequirementActionableFor(requirement, 'CLIENT', 'other')).toBe(true)
  })
  it('treats received documents as agent review, not another upload', () => {
    const requirement: DealRequirement = { id: 'r', document_type: 'ID', label: 'Identity', responsible_role: 'CLIENT', status: 'UPLOADED',
      client_documents: { id: 'doc', title: 'Identity', type: 'ID', status: 'UPLOADED', version: 1 } }
    expect(isDealRequirementActionableFor(requirement, 'CLIENT', 'client')).toBe(false)
    expect(isDealRequirementActionableFor(requirement, 'AGENT', 'agent')).toBe(true)
    const accepted = room({ property_offers: [{ id: 'offer', status: 'ACCEPTED' }] as DealRoom['property_offers'], deal_document_requirements: [requirement] })
    expect(getTransactionProcess(accepted, 'CLIENT', 'client')).toMatchObject({ phase: 'contract', actor: 'Agentul', actionable: false })
    expect(getTransactionProcess(accepted, 'AGENT', 'agent').actionable).toBe(true)
  })

})
