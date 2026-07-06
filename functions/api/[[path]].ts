// Cloudflare Pages Function — replaces all Next.js API routes
// Handles every /api/* request using D1 + Supabase REST

interface Env {
  DB: any
}

const SB_URL = 'https://spmapzhlcwhzfrxuvgxd.supabase.co'
const SB_KEY = 'sb_publishable_24oJXCI0JLY1VyLq_Ls-AA_-tYFf729'
const SB_H: Record<string, string> = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
}

// Type mappings
const TYPE_MAP: Record<string, string> = {
  APARTMENT: 'Apartament', COMMERCIAL: 'Comercial', HOUSE: 'Casa',
  VILLA: 'Vila', LAND: 'Teren', GARSONIERA: 'Garsoniera', STUDIO: 'Studio',
}
const REV_TYPE: Record<string, string> = {
  Apartament: 'APARTMENT', Garsoniera: 'APARTMENT', Casa: 'HOUSE',
  Vila: 'VILLA', Teren: 'LAND', 'Spatiu Comercial': 'COMMERCIAL',
  Birou: 'COMMERCIAL', Depozit: 'COMMERCIAL', 'Apartament Nou': 'APARTMENT', Studio: 'APARTMENT',
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    },
  })
}

function cors(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}

function slugify(t: string): string {
  const b = t.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  return `${b}-${Math.random().toString(36).slice(2, 6)}`
}

async function sbGet(path: string): Promise<Record<string, unknown>[]> {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: SB_H })
    if (!r.ok) return []
    return r.json()
  } catch { return [] }
}

function mapTx(t: string | null | undefined): string {
  if (!t) return 'VANZARE'
  const l = t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return l === 'rent' || l === 'inchiriere' ? 'INCHIRIERE' : 'VANZARE'
}

function mapType(t: string | null | undefined): string {
  if (!t) return 'Apartament'
  return TYPE_MAP[t] || t
}

function revType(t: string): string {
  return REV_TYPE[t] || t.toUpperCase()
}

const ZONE_NAMES = [
  'Pipera','Floreasca','Aviatorilor','Dorobanti','Victoriei','Unirii','Militari',
  'Drumul Taberei','Berceni','Pantelimon','Colentina','Vitan','Titan','Otopeni','Corbeanca',
  'Primaverii','Herastrau','Baneasa','Barbu Vacarescu','Romana','Universitate',
  'Centru','Lipscani','Parlament','Crangasi','Grozavesti','Ghencea','Rahova',
  'Politehnica','Iancului','Obor','Dristor','Mihai Bravu','Brancusi','Decebal',
]

function extractZone(address: string, title: string): string {
  const combined = `${address || ''} ${title || ''}`.toLowerCase()
  for (const z of ZONE_NAMES) {
    if (combined.includes(z.toLowerCase())) return z
  }
  return ''
}

function mapSbProp(r: Record<string, unknown>) {
  const area = Number(r.area_sqm ?? 0)
  const price = Number(r.price ?? 0)
  const gal = r.gallery_urls
  return {
    id: r.id, title: r.title || '', slug: r.slug || '',
    description: r.description || '', type: mapType(r.type as string),
    transaction: mapTx(r.transaction_type as string), price, currency: r.currency || 'EUR',
    areaSqm: area, rooms: Number(r.rooms ?? 0), bathrooms: Number(r.bathrooms ?? 0),
    floor: r.floor != null ? Number(r.floor) : null,
    yearBuilt: r.year_built != null ? Number(r.year_built) : null,
    address: r.address || '',
    zone: (r.zone as string) || extractZone(r.address as string, r.title as string),
    sector: (r.sector as string) || null, city: (r.city as string) || 'Bucuresti',
    lat: r.lat != null ? Number(r.lat) : null, lng: r.lng != null ? Number(r.lng) : null,
    status: r.status || 'PUBLISHED', featured: !!(r.featured),
    coverUrl: r.cover_image_url || r.cover_url || null,
    galleryUrls: typeof gal === 'string' ? gal : JSON.stringify(gal || []),
    pricePerSqm: r.price_per_sqm != null ? Number(r.price_per_sqm) : (area > 0 ? Math.round(price / area) : null),
    createdAt: r.created_at || '', updatedAt: r.updated_at || '',
  }
}

function mapD1Prop(r: Record<string, unknown>) {
  const area = Number(r.area_sqm ?? 0)
  const price = Number(r.price ?? 0)
  let gal: string = (r.gallery_urls as string) || '[]'
  try { if (!Array.isArray(JSON.parse(gal))) gal = '[]' } catch { gal = '[]' }
  return {
    id: r.id, title: r.title || '', slug: r.slug || '',
    description: r.description || '', type: r.type || 'Apartament',
    transaction: r.transaction_type === 'rent' || r.transaction_type === 'INCHIRIERE' ? 'INCHIRIERE' : 'VANZARE',
    price, currency: r.currency || 'EUR', areaSqm: area,
    rooms: Number(r.rooms ?? 0), bathrooms: Number(r.bathrooms ?? 0),
    floor: r.floor != null ? Number(r.floor) : null,
    yearBuilt: r.year_built != null ? Number(r.year_built) : null,
    address: r.address || '', zone: r.zone || '', sector: r.sector || null,
    city: r.city || 'Bucuresti', lat: r.lat != null ? Number(r.lat) : null,
    lng: r.lng != null ? Number(r.lng) : null, status: r.status || 'PUBLISHED',
    featured: !!((r.featured as number) ?? 0), coverUrl: r.cover_url || null,
    galleryUrls: gal,
    pricePerSqm: r.price_per_sqm != null ? Number(r.price_per_sqm) : (area > 0 ? Math.round(price / area) : null),
    createdAt: r.created_at || '', updatedAt: r.updated_at || '',
  }
}

// ── Route Handlers ──

async function getProperties(url: URL, env: Env) {
  const type = url.searchParams.get('type') || undefined
  const zone = url.searchParams.get('zone')
  const transaction = url.searchParams.get('transaction')
  const minPrice = url.searchParams.get('minPrice')
  const maxPrice = url.searchParams.get('maxPrice')
  const minRooms = url.searchParams.get('minRooms') || url.searchParams.get('rooms')
  const minArea = url.searchParams.get('minArea')
  const maxArea = url.searchParams.get('maxArea')
  const sort = url.searchParams.get('sort') || 'newest'
  const featured = url.searchParams.get('featured')
  const q = url.searchParams.get('q') || url.searchParams.get('search')
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get('pageSize')) || 12))

  // Supabase query
  let sbPath = 'properties?select=*&status=eq.PUBLISHED'
  if (type) sbPath += `&type=eq.${encodeURIComponent(revType(type))}`
  if (transaction) {
    sbPath += `&transaction_type=eq.${transaction === 'INCHIRIERE' ? 'rent' : 'sale'}`
  }
  if (featured === 'true') sbPath += '&featured=eq.true'
  if (q) {
    const eq = encodeURIComponent(q)
    sbPath += `&or=(title.ilike.*${eq}*,address.ilike.*${eq}*,description.ilike.*${eq}*)`
  }
  const sbRows = await sbGet(sbPath)

  // D1 query
  let d1Sql = 'SELECT * FROM user_properties WHERE status = ?'
  const binds: unknown[] = ['PUBLISHED']
  if (type) { d1Sql += ' AND type = ?'; binds.push(type) }
  if (zone) { d1Sql += ' AND zone = ?'; binds.push(zone) }
  if (transaction) { d1Sql += ' AND transaction_type = ?'; binds.push(transaction) }
  if (featured === 'true') { d1Sql += ' AND featured = ?'; binds.push(1) }
  if (q) {
    d1Sql += ' AND (title LIKE ? OR address LIKE ? OR zone LIKE ?)'
    const lq = `%${q}%`
    binds.push(lq, lq, lq)
  }
  const d1Result = await env.DB.prepare(d1Sql).bind(...binds).all<Record<string, unknown>>()

  // Merge
  let all = [...sbRows.map(mapSbProp), ...d1Result.results.map(mapD1Prop)]

  // In-memory filters
  if (zone) all = all.filter(p => p.zone === zone)
  if (minPrice) all = all.filter(p => p.price >= Number(minPrice))
  if (maxPrice) all = all.filter(p => p.price <= Number(maxPrice))
  if (minRooms) all = all.filter(p => p.rooms >= Number(minRooms))
  if (minArea) all = all.filter(p => p.areaSqm >= Number(minArea))
  if (maxArea) all = all.filter(p => p.areaSqm <= Number(maxArea))

  // Sort
  switch (sort) {
    case 'priceAsc': all.sort((a, b) => a.price - b.price); break
    case 'priceDesc': all.sort((a, b) => b.price - a.price); break
    case 'areaDesc': all.sort((a, b) => b.areaSqm - a.areaSqm); break
    default: all.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  }

  const total = all.length
  const start = (page - 1) * pageSize
  return json({ properties: all.slice(start, start + pageSize), total, page, pageSize, hasMore: start + pageSize < total })
}

async function getPropertyBySlug(slug: string, env: Env) {
  const sb = await sbGet(`properties?slug=eq.${encodeURIComponent(slug)}&status=eq.PUBLISHED&limit=1`)
  if (sb.length > 0) return json({ property: { ...mapSbProp(sb[0]), analytics: [] } })
  const d1 = await env.DB.prepare('SELECT * FROM user_properties WHERE slug = ? AND status = ?').bind(slug, 'PUBLISHED').first<Record<string, unknown>>()
  if (d1) return json({ property: { ...mapD1Prop(d1), analytics: [] } })
  return json({ error: 'Property not found' }, 404)
}

async function createProperty(body: Record<string, unknown>, env: Env) {
  const title = (body.title as string)?.trim()
  if (!title || title.length < 3) return json({ error: 'Titlul este obligatoriu (minim 3 caractere).' }, 400)
  const price = Number(body.price) || 0
  if (price <= 0) return json({ error: 'Pretul este obligatoriu si trebuie sa fie pozitiv.' }, 400)
  const area = Number(body.areaSqm) || 0
  if (area <= 0) return json({ error: 'Suprafata este obligatorie si trebuie sa fie pozitiva.' }, 400)
  const id = crypto.randomUUID()
  const slug = slugify(title)
  const now = new Date().toISOString()
  const galleryUrls = body.galleryUrls ? JSON.stringify(body.galleryUrls) : '[]'
  await env.DB.prepare(`INSERT INTO user_properties (id,title,slug,description,type,transaction_type,price,currency,area_sqm,rooms,bathrooms,floor,year_built,address,zone,sector,city,featured,cover_url,gallery_urls,price_per_sqm,status,user_id,user_email,user_name,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(id, title, slug, (body.description as string)?.trim()||'', body.type||'Apartament', body.transaction||'VANZARE',
      price, body.currency||'EUR', area, Number(body.rooms)||0, Number(body.bathrooms)||0,
      body.floor != null ? Number(body.floor) : null, body.yearBuilt != null ? Number(body.yearBuilt) : null,
      body.address||'', body.zone||'', body.sector||'', body.city||'Bucuresti',
      body.featured ? 1 : 0, body.coverUrl||'', galleryUrls, area > 0 ? Math.round(price/area) : null,
      'PUBLISHED', body.userId||null, body.userEmail||'', body.userName||'', now, now).run()
  const prop = await env.DB.prepare('SELECT * FROM user_properties WHERE id = ?').bind(id).first<Record<string, unknown>>()
  return json({ success: true, property: prop ? mapD1Prop(prop) : { id, title, slug } })
}

async function getZones(env: Env) {
  const { results } = await env.DB.prepare('SELECT * FROM zones ORDER BY sort_order ASC').all<Record<string, unknown>>()
  const zones = results.map(r => ({
    id: r.id, name: r.name, slug: r.slug, sector: r.sector, description: r.description,
    avgPriceSqm: r.avg_price_sqm != null ? Number(r.avg_price_sqm) : null,
    demand: r.demand || 'Moderata', popularFor: r.popular_for || '[]',
    sortOrder: Number(r.sort_order ?? 0),
  }))
  // Count properties per zone from both sources
  const sbProps = await sbGet('properties?select=address,title,status&status=eq.PUBLISHED')
  for (const z of zones) {
    const count = sbProps.filter(p => {
      const combined = `${p.address||''} ${p.title||''}`.toLowerCase()
      return combined.includes(z.name.toLowerCase())
    }).length
    z._count = { properties: count }
  }
  return json({ zones })
}

async function getMarketData(env: Env) {
  const { results: zones } = await env.DB.prepare('SELECT * FROM zones ORDER BY sort_order ASC').all<Record<string, unknown>>()
  const md = await sbGet('market_data?status=eq.ACTIVE&select=zone,avg_price,rent_yield,liquidity,growth,risk&order=zone.asc')
  const weeklyData = md.map((r, i) => ({
    id: `md-${i}`, zone: r.zone || '', type: 'mixed',
    avgPriceSqm: Number(r.avg_price ?? 0), avgAreaSqm: 0,
    totalListed: 0, soldCount: 0, week: new Date().toISOString().slice(0, 10),
  }))
  const allProps = await sbGet('properties?select=price,area_sqm&status=eq.PUBLISHED')
  let totalSqm = 0
  for (const p of allProps) { const a = Number(p.area_sqm); const pr = Number(p.price); if (a > 0) totalSqm += pr / a }
  const avgPrice = allProps.length > 0 ? Math.round(totalSqm / allProps.length) : 0
  const topZone = zones.length > 0 ? zones.reduce((t, z) => (Number(z.avg_price_sqm) || 0) > (Number(t.avg_price_sqm) || 0) ? z : t) : null
  return json({ zones: zones.map(z => ({...z, avgPriceSqm: z.avgPriceSqm, demand: z.demand, popularFor: z.popularFor, sortOrder: z.sortOrder})), weeklyData, summary: { totalProperties: allProps.length, avgPriceSqm: avgPrice, totalZones: zones.length, topZone: topZone ? { name: topZone.name, avgPriceSqm: topZone.avg_price_sqm } : null } })
}

async function postContact(body: Record<string, unknown>, env: Env) {
  const name = (body.name as string)?.trim()
  const email = (body.email as string)?.trim()
  const phone = (body.phone as string)?.trim()
  const message = (body.message as string)?.trim()
  if (!name || name.length < 2) return json({ error: 'Numele este obligatoriu (minim 2 caractere).' }, 400)
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Adresa de email nu este valida.' }, 400)
  if (!phone || phone.length < 10) return json({ error: 'Numarul de telefon este obligatoriu (minim 10 caractere).' }, 400)
  if (!message || message.length < 10) return json({ error: 'Mesajul este obligatoriu (minim 10 caractere).' }, 400)
  await env.DB.prepare('INSERT INTO contact_submissions (id,name,email,phone,message,property_title,created_at) VALUES (?,?,?,?,?,?,?)')
    .bind(crypto.randomUUID(), name, email, phone, message, body.propertyTitle || null, new Date().toISOString()).run()
  return json({ success: true, message: 'Mesajul a fost trimis cu succes!' })
}

async function postNewsletter(body: Record<string, unknown>, env: Env) {
  const email = (body.email as string)?.trim()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Adresa de email nu este valida.' }, 400)
  try {
    await env.DB.prepare('INSERT INTO newsletter_subscriptions (id,email,created_at) VALUES (?,?,?)')
      .bind(crypto.randomUUID(), email.toLowerCase(), new Date().toISOString()).run()
    return json({ success: true, message: 'Multumim pentru abonare!' })
  } catch {
    return json({ success: true, message: 'Esti deja abonat!' })
  }
}

async function getPriceAlerts(env: Env) {
  const { results } = await env.DB.prepare('SELECT * FROM price_alerts ORDER BY created_at DESC').all<Record<string, unknown>>()
  return json(results.map(r => ({ id: r.id, email: r.email, zone: r.zone, propertyType: r.property_type, minPrice: r.min_price, maxPrice: r.max_price, minRooms: r.min_rooms, active: !!r.active, createdAt: r.created_at })))
}

async function postPriceAlert(body: Record<string, unknown>, env: Env) {
  const email = (body.email as string)?.trim()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Email invalid.' }, 400)
  const id = crypto.randomUUID()
  await env.DB.prepare('INSERT INTO price_alerts (id,email,zone,property_type,min_price,max_price,min_rooms,active,created_at) VALUES (?,?,?,?,?,?,?,?,?)')
    .bind(id, email, body.zone || null, body.propertyType || null, body.minPrice || null, body.maxPrice || null, body.minRooms || null, 1, new Date().toISOString()).run()
  return json({ id, email, zone: body.zone, propertyType: body.propertyType, minPrice: body.minPrice, maxPrice: body.maxPrice, minRooms: body.minRooms, active: true, createdAt: new Date().toISOString() }, 201)
}

async function deletePriceAlert(id: string, env: Env) {
  await env.DB.prepare('DELETE FROM price_alerts WHERE id = ?').bind(id).run()
  return json({ success: true })
}

async function getSearchSuggestions(q: string, env: Env) {
  if (!q || q.length < 2) return json({ suggestions: [] })
  const suggestions: Record<string, unknown>[] = []
  // Search D1 zones
  const { results: zRows } = await env.DB.prepare('SELECT name,slug,sector,avg_price_sqm FROM zones WHERE name LIKE ? OR sector LIKE ? ORDER BY sort_order ASC LIMIT 5').bind(`%${q}%`, `%${q}%`).all<Record<string, unknown>>()
  for (const r of zRows) suggestions.push({ type: 'zone', name: r.name, sector: r.sector, avgPriceSqm: r.avg_price_sqm })
  // Search Supabase properties
  const pRows = await sbGet(`properties?status=eq.PUBLISHED&or=(title.ilike.*${encodeURIComponent(q)}*,address.ilike.*${encodeURIComponent(q)}*)&select=id,title,slug,type,transaction_type,price,area_sqm&limit=5&order=created_at.desc`)
  for (const r of pRows) suggestions.push({ type: 'property', name: r.title, slug: r.slug, zone: extractZone(r.address as string, r.title as string), propertyType: mapType(r.type as string), transaction: mapTx(r.transaction_type as string), price: Number(r.price), areaSqm: Number(r.area_sqm) })
  return json({ suggestions: suggestions.slice(0, 10) })
}

async function compareProperties(body: Record<string, unknown>, env: Env) {
  const ids = body.ids as string[]
  if (!ids || !Array.isArray(ids) || ids.length < 2 || ids.length > 3) return json({ error: 'Trimiteti intre 2 si 3 ID-uri valide.' }, 400)
  const idList = ids.map(encodeURIComponent).join(',')
  const sb = await sbGet(`properties?id=in.(${idList})&status=eq.PUBLISHED&select=*`)
  const d1Ids = ids.filter(id => !sb.some(p => p.id === id))
  let d1Props: Record<string, unknown>[] = []
  if (d1Ids.length > 0) {
    const placeholders = d1Ids.map(() => '?').join(',')
    const { results } = await env.DB.prepare(`SELECT * FROM user_properties WHERE id IN (${placeholders}) AND status = ?`).bind(...d1Ids, 'PUBLISHED').all<Record<string, unknown>>()
    d1Props = results
  }
  const all = [...sb.map(mapSbProp), ...d1Props.map(mapD1Prop)]
  return json({ properties: all })
}

async function getAdminDashboard(env: Env) {
  const [contacts, newsletters, alerts] = await Promise.all([
    env.DB.prepare('SELECT * FROM contact_submissions ORDER BY created_at DESC LIMIT 50').all<Record<string, unknown>>(),
    env.DB.prepare('SELECT * FROM newsletter_subscriptions ORDER BY created_at DESC LIMIT 50').all<Record<string, unknown>>(),
    env.DB.prepare('SELECT * FROM price_alerts ORDER BY created_at DESC LIMIT 50').all<Record<string, unknown>>(),
  ])
  const sbProps = await sbGet('properties?select=id,title,slug,price,type,transaction_type,status,zone,created_at&limit=100')
  const { results: d1Props } = await env.DB.prepare('SELECT id,title,slug,price,type,transaction_type as transaction,status,zone,created_at FROM user_properties ORDER BY created_at DESC LIMIT 100').all<Record<string, unknown>>()
  const allProps = [...sbProps.map(mapSbProp), ...d1Props.map(mapD1Prop)]
  return json({
    contacts: contacts.results, newsletters: newsletters.results, alerts: alerts.results, properties: allProps,
    stats: {
      totalContacts: contacts.results.length, totalNewsletters: newsletters.results.length,
      totalAlerts: alerts.results.filter(a => a.active).length, totalProperties: allProps.length,
      activeProperties: allProps.filter(p => p.status === 'PUBLISHED').length,
      soldProperties: allProps.filter(p => p.status === 'SOLD').length,
    },
  })
}

// ── Main Router ──

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context
  if (request.method === 'OPTIONS') return cors()
  const url = new URL(request.url)
  const path = url.pathname.replace(/\/api\/?/, '').replace(/\/+$/, '')
  const method = request.method

  try {
    if (!env.DB) return json({ error: "D1 database not configured" }, 503)
    if (path === 'properties/compare' && method === 'POST') return compareProperties(await request.json(), env)
    if (path === 'properties' && method === 'GET') return getProperties(url, env)
    if (path === 'properties' && method === 'POST') return createProperty(await request.json(), env)
    if (path.startsWith('properties/') && method === 'GET') return getPropertyBySlug(path.slice('properties/'.length), env)
    if (path === 'zones' && method === 'GET') return getZones(env)
    if (path === 'market-data' && method === 'GET') return getMarketData(env)
    if (path === 'contact' && method === 'POST') return postContact(await request.json(), env)
    if (path === 'newsletter' && method === 'POST') return postNewsletter(await request.json(), env)
    if (path === 'price-alerts' && method === 'GET') return getPriceAlerts(env)
    if (path === 'price-alerts' && method === 'POST') return postPriceAlert(await request.json(), env)
    if (path.startsWith('price-alerts/') && method === 'DELETE') return deletePriceAlert(path.slice('price-alerts/'.length), env)
    if (path === 'search/suggestions' && method === 'GET') return getSearchSuggestions(url.searchParams.get('q')?.trim() || '', env)
    if (path === 'admin/dashboard' && method === 'GET') return getAdminDashboard(env)
    if (path === 'ai-chat' && method === 'POST') return json({ reply: 'Funcția AI chat este în curs de actualizare. Vă rugăm încercați mai târziu.' })
    return json({ error: 'Not found' }, 404)
  } catch (err) {
    console.error('API error:', err)
    return json({ error: err instanceof Error ? err.message : 'Internal server error' }, 500)
  }
}
