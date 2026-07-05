import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, message } = body as {
      name?: string
      email?: string
      phone?: string
      message?: string
    }

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Numele este obligatoriu și trebuie să aibă cel puțin 2 caractere.' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Adresa de email nu este validă.' },
        { status: 400 }
      )
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length < 10) {
      return NextResponse.json(
        { error: 'Numărul de telefon este obligatoriu (minim 10 caractere).' },
        { status: 400 }
      )
    }

    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Mesajul este obligatoriu și trebuie să aibă cel puțin 10 caractere.' },
        { status: 400 }
      )
    }

    // Log the submission (no email sending needed)
    console.log('=== Nouă cerere de contact ===')
    console.log(`Nume: ${name.trim()}`)
    console.log(`Email: ${email.trim()}`)
    console.log(`Telefon: ${phone.trim()}`)
    console.log(`Mesaj: ${message.trim()}`)
    console.log('================================')

    return NextResponse.json({ success: true, message: 'Mesajul a fost trimis cu succes!' })
  } catch (error) {
    console.error('Eroare la trimiterea formularului de contact:', error)
    return NextResponse.json(
      { error: 'A apărut o eroare la trimiterea mesajului. Vă rugăm încercați din nou.' },
      { status: 500 }
    )
  }
}