import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// ── Simple in-memory rate limiter ─────────────────────────────
const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX = 8

const ipTimestamps = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  let timestamps = ipTimestamps.get(ip)

  if (!timestamps) {
    timestamps = []
    ipTimestamps.set(ip, timestamps)
  }

  const windowStart = now - RATE_LIMIT_WINDOW
  while (timestamps.length > 0 && timestamps[0]! < windowStart) {
    timestamps.shift()
  }

  if (timestamps.length >= RATE_LIMIT_MAX) {
    return true
  }

  timestamps.push(now)
  return false
}

// ── AI setup ──────────────────────────────────────────────────
const systemPrompt = `Ești un expert în evaluarea proprietăților imobiliare din București, România. Analizezi datele furnizate și oferi o estimare realistă a valorii de piață.

REGULI STRICTE:
- Răspunde ÎNTOTDEAUNA cu un obiect JSON valid (fără markdown, fără backticks, fără explicații suplimentare).
- Structura JSON trebuie să fie exact următoarea:
{
  "estimatedValue": <număr>,
  "pricePerSqm": <număr>,
  "confidenceRange": [<valoare_min>, <valoare_max>],
  "marketTrend": "In crestere" | "Stabil" | "In scadere",
  "zoneAnalysis": "<text analiză zonă, 2-3 propoziții>",
  "recommendations": ["<recomandare 1>", "<recomandare 2>", "<recomandare 3>"],
  "comparableProperties": [
    {"title": "<titlu proprietate>", "zone": "<zonă>", "price": <număr>, "areaSqm": <număr>, "pricePerSqm": <număr>}
  ]
}

CONSIDERAȚII PENTRU EVALUARE:
- Prețurile variază semnificativ în funcție de zonă (Dorobanți și Primăverii sunt cele mai scumpe)
- Apartamentele noi sunt cu 15-30% mai scumpe decât cele vechi
- Etajul influențează prețul (etajele intermediare sunt mai scumpe, parter și ultimul etaj mai ieftine)
- Starea proprietății contează: Nou > Renovat recent > Bun > Necesită renovare
- Pentru București, prețul mediu pe m² în 2024 este: 1.500-3.500 EUR (apartamente), 800-2.000 EUR (case)
- Zona centrală și semi-centrală au cele mai mari prețuri
- Pentru închiriere, prețurile sunt lunare

GENEREAZĂ exact 3 proprietăți comparabile realiste pentru zona și tipul cerut.

RĂSPUNDE DOAR CU JSON, FĂRĂ ALTE TEXTE.`

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

// ── Fallback response ─────────────────────────────────────────
function buildFallback(data: Record<string, unknown>) {
  const type = (data.type as string) || 'Apartament'
  const transaction = (data.transaction as string) || 'Vanzare'
  const areaSqm = Number(data.areaSqm) || 50
  const zone = (data.zone as string) || 'Centru'

  const isRent = transaction.toLowerCase().includes('inchiriere')
  const basePricePerSqm = isRent ? 12 : 2200
  const estimatedValue = Math.round(basePricePerSqm * areaSqm)

  return {
    estimatedValue,
    pricePerSqm: basePricePerSqm,
    confidenceRange: [
      Math.round(estimatedValue * 0.85),
      Math.round(estimatedValue * 1.15),
    ],
    marketTrend: 'Stabil',
    zoneAnalysis: `Zona ${zone} reprezintă o zonă cu potențial stabil pentru proprietăți de tip ${type}. Prețurile sunt în linie cu media pieței din București.`,
    recommendations: [
      'Consultați un evaluator profesional pentru o estimare exactă',
      'Comparați cu proprietăți similare din zonă',
      'Luați în considerare starea proprietății și finisajele',
    ],
    comparableProperties: [
      { title: `${type} similar 1`, zone, price: Math.round(estimatedValue * 0.95), areaSqm, pricePerSqm: Math.round(basePricePerSqm * 0.95) },
      { title: `${type} similar 2`, zone, price: estimatedValue, areaSqm, pricePerSqm: basePricePerSqm },
      { title: `${type} similar 3`, zone, price: Math.round(estimatedValue * 1.05), areaSqm, pricePerSqm: Math.round(basePricePerSqm * 1.05) },
    ],
  }
}

// ── Handler ───────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Prea multe solicitări. Te rog să încerci din nou peste un minut.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const { type, transaction, zone, sector, areaSqm, rooms, floor, yearBuilt, condition } = body as {
      type?: string
      transaction?: string
      zone?: string
      sector?: string
      areaSqm?: number
      rooms?: number
      floor?: number
      yearBuilt?: number
      condition?: string
    }

    if (!type || !transaction || !zone || !areaSqm || !rooms) {
      return NextResponse.json(
        { error: 'Câmpuri obligatorii lipsă: tip, tranzacție, zonă, suprafață, camere.' },
        { status: 400 }
      )
    }

    const userMessage = `Evaluează următoarea proprietate:
- Tip: ${type}
- Tranzacție: ${transaction}
- Zonă: ${zone}
- Sector: ${sector || 'Nespecificat'}
- Suprafață: ${areaSqm} m²
- Camere: ${rooms}
${floor ? `- Etaj: ${floor}` : ''}
${yearBuilt ? `- An construcție: ${yearBuilt}` : ''}
${condition ? `- Stare: ${condition}` : ''}

Răspunde DOAR cu JSON-ul solicitat.`

    const zai = await getZAI()

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant' as const, content: systemPrompt },
        { role: 'user' as const, content: userMessage },
      ],
      thinking: { type: 'disabled' },
    })

    const raw = completion.choices[0]?.message?.content || ''

    // Try to extract JSON from the response
    let parsed: unknown
    try {
      // Try direct parse first
      parsed = JSON.parse(raw)
    } catch {
      // Try to extract JSON from markdown code blocks or surrounding text
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0])
        } catch {
          // Fallback
          parsed = null
        }
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      const fallback = buildFallback(body)
      return NextResponse.json({ ...fallback, _fallback: true })
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Valuation API error:', error)
    const fallback = buildFallback({})
    return NextResponse.json({ ...fallback, _fallback: true })
  }
}