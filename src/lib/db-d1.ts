/**
 * Cloudflare D1 Database Adapter
 * Provides a Prisma-compatible API for Cloudflare Edge Runtime
 */

// ── Helpers ────────────────────────────────────────────────────

type D1Result<T = Record<string, unknown>> = {
  results: T[]
  success: boolean
  meta?: { changes?: number; duration?: number }
}

// ── Helpers ────────────────────────────────────────────────────

function serializeValue(v: unknown): string {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'boolean') return v ? '1' : '0'
  if (v instanceof Date) return `'${v.toISOString()}'`
  return `'${String(v).replace(/'/g, "''")}'`
}

function deserializeRow<T>(row: Record<string, unknown>): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    // D1 returns numbers as strings sometimes
    if (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value)) {
      result[key] = Number(value)
    } else if (value === null || value === undefined) {
      result[key] = null
    } else {
      result[key] = value
    }
  }
  return result as T
}

// ── Query Builder ──────────────────────────────────────────────

type WhereClause = Record<string, unknown>

function buildWhereClause(where: WhereClause, params: unknown[]): { sql: string; params: unknown[] } {
  if (!where || Object.keys(where).length === 0) return { sql: '', params }

  const conditions: string[] = []

  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue

    if (typeof value === 'object' && value !== null) {
      // Handle Prisma-style operators: { contains, in, gte, lte, gt, lt, equals, not }
      const ops = value as Record<string, unknown>

      if ('contains' in ops && ops.contains !== undefined) {
        params.push(`%${ops.contains}%`)
        conditions.push(`${key} LIKE ?${params.length}`)
      } else if ('startsWith' in ops && ops.startsWith !== undefined) {
        params.push(`${ops.startsWith}%`)
        conditions.push(`${key} LIKE ?${params.length}`)
      } else if ('endsWith' in ops && ops.endsWith !== undefined) {
        params.push(`%${ops.endsWith}`)
        conditions.push(`${key} LIKE ?${params.length}`)
      } else if ('in' in ops && Array.isArray(ops.in)) {
        const placeholders = ops.in.map(() => {
          params.push(undefined)
          return `?${params.length}`
        })
        // Re-assign values
        ops.in.forEach((v, i) => { params[params.length - ops.in.length + i] = v })
        conditions.push(`${key} IN (${placeholders.join(', ')})`)
      } else if ('notIn' in ops && Array.isArray(ops.notIn)) {
        const placeholders = ops.notIn.map(() => {
          params.push(undefined)
          return `?${params.length}`
        })
        ops.notIn.forEach((v, i) => { params[params.length - ops.notIn.length + i] = v })
        conditions.push(`${key} NOT IN (${placeholders.join(', ')})`)
      } else if ('gte' in ops) {
        params.push(ops.gte)
        conditions.push(`${key} >= ?${params.length}`)
      } else if ('lte' in ops) {
        params.push(ops.lte)
        conditions.push(`${key} <= ?${params.length}`)
      } else if ('gt' in ops) {
        params.push(ops.gt)
        conditions.push(`${key} > ?${params.length}`)
      } else if ('lt' in ops) {
        params.push(ops.lt)
        conditions.push(`${key} < ?${params.length}`)
      } else if ('not' in ops) {
        if (ops.not === null) {
          conditions.push(`${key} IS NOT NULL`)
        } else {
          params.push(ops.not)
          conditions.push(`${key} != ?${params.length}`)
        }
      } else if ('equals' in ops) {
        if (ops.equals === null) {
          conditions.push(`${key} IS NULL`)
        } else {
          params.push(ops.equals)
          conditions.push(`${key} = ?${params.length}`)
        }
      } else {
        // Nested AND/OR conditions
        if ('AND' in ops) {
          const andClauses = (ops.AND as WhereClause[]).map(w => buildWhereClause(w, params))
          conditions.push(`(${andClauses.map(c => c.sql).join(' AND ')})`)
        } else if ('OR' in ops) {
          const orClauses = (ops.OR as WhereClause[]).map(w => buildWhereClause(w, params))
          conditions.push(`(${orClauses.map(c => c.sql).join(' OR ')})`)
        }
      }
    } else {
      if (value === null) {
        conditions.push(`${key} IS NULL`)
      } else {
        params.push(value)
        conditions.push(`${key} = ?${params.length}`)
      }
    }
  }

  return { sql: conditions.join(' AND '), params }
}

function buildOrderByClause(orderBy: unknown): string {
  if (!orderBy) return ''
  if (typeof orderBy === 'string') return `ORDER BY ${orderBy}`

  const orders = Array.isArray(orderBy) ? orderBy : [orderBy]
  const clauses = orders.map((o: Record<string, unknown>) => {
    const [field, dir] = Object.entries(o)[0] as [string, unknown]
    return `${field} ${dir === 'desc' ? 'DESC' : 'ASC'}`
  })
  return `ORDER BY ${clauses.join(', ')}`
}

// ── Model Adapter ──────────────────────────────────────────────

type QueryOptions = {
  where?: WhereClause
  orderBy?: unknown
  take?: number
  skip?: number
  select?: Record<string, boolean>
  include?: Record<string, unknown>
  distinct?: string[]
}

type AggregateOptions = {
  _avg?: Record<string, boolean>
  _count?: Record<string, boolean> | { _all: boolean }
  _min?: Record<string, boolean>
  _max?: Record<string, boolean>
  _sum?: Record<string, boolean>
  where?: WhereClause
}

type GroupByOptions = {
  by: string[]
  _avg?: Record<string, boolean>
  _count?: Record<string, boolean> | { _all: boolean }
  _min?: Record<string, boolean>
  _max?: Record<string, boolean>
  _sum?: Record<string, boolean>
  where?: WhereClause
  orderBy?: unknown
  having?: WhereClause
  take?: number
}

// Need access to tableName in applyIncludes - use a factory wrapper
function createModelAdapter(tableName: string, d1: D1Database) {
  const relTableMap: Record<string, string> = {
    analytics: 'PropertyAnalytics',
  }

  async function applyIncludes(
    row: Record<string, unknown>,
    includes: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const result = { ...row }
    for (const [relationName, relOptions] of Object.entries(includes)) {
      const relTable = relTableMap[relationName] || relationName
      const fkColumn = `${tableName === 'Property' ? 'propertyId' : 'id'}`
      const parentId = row.id as string
      if (!parentId) continue

      const relOpts = (typeof relOptions === 'object' && relOptions !== null ? relOptions : {}) as QueryOptions
      const params: unknown[] = [parentId]
      let sql = `SELECT * FROM ${relTable} WHERE ${fkColumn} = ?1`

      if (relOpts.orderBy) sql += ' ' + buildOrderByClause(relOpts.orderBy)
      if (relOpts.take) sql += ` LIMIT ${relOpts.take}`

      const relResult = await d1.prepare(sql).bind(...params).all<D1Result>()
      result[relationName] = (relResult.results || []).map(r => deserializeRow(r))
    }
    return result
  }

  return {
    async findMany<T = Record<string, unknown>>(options: QueryOptions = {}): Promise<T[]> {
      const params: unknown[] = []
      let sql = `SELECT `

      if (options.select) {
        const cols = Object.entries(options.select)
          .filter(([, v]) => v)
          .map(([k]) => k)
        sql += cols.length > 0 ? cols.join(', ') : '*'
      } else {
        sql += '*'
      }

      sql += ` FROM ${tableName}`

      if (options.where) {
        const { sql: whereSql } = buildWhereClause(options.where, params)
        if (whereSql) sql += ` WHERE ${whereSql}`
      }

      if (options.orderBy) {
        sql += ' ' + buildOrderByClause(options.orderBy)
      }

      if (options.take) sql += ` LIMIT ${options.take}`
      if (options.skip) sql += ` OFFSET ${options.skip}`

      const result = await d1.prepare(sql).bind(...params).all<D1Result<T>>()
      let rows = (result.results || []).map(r => deserializeRow(r))

      if (options.include) {
        rows = await Promise.all(
          rows.map(async (row) => applyIncludes(row as Record<string, unknown>, options.include!))
        ) as T[]
      }

      return rows
    },

    async findFirst<T = Record<string, unknown>>(options: QueryOptions = {}): Promise<T | null> {
      const results = await this.findMany<T>({ ...options, take: 1 })
      return results[0] || null
    },

    async findUnique<T = Record<string, unknown>>(options: { where: WhereClause; include?: Record<string, unknown> }): Promise<T | null> {
      const params: unknown[] = []
      let sql = `SELECT * FROM ${tableName} WHERE `

      const conditions: string[] = []
      for (const [key, value] of Object.entries(options.where)) {
        params.push(value)
        conditions.push(`${key} = ?${params.length}`)
      }
      sql += conditions.join(' AND ') + ' LIMIT 1'

      const result = await d1.prepare(sql).bind(...params).all<D1Result<T>>()
      const rows = (result.results || []).map(r => deserializeRow(r))
      let row = rows[0] || null

      if (row && options.include) {
        row = (await applyIncludes(row as Record<string, unknown>, options.include)) as T
      }

      return row
    },

    async create<T = Record<string, unknown>>(options: { data: Record<string, unknown> }): Promise<T> {
      const keys = Object.keys(options.data)
      const values = Object.values(options.data)
      const id = crypto.randomUUID()
      const createdAt = new Date().toISOString()

      // Add id and createdAt if not provided
      if (!keys.includes('id')) {
        keys.push('id')
        values.push(id)
      }
      if (!keys.includes('createdAt')) {
        keys.push('createdAt')
        values.push(createdAt)
      }
      if (!keys.includes('updatedAt')) {
        keys.push('updatedAt')
        values.push(createdAt)
      }

      const placeholders = keys.map((_, i) => `?${i + 1}`)
      const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders.join(', ')})`

      await d1.prepare(sql).bind(...values).run()

      return { id, createdAt, ...options.data } as T
    },

    async update<T = Record<string, unknown>>(options: { where: WhereClause; data: Record<string, unknown> }): Promise<T | null> {
      const setKeys = Object.keys(options.data)
      const setValues = Object.values(options.data)

      // Add updatedAt
      const updatedAt = new Date().toISOString()
      setKeys.push('updatedAt')
      setValues.push(updatedAt)

      const params: unknown[] = [...setValues]
      let sql = `UPDATE ${tableName} SET `
      sql += setKeys.map((k, i) => `${k} = ?${i + 1}`).join(', ')

      const conditions: string[] = []
      for (const [key, value] of Object.entries(options.where)) {
        params.push(value)
        conditions.push(`${key} = ?${params.length}`)
      }
      sql += ` WHERE ${conditions.join(' AND ')}`

      await d1.prepare(sql).bind(...params).run()

      return this.findUnique<T>(options)
    },

    async delete(options: { where: WhereClause }): Promise<void> {
      const params: unknown[] = []
      let sql = `DELETE FROM ${tableName} WHERE `

      const conditions: string[] = []
      for (const [key, value] of Object.entries(options.where)) {
        params.push(value)
        conditions.push(`${key} = ?${params.length}`)
      }
      sql += conditions.join(' AND ')

      await d1.prepare(sql).bind(...params).run()
    },

    async count(options: { where?: WhereClause } = {}): Promise<number> {
      const params: unknown[] = []
      let sql = `SELECT COUNT(*) as count FROM ${tableName}`

      if (options.where) {
        const { sql: whereSql } = buildWhereClause(options.where, params)
        if (whereSql) sql += ` WHERE ${whereSql}`
      }

      const result = await d1.prepare(sql).bind(...params).first<{ count: number }>()
      return result?.count || 0
    },

    async aggregate(options: AggregateOptions): Promise<Record<string, unknown>> {
      const params: unknown[] = []
      const selects: string[] = []

      if (options._avg) {
        for (const [field] of Object.entries(options._avg)) {
          selects.push(`AVG(CAST(${field} AS REAL)) as _avg_${field}`)
        }
      }
      if (options._count) {
        if (options._count && typeof options._count === 'object' && '_all' in options._count) {
          selects.push('COUNT(*) as _count')
        } else if (typeof options._count === 'object') {
          for (const [field] of Object.entries(options._count)) {
            selects.push(`COUNT(${field}) as _count_${field}`)
          }
        }
      }
      if (options._min) {
        for (const [field] of Object.entries(options._min)) {
          selects.push(`MIN(CAST(${field} AS REAL)) as _min_${field}`)
        }
      }
      if (options._max) {
        for (const [field] of Object.entries(options._max)) {
          selects.push(`MAX(CAST(${field} AS REAL)) as _max_${field}`)
        }
      }
      if (options._sum) {
        for (const [field] of Object.entries(options._sum)) {
          selects.push(`SUM(CAST(${field} AS REAL)) as _sum_${field}`)
        }
      }

      let sql = `SELECT ${selects.join(', ')} FROM ${tableName}`

      if (options.where) {
        const { sql: whereSql } = buildWhereClause(options.where, params)
        if (whereSql) sql += ` WHERE ${whereSql}`
      }

      const result = await d1.prepare(sql).bind(...params).first<Record<string, unknown>>()

      // Transform to Prisma-compatible format
      const output: Record<string, unknown> = {}
      if (options._avg) {
        output._avg = {}
        for (const field of Object.keys(options._avg)) {
          const val = result?.[`_avg_${field}`]
          ;(output._avg as Record<string, unknown>)[field] = val !== null ? Number(val) : null
        }
      }
      if (options._count) {
        if (options._count && typeof options._count === 'object' && '_all' in options._count) {
          output._count = Number(result?._count || 0)
        } else {
          output._count = {}
          for (const field of Object.keys(options._count as Record<string, unknown>)) {
            ;(output._count as Record<string, unknown>)[field] = Number(result?.[`_count_${field}`] || 0)
          }
        }
      }
      if (options._min) {
        output._min = {}
        for (const field of Object.keys(options._min)) {
          const val = result?.[`_min_${field}`]
          ;(output._min as Record<string, unknown>)[field] = val !== null ? Number(val) : null
        }
      }
      if (options._max) {
        output._max = {}
        for (const field of Object.keys(options._max)) {
          const val = result?.[`_max_${field}`]
          ;(output._max as Record<string, unknown>)[field] = val !== null ? Number(val) : null
        }
      }
      if (options._sum) {
        output._sum = {}
        for (const field of Object.keys(options._sum)) {
          const val = result?.[`_sum_${field}`]
          ;(output._sum as Record<string, unknown>)[field] = val !== null ? Number(val) : null
        }
      }

      return output
    },

    async groupBy(options: GroupByOptions): Promise<Record<string, unknown>[]> {
      const params: unknown[] = []
      const selects: string[] = [...options.by]

      if (options._avg) {
        for (const [field] of Object.entries(options._avg)) {
          selects.push(`AVG(CAST(${field} AS REAL)) as _avg_${field}`)
        }
      }
      if (options._count) {
        if (options._count && typeof options._count === 'object' && '_all' in options._count) {
          selects.push('COUNT(*) as _count')
        } else if (typeof options._count === 'object') {
          for (const [field] of Object.entries(options._count)) {
            selects.push(`COUNT(${field}) as _count_${field}`)
          }
        }
      }
      if (options._min) {
        for (const [field] of Object.entries(options._min)) {
          selects.push(`MIN(CAST(${field} AS REAL)) as _min_${field}`)
        }
      }
      if (options._max) {
        for (const [field] of Object.entries(options._max)) {
          selects.push(`MAX(CAST(${field} AS REAL)) as _max_${field}`)
        }
      }
      if (options._sum) {
        for (const [field] of Object.entries(options._sum)) {
          selects.push(`SUM(CAST(${field} AS REAL)) as _sum_${field}`)
        }
      }

      let sql = `SELECT ${selects.join(', ')} FROM ${tableName}`

      if (options.where) {
        const { sql: whereSql } = buildWhereClause(options.where, params)
        if (whereSql) sql += ` WHERE ${whereSql}`
      }

      sql += ` GROUP BY ${options.by.join(', ')}`

      if (options.having) {
        const { sql: havingSql } = buildWhereClause(options.having, params)
        if (havingSql) sql += ` HAVING ${havingSql}`
      }

      if (options.orderBy) {
        sql += ' ' + buildOrderByClause(options.orderBy)
      }

      if (options.take) sql += ` LIMIT ${options.take}`

      const result = await d1.prepare(sql).bind(...params).all<D1Result>()

      return (result.results || []).map(row => {
        const output: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(row)) {
          output[key] = typeof value === 'string' && /^\d+(\.\d+)?$/.test(value)
            ? Number(value)
            : value
        }
        return output
      })
    },
  }
}

// ── Main D1 Client ─────────────────────────────────────────────

export function createD1Client(d1: D1Database) {
  return {
    property: createModelAdapter('Property', d1),
    contactSubmission: createModelAdapter('ContactSubmission', d1),
    marketData: createModelAdapter('MarketData', d1),
    newsletterSubscription: createModelAdapter('NewsletterSubscription', d1),
    priceAlert: createModelAdapter('PriceAlert', d1),
    vizionare: createModelAdapter('Vizionare', d1),
    zone: createModelAdapter('Zone', d1),
    user: createModelAdapter('User', d1),
    userProfile: createModelAdapter('UserProfile', d1),
    propertyAnalytics: createModelAdapter('PropertyAnalytics', d1),
    // Raw query access
    $queryRaw: async <T = Record<string, unknown>>(sql: string, ...params: unknown[]): Promise<T[]> => {
      const result = await d1.prepare(sql).bind(...params).all<D1Result<T>>()
      return (result.results || []).map(r => deserializeRow(r))
    },
    $executeRaw: async (sql: string, ...params: unknown[]): Promise<void> => {
      await d1.prepare(sql).bind(...params).run()
    },
  }
}

// ── D1 Schema SQL ──────────────────────────────────────────────

export const D1_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Post (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  published INTEGER NOT NULL DEFAULT 0,
  authorId TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Property (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  transaction TEXT NOT NULL,
  price REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  areaSqm REAL NOT NULL,
  rooms INTEGER NOT NULL,
  bathrooms INTEGER NOT NULL,
  floor INTEGER,
  yearBuilt INTEGER,
  address TEXT NOT NULL,
  zone TEXT NOT NULL,
  sector TEXT,
  city TEXT NOT NULL DEFAULT 'Bucuresti',
  lat REAL,
  lng REAL,
  status TEXT NOT NULL DEFAULT 'PUBLISHED',
  featured INTEGER NOT NULL DEFAULT 0,
  coverUrl TEXT,
  galleryUrls TEXT DEFAULT '[]',
  pricePerSqm REAL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS PropertyAnalytics (
  id TEXT PRIMARY KEY,
  propertyId TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  inquiries INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  week TEXT NOT NULL,
  recordedAt TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(propertyId, week)
);

CREATE TABLE IF NOT EXISTS MarketData (
  id TEXT PRIMARY KEY,
  zone TEXT NOT NULL,
  type TEXT NOT NULL,
  avgPriceSqm REAL NOT NULL,
  avgAreaSqm REAL NOT NULL,
  totalListed INTEGER NOT NULL DEFAULT 0,
  soldCount INTEGER NOT NULL DEFAULT 0,
  week TEXT NOT NULL,
  recordedAt TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(zone, type, week)
);

CREATE TABLE IF NOT EXISTS Zone (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  sector TEXT,
  description TEXT,
  avgPriceSqm REAL,
  demand TEXT NOT NULL DEFAULT 'Moderata',
  popularFor TEXT DEFAULT '[]',
  sortOrder INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ContactSubmission (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  propertyTitle TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS NewsletterSubscription (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS PriceAlert (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  zone TEXT,
  propertyType TEXT,
  minPrice REAL,
  maxPrice REAL,
  minRooms INTEGER,
  active INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Vizionare (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  userEmail TEXT NOT NULL,
  userName TEXT,
  propertyId TEXT NOT NULL,
  propertyTitle TEXT NOT NULL,
  propertyZone TEXT,
  staffId TEXT,
  staffName TEXT,
  date TEXT NOT NULL,
  startTime TEXT NOT NULL,
  endTime TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS UserProfile (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  fullName TEXT,
  phone TEXT,
  bio TEXT,
  notificationPreferences TEXT DEFAULT '{}',
  displayPreferences TEXT DEFAULT '{}',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_property_zone ON Property(zone);
CREATE INDEX IF NOT EXISTS idx_property_type ON Property(type);
CREATE INDEX IF NOT EXISTS idx_property_transaction ON Property(transaction);
CREATE INDEX IF NOT EXISTS idx_property_status ON Property(status);
CREATE INDEX IF NOT EXISTS idx_property_featured ON Property(featured);
CREATE INDEX IF NOT EXISTS idx_property_sector ON Property(sector);
CREATE INDEX IF NOT EXISTS idx_property_price ON Property(price);
CREATE INDEX IF NOT EXISTS idx_vizionare_userId ON Vizionare(userId);
CREATE INDEX IF NOT EXISTS idx_vizionare_status ON Vizionare(status);
CREATE INDEX IF NOT EXISTS idx_priceAlert_email ON PriceAlert(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON NewsletterSubscription(email);
`