/**
 * Input validators shared by API routes.
 *
 * Keep these pure and side-effect free. They are called from request
 * handlers on both the Node and Cloudflare edge runtimes.
 */

// Pragmatic RFC 5322-lite. Stops control characters, angle brackets, quotes
// and whitespace while still accepting the overwhelming majority of real
// addresses. The local part allows the common `dot`, `+`, `dash`, and
// underscore characters without going full RFC 5322.
const EMAIL_RE = /^[A-Za-z0-9._%+\-]{1,64}@[A-Za-z0-9.\-]{1,255}\.[A-Za-z]{2,24}$/

export function isValidEmail(email: unknown): email is string {
  if (typeof email !== 'string') return false
  const value = email.trim()
  if (value.length < 5 || value.length > 254) return false
  if (/[\s<>"]/.test(value)) return false
  return EMAIL_RE.test(value)
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
