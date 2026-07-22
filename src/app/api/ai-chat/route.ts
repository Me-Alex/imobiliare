import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  AIServiceConfigurationError,
  AIServiceUnavailableError,
  aiChat,
} from '@/lib/ai-edge'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const requestSchema = z.object({
  message: z.string().trim().min(1).max(1_000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().min(1).max(1_000),
  })).max(12).default([]),
})

const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX = 10
const MAX_TRACKED_IPS = 5_000
const ipTimestamps = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW
  const timestamps = (ipTimestamps.get(ip) || []).filter((timestamp) => timestamp >= windowStart)

  if (timestamps.length >= RATE_LIMIT_MAX) {
    ipTimestamps.set(ip, timestamps)
    return true
  }

  timestamps.push(now)
  ipTimestamps.set(ip, timestamps)

  if (ipTimestamps.size > MAX_TRACKED_IPS) {
    for (const [key, entries] of ipTimestamps) {
      if (entries.length === 0 || entries[entries.length - 1]! < windowStart) ipTimestamps.delete(key)
    }
  }

  return false
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Prea multe solicitari. Incearca din nou peste un minut.' },
      { status: 429 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cererea nu contine JSON valid.' }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Trimite un mesaj intre 1 si 1.000 de caractere.' },
      { status: 400 },
    )
  }

  const systemPrompt = 'Esti un asistent virtual pentru HQS Imobiliare, o platforma de analiza imobiliara din Bucuresti. Raspunde scurt si util in limba romana despre proprietati, zone, preturi, piete imobiliare, sfaturi de cumparare sau vanzare. Daca esti intrebat despre alte subiecte, redirectioneaza politicos spre imobiliare. Maximum 3 propozitii.'

  try {
    const reply = await aiChat(systemPrompt, parsed.data.message, parsed.data.history)
    return NextResponse.json({ reply })
  } catch (error) {
    console.error('AI chat request failed:', error)
    const status = error instanceof AIServiceConfigurationError || error instanceof AIServiceUnavailableError
      ? 503
      : 500
    return NextResponse.json(
      { error: 'Asistentul nu este disponibil momentan. Incearca din nou mai tarziu.' },
      { status },
    )
  }
}
