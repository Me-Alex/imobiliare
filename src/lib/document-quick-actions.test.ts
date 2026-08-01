import { describe, expect, it } from 'vitest'

import { getDocumentQuickActions } from '@/lib/document-quick-actions'
import type { DocumentActionPlan } from '@/lib/document-action-plan'

const activePlan: DocumentActionPlan = {
  headline: 'Plan simplificat',
  description: 'Demo',
  readOnly: false,
  primaryItemId: 'signature',
  items: [
    {
      id: 'signature',
      title: 'Semnături',
      description: 'Ai un document pregătit pentru semnătură.',
      state: 'current',
      owner: 'CLIENT',
    },
  ],
}

describe('getDocumentQuickActions', () => {
  it('puts the current actionable step first', () => {
    const actions = getDocumentQuickActions({
      role: 'CLIENT',
      plan: activePlan,
      hasDealRoomContext: true,
      documentsCount: 2,
    })

    expect(actions[0]).toMatchObject({
      id: 'current-step',
      title: 'Pas curent: Semnături',
      target: 'primary',
      tone: 'primary',
    })
    expect(actions.find((action) => action.id === 'deal-room')?.buttonLabel).toBe('Deschide Deal Room')
    expect(actions.some((action) => action.id === 'advanced-tools')).toBe(false)
  })

  it('shows operational actions only for staff roles', () => {
    const actions = getDocumentQuickActions({
      role: 'AGENT',
      plan: activePlan,
      hasDealRoomContext: false,
      documentsCount: 0,
    })

    expect(actions.find((action) => action.id === 'advanced-tools')).toMatchObject({
      title: 'Acțiuni operaționale',
      target: 'advanced',
    })
    expect(actions.find((action) => action.id === 'deal-room')?.buttonLabel).toBe('Vezi tranzacția')
  })

  it('keeps participant actions focused on the active step and archive', () => {
    const actions = getDocumentQuickActions({
      role: 'OWNER',
      plan: activePlan,
      hasDealRoomContext: false,
      documentsCount: 0,
    })

    expect(actions.map((action) => action.id)).toEqual(['current-step', 'deal-room', 'archive'])
  })

  it('turns closed dossiers into archive-first guidance without duplicate actions', () => {
    const actions = getDocumentQuickActions({
      role: 'ADMIN',
      plan: {
        ...activePlan,
        readOnly: true,
        primaryItemId: 'signature',
      },
      hasDealRoomContext: true,
      documentsCount: 1,
    })

    expect(actions[0]).toMatchObject({
      title: 'Dosar închis',
      target: 'archive',
      tone: 'muted',
    })
    expect(actions.map((action) => action.id)).toEqual(['current-step', 'deal-room'])
    expect(actions.some((action) => action.id === 'advanced-tools')).toBe(false)
  })
})
