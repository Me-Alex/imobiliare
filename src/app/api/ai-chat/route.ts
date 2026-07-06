import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

const systemPrompt =
  'Ești un asistent virtual pentru PropMarket, o platformă de analiză imobiliară din București. Răspunde scurt și util în limba română despre: proprietăți, zone, prețuri, piețe imobiliare, sfaturi de cumpărare/vânzare. Dacă ești întrebat despre alte subiecte, redirecționează politicos spre imobiliare. Max 3 propoziții.'

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, history } = body as { message?: string; history?: Array<{ role: string; content: string }> }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { reply: 'Te rog să scrii un mesaj valid.' },
        { status: 400 }
      )
    }

    const zai = await getZAI()

    const messages = [
      { role: 'assistant' as const, content: systemPrompt },
      ...(history || []),
      { role: 'user' as const, content: message.trim() },
    ]

    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
    })

    const reply = completion.choices[0]?.message?.content || 'Ne pare rău, nu am putut genera un răspuns.'

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('AI Chat error:', error)
    return NextResponse.json(
      { reply: 'Ne pare rău, a apărut o eroare. Te rog să încerci din nou.' },
      { status: 500 }
    )
  }
}