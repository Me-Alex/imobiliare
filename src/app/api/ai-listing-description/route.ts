import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateListingContent, regenerateListingVariant } from '@/lib/ai-listing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const requestSchema = z.object({
  propertyType: z.string().trim().min(2).max(60),
  transaction: z.enum(['VANZARE', 'INCHIRIERE']),
  zone: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80).default('București'),
  rooms: z.number().int().min(0).max(30),
  bathrooms: z.number().int().min(0).max(20),
  surface: z.number().positive().max(50_000),
  price: z.number().positive().max(100_000_000),
  currency: z.enum(['EUR', 'RON', 'USD']),
  floor: z.number().int().min(-5).max(300).optional(),
  totalFloors: z.number().int().min(0).max(300).optional(),
  yearBuilt: z.number().int().min(1800).max(new Date().getFullYear() + 5).optional(),
  features: z.array(z.string().trim().min(2).max(60)).max(16).default([]),
  highlights: z.string().trim().max(600).optional(),
  tone: z.enum(['professional', 'warm', 'luxury', 'concise', 'investor']),
  language: z.enum(['ro', 'en']),
  length: z.enum(['short', 'medium', 'long']),
  variantIndex: z.number().int().min(0).max(2).optional(),
})

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 8
const requestsByIp = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (requestsByIp.get(ip) || []).filter((timestamp) => timestamp > now - RATE_LIMIT_WINDOW_MS)
  if (recent.length >= RATE_LIMIT_MAX) {
    requestsByIp.set(ip, recent)
    return true
  }
  recent.push(now)
  requestsByIp.set(ip, recent)
  return false
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Ai generat mai multe variante într-un timp scurt. Încearcă din nou peste un minut.' },
      { status: 429 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cererea nu conține date JSON valide.' }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Completează câmpurile obligatorii înainte de generare.',
        issues: parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 422 },
    )
  }

  try {
    if (typeof parsed.data.variantIndex === 'number') {
      const { variantIndex, ...input } = parsed.data
      const result = await regenerateListingVariant(input, variantIndex)
      return NextResponse.json({ ok: true, ...result })
    }

    const { variantIndex: _variantIndex, ...input } = parsed.data
    void _variantIndex
    const result = await generateListingContent(input)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('[ai-listing-description] generation failed:', error)
    return NextResponse.json(
      { error: 'Nu am putut genera conținutul. Încearcă din nou.' },
      { status: 500 },
    )
  }
}
