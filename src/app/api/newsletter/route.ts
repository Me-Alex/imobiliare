export const dynamic = "force-static";
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body as { email?: string }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Adresa de email nu este valida.' },
        { status: 400 }
      )
    }

    // Try to create — unique constraint will catch duplicates
    try {
      await db.newsletterSubscription.create({
        data: { email: email.trim().toLowerCase() },
      })
    } catch {
      // Already subscribed — that's fine, just return success
      return NextResponse.json({ success: true, message: 'Esti deja abonat!' })
    }

    return NextResponse.json({ success: true, message: 'Multumim pentru abonare!' })
  } catch (error) {
    console.error('Eroare la abonare newsletter:', error)
    return NextResponse.json(
      { error: 'A aparut o eroare. Va rugam incercati din nou.' },
      { status: 500 }
    )
  }
}