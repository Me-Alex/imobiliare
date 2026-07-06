import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, message, propertyTitle } = body as {
      name?: string
      email?: string
      phone?: string
      message?: string
      propertyTitle?: string
    }

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Numele este obligatoriu si trebuie sa aiba cel putin 2 caractere.' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
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

    // Persist to database
    await db.contactSubmission.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        message: message.trim(),
        propertyTitle: propertyTitle?.trim() || null,
      },
    })

    return NextResponse.json({ success: true, message: 'Mesajul a fost trimis cu succes!' })
  } catch (error) {
    console.error('Eroare la trimiterea formularului de contact:', error)
    return NextResponse.json(
      { error: 'A aparut o eroare la trimiterea mesajului. Va rugam incercati din nou.' },
      { status: 500 }
    )
  }
}