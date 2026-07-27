# VIZIONARE & DOCUMENTS SYSTEM - COMPLETE REFACTOR SPECIFICATION

**Project:** HQS Imobiliare - Viewing Scheduling & Document Signing System  
**Current State:** Fragmented, deprecated code paths, JSON hacks in notes fields  
**Target State:** Clean, unified, intuitive UX for clients and agents  
**Date:** 2026-07-25

---

## 1. EXECUTIVE SUMMARY

### Current Problems
1. **Fragmented Codebase** - 15+ files across 4 directories handling viewing/document logic
2. **Deprecated Dependencies** - `viewing-documents.ts` marked `@deprecated` but still 1101 lines
3. **Data Hacks** - ClientFlow submissions JSON-serialized into `notes` field
4. **Unclear User Journey** - Client doesn't know what documents to sign or when
5. **Duplicate Components** - `documents-v2` and `features/documents` both exist
6. **Complex State Machine** - Viewing states, document states, signing states all separate

### Proposed Solution
A unified **"Appointment Workspace"** that guides clients through:
1. **Schedule** → 2. **Prepare Documents** → 3. **Sign** → 4. **Complete**

---

## 2. USER JOURNEY DEFINITION

### Client Flow (Home Buyer/Tenant)
```
┌─────────────────────────────────────────────────────────────────┐
│  APPOINTMENT WORKSPACE (Single Page Application)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: SCHEDULE VIEWING                                       │
│  ├─ Select property (pre-filled if coming from listing)        │
│  ├─ Pick date/time from agent's availability                    │
│  ├─ Add personal notes (optional)                               │
│  └─ Confirm → moves to Step 2                                   │
│                                                                 │
│  Step 2: PREPARE DOCUMENTS                                       │
│  ├─ See REQUIRED documents checklist                            │
│  │   ├─ ID Card/Passport (upload)                              │
│  │   ├─ Proof of Address (utility bill)                        │
│  │   └─ Financial Pre-Approval (if buying)                     │
│  ├─ Fill in personal information form (pre-filled from profile) │
│  ├─ Review & accept terms (one-time per type)                  │
│  └─ Continue when all required docs uploaded                    │
│                                                                 │
│  Step 3: SIGN DOCUMENTS                                         │
│  ├─ View each document (PDF preview)                           │
│  ├─ Type signature (full legal name)                           │
│  ├─ Confirm "I have read and agree" checkbox                   │
│  └─ Digital signature recorded with timestamp                    │
│                                                                 │
│  Step 4: CONFIRMATION                                           │
│  ├─ Summary of appointment                                     │
│  ├─ Calendar invite (.ics) download                             │
│  └─ Agent contact details                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Flow (HQS Staff)
```
┌─────────────────────────────────────────────────────────────────┐
│  AGENT DASHBOARD                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MY SCHEDULE                                                    │
│  ├─ Today's appointments (timeline view)                        │
│  ├─ Check-in client (one tap)                                   │
│  ├─ View uploaded documents (before meeting)                    │
│  └─ Generate viewing report (after meeting)                     │
│                                                                 │
│  DOCUMENT MANAGEMENT                                             │
│  ├─ Templates library (GDPR notice, contracts, reports)         │
│  ├─ Client documents queue                                      │
│  ├─ Sign as agent                                               │
│  └─ Send to notary/lawyer                                       │
│                                                                 │
│  NOTIFICATIONS                                                  │
│  ├─ New booking → needs confirmation                            │
│  ├─ Document uploaded → review required                         │
│  └─ Document signed → archive & notify                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. DOCUMENT TYPES & REQUIREMENTS MATRIX

### By Transaction Type

#### RENTAL (Închiriere)
| Document | When Required | Who Signs | Required? |
|----------|--------------|-----------|-----------|
| Privacy Notice (GDPR) | Booking confirmation | Client | ✅ Mandatory |
| Viewing Terms | Before viewing | Client | ✅ Mandatory |
| Personal Information Form | Pre-meeting | Client | ✅ Mandatory |
| ID Copy | Pre-meeting | Client | ✅ Mandatory |
| Viewing Report | After viewing | Agent | Conditional |
| Rental Application | If interested | Client | Optional |
| Reservation Agreement | If reserving | Both | Optional |
| Rental Contract | If proceeding | Both | Optional |

#### SALE (Vanzare)
| Document | When Required | Who Signs | Required? |
|----------|--------------|-----------|-----------|
| Privacy Notice (GDPR) | Booking confirmation | Client | ✅ Mandatory |
| Viewing Terms | Before viewing | Client | ✅ Mandatory |
| Personal Information Form | Pre-meeting | Client | ✅ Mandatory |
| ID Copy | Pre-meeting | Client | ✅ Mandatory |
| Financial Pre-Approval | Pre-meeting | Client | ✅ Mandatory |
| Viewing Report | After viewing | Agent | Conditional |
| Offer Form | If making offer | Client | Optional |
| Reservation Agreement | If reserving | Both | Optional |
| Brokerage Agreement | If proceeding | Both | Optional |

---

## 4. DATA MODEL SPECIFICATION

### Core Entities

```typescript
// ============================================
// APPOINTMENT (Vizionare) - Clean & Simple
// ============================================
interface Appointment {
  id: string
  
  // Who
  clientId: string
  clientName: string
  clientEmail: string
  clientPhone: string
  
  // What Property
  propertyId: string
  propertyTitle: string
  
  // Who With (Agent)
  agentId: string
  agentName: string
  
  // When
  scheduledAt: DateTime    // Start
  scheduledEnd: DateTime  // End
  
  // Status: SCHEDULED → CONFIRMED → IN_PROGRESS → COMPLETED → CANCELLED
  status: AppointmentStatus
  
  // Terms acceptance
  termsAcceptedAt: DateTime?
  privacyAcceptedAt: DateTime?
  privacyNoticeVersion: string
  
  // Workflow progress
  documentsChecklist: DocumentChecklist
  currentStep: 'schedule' | 'prepare' | 'sign' | 'confirm'
  
  // Timestamps
  createdAt: DateTime
  updatedAt: DateTime
  confirmedAt: DateTime?
  checkedInAt: DateTime?
  completedAt: DateTime?
}

type AppointmentStatus = 
  | 'SCHEDULED'      // Initial, awaiting agent confirmation
  | 'CONFIRMED'      // Agent confirmed, awaiting client check-in
  | 'IN_PROGRESS'    // Client checked in, viewing happening
  | 'COMPLETED'      // Viewing finished, documents can be generated
  | 'CANCELLED'      // Cancelled by either party
  | 'NO_SHOW'        // Client didn't show up

// ============================================
// DOCUMENT CHECKLIST (What client needs to prepare)
// ============================================
interface DocumentChecklist {
  appointmentId: string
  
  // Required by transaction type
  requiredDocuments: RequiredDocument[]
  
  // Client uploads
  uploadedDocuments: UploadedDocument[]
  
  // Signatures
  signatures: Signature[]
  
  // Computed
  isComplete: boolean        // All required docs uploaded
  allSigned: boolean         // All required docs signed
  readyForViewing: boolean   // Can proceed to appointment
}

interface RequiredDocument {
  id: string
  type: DocumentType
  label: string              // "Carte de identitate"
  description: string        // "Scan sau poză clară, ambele fețe"
  required: boolean
  signatureRequired: boolean
  order: number              // Display order
}

type DocumentType = 
  | 'ID_CARD'               // CI/Pașaport
  | 'PROOF_OF_ADDRESS'      // Utilități
  | 'FINANCIAL_PREAPPROVAL' // Accept bancar
  | 'INCOME_PROOF'          // Adeverință venit
  | 'EMPLOYMENT_CONTRACT'   // Contract de muncă
  | 'VIEWING_TERMS'         // Termeni vizionare
  | 'PRIVACY_NOTICE'        // GDPR
  | 'RENTAL_APPLICATION'     // Cerere închiriere
  | 'OFFER_FORM'            // Formular ofertă
  | 'RESERVATION_AGREEMENT' // Contract rezervare
  | 'BROKERAGE_AGREEMENT'   // Contract de intermediere
  | 'VIEWING_REPORT'        // Fișă vizionare
  | 'IDENTITY_DECLARATION'  // Declarație identitate

// ============================================
// UPLOADED DOCUMENT
// ============================================
interface UploadedDocument {
  id: string
  appointmentId: string
  documentType: DocumentType
  
  // File info
  fileName: string
  fileSize: number
  mimeType: string
  storageUrl: string
  
  // Metadata
  uploadedBy: string
  uploadedAt: DateTime
  
  // Verification
  verifiedAt: DateTime?
  verifiedBy: string?
  rejectionReason: string?
  
  // Status
  status: 'PENDING' | 'VERIFIED' | 'REJECTED'
}

// ============================================
// DIGITAL SIGNATURE
// ============================================
interface Signature {
  id: string
  documentId: string        // Links to specific document
  appointmentId: string
  
  signerId: string
  signerName: string
  signerRole: 'CLIENT' | 'AGENT' | 'OWNER'
  
  // Signature method
  method: 'TYPED' | 'DRAWN' | 'DIGITAL_CERT'
  
  // The typed signature (for TYPED method)
  signatureText: string     // "Popescu Ion"
  
  // Consent
  consentText: string       // "Confirm că am citit..."
  consentAcceptedAt: DateTime
  
  // Timestamp
  signedAt: DateTime
  
  // IP/User Agent for audit
  ipAddress: string
  userAgent: string
}

// ============================================
// DOCUMENT TEMPLATE (Legal Templates)
// ============================================
interface DocumentTemplate {
  id: string
  name: string              // "Notă de informare GDPR"
  shortCode: string         // "GDPR"
  
  // Applies to
  transactionTypes: ('RENTAL' | 'SALE')[]
  
  // When in workflow
  whenRequired: 'PRE_BOOKING' | 'PRE_MEETING' | 'POST_MEETING' | 'ON_DEMAND'
  order: number
  
  // Content
  bodyTemplate: string      // Markdown with {{variables}}
  legalBasis: string[]      // ["GDPR Art. 6(1)(b)", ...]
  
  // Requirements
  requiresSignature: boolean
  signatureType: 'CLIENT' | 'AGENT' | 'BOTH' | 'NONE'
  requiresUpload: boolean   // Some docs need upload (ID), not generated
  
  // Metadata
  version: number
  legalVersion: string      // For compliance tracking
  approvedBy: string
  approvedAt: DateTime
  
  // Status
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
}
```

---

## 5. API ENDPOINTS SPECIFICATION

### Appointments

```typescript
// POST /api/appointments
// Create newappointment booking
Request: {
  propertyId: string
  propertyTitle: string
  agentId: string
  scheduledAt: string (ISO)
  scheduledEnd: string (ISO)
  clientName: string
  clientEmail: string
  clientPhone: string
  notes?: string
  termsAccepted: boolean
  privacyAccepted: boolean
  privacyNoticeVersion: string
}
Response: {
  appointment: Appointment
  checklist: DocumentChecklist
}

// GET /api/appointments/:id
// Get appointment with checklist
Response: {
  appointment: Appointment
  checklist: DocumentChecklist
  documents: UploadedDocument[]
  signatures: Signature[]
}

// PATCH /api/appointments/:id/status
// Update appointment status
Request: {
  status: AppointmentStatus
  reason?: string  // For cancellation
}
Response: { appointment: Appointment }

// GET /api/appointments/:id/checklist
// Get document checklist for appointment
Response: {
  checklist: DocumentChecklist
  templates: DocumentTemplate[]  // All required templates
}
```

### Documents

```typescript
// POST /api/appointments/:id/documents
// Upload a document
Request: FormData {
  file: File
  documentType: DocumentType
}
Response: { document: UploadedDocument }

// DELETE /api/appointments/:id/documents/:docId
// Remove uploaded document
Response: { success: true }

// POST /api/appointments/:id/documents/:docId/verify
// Agent verifies document
Request: { verified: boolean; rejectionReason?: string }
Response: { document: UploadedDocument }

// GET /api/appointments/:id/document/:docId/pdf
// Get generated PDF for signing
Response: Binary PDF

// POST /api/appointments/:id/sign
// Sign a document
Request: {
  documentId: string
  signatureText: string
  consentAccepted: boolean
}
Response: { signature: Signature }

// GET /api/appointments/:id/summary
// Get signing summary for client
Response: {
  appointment: Appointment
  pendingSignatures: DocumentTemplate[]
  completedSignatures: Signature[]
  allSigned: boolean
}
```

### Templates

```typescript
// GET /api/templates
// List all active templates
Query: { transactionType?: 'RENTAL' | 'SALE' }
Response: { templates: DocumentTemplate[] }

// GET /api/templates/:id/preview
// Preview template with filled values
Query: { appointmentId: string }
Response: { html: string; variables: string[] }
```

---

## 6. FRONTEND COMPONENT ARCHITECTURE

### New Structure (Single Location)

```
src/
├── features/
│   └── appointment-workspace/
│       ├── components/
│       │   ├── appointment-header.tsx      # Property info, agent, status
│       │   ├── step-progress.tsx          # Visual progress indicator
│       │   │
│       │   ├── steps/
│       │   │   ├── schedule-step.tsx      # Step 1: Pick date/time
│       │   │   ├── prepare-step.tsx        # Step 2: Upload docs
│       │   │   ├── sign-step.tsx           # Step 3: Sign documents
│       │   │   └── confirm-step.tsx        # Step 4: Summary
│       │   │
│       │   ├── documents/
│       │   │   ├── document-checklist.tsx  # What client needs
│       │   │   ├── document-upload.tsx      # Upload area
│       │   │   ├── document-preview.tsx     # PDF viewer
│       │   │   ├── signature-input.tsx      # Typed signature
│       │   │   └── document-status.tsx       # Verified/Rejected pill
│       │   │
│       │   └── shared/
│       │       ├── availability-picker.tsx # Calendar + time slots
│       │       ├── agent-card.tsx           # Agent info
│       │       └── property-card.tsx        # Property summary
│       │
│       ├── hooks/
│       │   ├── use-appointment.ts          # CRUD operations
│       │   ├── use-document-upload.ts      # File handling
│       │   ├── use-signature.ts            # Signing flow
│       │   └── use-checklist.ts            # Progress tracking
│       │
│       ├── lib/
│       │   ├── appointment-api.ts          # API client
│       │   ├── document-api.ts             # Document API
│       │   └── types.ts                    # TypeScript types
│       │
│       └── pages/
│           ├── book-appointment-page.tsx   # Main booking page
│           └── my-appointments-page.tsx    # Client's appointments
│
├── components/
│   └── shared/
│       ├── pdf-viewer.tsx                 # Generic PDF viewer
│       ├── file-upload.tsx                # Reusable upload
│       └── signature.pad.tsx              # Signature canvas (optional)
```

### Deprecate & Remove

```
DELETE src/components/documents-v2/        # Old scattered documents
DELETE src/components/features/documents/  # Duplicate folder
DELETE src/lib/viewing-documents.ts        # 1101-line deprecated file
DELETE src/views/vizionarile-mele-page.tsx # Merged into new flow
```

---

## 7. UI/UX SPECIFICATIONS

### Step 1: Schedule (ScheduleStep)
```
┌─────────────────────────────────────────────────────────────┐
│  📅 Programează Vizionarea                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Proprietate: Apartament 2 cameri, Str. Victoriei 42       │
│  Agent: Maria Ionescu                                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │          AUGUST 2026                                │    │
│  │  Lu  Ma  Mi  Jo  Vi  Sa                            │    │
│  │      1   2   3   4   5   6                          │    │
│  │  [7]  [8]  [9] [10] [11] 12  13                     │    │
│  │  14  15  16  17  18  19  20                         │    │
│  │  21  22  23  24  25 [26] 27  28                     │    │
│  │  29  30  31                                         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Ore disponibile pentru 26 August:                          │
│  ┌──────────┬──────────┬──────────┐                        │
│  │ 10:00    │ 14:00    │ 16:00    │                        │
│  │ 60 min   │ 60 min   │ 60 min   │                        │
│  │ Disponibil│ Disponibil│ Ocupat   │                        │
│  └──────────┴──────────┴──────────┘                        │
│                                                             │
│  Notițe (opțional):                                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Voi veni cu soția pentru a vedea bucătăria...      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ☐ Accept Termenii și Condițiile vizionării               │
│  ☐ Accept Informarea de Confidențialitate (GDPR)          │
│                                                             │
│              [ Programează Vizionarea ]                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 2: Prepare Documents (PrepareStep)
```
┌─────────────────────────────────────────────────────────────┐
│  📋 Pregătește Documentele                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Pentru vizionare ai nevoie de:                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ✅  CI / Pașaport                                     │    │
│  │    Uploaded: CI_Popescu.pdf                          │    │
│  │    [Vezi] [Șterge]                                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ☐  Dovadă Adresă (factură utilități)                │    │
│  │    Descriere: Factură din ultimele 3 luni           │    │
│  │                                                      │    │
│  │    ┌────────────────────────────────────────────┐   │    │
│  │    │                                            │   │    │
│  │    │     📁 Trage fișierul aici sau             │   │    │
│  │    │        [Încarcă]                           │   │    │
│  │    │                                            │   │    │
│  │    │     PNG, JPG, PDF • Max 10MB               │   │    │
│  │    └────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ☐  Notă Informare GDPR                              │    │
│  │    ☐ Am citit și accept informarea                 │    │
│  │    [Citește documentul]                            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Progres: 1 din 3 documente pregătite                      │
│  ████████░░░░░░░░░░░░░░░░░ 33%                             │
│                                                             │
│          [ Semnează Documentele → ]                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 3: Sign (SignStep)
```
┌─────────────────────────────────────────────────────────────┐
│  ✍️  Semnează Documentele                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Document 1 din 2: Notă Informare GDPR                      │
││
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                     │    │
│  │  NOTĂ DE INFORMARE PRIVIND PROTECȚIA DATELOR        │    │
│  │  CU CARACTER PERSONAL                              │    │
│  │                                                     │    │
│  │  1. Operatorul de date                            │    │
│  │  HQS Imobiliare SRL, CIF: RO12345678               │    │
│  │  ...                                               │    │
│  │                                                     │    │
│  │  2. Scopul prelucrării                            │    │
│  │  Datele sunt prelucrate în scopul:                 │    │
│  │  - Programării vizităărilor imobiliare            │    │
│  │  - Comunicărilor legate de oferte                 │    │
│  │  ...                                               │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  [Vezi document complet în pagină nouă]                     │
│                                                             │
│  Nume complet pentru semnătură:                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ POPESCU ION                                          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ☐ Confirm că am citit documentul și sunt de acord         │
│    cu termenii și condițiile prezentate.                    │
│                                                             │
│                        [ Semnează → ]                       │
│                                                             │
│  ──────────────────────────────────────────────────────     │
│  Navigare: [< Prev] Document 1/2 [Next >]                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 4: Confirmation (ConfirmStep)
```
┌─────────────────────────────────────────────────────────────┐
│  ✅  Vizionare Confirmată!                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  📅  MARȚI, 26 AUGUST 2026                          │    │
│  │  🕐  10:00 - 11:00                                  │    │
│  │  📍  Str. Victoriei 42, București                    │    │
│  │                                                     │    │
│  │  Agent: Maria Ionescu                               │    │
│  │  📱  +40 721 234 567                                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Ai pregătit 3 documente și ai semnat 2.                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Documentele semnate vor fi disponibile în          │    │
│  │  contul tău pentru descărcare.                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  [📥 Adaugă în Calendar]  [📄 Vezi Contracte]  [🏠 Pagina Principală]
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. STATE MANAGEMENT

### Zustand Store Structure

```typescript
// src/features/appointment-workspace/store/appointment-store.ts

interface AppointmentWorkspaceState {
  // Current appointment
  appointment: Appointment | null
  checklist: DocumentChecklist | null
  
  // UI State
  currentStep: 'schedule' | 'prepare' | 'sign' | 'confirm'
  
  // Document state
  pendingUploads: Map<DocumentType, File>
  uploadProgress: Map<DocumentType, number>
  
  // Signature state
  currentSigningDoc: DocumentTemplate | null
  signatureDraft: string
  
  // Actions
  setAppointment: (apt: Appointment) => void
  setChecklist: (checklist: DocumentChecklist) => void
  uploadDocument: (type: DocumentType, file: File) => Promise<void>
  removeDocument: (docId: string) => Promise<void>
  signDocument: (docId: string, signature: string) => Promise<void>
  nextStep: () => void
  prevStep: () => void
  reset: () => void
}
```

---

## 9. MIGRATION PLAN

### Phase 1: New Backend (1 week)
1. Create new database migrations for clean schema
2. Implement new API endpoints
3. Write OpenAPI documentation
4. Add comprehensive error handling

### Phase 2: New Frontend (2 weeks)
1. Build AppointmentWorkspace component library
2. Implement step-by-step flow
3. Build document upload with progress
4. Add PDF viewer integration
5. Implement signature flow

### Phase 3: Testing (1 week)
1. Unit tests for API
2. Integration tests for flow
3. E2E tests with Playwright
4. Accessibility audit

### Phase 4: Migration (1 week)
1. Data migration script (move notes → proper tables)
2. Redirect old URLs to new structure
3. Deploy to staging
4. User acceptance testing

### Phase 5: Launch (1 day)
1. Deploy to production
2. Monitor error rates
3. Disable old code paths
4. Archive deprecated files

---

## 10. TECHNICAL REQUIREMENTS

### Dependencies to Add
```json
{
  "react-pdf": "^9.0.0",        // PDF viewing
  "react-dropzone": "^16.0.0",  // File uploads
  "@react-pdf/renderer": "^4.0.0", // Server-side PDF generation
  "date-fns": "^4.0.0",         // Date handling (already there)
  "sonner": "^2.0.0"            // Toasts (already there)
}
```

### Environment Variables
```bash
# New
STORAGE_BUCKET_APPOINTMENTS=appointments
MAX_UPLOAD_SIZE_MB=10
ALLOWED_FILE_TYPES=image/png,image/jpeg,application/pdf
SIGNATURE_REQUIRED_DOCUMENTS=PRIVACY_NOTICE,VIEWING_TERMS,VIEWING_REPORT
```

### Security Requirements
1. Rate limit document uploads (10/min/IP)
2. Validate file types server-side (magic bytes, not just extension)
3. Scan uploads for malware (ClamAV or similar)
4. Store signatures with IP/UserAgent for audit
5. GDPR-compliant document retention policies

---

## 11. SUCCESS METRICS

| Metric | Target | Measurement |
|--------|--------|-------------|
| Booking completion rate | >85% | Bookings started vs completed |
| Document upload success | >95% | Uploads without errors |
| Time to complete booking | <5 min | Average session duration |
| Agent confirmation time | <1 hour | Auto-confirm or prompt |
| Client satisfaction | >4.5/5 | Post-viewing survey |

---

## 12. FILES TO CREATE / MODIFY

### New Files
```
src/features/appointment-workspace/
├── components/
│   ├── appointment-header.tsx
│   ├── step-progress.tsx
│   ├── steps/
│   │   ├── schedule-step.tsx
│   │   ├── prepare-step.tsx
│   │   ├── sign-step.tsx
│   │   └── confirm-step.tsx
│   ├── documents/
│   │   ├── document-checklist.tsx
│   │   ├── document-upload.tsx
│   │   ├── document-preview.tsx
│   │   └── signature-input.tsx
│   └── shared/
│       ├── availability-picker.tsx
│       ├── agent-card.tsx
│       └── property-card.tsx
├── hooks/
│   ├── use-appointment.ts
│   ├── use-document-upload.ts
│   ├── use-signature.ts
│   └── use-checklist.ts
├── lib/
│   ├── appointment-api.ts
│   ├── document-api.ts
│   └── types.ts
├── pages/
│   ├── book-appointment-page.tsx
│   └── my-appointments-page.tsx
└── store/
    └── appointment-store.ts

src/app/api/appointments/
├── route.ts (POST, GET)
├── [id]/
│   ├── route.ts (GET, PATCH)
│   ├── checklist/
│   │   └── route.ts
│   ├── documents/
│   │   ├── route.ts
│   │   └── [docId]/
│   │       └── route.ts
│   └── sign/
│       └── route.ts
```

### Files to Delete
```
src/components/documents-v2/           (entire directory)
src/components/features/documents/      (entire directory)
src/lib/viewing-documents.ts           (entire file)
src/views/vizionarile-mele-page.tsx    (merged into new)
src/components/vizionare/              (replaced by new)
```

### Files to Keep (refactor imports)
```
src/components/dialogs/vizionare-feedback-dialog.tsx  (keep for post-viewing)
src/lib/legal-documents.ts                (keep definitions)
src/lib/types.ts                         (keep base types)
```

---

## 13. OPEN QUESTIONS FOR STAKEHOLDER

1. **Signature Method**: Typed name only, or add drawn signature pad?
2. **Document Verification**: Auto-verify based on file name, or manual agent approval?
3. **Calendar Sync**: Integrate with Google Calendar / Outlook?
4. **Reminder Notifications**: Email, SMS, both, neither?
5. **Offline Support**: PWA for areas with poor connectivity?
6. **Multi-language**: Romanian only, or English as well?

---

*Specification prepared for development team review*
*Author: Matrix Agent | Date: 2026-07-25*
