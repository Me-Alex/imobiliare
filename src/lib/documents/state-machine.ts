/**
 * Document state machine.
 *
 * One source of truth for what transitions are legal and which actors can
 * trigger them. Pure, side-effect-free, fully testable.
 *
 * Usage:
 *   const result = transition('REQUESTED', 'IN_REVIEW', { kind: 'STAFF', ... })
 *   if (result.ok) updateDoc(result.value)
 */

import type { Actor, DocumentStatus } from './types'

/** Allowed transitions: from → list of legal next states. */
const TRANSITIONS: Record<DocumentStatus, readonly DocumentStatus[]> = {
  DRAFT: ['REQUESTED', 'CANCELLED'],
  REQUESTED: ['IN_REVIEW', 'CANCELLED'],
  IN_REVIEW: ['NEEDS_INFO', 'READY_TO_SIGN', 'REJECTED', 'CANCELLED'],
  NEEDS_INFO: ['IN_REVIEW', 'CANCELLED'],
  READY_TO_SIGN: ['PARTIALLY_SIGNED', 'SIGNED', 'CANCELLED'],
  PARTIALLY_SIGNED: ['SIGNED', 'CANCELLED'],
  SIGNED: ['APPROVED', 'SUPERSEDED'],
  APPROVED: ['SUPERSEDED'],
  REJECTED: [],
  CANCELLED: [],
  SUPERSEDED: [],
}

/** Which actor kinds can trigger each transition. */
type ActorRule =
  | { kind: 'PARTICIPANT'; role: 'CLIENT' | 'OWNER' | 'ANY' }
  | { kind: 'STAFF' }
  | { kind: 'ANY' }
  | { kind: 'SYSTEM' }

/** Per-transition authorization. */
const RULES: Record<DocumentStatus, Partial<Record<DocumentStatus, ActorRule>>> = {
  DRAFT: {
    REQUESTED: { kind: 'PARTICIPANT', role: 'ANY' }, // participant submits their draft
    CANCELLED: { kind: 'ANY' },
  },
  REQUESTED: {
    IN_REVIEW: { kind: 'STAFF' },
    CANCELLED: { kind: 'ANY' },
  },
  IN_REVIEW: {
    NEEDS_INFO: { kind: 'STAFF' },
    READY_TO_SIGN: { kind: 'STAFF' }, // staff generates PDF, notifies signers
    REJECTED: { kind: 'STAFF' },
    CANCELLED: { kind: 'ANY' },
  },
  NEEDS_INFO: {
    IN_REVIEW: { kind: 'PARTICIPANT', role: 'ANY' }, // participant resubmits
    CANCELLED: { kind: 'ANY' },
  },
  READY_TO_SIGN: {
    PARTIALLY_SIGNED: { kind: 'PARTICIPANT', role: 'ANY' }, // any required signer
    SIGNED: { kind: 'PARTICIPANT', role: 'ANY' },
    CANCELLED: { kind: 'ANY' },
  },
  PARTIALLY_SIGNED: {
    SIGNED: { kind: 'PARTICIPANT', role: 'ANY' },
    CANCELLED: { kind: 'ANY' },
  },
  SIGNED: {
    APPROVED: { kind: 'STAFF' },
    SUPERSEDED: { kind: 'ANY' },
  },
  APPROVED: {
    SUPERSEDED: { kind: 'STAFF' },
  },
  REJECTED: {},
  CANCELLED: {},
  SUPERSEDED: {},
}

export type TransitionError =
  | { code: 'ILLEGAL_TRANSITION'; from: DocumentStatus; to: DocumentStatus }
  | { code: 'NOT_AUTHORIZED'; actor: Actor; from: DocumentStatus; to: DocumentStatus }
  | { code: 'TERMINAL_STATE'; from: DocumentStatus }

export type TransitionResult =
  | { ok: true; from: DocumentStatus; to: DocumentStatus }
  | { ok: false; error: TransitionError }

function ruleSatisfied(rule: ActorRule, actor: Actor): boolean {
  if (rule.kind === 'ANY') return true
  if (rule.kind === 'SYSTEM') return actor.kind === 'SYSTEM'
  if (rule.kind === 'STAFF') return actor.kind === 'STAFF'
  if (rule.kind === 'PARTICIPANT') {
    if (actor.kind !== 'PARTICIPANT') return false
    // `role: 'ANY'` in the rule table is a wildcard that matches both
    // CLIENT and OWNER. Without this branch the wildcard never fires
    // because the Actor union only allows the two concrete roles.
    if (rule.role === 'ANY') return actor.role === 'CLIENT' || actor.role === 'OWNER'
    return actor.role === rule.role
  }
  return false
}

/** Is the transition from → to legal at all (ignoring actor)? */
export function canTransition(from: DocumentStatus, to: DocumentStatus): boolean {
  return TRANSITIONS[from].includes(to)
}

/** Attempt a transition. Returns ok=true if the actor is allowed. */
export function transition(
  from: DocumentStatus,
  to: DocumentStatus,
  actor: Actor,
): TransitionResult {
  if (isTerminal(from)) {
    return { ok: false, error: { code: 'TERMINAL_STATE', from } }
  }
  if (!canTransition(from, to)) {
    return { ok: false, error: { code: 'ILLEGAL_TRANSITION', from, to } }
  }
  const rule = RULES[from][to]
  if (!rule || !ruleSatisfied(rule, actor)) {
    return { ok: false, error: { code: 'NOT_AUTHORIZED', actor, from, to } }
  }
  return { ok: true, from, to }
}

/** A document in one of these states will never move again. */
export function isTerminal(status: DocumentStatus): boolean {
  return TRANSITIONS[status].length === 0
}

/** All states a document could legitimately reach from `from`. */
export function nextStates(from: DocumentStatus): readonly DocumentStatus[] {
  return TRANSITIONS[from]
}

/**
 * Auto-derive the next status from real-world signals.
 * Used by the signature handler: when a required signature is added,
 * the document may move PARTIALLY_SIGNED → SIGNED.
 */
export function deriveStatusAfterSignature(args: {
  current: DocumentStatus
  requiredSigners: number
  signedSigners: number
}): DocumentStatus {
  if (args.current !== 'READY_TO_SIGN' && args.current !== 'PARTIALLY_SIGNED') {
    return args.current
  }
  if (args.signedSigners >= args.requiredSigners) return 'SIGNED'
  if (args.signedSigners > 0) return 'PARTIALLY_SIGNED'
  return args.current
}
