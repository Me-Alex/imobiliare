import { describe, expect, it } from 'vitest'

import { getPropertyPublicationFlow } from '@/lib/property-publication-flow'

describe('getPropertyPublicationFlow', () => {
  it('explains the owner publication flow and sends owners back to their portfolio', () => {
    const flow = getPropertyPublicationFlow({
      role: 'OWNER',
      propertyCount: 1,
      sessionPublishedCount: 0,
    })

    expect(flow.roleLabel).toBe('Proprietar')
    expect(flow.primaryActionPage).toBe('proprietatile-mele')
    expect(flow.secondaryActionPage).toBe('owner-dashboard')
    expect(flow.stats[0]?.value).toBe('1 proprietate')
    expect(flow.steps.map((step) => step.id)).toContain('owner-documents')
  })

  it('connects agent publication with CRM and Deal Room work', () => {
    const flow = getPropertyPublicationFlow({
      role: 'AGENT',
      propertyCount: 3,
      sessionPublishedCount: 2,
    })

    expect(flow.primaryActionPage).toBe('crm')
    expect(flow.secondaryActionPage).toBe('vizionarile-mele')
    expect(flow.stats[0]).toMatchObject({
      label: 'Portofoliu gestionat',
      value: '3 proprietăți',
    })
    expect(flow.steps.at(-1)).toMatchObject({
      id: 'agent-deal',
      title: 'Deal Room',
    })
  })

  it('keeps admin publication tied to moderation and audit', () => {
    const flow = getPropertyPublicationFlow({
      role: 'ADMIN',
      propertyCount: 0,
      sessionPublishedCount: 1,
    })

    expect(flow.title).toBe('Publici ca administrator')
    expect(flow.primaryActionPage).toBe('admin')
    expect(flow.stats[1]?.value).toBe('1 nouă')
    expect(flow.steps.map((step) => step.ownerLabel)).toContain('Admin + HQS')
  })
})
