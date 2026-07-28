/**
 * Document expiration logic.
 *
 * Some documents have a limited validity period:
 *   - Reservation offers (48h typical)
 *   - Brokerage agreements (30 days typical)
 *   - Cooling-off period deadlines (14 days, EU law)
 *
 * This module handles expiration detection and action execution.
 * Pure functions — no side effects, fully testable.
 */

import type { Document, DocumentStatus, DocumentEvent } from './types'

/** Default expiration periods by document kind (in milliseconds). */
const DEFAULT_EXPIRY_MS: Partial<Record<string, number>> = {
  reservation_offer: 48 * 60 * 60 * 1_000,       // 48 hours
  brokerage_agreement: 30 * 24 * 60 * 60 * 1_000, // 30 days
  owner_mandate: 90 * 24 * 60 * 60 * 1_000,       // 90 days
}

/**
 * Calculate the default expiration date for a document kind.
 * Returns null if the document kind has no default expiry.
 */
export function getDefaultExpiryDate(kind: string, createdAt: string): string | null {
  const expiryMs = DEFAULT_EXPIRY_MS[kind]
  if (!expiryMs) return null
  return new Date(new Date(createdAt).getTime() + expiryMs).toISOString()
}

/**
 * Check whether a document has expired.
 */
export function isDocumentExpired(document: Document): boolean {
  if (!document.expiresAt) return false
  return new Date() >= new Date(document.expiresAt)
}

/**
 * Check whether a document should be auto-expired.
 * Only non-terminal documents with an expiration date and action qualify.
 */
export function shouldAutoExpire(document: Document): boolean {
  if (!document.expiresAt) return false
  if (!document.expirationAction) return false
  if (isTerminalStatus(document.status)) return false
  return isDocumentExpired(document)
}

/**
 * Get the target status when a document expires.
 */
export function getExpiryTargetStatus(
  action: 'CANCEL' | 'SUPERSEDE' | 'NOTIFY_ONLY',
): DocumentStatus | null {
  switch (action) {
    case 'CANCEL':
      return 'EXPIRED'
    case 'SUPERSEDE':
      return 'SUPERSEDED'
    case 'NOTIFY_ONLY':
      return null // no status change, just notify
  }
}

/**
 * Get the remaining time until expiration.
 * Returns 0 if no expiration or already expired.
 */
export function getExpiryRemainingMs(document: Document): number {
  if (!document.expiresAt) return 0
  const remaining = new Date(document.expiresAt).getTime() - Date.now()
  return Math.max(0, remaining)
}

/**
 * Is expiration approaching? Returns true if less than the given threshold.
 * Default threshold: 4 hours.
 */
export function isExpiryApproaching(document: Document, thresholdMs = 4 * 60 * 60 * 1_000): boolean {
  if (!document.expiresAt) return false
  const remaining = getExpiryRemainingMs(document)
  return remaining > 0 && remaining <= thresholdMs
}

/**
 * Build the audit event for document expiration.
 */
export function buildDocumentExpiredEvent(
  documentId: string,
  action: 'CANCEL' | 'SUPERSEDE' | 'NOTIFY_ONLY',
): Omit<DocumentEvent, 'id' | 'createdAt'> {
  const messages = {
    CANCEL: 'Documentul a expirat și a fost anulat automat.',
    SUPERSEDE: 'Documentul a expirat și a fost înlocuit automat.',
    NOTIFY_ONLY: 'Documentul a expirat. Participanții au fost notificați.',
  }

  return {
    documentId,
    actorId: 'system',
    actorKind: 'SYSTEM',
    type: 'EXPIRED',
    body: messages[action],
    metadata: { action, expiredAt: new Date().toISOString() },
  }
}

/**
 * Build the audit event for expiry approaching notification.
 */
export function buildExpiryApproachingEvent(
  documentId: string,
  remainingMs: number,
): Omit<DocumentEvent, 'id' | 'createdAt'> {
  const hours = Math.ceil(remainingMs / (60 * 60 * 1_000))

  return {
    documentId,
    actorId: 'system',
    actorKind: 'SYSTEM',
    type: 'NOTE',
    body: `Documentul expiră în ${hours} ${hours === 1 ? 'oră' : 'ore'}.`,
    metadata: { remainingMs, type: 'expiry_warning' },
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function isTerminalStatus(status: DocumentStatus): boolean {
  return ['REJECTED', 'CANCELLED', 'SUPERSEDED', 'EXPIRED', 'APPROVED'].includes(status)
}
