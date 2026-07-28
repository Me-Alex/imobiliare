# Document Signing — Improvement Plan

> **Scope:** The full document lifecycle in HQS Imobiliare — from identity collection through template rendering, signing, approval, and archival.
>
> **Current state reviewed:** `src/lib/documents/`, `src/lib/document-flow.ts`, `src/lib/viewing-documents.ts`, `src/components/documents-v2/`, `src/lib/legal-documents.ts`

---

## Table of Contents

1. [How It Works Today](#1-how-it-works-today)
2. [What's Working Well](#2-whats-working-well)
3. [Problems & Gaps](#3-problems--gaps)
4. [Proposed Improvements](#4-proposed-improvements)
5. [Implementation Roadmap](#5-implementation-roadmap)

---

## 1. How It Works Today

### The Document Lifecycle

```
IDENTITY → DRAFT → REQUESTED → IN_REVIEW → READY_TO_SIGN → SIGNED → APPROVED
                    ↓                        ↓
                 NEEDS_INFO             PARTIALLY_SIGNED
                    ↓
                 CANCELLED / REJECTED / SUPERSEDED (terminal)
```

### Two Parallel Systems (Problem)

The codebase has **two document systems running side by side:**

1. **Legacy system** (`src/lib/document-flow.ts`, `src/lib/viewing-documents.ts`)
   - Tied to the `Vizionare` (viewing appointment) model
   - Uses `ViewingDocument` types with `DocumentSigner`
   - 18+ files still depend on it
   - Marked `@deprecated` but actively used

2. **New system** (`src/lib/documents/`)
   - Transaction-anchored (not viewing-anchored)
   - Clean state machine, identity resolution, template registry
   - 6 document templates: viewing report, brokerage agreement, owner mandate, reservation offer, rental contract, handover protocol
   - Flow function (`nextAction`) computes the single next step per actor
   - Used by `documents-v2` components

### Signature Types

| Type | Current Handling |
|------|-----------------|
| `SIMPLE` | In-platform click-to-sign. Works. |
| `ADVANCED_OR_QUALIFIED` | Shows "see steps" message. **No actual integration.** |
| `QUALIFIED` | Same — just a message. No provider connected. |

### Identity Model

Identity is collected **once per participant** (client or owner) and auto-filled into all documents. Fields: full name, ID document, address, email, phone. The `composeDocumentData()` function merges identity-sourced fields with user-provided values.

### Templates

6 templates defined, each with:
- Required participants and their identity fields
- Document-specific fields grouped by category
- Signature requirement level
- Transaction stage binding
- Consumer withdrawal flag (14-day cooling-off)
- Order in the transaction flow

---

## 2. What's Working Well

- **State machine is solid.** Pure function, fully testable, actor-authorized transitions. Well-designed.
- **Identity-first approach.** Collect once, reuse everywhere. Reduces friction.
- **Flow function is clean.** `nextAction(ctx)` returns exactly one next step — no ambiguity for the UI.
- **Template system is extensible.** Adding a new document kind is straightforward (add type → create file → register).
- **Progress tracking.** The 3-step progress indicator (Data → Verification → Signing) is clear.
- **Client-flow component.** Two layouts (RENTAL vs SALE) with progressive disclosure. Good UX thinking.
- **Document workspace.** Single-page layout with hero, identity card, timeline, footer. No modals, no tabs. Clean.

---

## 3. Problems & Gaps

### 3.1 No Real E-Signature Integration

**The biggest gap.** When a document requires `ADVANCED_OR_QUALIFIED` or `QUALIFIED` signatures, the system just shows a message saying "see steps for verified signing." There's no actual provider integration.

This means:
- Staff must manually handle qualified signatures outside the platform
- No signature verification trail
- No automated certificate attachment
- Documents that legally require qualified signatures (like Romanian real estate contracts) can't be completed in-platform

**What's needed:** Integration with an eIDAS-compliant e-signature provider that operates in Romania.

### 3.2 Legacy System Not Migrated

18+ files still depend on the deprecated `document-flow.ts` and `viewing-documents.ts`. This creates:
- Two codepaths for the same business logic
- Confusion about which system to use
- Risk of the two systems diverging
- Technical debt that slows down new features

### 3.3 PDF Generation is Basic

The current PDF generation (`viewing-documents.ts`) uses `pdf-lib` to draw text directly on pages. This works for simple documents but:
- No template-based rendering (hard-coded layout)
- No support for complex layouts (tables, multi-column)
- No digital signature embedding
- No PDF/A compliance (required for long-term archival in Romania)
- Generated PDFs don't include the signature certificate

### 3.4 Cooling-Off Period Not Automated

The `consumerWithdrawalRequired` flag exists on templates but there's no automated tracking of:
- When the 14-day period starts
- Whether it has expired
- Whether the consumer has exercised their right of withdrawal
- Automatic status changes when the period expires

### 3.5 No Document Versioning UI

The `Document` type has `version` and `supersedesId` fields, but there's no UI to:
- View previous versions of a document
- Compare versions side-by-side
- See what changed between versions
- Restore a previous version

### 3.6 No Bulk Operations

Staff can't:
- Generate multiple documents at once (e.g., all documents for a transaction stage)
- Send multiple documents for signature in a batch
- Approve multiple documents at once

### 3.7 No Document Expiration

Documents don't have:
- Expiration dates (e.g., a reservation offer valid for 48 hours)
- Automatic status changes when expired
- Reminder notifications before expiration

### 3.8 Signature Audit Trail is Thin

`DocumentEvent` tracks `SIGNATURE_ADDED` and `SIGNATURE_DECLINED` but doesn't capture:
- IP address of the signer
- Device/browser fingerprint
- Timestamp precision (seconds matter for legal documents)
- Signature image/certificate data
- Consent proof (checkbox + timestamp)

### 3.9 No Offline / Low-Connectivity Signing

The current flow requires an active connection. For field use (viewings, on-site signings):
- No offline draft capability
- No deferred sync
- No QR-code-based signing flow for mobile

### 3.10 Supabase Storage Integration is Incomplete

Documents reference a `DocumentFile` with `bucket` and `path`, but:
- No signed URL generation for secure document access
- No versioned storage (overwrites on re-generation)
- No virus scanning on upload
- No file size limits enforced at the storage layer

---

## 4. Proposed Improvements

### 4.1 E-Signature Provider Integration

**Recommendation: Integrate with a Romanian eIDAS-compliant provider.**

Options:

| Provider | Type | Romania Support | API | Cost |
|----------|------|----------------|-----|------|
| **CertSign** | Qualified | ✅ Local | REST | Per-signature |
| **Trans Sped** | Qualified | ✅ Local | REST | Per-signature |
| **DocuSign** | Advanced + Qualified | ✅ EU | REST + SDK | Per-envelope |
| **Yousign** | Advanced | ✅ EU | REST | Per-signature |
| **Autenti** | Advanced + Qualified | ✅ EU | REST | Per-signature |

**Recommended approach:**

1. **Abstract the provider behind an interface:**

```typescript
interface ESignatureProvider {
  createEnvelope(doc: Document, signers: Signer[]): Promise<Envelope>
  getEnvelopeStatus(envelopeId: string): Promise<EnvelopeStatus>
  getSignatureProof(signatureId: string): Promise<SignatureProof>
  cancelEnvelope(envelopeId: string): Promise<void>
}
```

2. **Implement for the chosen provider** (CertSign or Trans Sped for Romanian qualified signatures)

3. **Update the state machine** to handle the async nature of external signing:
   - `READY_TO_SIGN` → `SIGNING_IN_PROGRESS` (new status) → `SIGNED` / `SIGNATURE_EXPIRED`
   - Webhook receiver for provider callbacks

4. **Store signature certificates** in Supabase Storage alongside the signed PDF

### 4.2 Complete the Legacy Migration

**Phase 1: Map dependencies**
- List all 18+ files importing from `document-flow.ts` and `viewing-documents.ts`
- Categorize: can migrate now / blocked / can delete

**Phase 2: Bridge layer**
- Create adapter functions that translate legacy types to new types
- Migrate consumers one by one, starting with the least critical

**Phase 3: Cut over**
- Remove legacy types and functions
- Update Supabase schema to match new model
- Clean up deprecated imports

**Estimated effort:** 2-3 weeks for a developer familiar with the codebase.

### 4.3 Upgrade PDF Generation

**Replace the current `pdf-lib` drawing code with a template engine:**

Option A: **React-PDF** (render React components to PDF)
- Pros: Reuse existing component logic, familiar DX
- Cons: Bundle size, limited layout control for complex documents

Option B: **Puppeteer/Playwright** (render HTML to PDF)
- Pros: Full CSS support, easy to iterate on design
- Cons: Requires headless browser (not available in Cloudflare Workers — use a separate service)

Option C: **WeasyPrint** or **wkhtmltopdf** (server-side HTML-to-PDF)
- Pros: Excellent CSS support, PDF/A output
- Cons: Requires a server component (not edge-compatible)

**Recommended:** Option B with a dedicated PDF microservice:
- Run Playwright in a small container (Fly.io, Railway, or Cloudflare Container)
- Templates as HTML + CSS (reuse the `documents-v2` component styles)
- Output PDF/A-compliant documents
- Embed signature certificates in the PDF
- Store generated PDFs in Supabase Storage with versioning

### 4.4 Automate Cooling-Off Period

```typescript
interface CoolingOffTracker {
  documentId: string
  startedAt: string        // when the document was signed
  expiresAt: string        // startedAt + 14 days
  exercised: boolean       // did the consumer withdraw?
  exercisedAt: string | null
}
```

**Implementation:**
- Add a `coolingOff` field to `Document` when `template.consumerWithdrawalRequired` is true
- Daily cron job checks for expired cooling-off periods
- When expired: auto-transition document to `APPROVED` (if currently `SIGNED`)
- Notification to consumer 48h before expiry: "Your withdrawal period ends in 2 days"
- UI: show countdown on the document card

### 4.5 Document Versioning UI

- Add a "Version History" panel to the document workspace
- Show version number, date, author, and diff summary for each version
- Click to view any previous version
- Side-by-side diff for text changes
- "Restore this version" action (creates a new version, doesn't overwrite)

### 4.6 Document Expiration

Add to `Document` type:
```typescript
expiresAt: string | null
expirationAction: 'CANCEL' | 'SUPERSEDE' | 'NOTIFY_ONLY' | null
```

- Templates define default expiration (e.g., reservation offer: 48h, brokerage agreement: 30d)
- Cron job checks hourly for expired documents
- Actions: auto-cancel, auto-supersede, or notify-only
- Reminder notifications at 24h, 4h, and 1h before expiry

### 4.7 Enhanced Signature Audit Trail

Extend `DocumentEvent` metadata for signature events:
```typescript
{
  ip: string
  userAgent: string
  geoLocation?: { lat: number, lng: number }
  consentTimestamp: string
  consentText: string
  signatureCertificate?: string  // base64 X.509 cert
  timestampToken?: string        // RFC 3161 timestamp
}
```

This is legally important for Romanian real estate transactions where proof of consent and signing conditions may be challenged.

### 4.8 Bulk Operations for Staff

Add to the staff flow:
- **Batch generate:** Select multiple documents → generate all PDFs at once
- **Batch send for signature:** Select multiple documents → create envelope with all signers
- **Batch approve:** Select multiple signed documents → approve all
- **Transaction templates:** "Apply standard document set" → generates all documents for a transaction stage

### 4.9 QR-Code Signing Flow

For field use (viewings, on-site):
1. Staff generates document on their device
2. QR code displayed on screen
3. Client scans QR on their phone
4. Opens the document in the mobile browser
5. Client reviews and signs on their device
6. Signature syncs back to the staff's view in real-time (Supabase Realtime)

This eliminates the "pass the tablet" awkwardness and works even with low connectivity (QR contains a short-lived token, document loads from CDN).

### 4.10 Supabase Storage Hardening

- **Signed URLs:** Generate time-limited signed URLs for document access (no public bucket)
- **Versioning:** Store each generated PDF as a separate version (don't overwrite)
- **Virus scanning:** Integrate ClamAV or similar for uploaded files
- **Size limits:** Enforce max file size at the storage layer (not just client-side)
- **Retention policy:** Auto-archive documents older than X years to cold storage

---

## 5. Implementation Roadmap

### Phase 1 — Foundation (Weeks 1-3)

| Task | Effort | Impact |
|------|--------|--------|
| Complete legacy migration (cut over to new system) | 2-3 weeks | High — unblocks everything else |
| Enhanced signature audit trail | 3 days | High — legal compliance |
| Document expiration system | 3 days | Medium — prevents stale documents |
| Supabase Storage hardening | 2 days | Medium — security |

### Phase 2 — E-Signatures (Weeks 4-6)

| Task | Effort | Impact |
|------|--------|--------|
| Choose and integrate e-signature provider | 1 week | Critical — enables qualified signatures |
| Add `SIGNING_IN_PROGRESS` state + webhooks | 3 days | Critical |
| Signature certificate storage | 2 days | High |
| QR-code signing flow | 1 week | Medium — field use improvement |

### Phase 3 — PDF & UX (Weeks 7-9)

| Task | Effort | Impact |
|------|--------|--------|
| PDF template engine (Playwright microservice) | 1 week | High |
| PDF/A compliance + cert embedding | 3 days | High — legal archival |
| Document versioning UI | 1 week | Medium |
| Cooling-off period automation | 3 days | Medium |

### Phase 4 — Scale (Weeks 10-12)

| Task | Effort | Impact |
|------|--------|--------|
| Bulk operations for staff | 1 week | Medium — efficiency |
| Transaction templates (one-click document sets) | 3 days | Medium |
| Offline signing capability | 1-2 weeks | Low — nice to have |
| Multi-language document generation | 1 week | Low — future expansion |

---

## Appendix: E-Signature Provider Comparison for Romania

### Legal Context

Under **EU Regulation 910/2014 (eIDAS):**
- **Simple electronic signature** — legally valid but easy to challenge
- **Advanced electronic signature (AdES)** — uniquely linked to signer, detectable if changed
- **Qualified electronic signature (QES)** — equivalent to handwritten signature, created with a qualified device

For Romanian real estate:
- **Brokerage agreements** — AdES is sufficient
- **Sale-purchase contracts** — QES is recommended (sometimes required by notaries)
- **Rental contracts** — AdES is sufficient
- **Owner mandates** — AdES is sufficient

### Recommendation

**Start with Yousign or Autenti** for Advanced signatures (covers 80% of use cases). Add **CertSign or Trans Sped** for Qualified signatures when needed for sale contracts.

The abstraction layer means you can swap providers without changing application code.

---

## Appendix: Key Files Reference

| File | Role |
|------|------|
| `src/lib/documents/types.ts` | Type definitions (Document, Signature, Actor, Template) |
| `src/lib/documents/state-machine.ts` | Transition logic (pure, testable) |
| `src/lib/documents/flow.ts` | `nextAction(ctx)` — computes single next step |
| `src/lib/documents/identity.ts` | Identity validation + field auto-fill |
| `src/lib/documents/templates/*.ts` | 6 document templates |
| `src/lib/documents/bucketing.ts` | Groups documents into 5 visual buckets |
| `src/components/documents-v2/client-flow.tsx` | Client-facing document workspace |
| `src/components/documents-v2/document-workspace.tsx` | Staff-facing document workspace |
| `src/lib/document-flow.ts` | ⚠️ DEPRECATED — legacy flow logic |
| `src/lib/viewing-documents.ts` | ⚠️ DEPRECATED — legacy PDF generation + types |
