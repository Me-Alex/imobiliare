import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { isValidEmail } from '@/lib/validators'

export async function POST(request: NextRequest) {
  // ── Parse & validate input ──────────────────────────────────
  let email: string

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

  // ── Persist to database ─────────────────────────────────────
  try {
    await db.newsletterSubscription.create({
      data: { email: email.trim().toLowerCase() },
    })
  } catch (error) {
    // Unique constraint violation — user is already subscribed
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
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