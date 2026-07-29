import { describe, expect, it } from 'vitest'

import type { Vizionare } from '@/lib/types'
import {
  getViewingWorkspaceLabel,
  isDocumentWorkspaceClosed,
  pickDocumentViewingId,
} from '@/lib/document-workspace'

function viewing(id: string, status: Vizionare['status']) {
  return { id, status }
}

describe('document workspace selection', () => {
  it('keeps an explicit URL selection, including a closed audit record', () => {
    const rows = [viewing('closed', 'cancelled_by_client'), viewing('active', 'confirmed')]
    expect(pickDocumentViewingId(rows, 'closed', 'active')).toBe('closed')
  })

  it('does not restore a closed appointment from local persistence', () => {
    const rows = [viewing('closed', 'no_show'), viewing('active', 'pending')]
    expect(pickDocumentViewingId(rows, null, 'closed')).toBe('active')
  })

  it('falls back to a closed audit record only when nothing actionable exists', () => {
    const rows = [viewing('latest', 'cancelled_by_agent'), viewing('older', 'no_show')]
    expect(pickDocumentViewingId(rows, null, null)).toBe('latest')
  })

  it('classifies terminal appointments as read-only', () => {
    expect(isDocumentWorkspaceClosed('cancelled')).toBe(true)
    expect(isDocumentWorkspaceClosed('no_show')).toBe(true)
    expect(isDocumentWorkspaceClosed('completed')).toBe(false)
  })

  it('provides concise status labels for the selector', () => {
    expect(getViewingWorkspaceLabel('checked_in')).toBe('în desfășurare')
    expect(getViewingWorkspaceLabel('cancelled_by_agent')).toBe('anulată de agenție')
  })
})
