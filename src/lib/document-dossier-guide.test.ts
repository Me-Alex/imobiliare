import { describe, expect, it } from 'vitest'

import type { DocumentActionPlan } from '@/lib/document-action-plan'
import { getDocumentDossierGuide } from '@/lib/document-dossier-guide'

function plan(input: Partial<DocumentActionPlan> = {}): DocumentActionPlan {
  return {
    headline: 'Plan simplificat',
    description: 'Descriere',
    readOnly: false,
    primaryItemId: 'data',
    items: [
      {
        id: 'data',
        title: 'Date client',
        description: 'Completează datele.',
        state: 'current',
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
        id: 'archive',
        title: 'Arhivă și jurnal',
        description: 'Documentele pot fi consultate.',
        state: 'pending',
        owner: 'SYSTEM',
      },
    ],
    ...input,
  }
}

describe('getDocumentDossierGuide', () => {
  it('puts the current client work first', () => {
    const guide = getDocumentDossierGuide({
      role: 'CLIENT',
      plan: plan(),
      documentsCount: 0,
      requestsCount: 0,
    })

    expect(guide.headline).toBe('Dosarul, pe scurt')
    expect(guide.cards[0]).toMatchObject({
      id: 'role-action',
      target: 'primary',
      tone: 'primary',
      badgeLabel: '1 pas al tău',
    })
    expect(guide.cards[0]?.itemIds).toEqual(['data'])
  })

  it('tells participants when the agency owns the next handoff', () => {
    const guide = getDocumentDossierGuide({
      role: 'CLIENT',
      plan: plan({
        primaryItemId: 'review',
        items: [
          {
            id: 'data',
            title: 'Date client',
            description: 'Date trimise.',
            state: 'complete',
            owner: 'AGENCY',
          },
          {
            id: 'review',
            title: 'Verificare agenție',
            description: 'Agentul verifică datele.',
            state: 'waiting',
            owner: 'AGENCY',
          },
          {
            id: 'archive',
            title: 'Arhivă și jurnal',
            description: 'Documentele pot fi consultate.',
            state: 'pending',
            owner: 'SYSTEM',
          },
        ],
      }),
      documentsCount: 0,
      requestsCount: 1,
    })

    expect(guide.cards[0]).toMatchObject({
      title: 'Nu trebuie să modifici nimic acum',
      target: 'advanced',
      tone: 'waiting',
    })
    expect(guide.cards[1]).toMatchObject({
      id: 'handoff',
      badgeLabel: '1 handoff',
      target: 'advanced',
    })
  })

  it('treats agency-owned work as actionable for agents', () => {
    const guide = getDocumentDossierGuide({
      role: 'AGENT',
      plan: plan({
        primaryItemId: 'review',
        items: [
          {
            id: 'review',
            title: 'Generare și verificare',
            description: 'Verifică datele și generează documentul.',
            state: 'current',
            owner: 'AGENCY',
          },
          {
            id: 'archive',
            title: 'Arhivă și audit',
            description: 'Arhiva va include documentele.',
            state: 'pending',
            owner: 'SYSTEM',
          },
        ],
      }),
      documentsCount: 0,
      requestsCount: 1,
    })

    expect(guide.cards[0]).toMatchObject({
      title: 'Ce faci tu acum, ca agent',
      target: 'primary',
      tone: 'primary',
    })
    expect(guide.cards[0]?.itemIds).toEqual(['review'])
  })

  it('keeps closed dossiers in archive mode', () => {
    const guide = getDocumentDossierGuide({
      role: 'OWNER',
      plan: plan({
        readOnly: true,
        primaryItemId: 'archive',
        items: [
          {
            id: 'signature',
            title: 'Semnături oprite',
            description: 'Semnarea este oprită.',
            state: 'blocked',
            owner: 'SYSTEM',
          },
          {
            id: 'archive',
            title: 'Arhivă disponibilă',
            description: 'Un document rămâne disponibil.',
            state: 'complete',
            owner: 'SYSTEM',
          },
        ],
      }),
      documentsCount: 1,
      requestsCount: 0,
    })

    expect(guide.headline).toBe('Dosarul este în modul consultare')
    expect(guide.cards[0]).toMatchObject({
      title: 'Nu ai acțiuni noi',
      target: 'archive',
      tone: 'muted',
    })
    expect(guide.cards[2]).toMatchObject({
      badgeLabel: '1 document',
      tone: 'complete',
    })
  })
})
