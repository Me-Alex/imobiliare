/**
 * Identity resolution.
 *
 * The point: identity is filled once on the participant's profile, and
 * templates reference it. No more `LEGAL_REQUEST_FIELD_KEYS` map, no more
 * "fill the same field 4 times across 4 documents".
 *
 * This module:
 *   - validates an identity
 *   - resolves a field's value from an identity snapshot
 *   - computes which keys a participant still needs to provide
 */

import type {
  ClientIdentity,
  Field,
  FieldSource,
  OwnerIdentity,
  PropertyLegalIdentity,
} from './types'

/** Type guard: is this a client identity? */
export function isClientIdentity(value: unknown): value is ClientIdentity {
  return (
    typeof value === 'object' &&
    value !== null &&
    'fullName' in value &&
    typeof (value as Record<string, unknown>).fullName === 'string'
  )
}

/** Type guard: is this an owner identity? */
export function isOwnerIdentity(value: unknown): value is OwnerIdentity {
  return (
    typeof value === 'object' &&
    value !== null &&
    'fullName' in value &&
    typeof (value as Record<string, unknown>).fullName === 'string'
  )
}

/** Required keys for a client identity to be considered "complete". */
const CLIENT_REQUIRED: readonly (keyof ClientIdentity)[] = [
  'fullName', 'idDocument', 'address', 'email', 'phone',
] as const

/** Required keys for an owner identity. */
const OWNER_REQUIRED: readonly (keyof OwnerIdentity)[] = [
  'fullName', 'idDocument', 'address', 'email', 'phone',
] as const

/** Is the client identity complete? */
export function isClientComplete(identity: ClientIdentity | null): boolean {
  if (!identity) return false
  return CLIENT_REQUIRED.every((key) => {
    const value = identity[key]
    return typeof value === 'string' && value.trim().length > 0
  })
}

/** Is the owner identity complete? */
export function isOwnerComplete(identity: OwnerIdentity | null): boolean {
  if (!identity) return false
  return OWNER_REQUIRED.every((key) => {
    const value = identity[key]
    return typeof value === 'string' && value.trim().length > 0
  })
}

export interface ResolveContext {
  client?: ClientIdentity | null
  owner?: OwnerIdentity | null
  property?: PropertyLegalIdentity | null
  agency?: { legalName: string; cui: string; tradeRegistryNumber: string; registeredOffice: string; email: string; phone: string; representative: string; privacyNoticeUrl: string; privacyNoticeVersion: string } | null
}

/** Resolve a field's auto-fill value from identities. */
export function resolveFieldValue(
  field: Field,
  ctx: ResolveContext,
): string | null {
  const source = field.source
  if (!source) return null
  return resolveSource(source, ctx)
}

function resolveSource(
  source: FieldSource,
  ctx: ResolveContext,
): string | null {
  if (source.type === 'agency') {
    if (!ctx.agency) return null
    switch (source.key) {
      case 'legalName': return ctx.agency.legalName
      case 'cui': return ctx.agency.cui
      case 'tradeRegistryNumber': return ctx.agency.tradeRegistryNumber
      case 'registeredOffice': return ctx.agency.registeredOffice
      case 'email': return ctx.agency.email
      case 'phone': return ctx.agency.phone
      case 'representative': return ctx.agency.representative
      case 'privacyNoticeUrl': return ctx.agency.privacyNoticeUrl
      case 'privacyNoticeVersion': return ctx.agency.privacyNoticeVersion
    }
  }
  if (source.type === 'identity') {
    if (source.path === 'client') {
      return (ctx.client?.[source.key as keyof ClientIdentity] as string) ?? null
    }
    if (source.path === 'owner') {
      return (ctx.owner?.[source.key as keyof OwnerIdentity] as string) ?? null
    }
    if (source.path === 'property') {
      return (ctx.property?.[source.key as keyof PropertyLegalIdentity] as string) ?? null
    }
  }
  return null
}

/** Build a complete Document.data payload from identities + user-provided values. */
export function composeDocumentData(args: {
  fields: readonly Field[]
  userValues: Record<string, string>
  client?: ClientIdentity | null
  owner?: OwnerIdentity | null
  property?: PropertyLegalIdentity | null
  agency?: { legalName: string; cui: string; tradeRegistryNumber: string; registeredOffice: string; email: string; phone: string; representative: string; privacyNoticeUrl: string; privacyNoticeVersion: string } | null
}): Record<string, string> {
  const result: Record<string, string> = {}
  for (const field of args.fields) {
    // User value wins
    if (args.userValues[field.key] !== undefined && args.userValues[field.key] !== '') {
      result[field.key] = args.userValues[field.key]
      continue
    }
    // Otherwise try auto-fill
    const resolved = resolveFieldValue(field, {
      client: args.client,
      owner: args.owner,
      property: args.property,
      agency: args.agency,
    })
    if (resolved !== null) {
      result[field.key] = resolved
    }
  }
  return result
}
