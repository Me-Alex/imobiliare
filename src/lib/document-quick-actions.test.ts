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
  })

  it('keeps advanced actions available for active dossiers', () => {
    const actions = getDocumentQuickActions({
      plan: activePlan,
      hasDealRoomContext: false,
      documentsCount: 0,
    })

    expect(actions.find((action) => action.id === 'advanced-tools')).toMatchObject({
      target: 'advanced',
      disabled: undefined,
    })
    expect(actions.find((action) => action.id === 'deal-room')?.buttonLabel).toBe('Vezi tranzacția')
  })

  it('turns closed dossiers into archive-first guidance and disables advanced actions', () => {
    const actions = getDocumentQuickActions({
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
    expect(actions.find((action) => action.id === 'advanced-tools')).toMatchObject({
      disabled: true,
      buttonLabel: 'Indisponibil',
    })
    expect(actions.find((action) => action.id === 'archive')?.description).toContain('1 document păstrat')
  })
})
