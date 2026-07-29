import type { Vizionare } from '@/lib/types'

const CLOSED_VIEWING_STATUSES = new Set<Vizionare['status']>([
  'cancelled',
  'cancelled_by_client',
  'cancelled_by_agent',
  'no_show',
])

export function isDocumentWorkspaceClosed(status: Vizionare['status']) {
  return CLOSED_VIEWING_STATUSES.has(status)
}

/**
 * URL context is an explicit choice and always wins. A stored selection is
 * reused only while it is still actionable, preventing a previously opened
 * cancelled appointment from becoming the default workspace forever.
 */
export function pickDocumentViewingId(
  viewings: readonly Pick<Vizionare, 'id' | 'status'>[],
  requestedId: string | null,
  storedId: string | null,
) {
  if (requestedId && viewings.some((viewing) => viewing.id === requestedId)) {
    return requestedId
  }

  if (storedId && viewings.some((viewing) =>
    viewing.id === storedId && !isDocumentWorkspaceClosed(viewing.status),
  )) {
    return storedId
  }

  return viewings.find((viewing) => !isDocumentWorkspaceClosed(viewing.status))?.id
    ?? viewings[0]?.id
    ?? null
}

export function getViewingWorkspaceLabel(status: Vizionare['status']) {
  switch (status) {
    case 'pending':
      return 'în așteptare'
    case 'confirmed':
      return 'confirmată'
    case 'checked_in':
      return 'în desfășurare'
    case 'completed':
      return 'finalizată'
    case 'no_show':
      return 'neprezentare'
    case 'cancelled_by_agent':
      return 'anulată de agenție'
    case 'cancelled':
    case 'cancelled_by_client':
      return 'anulată'
  }
}
