import { describe, expect, it } from 'vitest'

import { getAgentCrmWorkbench, type AgentCrmWorkbenchInput } from '@/lib/agent-crm-workbench'

const NOW = Date.parse('2026-08-01T10:00:00.000Z')

const empty: AgentCrmWorkbenchInput = {
  leads: [],
  followUps: [],
  appointments: [],
  now: NOW,
}

describe('getAgentCrmWorkbench', () => {
  it('prioritizes overdue follow-ups and unanswered leads', () => {
    const workbench = getAgentCrmWorkbench({
      ...empty,
      leads: [
        {
          status: 'NEW',
          score: 50,
          created_at: '2026-08-01T06:00:00.000Z',
          response_due_at: '2026-08-01T09:00:00.000Z',
        },
      ],
      followUps: [
        {
          status: 'OPEN',
          due_at: '2026-08-01T08:00:00.000Z',
        },
      ],
    })

    expect(workbench.primaryStage).toMatchObject({
      id: 'response',
      state: 'urgent',
      count: 2,
      focus: 'followups',
    })
    expect(workbench.headline).toContain('răspuns rapid')
  })

  it('moves high-intent new leads into qualification focus when response is clear', () => {
    const workbench = getAgentCrmWorkbench({
      ...empty,
      leads: [
        {
          status: 'NEW',
          score: 82,
          created_at: '2026-08-01T09:30:00.000Z',
          response_due_at: '2026-08-01T11:00:00.000Z',
        },
        {
          status: 'QUALIFIED',
          score: 55,
          created_at: '2026-07-31T09:00:00.000Z',
        },
      ],
    })

    expect(workbench.primaryStage).toMatchObject({
      id: 'qualification',
      state: 'urgent',
      count: 2,
      focus: 'pipeline',
    })
    expect(workbench.primaryStage.signals).toContain('1 lead cu intenție mare')
  })

  it('prioritizes pending viewing confirmations before offer polish', () => {
    const workbench = getAgentCrmWorkbench({
      ...empty,
      leads: [
        {
          status: 'OFFER',
          score: 73,
          created_at: '2026-07-30T09:00:00.000Z',
        },
      ],
      appointments: [
        {
          status: 'REQUESTED',
          requested_at: '2026-08-01T08:30:00.000Z',
          start_at: '2026-08-02T13:00:00.000Z',
        },
      ],
    })

    expect(workbench.primaryStage).toMatchObject({
      id: 'viewing',
      state: 'urgent',
      focus: 'viewings',
    })
    expect(workbench.stages.find((stage) => stage.id === 'offerContract')).toMatchObject({
      state: 'active',
      count: 1,
    })
  })

  it('reports a healthy workbench when there is no active CRM work', () => {
    const workbench = getAgentCrmWorkbench(empty)

    expect(workbench.headline).toBe('CRM-ul filtrat este la zi')
    expect(workbench.healthPercent).toBe(100)
    expect(workbench.activeCount).toBe(0)
    expect(workbench.stages.every((stage) => stage.state === 'healthy')).toBe(true)
  })
})
