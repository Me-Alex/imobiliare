/**
 * Edge-safe database accessor.
 *
 * On a standard Node.js runtime, Prisma is resolved lazily from node_modules so
 * local SQLite development can use the real database without shipping Prisma to
 * the Cloudflare Worker.
 *
 * On Cloudflare Workers this resolves the configured D1 binding and wraps it in
 * the Prisma-compatible adapter. On standard Node.js it uses Prisma + SQLite.
 * If neither database is available, API routes can still fall back gracefully.
 */

import type { PrismaClient } from '@prisma/client'
import type { D1Database } from './db-d1'

let _nodeDb: PrismaClient | null | undefined = undefined // undefined = not tried yet

type PrismaModule = {
  PrismaClient: new (options?: { log?: string[] }) => PrismaClient
}

async function getD1Database(): Promise<PrismaClient | null> {
  try {
    const [{ getCloudflareContext }, { createD1Client }] = await Promise.all([
      import('@opennextjs/cloudflare'),
      import('./db-d1'),
    ])
    const { env } = getCloudflareContext()
    const d1 = (env as unknown as { DB?: D1Database }).DB

    if (d1) {
      return createD1Client(d1) as unknown as PrismaClient
    }
  } catch {
    // A Cloudflare request context is not available in the standard Node runtime.
  }

  return null
}

export async function getSafeDb(): Promise<PrismaClient | null> {
  // Resolve D1 per request. Reusing request-bound I/O objects across Worker
  // requests can fail in the Cloudflare runtime.
  const d1Db = await getD1Database()
  if (d1Db) return d1Db

  // The Node Prisma client is safe to reuse across local requests.
  if (_nodeDb !== undefined) return _nodeDb

  // Local preview can intentionally run without SQLite configuration and use
  // the route-level mock fallback. Avoid instantiating Prisma in that case.
  if (!process.env.DATABASE_URL) {
    _nodeDb = null
    return null
  }

  try {
    // Do not statically import Prisma from a module that is shared by Worker
    // routes. Cloudflare uses D1 above, while Node-only local development can
    // resolve Prisma from node_modules at runtime. Keeping the module name
    // dynamic prevents OpenNext from emitting Prisma's query-engine WASM in
    // the Worker bundle.
    const prismaPackage = ['@prisma', 'client'].join('/')
    const { PrismaClient } = await import(prismaPackage) as PrismaModule
    _nodeDb = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query'] : [],
    })
  } catch {
    _nodeDb = null
  }

  return _nodeDb
}
