import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const requestSchema = z.object({
  query: z.string().trim().min(4).max(240),
})

interface NominatimResult {
  lat?: string
  lon?: string
  display_name?: string
  type?: string
  importance?: number
}

interface GeocodeResult {
  lat: number
  lng: number
  displayName: string
  type: string
}

const cache = new Map<string, { expiresAt: number; results: GeocodeResult[] }>()
let nextAllowedRequestAt = 0

const CACHE_TTL_MS = 24 * 60 * 60 * 1_000
const NOMINATIM_BASE_URL = process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org'

function getCached(query: string): GeocodeResult[] | null {
  const cached = cache.get(query)
  if (!cached) return null
  if (cached.expiresAt <= Date.now()) {
    cache.delete(query)
    return null
  }
  return cached.results
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cererea nu conține date valide.' }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Introdu o adresă de cel puțin 4 caractere.' }, { status: 422 })
  }

  const normalizedQuery = parsed.data.query.replace(/\s+/g, ' ').toLocaleLowerCase('ro-RO')
  const cached = getCached(normalizedQuery)
  if (cached) return NextResponse.json({ ok: true, cached: true, results: cached })

  const now = Date.now()
  if (now < nextAllowedRequestAt) {
    return NextResponse.json(
      { error: 'Așteaptă o secundă înainte de o nouă căutare.' },
      { status: 429, headers: { 'Retry-After': '1' } },
    )
  }
  nextAllowedRequestAt = now + 1_100

  const url = new URL('/search', NOMINATIM_BASE_URL)
  url.searchParams.set('q', parsed.data.query)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '5')
  url.searchParams.set('countrycodes', 'ro')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('accept-language', 'ro,en')

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'ro,en;q=0.8',
        'User-Agent': 'HQS-Imobiliare/1.0 (+https://hqs-imobiliare.floreaalexandru2002.workers.dev; contact: contact@hqsimobiliare.ro)',
      },
      signal: AbortSignal.timeout(8_000),
    })

    if (!response.ok) {
      throw new Error(`Geocoder responded with ${response.status}`)
    }

    const raw = await response.json() as NominatimResult[]
    const results = raw.map((item): GeocodeResult | null => {
      const lat = Number(item.lat)
      const lng = Number(item.lon)
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || !item.display_name) return null
      return {
        lat,
        lng,
        displayName: item.display_name.slice(0, 320),
        type: item.type || 'adresă',
      }
    }).filter((item): item is GeocodeResult => item !== null)

    cache.set(normalizedQuery, { expiresAt: now + CACHE_TTL_MS, results })
    return NextResponse.json({ ok: true, cached: false, results })
  } catch (error) {
    console.error('[geocode] address lookup failed:', error)
    return NextResponse.json(
      { error: 'Serviciul de căutare nu este disponibil. Poți poziționa pinul manual pe hartă.' },
      { status: 503 },
    )
  }
}
