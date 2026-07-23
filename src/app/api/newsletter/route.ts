import { NextRequest, NextResponse } from 'next/server'
import { getSafeDb } from '@/lib/edge-db'
import { isValidEmail, normalizeEmail } from '@/lib/validators'
import { createIpRateLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

// Newsletter is a one-shot subscription. Keep the limit tight so a script
// can't burn through the address space.
const newsletterRateLimiter = createIpRateLimiter({ windowMs: 60_000, max: 3 })

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const limit = newsletterRateLimiter.check(ip)
  if (limit.limited) {
    return rateLimitResponse(
      limit,
      'Prea multe încercări de abonare. Te rugăm să aștepți un minut.',
    )
  }

  // ── Parse & validate input ──────────────────────────────────
  let email: string | undefined

  try {
    const body = await request.json()
    ;({ email } = body as { email?: string })
  } catch {
    return NextResponse.json(
      { error: 'Corpul cererii nu este valid JSON.' },
      { status: 400 }
    )
  }

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: 'Adresa de email nu este valida.' },
      { status: 400 }
    )
  }

  const normalizedEmail = normalizeEmail(email)

  // ── Persist to database ─────────────────────────────────────
  const db = await getSafeDb()
  if (!db) {
    // No database on edge — accept subscription silently (demo mode)
    return NextResponse.json({ success: true, message: 'Multumim pentru abonare!' })
  }

  try {
    await db.newsletterSubscription.create({
      data: { email: normalizedEmail },
    })
  } catch (error: any) {
    // Unique constraint violation — user is already subscribed
    if (error?.code === 'P2002') {
      return NextResponse.json({ success: true, message: 'Esti deja abonat!' })
    }

    console.error('Eroare la abonare newsletter:', error)
    return NextResponse.json(
      { error: 'A aparut o eroare. Va rugam incercati din nou.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, message: 'Multumim pentru abonare!' })
}
