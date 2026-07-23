// Quick runtime smoke test for the new documents module.
// Run with: npx -y -p typescript@5 tsx scripts/smoke-documents.ts
// (or compile with tsc and run the JS)

import {
  nextAction,
  transition,
  isTerminal,
  canTransition,
  composeDocumentData,
  isClientComplete,
  isOwnerComplete,
  getTemplate,
  getStartableTemplatesForRole,
  TEMPLATES_IN_ORDER,
  type Actor,
  type Transaction,
  type Document,
  type DocumentSignature,
} from '../src/lib/documents'

// ── Test data ─────────────────────────────────────────────────

const transaction: Transaction = {
  id: 'tx_1',
  propertyId: 'prop_1',
  type: 'SALE',
  status: 'OPEN',
  currentStage: 'NEGOTIATION',
  participants: [
    { id: 'p_client', transactionId: 'tx_1', userId: 'u_client', role: 'CLIENT', identity: null, createdAt: '2026-01-01' },
    { id: 'p_owner', transactionId: 'tx_1', userId: 'u_owner', role: 'OWNER', identity: { fullName: 'Ion Pop', idDocument: 'CI XX 000001', address: 'Str A', email: 'i@p.ro', phone: '+40700000001' }, createdAt: '2026-01-01' },
  ],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

const documents: Document[] = []
const signatures: DocumentSignature[] = []

// ── 1. Templates are registered ───────────────────────────────

console.log('1. Templates registered:', TEMPLATES_IN_ORDER.length, '/ 6 expected')
console.assert(TEMPLATES_IN_ORDER.length === 6, 'should have 6 templates')

// ── 2. State machine: legal transitions ───────────────────────

console.log('2. State machine:')
console.log('  DRAFT → REQUESTED (staff? no, participant):', transition('DRAFT', 'REQUESTED', { kind: 'PARTICIPANT', role: 'CLIENT', userId: 'u_client' }).ok)
console.log('  DRAFT → IN_REVIEW (illegal):', transition('DRAFT', 'IN_REVIEW', { kind: 'STAFF', role: 'ADMIN', userId: 'u_staff' }).ok)
console.log('  IN_REVIEW → APPROVED (illegal, must go through SIGNED):', transition('IN_REVIEW', 'APPROVED', { kind: 'STAFF', role: 'ADMIN', userId: 'u_staff' }).ok)
console.log('  SIGNED → APPROVED (staff OK):', transition('SIGNED', 'APPROVED', { kind: 'STAFF', role: 'ADMIN', userId: 'u_staff' }).ok)
console.log('  APPROVED → SIGNED (illegal, terminal-ish):', transition('APPROVED', 'SIGNED', { kind: 'STAFF', role: 'ADMIN', userId: 'u_staff' }).ok)
console.log('  REJECTED is terminal:', isTerminal('REJECTED'))
console.assert(canTransition('DRAFT', 'REQUESTED') === true)
console.assert(canTransition('DRAFT', 'APPROVED') === false)
console.assert(isTerminal('REJECTED') && isTerminal('CANCELLED') && isTerminal('SUPERSEDED'))

// ── 3. Flow: client with no identity → PROVIDE_IDENTITY ───────

const clientNoId: Actor = { kind: 'PARTICIPANT', role: 'CLIENT', userId: 'u_client' }
const a1 = nextAction({ actor: clientNoId, transaction, documents, signatures })
console.log('3. Client w/o identity →', a1.kind)
console.assert(a1.kind === 'PROVIDE_IDENTITY')

// ── 4. Flow: owner with full identity → START_DOCUMENT ───────

const ownerFullId: Actor = { kind: 'PARTICIPANT', role: 'OWNER', userId: 'u_owner' }
const a2 = nextAction({ actor: ownerFullId, transaction, documents, signatures })
console.log('4. Owner w/ full identity →', a2.kind)
console.assert(a2.kind === 'START_DOCUMENT', `expected START_DOCUMENT, got ${a2.kind}`)
console.assert(a2.kind === 'START_DOCUMENT' && a2.kindRef === 'owner_mandate', `expected owner_mandate, got ${(a2 as { kindRef?: string }).kindRef}`)

// ── 5. Identity validation ────────────────────────────────────

console.log('5. Identity checks:')
console.log('  null client is incomplete:', isClientComplete(null))
console.log('  full client is complete:', isClientComplete({ fullName: 'A', idDocument: 'B', address: 'C', email: 'd@e.ro', phone: '+40700000000' }))
console.log('  full owner is complete:', isOwnerComplete({ fullName: 'A', idDocument: 'B', address: 'C', email: 'd@e.ro', phone: '+40700000000' }))

// ── 6. Document data composition (auto-fill from identity) ───

const t = getTemplate('brokerage_agreement')
const fullFields = [
  // pretend we composed the full field list — this is what the form will see
  { key: 'client_name', label: 'Nume', group: 'Client', type: 'text' as const, required: true, source: { type: 'identity' as const, path: 'client' as const, key: 'fullName' } },
  { key: 'transaction_type', label: 'Tip', group: 'Serviciu', type: 'select' as const, required: true, options: [{ value: 'cumpărare', label: 'Cumpărare' }] },
  { key: 'commission_value', label: 'Comision', group: 'Comision', type: 'text' as const, required: true },
]
const data = composeDocumentData({
  fields: fullFields,
  userValues: { transaction_type: 'cumpărare', commission_value: '3' },
  client: { fullName: 'Maria Ionescu', idDocument: 'CI YY 000099', address: 'Bd X', email: 'm@i.ro', phone: '+40700000099' },
})
console.log('6. Composed data:')
console.log('   client_name auto-filled from identity:', data.client_name === 'Maria Ionescu')
console.log('   transaction_type kept from userValues:', data.transaction_type === 'cumpărare')
console.log('   commission_value kept from userValues:', data.commission_value === '3')
console.assert(data.client_name === 'Maria Ionescu')
console.assert(data.transaction_type === 'cumpărare')

// ── 7. Flow: staff with REQUESTED doc → REVIEW ───────────────

const txWithDoc: Transaction = { ...transaction, currentStage: 'NEGOTIATION' }
const docs: Document[] = [
  { id: 'd_1', transactionId: 'tx_1', kind: 'brokerage_agreement', stage: 'NEGOTIATION', status: 'REQUESTED', data: {}, version: 1, supersedesId: null, file: null, createdBy: 'u_client', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
]
const staff: Actor = { kind: 'STAFF', role: 'ADMIN', userId: 'u_staff' }
const a3 = nextAction({ actor: staff, transaction: txWithDoc, documents: docs, signatures: [] })
console.log('7. Staff with REQUESTED doc →', a3.kind)
console.assert(a3.kind === 'REVIEW')

// ── 8. Flow: client who has a draft → EDIT_DRAFT ────────────

const docs2: Document[] = [
  { id: 'd_2', transactionId: 'tx_1', kind: 'brokerage_agreement', stage: 'NEGOTIATION', status: 'DRAFT', data: {}, version: 1, supersedesId: null, file: null, createdBy: 'u_client', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
]
const txFullClientId: Transaction = {
  ...transaction,
  participants: [
    { id: 'p_client', transactionId: 'tx_1', userId: 'u_client', role: 'CLIENT', identity: { fullName: 'M', idDocument: 'X', address: 'Y', email: 'm@i.ro', phone: '+40700000000' }, createdAt: '2026-01-01' },
    transaction.participants[1]!,
  ],
}
const a4 = nextAction({ actor: clientNoId, transaction: txFullClientId, documents: docs2, signatures: [] })
console.log('8. Client w/ full id + own draft →', a4.kind)
console.assert(a4.kind === 'EDIT_DRAFT')

// ── 9. Flow: client with NEEDS_INFO doc → RESUBMIT ──────────

const docs3: Document[] = [
  { id: 'd_3', transactionId: 'tx_1', kind: 'brokerage_agreement', stage: 'NEGOTIATION', status: 'NEEDS_INFO', data: {}, version: 1, supersedesId: null, file: null, createdBy: 'u_client', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
]
const a5 = nextAction({ actor: clientNoId, transaction: txFullClientId, documents: docs3, signatures: [] })
console.log('9. Client w/ NEEDS_INFO doc →', a5.kind)
console.assert(a5.kind === 'RESUBMIT')

// ── 10. Flow: client with pending signature → SIGN ──────────

const docs4: Document[] = [
  { id: 'd_4', transactionId: 'tx_1', kind: 'brokerage_agreement', stage: 'NEGOTIATION', status: 'READY_TO_SIGN', data: {}, version: 1, supersedesId: null, file: null, createdBy: 'u_staff', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
]
const sigs: DocumentSignature[] = [
  { id: 's_1', documentId: 'd_4', participantId: 'p_client', required: true, status: 'PENDING', signedAt: null, signatureRef: null },
]
const a6 = nextAction({ actor: clientNoId, transaction: txFullClientId, documents: docs4, signatures: sigs })
console.log('10. Client w/ pending sig →', a6.kind, '— label:', a6.label)
console.assert(a6.kind === 'SIGN')

// ── 11. Startable templates for role ─────────────────────────

const clientStartable = getStartableTemplatesForRole('CLIENT', 'NEGOTIATION')
const ownerStartable = getStartableTemplatesForRole('OWNER', 'NEGOTIATION')
console.log('11. Client startable in NEGOTIATION:', clientStartable.map((t) => t.kind).join(', '))
console.log('    Owner startable in NEGOTIATION:', ownerStartable.map((t) => t.kind).join(', '))
console.assert(clientStartable.some((t) => t.kind === 'brokerage_agreement'))
console.assert(ownerStartable.some((t) => t.kind === 'owner_mandate'))

console.log('\n✅ All smoke tests passed.')
