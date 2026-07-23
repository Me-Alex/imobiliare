# Documents module

The clean rebuild of the document / vizionare / contract flow.

## Why this exists

The old system had two overlapping state machines — `ViewingDocument` (file +
signers + events) and `LegalDocumentRequest` (data-collection workflow) — glued
together with role-specific action reducers. A 1,092-line `viewing-documents.ts`
was doing vizionare CRUD, document CRUD, PDF rendering, agency profile, and
template fetching. Templates and field lists were inline in `legal-documents.ts`.

This module is the replacement. It is **additive** — old code still exists and
still works. Migration is incremental (see "Migration plan" below).

## Architecture

```
documents/
├── types.ts              # ONE source of truth for the data model
├── state-machine.ts      # ONE source of truth for status transitions
├── identity.ts           # ONE source of truth for identity resolution
├── flow.ts               # ONE function: nextAction(actor, ctx) → FlowAction
├── fields/
│   ├── agency.ts         # AGENCY_FIELDS, PRIVACY_FIELDS
│   ├── client.ts         # CLIENT_IDENTITY_FIELDS
│   ├── owner.ts          # OWNER_IDENTITY_FIELDS
│   ├── property.ts       # PROPERTY_FIELDS, PROPERTY_LEGAL_FIELDS
│   └── index.ts          # composeDocumentFields(...)
├── templates/
│   ├── viewing-report.ts
│   ├── brokerage-agreement.ts
│   ├── owner-mandate.ts
│   ├── reservation-offer.ts
│   ├── rental-contract.ts
│   ├── handover-protocol.ts
│   └── index.ts          # TEMPLATES registry
├── index.ts              # public re-exports
└── README.md             # this file
```

## The three rules

1. **Identity is filled once, referenced everywhere.** No more
   `LEGAL_REQUEST_FIELD_KEYS` map. The form auto-fills from the participant's
   stored identity; the template only declares which keys it consumes.

2. **Status transitions are explicit.** `transition(from, to, actor)` returns
   a typed result. No nested ifs. Every state change goes through this function.

3. **The flow function is pure.** `nextAction(actor, transaction, documents, signatures)`
   returns the ONE thing the user should do next. Trivially testable.

## Adding a new document kind

1. Add the kind to `DocumentKind` in `types.ts`.
2. Create `templates/my-new-doc.ts` exporting a `DocumentTemplate`.
3. Register it in `templates/index.ts`.

That's it. No state machine changes. No flow changes. No field-map changes.

## Adding a new field to an existing template

Edit the template file. If the field is identity-sourced, define it in
`fields/*.ts` and reference it. If it's a one-off, put it in the template's
`fields` array.

## Adding a new field group / identity type

Add a new file in `fields/`, register the picker in `fields/index.ts`. Templates
opt in by setting the include flags in `composeDocumentFields`.

## Migration plan

The new module is **parallel** to the old code:

| Old | New |
|---|---|
| `src/lib/viewing-documents.ts` (1,092 lines) | `src/lib/documents/{state-machine,identity,flow}.ts` + future `transactions.ts` / `documents.ts` / `pdf.ts` |
| `src/lib/legal-documents.ts` (372 lines) | `src/lib/documents/templates/*.ts` (one per kind) + `src/lib/documents/fields/*.ts` |
| `src/lib/document-flow.ts` (275 lines) | `src/lib/documents/flow.ts` (single function) |
| `src/lib/legal-document-requests.ts` (138 lines) | covered by `state-machine.ts` + future `documents.ts` API |
| `src/components/features/documents/*` (11 files) | unchanged for now; will be migrated to consume the new types |

### Phases

1. **Foundation** (this module) — done. Pure code, no DB changes, no UI changes.
2. **Tests** — add Vitest, cover `state-machine.ts`, `flow.ts`, `identity.ts`.
3. **API layer** — new `src/app/api/documents/*` route family with zod validation,
   audit log, edge-safe rate limit. The old API routes keep working.
4. **DB migration** — add `Transaction` / `Document` / `DocumentSignature` /
   `DocumentEvent` tables to Supabase + D1. Backfill from existing
   `vizionari` / `viewing_documents` / `legal_document_requests`.
5. **Component migration** — `documente-page.tsx` and friends consume the new
   types. Feature flag per route so we can switch in production.
6. **Cleanup** — remove old code once new code is in production for ≥1 week.

## What is NOT in this module

- **PDF rendering.** Will be in a separate `pdf.ts` once the data model lands.
- **Storage.** Documents still go to Supabase storage / D1 R2 (the
  `client-documents` and `virtual-tour-*` buckets in the old code).
- **Email notifications.** The new flow calls into the existing
  `notifications.ts` once a transition happens.
- **Supabase / D1 queries.** Pending the data model.

## Test surface (when Vitest lands)

Easy wins:
- `state-machine.test.ts` — every legal transition passes, every illegal one
  fails with the right error code
- `flow.test.ts` — same input always returns the same action
- `identity.test.ts` — isClientComplete, isOwnerComplete, resolveFieldValue
- `templates.test.ts` — every template has a stage, signature, and participants

No mocking, no DB, no React. Pure functions.
