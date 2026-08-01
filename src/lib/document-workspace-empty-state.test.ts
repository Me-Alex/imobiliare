import { describe, expect, it } from 'vitest'

import { ACCOUNT_ROLES } from '@/lib/account-roles'
import { getDocumentWorkspaceEmptyState } from '@/lib/document-workspace-empty-state'

describe('getDocumentWorkspaceEmptyState', () => {
  it('gives every account role a concrete recovery action', () => {
    for (const role of ACCOUNT_ROLES) {
      const state = getDocumentWorkspaceEmptyState(role)

      expect(state.title).not.toHaveLength(0)
      expect(state.description).not.toHaveLength(0)
      expect(state.actionLabel).not.toHaveLength(0)
      expect(state.secondaryHint).not.toHaveLength(0)
      expect(state.actionPage).not.toHaveLength(0)
    }
  })

  it('routes clients to scheduling because documents depend on a viewing', () => {
    expect(getDocumentWorkspaceEmptyState('CLIENT')).toMatchObject({
      actionPage: 'programare-vizionare',
      actionLabel: 'Programează o vizionare',
    })
  })

  it('routes operational roles to their own workspaces', () => {
    expect(getDocumentWorkspaceEmptyState('OWNER').actionPage).toBe('proprietatile-mele')
    expect(getDocumentWorkspaceEmptyState('AGENT').actionPage).toBe('vizionarile-mele')
    expect(getDocumentWorkspaceEmptyState('ADMIN').actionPage).toBe('admin')
  })
})
