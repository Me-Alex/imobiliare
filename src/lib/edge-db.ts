/**
 * Edge-safe database accessor.
 *
 * On a standard Node.js runtime the dynamic `import()` of @/lib/db (Prisma + SQLite)
 * succeeds and every route works with the real database.
 *
 * On Cloudflare Workers the Prisma/SQLite import fails at module level because
 * there is no filesystem.  This helper catches that failure and returns `null`
 * so that every route can fall back to mock data gracefully.
 */

import type { PrismaClient } from '@prisma/client'

let _db: PrismaClient | null | undefined = undefined // undefined = not tried yet

export async function getSafeDb(): Promise<PrismaClient | null> {
  // Fast-path: already resolved
  if (_db !== undefined) return _db

  try {
    const mod = await import('./db')
    _db = (mod as { db: PrismaClient }).db ?? null
  } catch {
    // Prisma cannot load on edge runtimes (no fs, no native addons)
    _db = null
  }

  return _db
}