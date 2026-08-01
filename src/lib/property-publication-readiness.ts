export type PublicationSectionKey = 'basic' | 'details' | 'location' | 'images' | 'tour'
export type PublicationRecommendationPriority = 'required' | 'recommended'

export interface PublicationRequiredItem {
  label: string
  fieldId: string
  sectionId: string
}

export interface PublicationStep {
  id: string
  label: string
  complete: boolean
  optional?: boolean
}

export interface PublicationRecommendation {
  id: string
  title: string
  description: string
  sectionId: string
  priority: PublicationRecommendationPriority
}

export interface PropertyPublicationReadinessInput {
  title: string
  description: string
  type: string
  transaction: string
  price: string
  areaSqm: string
  rooms: string
  bathrooms: string
  floor: string
  totalFloors: string
  yearBuilt: string
  address: string
  zone: string
  sector: string
  lat: number | null
  lng: number | null
  galleryUrls: readonly string[]
  virtualTourMode: string
  virtualTourValid: boolean
  currentYear?: number
}

export interface PropertyPublicationReadiness {
  isLand: boolean
  hasPin: boolean
  hasConfiguredTour: boolean
  canPublish: boolean
  currentYear: number
  pricePerSqm: number | null
  sectionCompletion: Record<PublicationSectionKey, boolean>
  steps: PublicationStep[]
  requiredItems: PublicationRequiredItem[]
  recommendations: PublicationRecommendation[]
  qualityPercent: number
  qualityLabel: string
}

export type PublicationMilestoneStatus = 'complete' | 'current' | 'next'

export interface PublicationMilestone {
  id: 'publishable' | 'competitive' | 'premium'
  label: string
  title: string
  description: string
  actionLabel: string
  sectionId: string
  status: PublicationMilestoneStatus
}

export type PublishedPropertyQualityPriority = 'high' | 'medium'

export interface PublishedPropertyQualityRecommendation {
  id: string
  title: string
  description: string
  priority: PublishedPropertyQualityPriority
}

export interface PublishedPropertyQuality {
  score: number
  label: string
  issues: string[]
  recommendations: PublishedPropertyQualityRecommendation[]
  strengths: string[]
  nextAction: string | null
}

export interface PublishedPropertyQualityInput {
  title?: string | null
  description?: string | null
  type?: string | null
  transaction?: string | null
  transaction_type?: string | null
  price?: string | number | null
  currency?: string | null
  areaSqm?: string | number | null
  area_sqm?: string | number | null
  rooms?: string | number | null
  bathrooms?: string | number | null
  yearBuilt?: string | number | null
  year_built?: string | number | null
  address?: string | null
  zone?: string | null
  sector?: string | null
  city?: string | null
  lat?: string | number | null
  lng?: string | number | null
  coverUrl?: string | null
  cover_url?: string | null
  cover_image_url?: string | null
  galleryUrls?: readonly string[] | string | null
  gallery_urls?: readonly string[] | string | null
  amenities?: readonly string[] | string | null
  virtualTour?: unknown
  virtual_tour?: unknown
  virtual_tours?: unknown
}

const STEP_IDS: Record<PublicationSectionKey, string> = {
  basic: 'property-step-basic',
  details: 'property-step-details',
  location: 'property-step-location',
  images: 'property-step-images',
  tour: 'property-step-virtual-tour',
}

function isPositiveInteger(value: string) {
  return Number.isInteger(Number(value)) && Number(value) > 0
}

function isOptionalNonNegativeInteger(value: string) {
  return !value || (Number.isInteger(Number(value)) && Number(value) >= 0)
}

function qualityLabel(percent: number) {
  if (percent >= 90) return 'Excelent'
  if (percent >= 70) return 'Foarte bun'
  if (percent >= 45) return 'Bun început'
  return 'De completat'
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function positiveNumber(value: unknown) {
  const parsed = typeof value === 'number' || typeof value === 'string' ? Number(value) : Number.NaN
  return Number.isFinite(parsed) && parsed > 0
}

function firstText(...values: unknown[]) {
  return values.map(text).find(Boolean) || ''
}

function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => text(item)).filter(Boolean)
  }

  if (typeof value !== 'string') return []
  const trimmed = value.trim()
  if (!trimmed) return []

  try {
    const parsed = JSON.parse(trimmed) as unknown
    return Array.isArray(parsed) ? normalizeStringList(parsed) : []
  } catch {
    return trimmed.split(',').map((item) => item.trim()).filter(Boolean)
  }
}

function isLandType(value: unknown) {
  const normalized = text(value).toLocaleLowerCase('ro-RO')
  return normalized === 'land' || normalized.includes('teren')
}

function hasCoordinates(lat: unknown, lng: unknown) {
  return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))
}

function isActiveVirtualTour(value: unknown): boolean {
  if (!value) return false
  if (Array.isArray(value)) return value.some(isActiveVirtualTour)
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value !== 'object') return Boolean(value)

  const tour = value as {
    status?: unknown
    provider?: unknown
    externalUrl?: unknown
    external_url?: unknown
    scenes?: unknown
  }
  const status = text(tour.status).toUpperCase()
  if (status === 'REJECTED' || status === 'ARCHIVED') return false
  if (status === 'DRAFT') return false
  if (status === 'PUBLISHED' || status === 'IN_REVIEW') return true

  return Boolean(text(tour.provider) || text(tour.externalUrl) || text(tour.external_url) || normalizeStringList(tour.scenes).length)
}

function required(missing: boolean, label: string, fieldId: string, sectionId: string): PublicationRequiredItem | null {
  return missing ? { label, fieldId, sectionId } : null
}

function recommendation(
  missing: boolean,
  id: string,
  title: string,
  description: string,
  sectionId: string,
  priority: PublicationRecommendationPriority = 'recommended',
): PublicationRecommendation | null {
  return missing ? { id, title, description, sectionId, priority } : null
}

export function getPropertyPublicationReadiness(
  input: PropertyPublicationReadinessInput,
): PropertyPublicationReadiness {
  const currentYear = input.currentYear ?? new Date().getFullYear()
  const isLand = /teren/i.test(input.type)
  const hasPin = input.lat !== null && input.lng !== null
  const hasConfiguredTour = input.virtualTourMode !== 'NONE' && input.virtualTourValid
  const hasValidYear = !input.yearBuilt || (
    Number.isInteger(Number(input.yearBuilt))
    && Number(input.yearBuilt) >= 1800
    && Number(input.yearBuilt) <= currentYear
  )
  const floorWithinTotal = !input.floor || !input.totalFloors || Number(input.floor) <= Number(input.totalFloors)

  const sectionCompletion = {
    basic: Boolean(input.title.trim() && input.description.trim() && input.type && input.transaction),
    details: Number(input.price) > 0 && Number(input.areaSqm) > 0 && (isLand || isPositiveInteger(input.rooms)),
    location: Boolean(input.sector && input.zone && input.address.trim()),
    images: input.galleryUrls.length > 0,
    tour: hasConfiguredTour,
  }

  const requiredItems = [
    required(!input.title.trim(), 'titlul', 'title', STEP_IDS.basic),
    required(!input.description.trim(), 'descrierea', 'description', STEP_IDS.basic),
    required(!input.type, 'tipul proprietății', 'property-type', STEP_IDS.basic),
    required(!(Number(input.price) > 0), 'prețul', 'price', STEP_IDS.details),
    required(!(Number(input.areaSqm) > 0), 'suprafața', 'area', STEP_IDS.details),
    required(!isLand && !isPositiveInteger(input.rooms), 'un număr întreg de camere', 'rooms', STEP_IDS.details),
    required(!isLand && !isOptionalNonNegativeInteger(input.bathrooms), 'un număr valid de băi', 'bathrooms', STEP_IDS.details),
    required(!isLand && !isOptionalNonNegativeInteger(input.floor), 'un etaj valid', 'floor', STEP_IDS.details),
    required(!isLand && !isOptionalNonNegativeInteger(input.totalFloors), 'un număr valid de etaje', 'totalFloors', STEP_IDS.details),
    required(!isLand && !floorWithinTotal, 'un etaj mai mic sau egal cu totalul', 'floor', STEP_IDS.details),
    required(!isLand && !hasValidYear, `un an între 1800 și ${currentYear}`, 'yearBuilt', STEP_IDS.details),
    required(!input.sector, 'sectorul', 'property-sector', STEP_IDS.location),
    required(!input.zone, 'zona', 'property-zone', STEP_IDS.location),
    required(!input.address.trim(), 'adresa', 'address', STEP_IDS.location),
    required(input.virtualTourMode !== 'NONE' && !input.virtualTourValid, 'configurația turului virtual', STEP_IDS.tour, STEP_IDS.tour),
  ].filter((item): item is PublicationRequiredItem => Boolean(item))

  const qualitySignals = [
    input.title.trim().length >= 20,
    input.description.trim().length >= 160,
    Boolean(input.type && input.transaction),
    Number(input.price) > 0,
    Number(input.areaSqm) > 0,
    isLand || isPositiveInteger(input.rooms),
    Boolean(input.sector && input.zone),
    input.address.trim().length >= 8,
    hasPin,
    input.galleryUrls.length > 0,
    input.galleryUrls.length >= 5,
    isLand || Boolean(input.yearBuilt),
    hasConfiguredTour,
  ]
  const qualityPercent = Math.round(
    (qualitySignals.filter(Boolean).length / qualitySignals.length) * 100,
  )

  const recommendations = [
    recommendation(input.title.trim().length > 0 && input.title.trim().length < 20, 'title-depth', 'Fă titlul mai specific', 'Include zona, numărul de camere și avantajul principal.', STEP_IDS.basic),
    recommendation(input.description.trim().length > 0 && input.description.trim().length < 160, 'description-depth', 'Extinde descrierea', 'Adaugă compartimentarea, finisajele, vecinătățile și motivul pentru care proprietatea merită văzută.', STEP_IDS.basic),
    recommendation(sectionCompletion.location && !hasPin, 'map-pin', 'Confirmă pinul pe hartă', 'Un pin salvat ajută căutarea pe hartă și reduce întrebările despre locație.', STEP_IDS.location),
    recommendation(input.galleryUrls.length === 0, 'cover-photo', 'Adaugă o fotografie de copertă', 'Anunțurile cu o imagine principală sunt mai ușor de înțeles în lista de proprietăți.', STEP_IDS.images),
    recommendation(input.galleryUrls.length > 0 && input.galleryUrls.length < 5, 'gallery-depth', 'Adaugă minimum 5 fotografii', 'Include livingul, dormitoarele, bucătăria, baia și exteriorul sau vederea.', STEP_IDS.images),
    recommendation(!isLand && sectionCompletion.details && !input.yearBuilt, 'year-built', 'Completează anul construcției', 'Ajută clienții să compare mai rapid proprietățile similare.', STEP_IDS.details),
    recommendation(input.virtualTourMode === 'NONE', 'virtual-tour', 'Adaugă un tur virtual', 'Un tur 360 sau Matterport poate filtra clienții mai bine înainte de vizionare.', STEP_IDS.tour),
  ].filter((item): item is PublicationRecommendation => Boolean(item))

  const requiredRecommendations = requiredItems.slice(0, 3).map((item) => ({
    id: `required-${item.fieldId}`,
    title: `Completează ${item.label}`,
    description: 'Câmp obligatoriu pentru publicare.',
    sectionId: item.sectionId,
    priority: 'required' as const,
  }))

  const pricePerSqm = Number(input.price) > 0 && Number(input.areaSqm) > 0
    ? Math.round(Number(input.price) / Number(input.areaSqm))
    : null

  return {
    isLand,
    hasPin,
    hasConfiguredTour,
    canPublish: requiredItems.length === 0,
    currentYear,
    pricePerSqm,
    sectionCompletion,
    steps: [
      { id: STEP_IDS.basic, label: 'Despre proprietate', complete: sectionCompletion.basic },
      { id: STEP_IDS.details, label: 'Preț și detalii', complete: sectionCompletion.details },
      { id: STEP_IDS.location, label: 'Localizare', complete: sectionCompletion.location },
      { id: STEP_IDS.images, label: 'Fotografii', complete: sectionCompletion.images, optional: true },
      { id: STEP_IDS.tour, label: 'Tur virtual', complete: sectionCompletion.tour, optional: true },
    ],
    requiredItems,
    recommendations: [...requiredRecommendations, ...recommendations].slice(0, 6),
    qualityPercent,
    qualityLabel: qualityLabel(qualityPercent),
  }
}

export function getPropertyPublicationMilestones(
  readiness: PropertyPublicationReadiness,
): readonly PublicationMilestone[] {
  const competitiveComplete = readiness.canPublish
    && readiness.hasPin
    && readiness.sectionCompletion.images
    && readiness.qualityPercent >= 70
  const premiumComplete = competitiveComplete
    && readiness.hasConfiguredTour
    && readiness.qualityPercent >= 90

  const milestones: Array<Omit<PublicationMilestone, 'status'>> = [
    {
      id: 'publishable',
      label: '1',
      title: 'Publicabil',
      description: readiness.canPublish
        ? 'Câmpurile obligatorii sunt complete; anunțul poate fi publicat.'
        : 'Completează minimul legal și operațional pentru a putea publica.',
      actionLabel: readiness.canPublish ? 'Gata de publicare' : 'Completează obligatorii',
      sectionId: readiness.requiredItems[0]?.sectionId ?? 'property-step-basic',
    },
    {
      id: 'competitive',
      label: '2',
      title: 'Competitiv',
      description: competitiveComplete
        ? 'Anunțul are localizare, pin și imagini suficiente pentru comparație.'
        : 'Adaugă pinul pe hartă și o galerie clară ca să reducă întrebările repetitive.',
      actionLabel: readiness.hasPin && readiness.sectionCompletion.images ? 'Optimizează detaliile' : 'Adaugă pin și fotografii',
      sectionId: !readiness.hasPin ? 'property-step-location' : 'property-step-images',
    },
    {
      id: 'premium',
      label: '3',
      title: 'Premium',
      description: premiumComplete
        ? 'Anunțul este pregătit ca experiență completă, inclusiv tur virtual.'
        : 'Finalizează turul virtual și detaliile recomandate pentru lead-uri mai bine filtrate.',
      actionLabel: readiness.hasConfiguredTour ? 'Verifică recomandările' : 'Adaugă tur virtual',
      sectionId: readiness.hasConfiguredTour
        ? readiness.recommendations[0]?.sectionId ?? 'property-step-virtual-tour'
        : 'property-step-virtual-tour',
    },
  ]

  const completed = [readiness.canPublish, competitiveComplete, premiumComplete]
  const currentIndex = completed.findIndex((value) => !value)
  const activeIndex = currentIndex === -1 ? milestones.length - 1 : currentIndex

  return milestones.map((milestone, index) => ({
    ...milestone,
    status: completed[index]
      ? 'complete'
      : index === activeIndex
        ? 'current'
        : 'next',
  }))
}

export function getPublishedPropertyQuality(input: PublishedPropertyQualityInput): PublishedPropertyQuality {
  const title = text(input.title)
  const description = text(input.description)
  const galleryUrls = normalizeStringList(input.galleryUrls ?? input.gallery_urls)
  const amenities = normalizeStringList(input.amenities)
  const cover = firstText(input.coverUrl, input.cover_url, input.cover_image_url, galleryUrls[0])
  const isLand = isLandType(input.type)
  const hasTour = isActiveVirtualTour(input.virtualTour ?? input.virtual_tour ?? input.virtual_tours)

  const checks = [
    {
      id: 'title-depth',
      passed: title.length >= 20,
      title: 'Fă titlul mai specific',
      description: 'Include zona, numărul de camere și avantajul principal.',
      priority: 'high' as const,
      strength: 'Titlul este suficient de clar pentru lista de rezultate.',
    },
    {
      id: 'description-depth',
      passed: description.length >= 180,
      title: 'Extinde descrierea',
      description: 'Adaugă compartimentarea, finisajele, vecinătățile și motivul pentru care merită văzută proprietatea.',
      priority: 'high' as const,
      strength: 'Descrierea oferă context bun pentru client.',
    },
    {
      id: 'price-area',
      passed: positiveNumber(input.price) && positiveNumber(input.areaSqm ?? input.area_sqm),
      title: 'Completează prețul și suprafața',
      description: 'Prețul pe metru pătrat și comparația cu piața depind de aceste două câmpuri.',
      priority: 'high' as const,
      strength: 'Prețul și suprafața permit comparații corecte.',
    },
    {
      id: 'rooms',
      passed: isLand || positiveNumber(input.rooms),
      title: 'Completează numărul de camere',
      description: 'Clienții filtrează frecvent după camere, iar lipsa lor scade calitatea lead-urilor.',
      priority: 'high' as const,
      strength: 'Numărul de camere este disponibil pentru filtre.',
    },
    {
      id: 'location',
      passed: Boolean(firstText(input.address) && firstText(input.zone, input.city)),
      title: 'Clarifică localizarea',
      description: 'Adaugă adresa și zona ca agentul și clientul să lucreze cu același context.',
      priority: 'high' as const,
      strength: 'Localizarea textuală este clară.',
    },
    {
      id: 'map-pin',
      passed: hasCoordinates(input.lat, input.lng),
      title: 'Confirmă pinul pe hartă',
      description: 'Pinul ajută căutarea pe hartă și reduce întrebările despre localizare.',
      priority: 'medium' as const,
      strength: 'Pinul pe hartă este salvat.',
    },
    {
      id: 'cover-photo',
      passed: Boolean(cover),
      title: 'Adaugă o fotografie de copertă',
      description: 'Anunțurile fără imagine principală par incomplete în lista de proprietăți.',
      priority: 'high' as const,
      strength: 'Anunțul are imagine de copertă.',
    },
    {
      id: 'gallery-depth',
      passed: galleryUrls.length >= 5,
      title: 'Adaugă minimum 5 fotografii',
      description: 'Include camerele principale, bucătăria, baia și exteriorul sau vederea.',
      priority: 'medium' as const,
      strength: 'Galeria are suficiente fotografii pentru prima evaluare.',
    },
    {
      id: 'amenities',
      passed: amenities.length >= 4,
      title: 'Adaugă facilitățile principale',
      description: 'Bifează dotările care diferențiază proprietatea: parcare, lift, centrală, balcon, mobilare sau eficiență energetică.',
      priority: 'medium' as const,
      strength: 'Facilitățile ajută clienții să compare rapid.',
    },
    {
      id: 'year-built',
      passed: isLand || positiveNumber(input.yearBuilt ?? input.year_built),
      title: 'Completează anul construcției',
      description: 'Anul construcției ajută la compararea corectă cu proprietăți similare.',
      priority: 'medium' as const,
      strength: 'Anul construcției este completat.',
    },
    {
      id: 'virtual-tour',
      passed: hasTour,
      title: 'Adaugă sau finalizează turul virtual',
      description: 'Turul virtual filtrează clienții mai bine înainte de vizionare și reduce vizionările nepotrivite.',
      priority: 'medium' as const,
      strength: 'Proprietatea are tur virtual asociat.',
    },
  ]

  const failed = checks.filter((check) => !check.passed)
  const score = Math.round(((checks.length - failed.length) / checks.length) * 100)
  const recommendations = failed.map(({ id, title, description, priority }) => ({
    id,
    title,
    description,
    priority,
  }))

  return {
    score,
    label: qualityLabel(score),
    issues: recommendations.slice(0, 4).map((item) => item.title),
    recommendations,
    strengths: checks.filter((check) => check.passed).slice(0, 4).map((check) => check.strength),
    nextAction: recommendations[0]?.title ?? null,
  }
}
