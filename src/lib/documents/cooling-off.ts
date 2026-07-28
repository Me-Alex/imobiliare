/**
 * Cooling-off period tracking (EU consumer protection).
 *
 * Under EU Directive 2011/83/EU, consumers have a 14-day withdrawal period
 * for off-premises and distance contracts. This module tracks that period
 * for documents that require it.
 *
 * Pure functions — no side effects, fully testable.
 */

import type { CoolingOffPeriod, DocumentEvent } from './types'

/** Standard EU cooling-off period: 14 days in milliseconds. */
const COOLING_OFF_DAYS = 14
const COOLING_OFF_MS = COOLING_OFF_DAYS * 24 * 60 * 60 * 1_000

/**
 * Create a new cooling-off period starting at the given timestamp.
 * The period starts when the document is signed (not when it was created).
 */
export function createCoolingOffPeriod(signedAt: string): CoolingOffPeriod {
  const startDate = new Date(signedAt)
  const expiryDate = new Date(startDate.getTime() + COOLING_OFF_MS)

  return {
    startedAt: signedAt,
    expiresAt: expiryDate.toISOString(),
    exercised: false,
    exercisedAt: null,
    reason: null,
  }
}

/**
 * Check whether the cooling-off period has expired.
 */
export function isCoolingOffExpired(coolingOff: CoolingOffPeriod): boolean {
  return new Date() >= new Date(coolingOff.expiresAt)
}

/**
 * Check whether the consumer can still withdraw.
 * Returns false if already exercised or expired.
 */
export function canWithdraw(coolingOff: CoolingOffPeriod): boolean {
  if (coolingOff.exercised) return false
  return !isCoolingOffExpired(coolingOff)
}

/**
 * Exercise the right of withdrawal.
 * Returns a new CoolingOffPeriod with the exercised flag set.
 * Returns null if withdrawal is no longer possible.
 */
export function exerciseWithdrawal(
  coolingOff: CoolingOffPeriod,
  reason?: string,
): CoolingOffPeriod | null {
  if (!canWithdraw(coolingOff)) return null

  return {
    ...coolingOff,
    exercised: true,
    exercisedAt: new Date().toISOString(),
    reason: reason ?? null,
  }
}

/**
 * Get the remaining time in the cooling-off period.
 * Returns 0 if expired or exercised.
 */
export function getRemainingMs(coolingOff: CoolingOffPeriod): number {
  if (coolingOff.exercised) return 0
  const remaining = new Date(coolingOff.expiresAt).getTime() - Date.now()
  return Math.max(0, remaining)
}

/**
 * Get a human-readable summary of the cooling-off status.
 * Used for display in the UI.
 */
export function getCoolingOffStatus(coolingOff: CoolingOffPeriod): {
  label: string
  detail: string
  urgent: boolean
} {
  if (coolingOff.exercised) {
    return {
      label: 'Retragere exercitată',
      detail: `Retragerea a fost exercitată la ${new Date(coolingOff.exercisedAt!).toLocaleDateString('ro-RO')}${coolingOff.reason ? `: ${coolingOff.reason}` : ''}`,
      urgent: false,
    }
  }

  if (isCoolingOffExpired(coolingOff)) {
    return {
      label: 'Perioadă expirată',
      detail: 'Perioada de retragere de 14 zile a expirat. Documentul poate fi aprobat.',
      urgent: false,
    }
  }

  const remainingMs = getRemainingMs(coolingOff)
  const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1_000))

  return {
    label: `Retragere: ${remainingDays} zile rămase`,
    detail: `Perioada de retragere expiră la ${new Date(coolingOff.expiresAt).toLocaleDateString('ro-RO')}. Consumatorul poate retrage fără justificare.`,
    urgent: remainingDays <= 3,
  }
}

/**
 * Check if any document in a transaction needs cooling-off expiry processing.
 * Used by the cron job / scheduled task.
 */
export function needsCoolingOffExpiryCheck(coolingOff: CoolingOffPeriod | null): boolean {
  if (!coolingOff) return false
  if (coolingOff.exercised) return false
  return isCoolingOffExpired(coolingOff)
}

/**
 * Build the audit event for cooling-off period creation.
 */
export function buildCoolingOffStartedEvent(
  documentId: string,
  actorId: string,
  coolingOff: CoolingOffPeriod,
): Omit<DocumentEvent, 'id' | 'createdAt'> {
  return {
    documentId,
    actorId,
    actorKind: 'SYSTEM',
    type: 'COOLING_OFF_STARTED',
    body: `Perioadă de retragere de ${COOLING_OFF_DAYS} zile începută. Expiră la ${new Date(coolingOff.expiresAt).toLocaleDateString('ro-RO')}.`,
    metadata: {
      startedAt: coolingOff.startedAt,
      expiresAt: coolingOff.expiresAt,
    },
  }
}

/**
 * Build the audit event for cooling-off expiry.
 */
export function buildCoolingOffExpiredEvent(
  documentId: string,
): Omit<DocumentEvent, 'id' | 'createdAt'> {
  return {
    documentId,
    actorId: 'system',
    actorKind: 'SYSTEM',
    type: 'COOLING_OFF_EXPIRED',
    body: 'Perioada de retragere de 14 zile a expirat fără a fi exercitată.',
    metadata: {},
  }
}

/**
 * Build the audit event for withdrawal exercise.
 */
export function buildCoolingOffExercisedEvent(
  documentId: string,
  actorId: string,
  reason?: string,
): Omit<DocumentEvent, 'id' | 'createdAt'> {
  return {
    documentId,
    actorId,
    actorKind: 'PARTICIPANT',
    type: 'COOLING_OFF_EXERCISED',
    body: `Dreptul de retragere a fost exercitat${reason ? `: ${reason}` : ''}.`,
    metadata: { reason },
  }
}
