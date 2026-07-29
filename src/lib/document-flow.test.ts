import { describe, expect, it } from 'vitest'

import { getDocumentFlowSummary } from '@/lib/document-flow'
import type { ViewingDocument, Vizionare } from '@/lib/types'

function viewing(status: Vizionare['status']) {
  return { status } as Vizionare
}

describe('getDocumentFlowSummary', () => {
  it('turns cancelled appointments into read-only archives', () => {
    const summary = getDocumentFlowSummary({
      role: 'CLIENT',
      userId: 'client-1',
      viewing: viewing('cancelled_by_client'),
      documents: [],
      requests: [],
    })

    expect(summary.readOnly).toBe(true)
    expect(summary.action.type).toBe('OPEN_ARCHIVE')
    expect(summary.action.label).toContain('programare anulată')
    expect(summary.pendingSignaturesCount).toBe(0)
  })

  it('does not offer signing after a no-show, even if a stale signer exists', () => {
    const staleDocument = {
      status: 'READY_TO_SIGN',
      signatureRequirement: 'SIMPLE',
      signers: [{ userId: 'client-1', required: true, status: 'PENDING' }],
    } as ViewingDocument

    const summary = getDocumentFlowSummary({
      role: 'CLIENT',
      userId: 'client-1',
      viewing: viewing('no_show'),
      documents: [staleDocument],
      requests: [],
    })

    expect(summary.readOnly).toBe(true)
    expect(summary.action.type).toBe('OPEN_ARCHIVE')
    expect(summary.pendingSignaturesCount).toBe(0)
  })

  it('keeps active client appointments actionable', () => {
    const summary = getDocumentFlowSummary({
      role: 'CLIENT',
      userId: 'client-1',
      viewing: viewing('confirmed'),
      documents: [],
      requests: [],
    })

    expect(summary.readOnly).toBe(false)
    expect(summary.action.type).toBe('CREATE_REQUEST')
  })

  it('prioritizes the viewing report for staff after completion', () => {
    const summary = getDocumentFlowSummary({
      role: 'AGENT',
      userId: 'agent-1',
      viewing: viewing('completed'),
      documents: [],
      requests: [],
    })

    expect(summary.readOnly).toBe(false)
    expect(summary.action.type).toBe('GENERATE_DOCUMENT')
    expect(summary.action.kind).toBe('viewing_report')
  })
})
