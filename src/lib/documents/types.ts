/**
 * Document system — type definitions.
 *
 * One source of truth for the data model. Three layers:
 *   1. Identity      (filled once, referenced everywhere)
 *   2. Templates     (pure data: what a doc looks like)
 *   3. State machine (pure function: how a doc moves through statuses)
 *
 * Anything that needs to render a doc, validate a doc, decide the next
 * user action, or persist to DB uses these types.
 */

// ─── Roles & actors ──────────────────────────────────────────

/** Who can be on a document or transaction. */
export type ParticipantRole = 'CLIENT' | 'OWNER'

/** Who is asking / acting right now. */
export type Actor =
  | { kind: 'PARTICIPANT'; role: ParticipantRole; userId: string }
  | { kind: 'STAFF'; role: 'AGENT' | 'ADMIN' | 'DIRECTOR'; userId: string }
  | { kind: 'SYSTEM' } // background, migrations, scheduled jobs

// ─── Identity ────────────────────────────────────────────────

/** Snapshot of a client's identity, used both for display and to fill forms. */
export interface ClientIdentity {
  fullName: string
  idDocument: string // tip, serie, număr, emitent
  address: string
  email: string
  phone: string
}

/** Snapshot of an owner's identity. */
export interface OwnerIdentity {
  fullName: string
  idDocument: string
  address: string
  email: string
  phone: string
  paymentAccount?: string // IBAN / modalitate încasare (for rentals)
}

/** Snapshot of a property's legal identity. */
export interface PropertyLegalIdentity {
  title: string
  address: string
  cadastralNumber: string // număr cadastral / carte funciară
  ownershipTitle: string // titlul de proprietate
  encumbrances: string // sarcini, litigii, coproprietari
}

/** Agency legal profile (read-only, comes from the agency config). */
export interface AgencyLegalProfile {
  legalName: string
  cui: string
  tradeRegistryNumber: string
  registeredOffice: string
  email: string
  phone: string
  representative: string
  privacyNoticeUrl: string
  privacyNoticeVersion: string
}

// ─── Transaction ─────────────────────────────────────────────

/** Stages a transaction moves through. */
export type TransactionStage = 'VIEWING' | 'NEGOTIATION' | 'CONTRACT' | 'HANDOVER' | 'CLOSED'

/** A real estate deal. Replaces the vizionare-anchored mental model. */
export interface Transaction {
  id: string
  propertyId: string
  type: 'SALE' | 'RENTAL'
  status: 'OPEN' | 'WON' | 'LOST' | 'CANCELLED'
  currentStage: TransactionStage
  participants: TransactionParticipant[]
  createdAt: string
  updatedAt: string
}

/** A person on a transaction (a user, plus the identity they need to provide). */
export interface TransactionParticipant {
  id: string
  transactionId: string
  userId: string
  role: ParticipantRole
  /** Cached identity. Always available for display; can be stale until refreshed. */
  identity: ClientIdentity | OwnerIdentity | null
  createdAt: string
}

// ─── Document ────────────────────────────────────────────────

/** What kind of document — drives which template is used. */
export type DocumentKind =
  | 'viewing_report'
  | 'brokerage_agreement'
  | 'owner_mandate'
  | 'reservation_offer'
  | 'rental_contract'
  | 'handover_protocol'

/** How a document must be signed. */
export type SignatureRequirement = 'SIMPLE' | 'ADVANCED_OR_QUALIFIED' | 'QUALIFIED'

/**
 * The full lifecycle of a document. Replaces the old split between
 * `ViewingDocument.status` and `LegalDocumentRequest.status`.
 */
export type DocumentStatus =
  | 'DRAFT' // participant is filling the form
  | 'REQUESTED' // submitted, waiting for staff review
  | 'IN_REVIEW' // staff is reviewing
  | 'NEEDS_INFO' // staff sent it back for changes
  | 'READY_TO_SIGN' // file is generated, signers notified
  | 'PARTIALLY_SIGNED' // some required signers have signed
  | 'SIGNED' // all required signers have signed
  | 'APPROVED' // staff approved, locked
  | 'REJECTED' // staff rejected, terminal
  | 'CANCELLED' // someone cancelled, terminal
  | 'SUPERSEDED' // replaced by a newer version, terminal

/** A filled instance of a template, anchored to a transaction. */
export interface Document {
  id: string
  transactionId: string
  kind: DocumentKind
  stage: TransactionStage
  status: DocumentStatus
  /** The filled fields (template-specific). Identity-sourced fields are already merged in. */
  data: Record<string, string>
  /** Version of this kind within the transaction (1-based). */
  version: number
  /** Previous version's id, if this is a revision. */
  supersedesId: string | null
  /** The generated PDF, if any. */
  file: DocumentFile | null
  /** Who triggered the current state. */
  createdBy: string
  createdAt: string
  updatedAt: string
}

/** Stored file reference. */
export interface DocumentFile {
  bucket: string
  path: string
  size: number
  fileName: string
  generatedAt: string
}

/** A required or optional signature on a document. */
export interface DocumentSignature {
  id: string
  documentId: string
  /** Which participant (by participant id, not user id, to support role changes). */
  participantId: string
  /** Whether this signature is required to complete the document. */
  required: boolean
  status: 'PENDING' | 'SIGNED' | 'DECLINED' | 'EXPIRED'
  signedAt: string | null
  /** External signature reference (e.g. qualified e-signature provider id). */
  signatureRef: string | null
}

/** Immutable audit log entry. */
export interface DocumentEvent {
  id: string
  documentId: string
  actorId: string
  actorKind: Actor['kind']
  type: DocumentEventType
  body: string
  metadata: Record<string, unknown>
  createdAt: string
}

export type DocumentEventType =
  | 'CREATED'
  | 'STATUS_CHANGED'
  | 'FIELD_UPDATED'
  | 'SIGNATURE_ADDED'
  | 'SIGNATURE_DECLINED'
  | 'FILE_GENERATED'
  | 'NOTE'
  | 'RESENT'

// ─── Flow (what the user sees) ───────────────────────────────

/** A single concrete thing the user can do next. */
export type FlowAction =
  | { kind: 'PROVIDE_IDENTITY'; label: string; description: string; role: ParticipantRole }
  | { kind: 'EDIT_DRAFT'; documentId: string; label: string; description: string }
  | { kind: 'RESUBMIT'; documentId: string; label: string; description: string }
  | { kind: 'WAITING_FOR_STAFF'; documentId: string; label: string; description: string }
  | { kind: 'SIGN'; documentId: string; label: string; description: string; signature: SignatureRequirement }
  | { kind: 'GENERATE'; documentId: string; label: string; description: string }
  | { kind: 'REVIEW'; documentId: string; label: string; description: string }
  | { kind: 'REQUEST_INFO'; documentId: string; label: string; description: string }
  | { kind: 'APPROVE'; documentId: string; label: string; description: string }
  | { kind: 'START_DOCUMENT'; kindRef: DocumentKind; label: string; description: string }
  | { kind: 'COMPLETE'; label: string; description: string }

// ─── Field & template primitives ─────────────────────────────

export type FieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'date'
  | 'datetime-local'
  | 'textarea'
  | 'select'
  | 'checkbox'

export interface FieldOption {
  value: string
  label: string
}

export interface FieldValidation {
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
}

export interface Field {
  key: string
  label: string
  group: string
  type: FieldType
  required: boolean
  readOnly?: boolean
  placeholder?: string
  options?: FieldOption[]
  helpText?: string
  validation?: FieldValidation
  /** Where this field's value can be auto-filled from, if anywhere. */
  source?: FieldSource
}

/** Keys on the agency profile that a field can source from. */
export type AgencySourceKey =
  | 'legalName'
  | 'cui'
  | 'tradeRegistryNumber'
  | 'registeredOffice'
  | 'email'
  | 'phone'
  | 'representative'
  | 'privacyNoticeUrl'
  | 'privacyNoticeVersion'

/** A field that can be auto-filled from a stored identity. */
export type FieldSource =
  | { type: 'identity'; path: 'client' | 'owner' | 'property'; key: string }
  | { type: 'agency'; key: AgencySourceKey }

/** Which fields of a participant's identity a template needs. */
export type IdentityFieldKey = keyof ClientIdentity | keyof OwnerIdentity

export interface TemplateParticipant {
  role: ParticipantRole
  /** Which keys from this participant's identity this template reads. */
  identityFields: readonly IdentityFieldKey[]
  /** Whether this participant is required to start the document. */
  required: boolean
}

export interface DocumentTemplate {
  kind: DocumentKind
  title: string
  shortTitle: string
  description: string
  stage: TransactionStage
  signature: SignatureRequirement
  /** Whether the participant has a 14-day cooling-off period (consumer protection). */
  consumerWithdrawalRequired: boolean
  /** Whether the document needs the agency legal profile to render. */
  requiresAgencyProfile: boolean
  /** Who must be on the document and which identity fields they need. */
  participants: readonly TemplateParticipant[]
  /** Document-specific fields (not identity-sourced). */
  fields: readonly Field[]
  /** Order in the typical transaction flow (used for "next document" suggestions). */
  order: number
}
