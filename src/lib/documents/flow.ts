/**
 * The flow function.
 *
 * Given an actor and a transaction context, returns the ONE thing the
 * user should do next. Pure, side-effect-free, fully testable.
 *
 * Replaces the old split:
 *   - `actionForParticipant(role, userId, …)`  (CLIENT/OWNER branch)
 *   - `actionForStaff(viewing, …)`              (AGENT/ADMIN branch)
 *
 * Same function, different inputs. No nested role-specific branches.
 */

import type {
  Actor,
  Document,
  DocumentSignature,
  FlowAction,
  ParticipantRole,
  Transaction,
  TransactionParticipant,
} from './types'
import { isTerminal } from './state-machine'
import { getStartableTemplatesForRole, getTemplate } from './templates'
import { isClientComplete, isOwnerComplete, isClientIdentity, isOwnerIdentity } from './identity'
import type { ClientIdentity, OwnerIdentity } from './types'

function asClientIdentity(value: unknown): ClientIdentity | null {
  return isClientIdentity(value) ? value : null
}
function asOwnerIdentity(value: unknown): OwnerIdentity | null {
  return isOwnerIdentity(value) ? value : null
}

/** Everything the flow function needs to know. */
export interface FlowContext {
  /** The actor asking. */
  actor: Actor
  /** The transaction in question. */
  transaction: Transaction
  /** All documents for this transaction, regardless of stage. */
  documents: readonly Document[]
  /** All signatures for these documents, flat. */
  signatures: readonly DocumentSignature[]
}

/**
 * Compute the single next action for the actor. Returns a FlowAction with
 * `kind: 'COMPLETE'` if there's nothing to do.
 */
export function nextAction(ctx: FlowContext): FlowAction {
  // 1. Is this actor a pending signer on any document?
  const signatureAction = checkPendingSignature(ctx)
  if (signatureAction) return signatureAction

  // 2. If the actor is staff, run the staff branch
  if (ctx.actor.kind === 'STAFF') {
    return staffAction(ctx)
  }

  // 3. Otherwise the actor is a participant — run the participant branch
  return participantAction(ctx)
}

// ─── Signature check (highest priority) ──────────────────────

function checkPendingSignature(ctx: FlowContext): FlowAction | null {
  if (ctx.actor.kind !== 'PARTICIPANT') return null

  const participant = findParticipant(ctx.transaction, ctx.actor.userId)
  if (!participant) return null

  for (const doc of ctx.documents) {
    if (isTerminal(doc.status)) continue
    if (doc.status !== 'READY_TO_SIGN' && doc.status !== 'PARTIALLY_SIGNED') continue

    const mySig = ctx.signatures.find(
      (s) => s.documentId === doc.id && s.participantId === participant.id && s.status === 'PENDING',
    )
    if (!mySig) continue

    const template = getTemplate(doc.kind)

    if (template.signature === 'SIMPLE') {
      return {
        kind: 'SIGN',
        documentId: doc.id,
        label: `Verifică și semnează: ${template.shortTitle}`,
        description: 'Deschide versiunea exactă, verifică datele și confirmă semnătura electronică.',
        signature: 'SIMPLE',
      }
    }

    return {
      kind: 'SIGN',
      documentId: doc.id,
      label: 'Vezi pașii pentru semnarea verificată',
      description: 'Acest document cere semnătură avansată sau calificată; semnarea simplă din platformă nu este disponibilă.',
      signature: template.signature,
    }
  }

  return null
}

// ─── Participant flow ────────────────────────────────────────

function participantAction(ctx: FlowContext): FlowAction {
  const actor = ctx.actor
  if (actor.kind !== 'PARTICIPANT') {
    // should never happen — guard for type narrowing
    return { kind: 'COMPLETE', label: '—', description: '' }
  }

  const participant = findParticipant(ctx.transaction, actor.userId)
  if (!participant) {
    return {
      kind: 'COMPLETE',
      label: 'Nu ești parte din această tranzacție',
      description: 'Verifică link-ul primit sau contactează agentul.',
    }
  }

  // 2a. Identity missing → ask for it first
  if (actor.role === 'CLIENT' && !isClientComplete(asClientIdentity(participant.identity))) {
    return {
      kind: 'PROVIDE_IDENTITY',
      role: 'CLIENT',
      label: 'Completează datele de client',
      description: 'O singură dată. Le refolosim pe toate documentele tranzacției.',
    }
  }
  if (actor.role === 'OWNER' && !isOwnerComplete(asOwnerIdentity(participant.identity))) {
    return {
      kind: 'PROVIDE_IDENTITY',
      role: 'OWNER',
      label: 'Completează datele de proprietar',
      description: 'O singură dată. Le refolosim pe toate documentele tranzacției.',
    }
  }

  // 2b. Active draft to edit
  const myDraft = ctx.documents.find(
    (d) => d.status === 'DRAFT' && d.createdBy === actor.userId,
  )
  if (myDraft) {
    const t = getTemplate(myDraft.kind)
    return {
      kind: 'EDIT_DRAFT',
      documentId: myDraft.id,
      label: `Continuă: ${t.shortTitle}`,
      description: 'Ai început acest document. Completează câmpurile rămase.',
    }
  }

  // 2c. Needs-info from staff
  const needsInfo = ctx.documents.find(
    (d) => d.status === 'NEEDS_INFO' && d.createdBy === actor.userId,
  )
  if (needsInfo) {
    const t = getTemplate(needsInfo.kind)
    return {
      kind: 'RESUBMIT',
      documentId: needsInfo.id,
      label: `Completează informațiile cerute: ${t.shortTitle}`,
      description: 'Agentul a indicat ce date trebuie corectate înainte de generare.',
    }
  }

  // 2d. Document waiting for staff review
  const waiting = ctx.documents.find(
    (d) => d.status === 'REQUESTED' || d.status === 'IN_REVIEW',
  )
  if (waiting) {
    const t = getTemplate(waiting.kind)
    return {
      kind: 'WAITING_FOR_STAFF',
      documentId: waiting.id,
      label: `Așteaptă verificarea: ${t.shortTitle}`,
      description: 'Datele tale sunt la agent. Vei fi notificat(ă) la următoarea etapă.',
    }
  }

  // 2e. No active workflow — suggest the next doc to start
  const startable = getStartableTemplatesForRole(actor.role, ctx.transaction.currentStage)
  if (startable.length > 0) {
    const t = startable[0]
    return {
      kind: 'START_DOCUMENT',
      kindRef: t.kind,
      label: actor.role === 'CLIENT' ? 'Completează datele o singură dată' : 'Confirmă datele proprietarului',
      description: `Începem cu ${t.shortTitle.toLowerCase()}; agentul va reutiliza datele verificate în dosar.`,
    }
  }

  return {
    kind: 'COMPLETE',
    label: 'Dosarul tău este la zi',
    description: 'Nu ai completări sau semnături restante. Poți consulta oricând versiunile și jurnalul.',
  }
}

// ─── Staff flow ──────────────────────────────────────────────

function staffAction(ctx: FlowContext): FlowAction {
  // 3a. Document waiting for review
  const needsReview = ctx.documents.find(
    (d) => d.status === 'REQUESTED' || d.status === 'IN_REVIEW',
  )
  if (needsReview) {
    const t = getTemplate(needsReview.kind)
    return {
      kind: 'REVIEW',
      documentId: needsReview.id,
      label: `Verifică și generează: ${t.shortTitle}`,
      description: 'Datele participantului sunt pregătite. Verifică-le înainte de a crea versiunea oficială.',
    }
  }

  // 3b. Document waiting for participant to fix and resubmit
  const blocked = ctx.documents.find((d) => d.status === 'NEEDS_INFO')
  if (blocked) {
    const t = getTemplate(blocked.kind)
    return {
      kind: 'WAITING_FOR_STAFF', // we re-use the variant — semantically it's "wait for participant"
      documentId: blocked.id,
      label: `Așteaptă completările: ${t.shortTitle}`,
      description: 'Participantul trebuie să retrimită informațiile solicitate.',
    }
  }

  // 3c. Document signed but not approved
  const readyToApprove = ctx.documents.find((d) => d.status === 'SIGNED')
  if (readyToApprove) {
    const t = getTemplate(readyToApprove.kind)
    return {
      kind: 'APPROVE',
      documentId: readyToApprove.id,
      label: `Aprobă: ${t.shortTitle}`,
      description: 'Toate semnăturile au fost colectate. Verifică versiunea finală și aprobă.',
    }
  }

  const hasAnyDoc = ctx.documents.length > 0
  return {
    kind: 'COMPLETE',
    label: hasAnyDoc ? 'Dosarul este pregătit pentru următoarea etapă' : 'Pregătește dosarul tranzacției',
    description: hasAnyDoc
      ? 'Verifică versiunile, semnăturile și jurnalul înainte de a continua tranzacția.'
      : 'Vezi ce date lipsesc și pornește documentul potrivit pentru etapa curentă.',
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function findParticipant(
  transaction: Transaction,
  userId: string,
): TransactionParticipant | null {
  return transaction.participants.find((p) => p.userId === userId) ?? null
}

// ─── Progress (for the multi-step indicator in UI) ───────────

export type ProgressStep = {
  label: string
  description: string
  state: 'complete' | 'current' | 'pending'
}

export function computeProgress(ctx: FlowContext): {
  percent: number
  steps: ProgressStep[]
} {
  const stepCopy: ReadonlyArray<readonly [string, string]> = [
    ['Date', 'Completează o singură dată'],
    ['Verificare', 'Agentul validează versiunea'],
    ['Semnare', 'Semnează documentul exact'],
  ] as const

  const anyInProgress = ctx.documents.some(
    (d) => !isTerminal(d.status) && d.status !== 'APPROVED',
  )
  const hasVerified = ctx.documents.some(
    (d) => d.status === 'READY_TO_SIGN' || d.status === 'PARTIALLY_SIGNED' || d.status === 'SIGNED' || d.status === 'APPROVED',
  )
  const hasSigned = ctx.documents.some((d) => d.status === 'SIGNED' || d.status === 'APPROVED')

  const completed = [anyInProgress || ctx.documents.length > 0, hasVerified, hasSigned]
  const currentIndex = completed.findIndex((v) => !v)

  return {
    percent: Math.round((completed.filter(Boolean).length / completed.length) * 100),
    steps: stepCopy.map(([label, description], index) => ({
      label,
      description,
      state: completed[index]
        ? 'complete'
        : index === (currentIndex === -1 ? stepCopy.length - 1 : currentIndex)
          ? 'current'
          : 'pending',
    })),
  }
}

// Re-export common types for the API surface
export type { FlowAction }
export type { ParticipantRole }
