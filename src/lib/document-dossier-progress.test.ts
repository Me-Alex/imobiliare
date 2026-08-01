import { describe, expect, it } from 'vitest'

import type { DocumentActionPlan } from '@/lib/document-action-plan'
import { getDocumentDossierProgress } from '@/lib/document-dossier-progress'

const basePlan: DocumentActionPlan = {
  headline: 'Plan simplificat',
  description: 'Demo',
  readOnly: false,
  primaryItemId: 'data',
  items: [
    {
      id: 'data',
      title: 'Date client',
      description: 'Completează datele cerute pentru documentele tranzacției.',
      state: 'current',
      owner: 'CLIENT',
    },
    {
      id: 'evidence',
      title: 'Act identitate',
      description: 'Încarcă actul de identitate.',
      state: 'pending',
      owner: 'CLIENT',
    },
    {
      id: 'review',
      title: 'Verificare agenție',
      description: 'Agentul verifică datele.',
      state: 'pending',
      owner: 'AGENCY',
    },
    {
      id: 'signature',
      title: 'Semnături',
      description: 'Semnarea apare după verificare.',
      state: 'pending',
      owner: 'SYSTEM',
    },
    {
      id: 'archive',
      title: 'Arhivă și jurnal',
      description: 'Arhiva se creează automat.',
      state: 'pending',
      owner: 'SYSTEM',
    },
  ],
}

describe('getDocumentDossierProgress', () => {
  it('starts an active dossier in the preparation stage', () => {
    const progress = getDocumentDossierProgress({ plan: basePlan, documentsCount: 0 })

    expect(progress.headline).toBe('Unde este dosarul acum')
    expect(progress.progressPercent).toBe(0)
    expect(progress.currentStage).toMatchObject({
      id: 'preparation',
      state: 'current',
    })
    expect(progress.stages.map((stage) => stage.id)).toEqual(['preparation', 'review', 'signature', 'archive'])
  })

  it('moves the visible current stage to signature after review is complete', () => {
    const progress = getDocumentDossierProgress({
      plan: {
        ...basePlan,
        primaryItemId: 'signature',
        items: basePlan.items.map((item) => {
          if (item.id === 'data' || item.id === 'evidence' || item.id === 'review') {
            return { ...item, state: 'complete' as const }
          }
          if (item.id === 'signature') return { ...item, state: 'current' as const }
          return item
        }),
      },
      documentsCount: 1,
    })

    expect(progress.completedCount).toBe(2)
    expect(progress.progressPercent).toBe(50)
    expect(progress.currentStage).toMatchObject({
      id: 'signature',
      state: 'current',
    })
    expect(progress.stages.find((stage) => stage.id === 'archive')?.description).toContain('1 document păstrat')
  })

  it('keeps closed dossiers focused on archive consultation', () => {
    const progress = getDocumentDossierProgress({
      plan: {
        ...basePlan,
        readOnly: true,
        items: basePlan.items.map((item) => ({
          ...item,
          state: item.id === 'signature' ? 'blocked' as const : 'complete' as const,
        })),
      },
      documentsCount: 2,
    })

    expect(progress.headline).toBe('Dosar închis pentru consultare')
    expect(progress.currentStage).toMatchObject({
      id: 'signature',
      state: 'blocked',
    })
    expect(progress.description).toContain('Nu mai există pași noi')
  })
})
