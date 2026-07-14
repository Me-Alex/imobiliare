import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { isValidEmail } from '@/lib/validators'

export async function POST(request: NextRequest) {
  // ── Parse & validate input ──────────────────────────────────
  let name: string
  let email: string
  let phone: string
  let message: string
  let propertyTitle: string | undefined

  try {
    const body = await request.json()
    ;({ name, email, phone, message, propertyTitle } = body as {
      name?: string
      email?: string
      phone?: string
      message?: string
      propertyTitle?: string
    })
  } catch {
    return NextResponse.json(
      { error: 'Corpul cererii nu este valid JSON.' },
      { status: 400 }
    )
  }

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json(
      { error: 'Numele este obligatoriu si trebuie sa aiba cel putin 2 caractere.' },
      { status: 400 }
    )
  }

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: 'Adresa de email nu este valida.' },
      { status: 400 }
    )
  }

  if (!phone || typeof phone !== 'string' || phone.trim().length < 10) {
    return NextResponse.json(
      { error: 'Numarul de telefon este obligatoriu (minim 10 caractere).' },
      { status: 400 }
    )
  }

  if (!message || typeof message !== 'string' || message.trim().length < 10) {
    return NextResponse.json(
      { error: 'Mesajul este obligatoriu si trebuie sa aiba cel putin 10 caractere.' },
      { status: 400 }
    )
  }

  // ── Persist to database ─────────────────────────────────────
  try {
    await db.contactSubmission.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        message: message.trim(),
        propertyTitle: propertyTitle?.trim() || null,
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      console.error('Prisma error saving contact:', error.code, error.message)
    } else {
      console.error('Eroare la trimiterea formularului de contact:', error)
    }
    return NextResponse.json(
      { error: 'A aparut o eroare la trimiterea mesajului. Va rugam incercati din nou.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, message: 'Mesajul a fost trimis cu succes!' })
}