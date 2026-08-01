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
  if (percent >= 45) return 'Bun inceput'
  return 'De completat'
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
    required(!input.type, 'tipul proprietatii', 'property-type', STEP_IDS.basic),
    required(!(Number(input.price) > 0), 'pretul', 'price', STEP_IDS.details),
    required(!(Number(input.areaSqm) > 0), 'suprafata', 'area', STEP_IDS.details),
    required(!isLand && !isPositiveInteger(input.rooms), 'un numar intreg de camere', 'rooms', STEP_IDS.details),
    required(!isLand && !isOptionalNonNegativeInteger(input.bathrooms), 'un numar valid de bai', 'bathrooms', STEP_IDS.details),
    required(!isLand && !isOptionalNonNegativeInteger(input.floor), 'un etaj valid', 'floor', STEP_IDS.details),
    required(!isLand && !isOptionalNonNegativeInteger(input.totalFloors), 'un numar valid de etaje', 'totalFloors', STEP_IDS.details),
    required(!isLand && !floorWithinTotal, 'un etaj mai mic sau egal cu totalul', 'floor', STEP_IDS.details),
    required(!isLand && !hasValidYear, `un an intre 1800 si ${currentYear}`, 'yearBuilt', STEP_IDS.details),
    required(!input.sector, 'sectorul', 'property-sector', STEP_IDS.location),
    required(!input.zone, 'zona', 'property-zone', STEP_IDS.location),
    required(!input.address.trim(), 'adresa', 'address', STEP_IDS.location),
    required(input.virtualTourMode !== 'NONE' && !input.virtualTourValid, 'configuratia turului virtual', STEP_IDS.tour, STEP_IDS.tour),
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
    recommendation(input.title.trim().length > 0 && input.title.trim().length < 20, 'title-depth', 'Fa titlul mai specific', 'Include zona, numarul de camere si avantajul principal.', STEP_IDS.basic),
    recommendation(input.description.trim().length > 0 && input.description.trim().length < 160, 'description-depth', 'Extinde descrierea', 'Adauga compartimentare, finisaje, vecinatati si motivul pentru care proprietatea merita vazuta.', STEP_IDS.basic),
    recommendation(sectionCompletion.location && !hasPin, 'map-pin', 'Confirma pinul pe harta', 'Un pin salvat ajuta cautarea pe harta si reduce intrebarile despre locatie.', STEP_IDS.location),
    recommendation(input.galleryUrls.length === 0, 'cover-photo', 'Adauga o fotografie de coperta', 'Anunturile cu o imagine principala sunt mai usor de inteles in lista de proprietati.', STEP_IDS.images),
    recommendation(input.galleryUrls.length > 0 && input.galleryUrls.length < 5, 'gallery-depth', 'Adauga minimum 5 fotografii', 'Include livingul, dormitoarele, bucataria, baia si exteriorul sau vederea.', STEP_IDS.images),
    recommendation(!isLand && sectionCompletion.details && !input.yearBuilt, 'year-built', 'Completeaza anul constructiei', 'Ajuta clientii sa compare mai rapid proprietatile similare.', STEP_IDS.details),
    recommendation(input.virtualTourMode === 'NONE', 'virtual-tour', 'Adauga un tur virtual', 'Un tur 360 sau Matterport poate filtra clientii mai bine inainte de vizionare.', STEP_IDS.tour),
  ].filter((item): item is PublicationRecommendation => Boolean(item))

  const requiredRecommendations = requiredItems.slice(0, 3).map((item) => ({
    id: `required-${item.fieldId}`,
    title: `Completeaza ${item.label}`,
    description: 'Camp obligatoriu pentru publicare.',
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
      { id: STEP_IDS.details, label: 'Pret si detalii', complete: sectionCompletion.details },
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
