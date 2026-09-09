import { describe, expect, it } from 'vitest'
import { assertDraftContextCurrent } from './draft-context'
const definition = { kind: 'test', fields: [{ key: 'agency_name', label: 'Agency', readOnly: true }] }
const snapshot = { template: { id: 'template', version: 2, body: 'Reviewed text', legalReviewStatus: 'APPROVED' }, agencyReady: true, values: { agency_name: 'Agency A', client_name: 'Client A', document_reference: 'REFERENCE-A' } }
describe('reviewed draft freshness', () => {
  it('accepts unchanged sources with a new provisional generated reference', () => {
    expect(() => assertDraftContextCurrent(definition, snapshot, { ...snapshot, values: { ...snapshot.values, document_reference: 'NEW-REFERENCE' } })).not.toThrow()
  })
  it('rejects changed template body, identity and trusted agency values', () => {
    const changed = [{ ...snapshot, template: { ...snapshot.template, body: 'Unreviewed text' } }, { ...snapshot, values: { ...snapshot.values, client_name: 'Different client' } }, { ...snapshot, values: { ...snapshot.values, agency_name: 'Agency B' } }]
    for (const current of changed) expect(() => assertDraftContextCurrent(definition, snapshot, current)).toThrow('s-au schimbat')
  })
})
