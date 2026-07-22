/**
 * The legacy CRM REST handlers were originally built for the local Prisma
 * schema. The Cloudflare D1 adapter deliberately exposes only the models it
 * can faithfully support. Keep this check at the boundary so a missing model
 * becomes an explicit 503 rather than a runtime TypeError.
 */
export function hasLegacyCrmModels(db: unknown): boolean {
  if (!db || typeof db !== 'object') return false

  const candidate = db as Record<string, unknown>
  return Boolean(candidate.lead && candidate.offer)
}
