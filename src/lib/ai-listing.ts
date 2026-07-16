import { aiCompletion } from '@/lib/ai-edge'
import type { ListingInput, ListingResult, ListingVariant } from '@/lib/ai-listing-types'

const VARIANT_LABELS = [
  'Locație & lifestyle',
  'Caracteristici & finisaje',
  'Oportunitate & preț',
] as const

const TONE_INSTRUCTIONS: Record<ListingInput['tone'], string> = {
  professional: 'profesional, clar și informativ, cu formulări precise',
  warm: 'cald și apropiat, ajutând cititorul să își imagineze viața în proprietate',
  luxury: 'premium și rafinat, fără superlative neverificabile',
  concise: 'direct și factual, fără introduceri lungi',
  investor: 'analitic și orientat spre valoare, fără promisiuni de randament',
}

const LENGTH_INSTRUCTIONS: Record<ListingInput['length'], string> = {
  short: '45-70 de cuvinte',
  medium: '90-130 de cuvinte',
  long: '150-210 cuvinte',
}

function listingFacts(input: ListingInput): string {
  return [
    `Tip: ${input.propertyType}`,
    `Tranzacție: ${input.transaction === 'VANZARE' ? 'vânzare' : 'închiriere'}`,
    `Localizare: ${input.zone}, ${input.city}`,
    `Camere: ${input.rooms}`,
    `Băi: ${input.bathrooms}`,
    `Suprafață: ${input.surface} m²`,
    `Preț: ${input.price.toLocaleString('ro-RO')} ${input.currency}`,
    input.floor !== undefined
      ? `Etaj: ${input.floor}${input.totalFloors !== undefined ? `/${input.totalFloors}` : ''}`
      : null,
    input.yearBuilt ? `An construcție: ${input.yearBuilt}` : null,
    input.features.length ? `Facilități confirmate: ${input.features.join(', ')}` : null,
    input.highlights?.trim() ? `Mențiuni oferite de utilizator: ${input.highlights.trim()}` : null,
  ].filter(Boolean).join('\n')
}

function stripCodeFence(value: string): string {
  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) return fenced[1].trim()
  const object = value.match(/\{[\s\S]*\}/)
  return object?.[0]?.trim() || value.trim()
}

function cleanText(value: unknown, maxLength = 4_000): string {
  if (typeof value !== 'string') return ''
  return value.replace(/^[-*#\s]+/, '').replace(/\s+$/g, '').trim().slice(0, maxLength)
}

function truncateTitle(value: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= 70) return normalized
  const shortened = normalized.slice(0, 70)
  const lastSpace = shortened.lastIndexOf(' ')
  return `${shortened.slice(0, lastSpace > 45 ? lastSpace : 67).trim()}…`
}

function parseGeneratedContent(raw: string): Omit<ListingResult, 'generatedBy'> {
  const parsed = JSON.parse(stripCodeFence(raw)) as {
    variants?: Array<{ label?: unknown; text?: unknown } | string>
    titles?: unknown[]
  }

  const variants = (parsed.variants || []).slice(0, 3).map((variant, index) => {
    const text = cleanText(typeof variant === 'string' ? variant : variant.text)
    const label = cleanText(typeof variant === 'string' ? '' : variant.label, 80)
    return {
      id: `v${index + 1}`,
      label: label || VARIANT_LABELS[index],
      text,
    }
  }).filter((variant) => variant.text.length >= 40)

  const titles = (parsed.titles || [])
    .map((title) => truncateTitle(cleanText(title, 160)))
    .filter(Boolean)
    .slice(0, 5)

  if (variants.length !== 3) throw new Error('AI response did not contain three valid variants')
  return { variants, titles }
}

function formatPrice(input: ListingInput): string {
  return `${input.price.toLocaleString(input.language === 'ro' ? 'ro-RO' : 'en-US')} ${input.currency}`
}

function typeWithRooms(input: ListingInput): string {
  if (input.rooms <= 0 || /teren/i.test(input.propertyType)) return input.propertyType
  return input.language === 'ro'
    ? `${input.propertyType} cu ${input.rooms} camere`
    : `${input.rooms}-room ${input.propertyType.toLowerCase()}`
}

function featureSentence(input: ListingInput): string {
  if (!input.features.length) return ''
  return input.language === 'ro'
    ? `Dotările confirmate includ ${input.features.join(', ')}.`
    : `Confirmed features include ${input.features.join(', ')}.`
}

function extraFactsSentence(input: ListingInput): string {
  const parts: string[] = []
  if (input.bathrooms > 0) parts.push(input.language === 'ro' ? `${input.bathrooms} băi` : `${input.bathrooms} bathrooms`)
  if (input.floor !== undefined) {
    parts.push(input.language === 'ro'
      ? `etajul ${input.floor}${input.totalFloors !== undefined ? ` din ${input.totalFloors}` : ''}`
      : `floor ${input.floor}${input.totalFloors !== undefined ? ` of ${input.totalFloors}` : ''}`)
  }
  if (input.yearBuilt) parts.push(input.language === 'ro' ? `construcție ${input.yearBuilt}` : `built in ${input.yearBuilt}`)
  if (!parts.length) return ''
  return input.language === 'ro'
    ? `Detaliile declarate includ ${parts.join(', ')}.`
    : `The provided details include ${parts.join(', ')}.`
}

function buildFallback(input: ListingInput): Omit<ListingResult, 'generatedBy'> {
  const property = typeWithRooms(input)
  const action = input.transaction === 'VANZARE' ? 'vânzare' : 'închiriere'
  const englishAction = input.transaction === 'VANZARE' ? 'for sale' : 'for rent'
  const price = formatPrice(input)
  const extra = extraFactsSentence(input)
  const features = featureSentence(input)
  const note = input.highlights?.trim()

  const roVariants = [
    `${property} disponibil pentru ${action} în ${input.zone}, ${input.city}. Cei ${input.surface} m² oferă o bază bine dimensionată pentru nevoile descrise în anunț. ${extra} ${features} Prețul solicitat este ${price}. Pentru informații suplimentare și programarea unei vizionări, contactează echipa HQS Imobiliare.`,
    `În ${input.zone}, această proprietate de tip ${input.propertyType.toLowerCase()} propune ${input.surface} m² și ${input.rooms} camere. ${extra} ${features}${note ? ` Proprietarul menționează: ${note}.` : ''} Datele pot fi verificate la vizionare, iar documentația relevantă poate fi solicitată înaintea unei decizii. Programează o întâlnire pentru a vedea proprietatea.`,
    `O opțiune de ${action} în zona ${input.zone}, listată la ${price}. Proprietatea are ${input.surface} m², ${input.rooms} camere${input.bathrooms ? ` și ${input.bathrooms} băi` : ''}. ${features} Configurația și amplasarea pot fi analizate direct la vizionare, în funcție de obiectivele tale rezidențiale sau investiționale. Solicită detaliile complete și o programare.`,
  ]

  const enVariants = [
    `${property} ${englishAction} in ${input.zone}, ${input.city}. Its ${input.surface} m² provide a well-sized starting point for the needs described in this listing. ${extra} ${features} The asking price is ${price}. Contact HQS Imobiliare for additional details and to arrange a viewing.`,
    `Located in ${input.zone}, this ${input.propertyType.toLowerCase()} offers ${input.surface} m² and ${input.rooms} rooms. ${extra} ${features}${note ? ` The owner also notes: ${note}.` : ''} The information can be checked during the viewing, and relevant documents can be requested before making a decision. Book a visit to experience the property in person.`,
    `A ${englishAction} opportunity in ${input.zone}, listed at ${price}. The property has ${input.surface} m², ${input.rooms} rooms${input.bathrooms ? ` and ${input.bathrooms} bathrooms` : ''}. ${features} Its layout and location can be assessed during a viewing based on your residential or investment goals. Request the full details and schedule a visit.`,
  ]

  const titleBase = input.language === 'ro'
    ? [
        `${property} în ${input.zone} · ${input.surface} m²`,
        `${input.propertyType} de ${action}, ${input.zone}`,
        `${property}, ${input.zone} · ${price}`,
        `${input.zone}: ${property} · ${input.surface} m²`,
        `${input.propertyType} ${input.rooms ? `${input.rooms} camere, ` : ''}${input.zone}`,
      ]
    : [
        `${property} in ${input.zone} · ${input.surface} m²`,
        `${input.propertyType} ${englishAction} in ${input.zone}`,
        `${property}, ${input.zone} · ${price}`,
        `${input.zone}: ${property} · ${input.surface} m²`,
        `${input.propertyType} with ${input.rooms} rooms in ${input.zone}`,
      ]

  return {
    variants: (input.language === 'ro' ? roVariants : enVariants).map((text, index) => ({
      id: `v${index + 1}`,
      label: VARIANT_LABELS[index],
      text: text.replace(/\s+/g, ' ').trim(),
    })),
    titles: titleBase.map(truncateTitle),
  }
}

function buildGenerationPrompt(input: ListingInput): { system: string; user: string } {
  const language = input.language === 'ro' ? 'limba română' : 'English'
  const system = `Ești un copywriter imobiliar senior pentru piața din România. Scrii în ${language}, cu un ton ${TONE_INSTRUCTIONS[input.tone]}. Generează conținut corect, onest și potrivit pentru portaluri imobiliare.

Reguli obligatorii:
- Folosește exclusiv informațiile primite. Nu inventa dotări, distanțe, orientare, stare, randament sau vecinătăți.
- Nu folosi ALL CAPS, emoji, markdown sau afirmații garantate.
- Fiecare descriere trebuie să aibă ${LENGTH_INSTRUCTIONS[input.length]} și să se încheie cu un îndemn discret la vizionare.
- Titlurile au maximum 70 de caractere și includ tipul, zona și un atribut verificabil.
- Răspunde exclusiv cu JSON valid, fără code fence, în forma:
{"variants":[{"label":"Locație & lifestyle","text":"..."},{"label":"Caracteristici & finisaje","text":"..."},{"label":"Oportunitate & preț","text":"..."}],"titles":["...","...","...","...","..."]}

Cele trei variante trebuie să aibă unghiuri și formulări vizibil diferite.`

  return { system, user: `Datele proprietății:\n${listingFacts(input)}` }
}

function buildRegenerationPrompt(input: ListingInput, variantIndex: number): { system: string; user: string } {
  const angle = VARIANT_LABELS[variantIndex] || VARIANT_LABELS[0]
  const language = input.language === 'ro' ? 'română' : 'engleză'
  return {
    system: `Ești un copywriter imobiliar senior. Scrie o singură descriere în limba ${language}, cu unghiul „${angle}”, ton ${TONE_INSTRUCTIONS[input.tone]} și lungime ${LENGTH_INSTRUCTIONS[input.length]}. Folosește exclusiv datele furnizate, nu inventa facilități sau promisiuni. Fără titlu, markdown sau emoji. Încheie cu un îndemn discret la vizionare.`,
    user: `Datele proprietății:\n${listingFacts(input)}`,
  }
}

export async function generateListingContent(input: ListingInput): Promise<ListingResult> {
  const fallback = buildFallback(input)
  try {
    const prompt = buildGenerationPrompt(input)
    const raw = await aiCompletion(prompt.system, prompt.user)
    const generated = parseGeneratedContent(raw)
    return {
      variants: generated.variants,
      titles: generated.titles.length === 5 ? generated.titles : fallback.titles,
      generatedBy: 'ai',
    }
  } catch (error) {
    console.warn('[ai-listing] using template fallback:', error instanceof Error ? error.message : error)
    return { ...fallback, generatedBy: 'template' }
  }
}

export async function regenerateListingVariant(
  input: ListingInput,
  variantIndex: number,
): Promise<{ variant: ListingVariant; generatedBy: ListingResult['generatedBy'] }> {
  const fallback = buildFallback(input).variants[variantIndex] || buildFallback(input).variants[0]
  try {
    const prompt = buildRegenerationPrompt(input, variantIndex)
    const text = cleanText(await aiCompletion(prompt.system, prompt.user))
    if (text.length < 40) throw new Error('AI response was too short')
    return {
      variant: { id: `v${variantIndex + 1}`, label: VARIANT_LABELS[variantIndex], text },
      generatedBy: 'ai',
    }
  } catch (error) {
    console.warn('[ai-listing] using variant fallback:', error instanceof Error ? error.message : error)
    return { variant: fallback, generatedBy: 'template' }
  }
}
