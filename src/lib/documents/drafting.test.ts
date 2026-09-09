import { describe, expect, it } from 'vitest'
import { getDraftIssues, mergeDraftSubmissions, prepareDraftValues, renderDraftText } from './drafting'
const definition = { kind: 'test', fields: [{ key: 'agency_name', label: 'Agency', required: true, readOnly: true }, { key: 'client_name', label: 'Client', required: true }, { key: 'client_email', label: 'Email', type: 'email' }, { key: 'transaction', label: 'Transaction', type: 'select', options: [{ value: 'cumpărare', label: 'Buy' }] }] }
const base = { agency_name: 'Verified agency', client_name: '', document_reference: 'REF-1' }
describe('document drafting integrity', () => {
  it('preserves trusted identity and system references while retaining edited Unicode text', () => {
    const values = prepareDraftValues(definition, base, { agency_name: 'Override', document_reference: 'Override', client_name: ' Ștefan Țîrlea ', unknown: 'extra' })
    expect(values).toMatchObject({ agency_name: 'Verified agency', document_reference: 'REF-1', client_name: 'Ștefan Țîrlea' })
    expect(values).not.toHaveProperty('unknown')
    expect(renderDraftText('Client: {{client_name}}; {{document_reference}}', values)).toBe('Client: Ștefan Țîrlea; REF-1')
  })
  it('rejects missing required, malformed email, invalid selects and undeclared template tokens', () => {
    expect(getDraftIssues(definition, { requiredFields: [], body: '{{unavailable}}' }, { ...base, client_email: 'invalid', transaction: 'SALE' }).map(issue => issue.key)).toEqual(['client_name', 'client_email', 'transaction', 'unavailable'])
  })
  it('does not prefill from other dossiers, kinds or superseded/cancelled submissions', () => {
    const request = { id: '1', appointmentId: 'dossier', requesterId: 'client', documentKind: 'test', status: 'REQUESTED', submittedData: { client_name: 'Old', agency_name: 'Bad' }, createdAt: '2026-01-01', updatedAt: '2026-01-01' }
    const merged = mergeDraftSubmissions(definition, 'dossier', [request, { ...request, id: '2', status: 'CANCELLED', updatedAt: '2026-01-02' }, { ...request, id: '3', appointmentId: 'other' }, { ...request, id: '4', documentKind: 'other' }], base, { client: ['client_name'] })
    expect(merged.client_name).toBe('')
    expect(merged.agency_name).toBe('Verified agency')
  })
  it('rejects impossible dates, reversed terms and invalid rental due days', () => {
    const rental = { kind: 'rental_contract', fields: [{ key: 'lease_start_date', label: 'Start', type: 'date' }, { key: 'lease_end_date', label: 'End', type: 'date' }, { key: 'rent_due_day', label: 'Due', type: 'number' }] }
    expect(getDraftIssues(rental, { requiredFields: [] }, { lease_start_date: '2026-02-30', rent_due_day: '32' }).map(issue => issue.key)).toEqual(['lease_start_date', 'rent_due_day'])
    expect(getDraftIssues(rental, { requiredFields: [] }, { lease_start_date: '2026-09-09', lease_end_date: '2026-09-08' })[0].key).toBe('lease_end_date')
  })
})

it('scopes participant prefills to their allowed fields', () => {
  const fields = { kind: 'rental_contract', fields: [{ key: 'client_name', label: 'Client' }, { key: 'owner_name', label: 'Owner' }, { key: 'owner_payment_account', label: 'Account' }] }
  const request = { id: '1', appointmentId: 'dossier', requesterId: 'client', documentKind: 'rental_contract', status: 'REQUESTED', submittedData: { client_name: 'Client', owner_name: 'Override', owner_payment_account: 'Wrong bank' }, createdAt: '2026-01-01', updatedAt: '2026-01-01' }
  expect(mergeDraftSubmissions(fields, 'dossier', [request], { owner_name: 'Real owner', owner_payment_account: '' }, { client: ['client_name'] })).toMatchObject({ client_name: 'Client', owner_name: 'Real owner', owner_payment_account: '' })
  expect(mergeDraftSubmissions(fields, 'dossier', [{ ...request, requesterId: 'unknown' }], {}, { client: ['client_name'] }).client_name).toBe('')
})
it('validates agreed monetary amounts without rewriting Romanian formatting', () => {
  const fields = { kind: 'rental_contract', fields: [{ key: 'rent_amount', label: 'Rent' }, { key: 'deposit_amount', label: 'Deposit' }] }
  for (const rent_amount of ['abc', '-100', '0', '1,2,3']) expect(getDraftIssues(fields, { requiredFields: [] }, { rent_amount })).toHaveLength(1)
  for (const rent_amount of ['1250', '1.250,50', '1250.50']) expect(getDraftIssues(fields, { requiredFields: [] }, { rent_amount, deposit_amount: '0' })).toHaveLength(0)
})

it('blocks unsupported template markers before review as well as saving', () => {
  for (const body of ['{{CLIENT_NAME}}', '{{ client_name }}', '{{}}']) {
    expect(getDraftIssues(definition, { requiredFields: [], body }, { ...base, client_name: 'Client' })).toHaveLength(1)
  }
})
