import { describe, expect, it } from 'vitest'

import { getAdminOperationsFlow, type AdminOperationsFlowInput } from '@/lib/admin-operations-flow'

const healthy: AdminOperationsFlowInput = {
  legalProfileReady: true,
  templatesPendingReview: 0,
  draftProperties: 0,
  propertiesNeedOptimization: 0,
  unassignedProperties: 0,
  openLeads: 0,
  overdueLeads: 0,
  pendingAppointments: 0,
  activeDeals: 0,
  pendingDocuments: 0,
  pendingRedemptions: 0,
}

describe('getAdminOperationsFlow', () => {
  it('prioritizes legal blockers before commercial work', () => {
    const flow = getAdminOperationsFlow({
      ...healthy,
      legalProfileReady: false,
      templatesPendingReview: 2,
      overdueLeads: 4,
    })

    expect(flow.primaryStage).toMatchObject({
      id: 'compliance',
      state: 'blocked',
      count: 3,
      destination: 'compliance',
    })
    expect(flow.headline).toContain('conformitate')
    expect(flow.activeCount).toBe(7)
  })

  it('points portfolio work to unassigned properties before quality polish', () => {
    const flow = getAdminOperationsFlow({
      ...healthy,
      draftProperties: 2,
      propertiesNeedOptimization: 5,
      unassignedProperties: 1,
    })

    expect(flow.primaryStage).toMatchObject({
      id: 'portfolio',
      state: 'urgent',
      count: 8,
      actionLabel: 'Repartizează agent',
      destination: 'property_unassigned',
    })
    expect(flow.primaryStage.signals).toContain('1 proprietate fără agent')
  })

  it('moves urgent commercial work to CRM when leads are overdue', () => {
    const flow = getAdminOperationsFlow({
      ...healthy,
      openLeads: 9,
      overdueLeads: 3,
      pendingAppointments: 2,
      activeDeals: 4,
    })

    expect(flow.primaryStage).toMatchObject({
      id: 'transactions',
      state: 'urgent',
      count: 9,
      destination: 'crm',
    })
  })

  it('marks the cockpit healthy when there are no visible blockers', () => {
    const flow = getAdminOperationsFlow(healthy)

    expect(flow.headline).toBe('Operațiunile sunt la zi')
    expect(flow.healthPercent).toBe(100)
    expect(flow.activeCount).toBe(0)
    expect(flow.stages.every((stage) => stage.state === 'healthy')).toBe(true)
  })
})
