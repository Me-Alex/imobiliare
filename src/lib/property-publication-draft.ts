import {
  createEmptyPropertyFormData,
  type PropertyFormData,
} from '@/lib/property-form-data'
import type {
  VirtualTourDraft,
  VirtualTourHotspot,
  VirtualTourScene,
} from '@/lib/virtual-tours'

const DRAFT_VERSION = 1
const MAX_DRAFT_SIZE = 1_000_000
const MAX_GALLERY_IMAGES = 15
const MAX_TOUR_SCENES = 8
const MAX_HOTSPOTS_PER_SCENE = 24

export interface PropertyPublicationDraft {
  version: typeof DRAFT_VERSION
  savedAt: string
  omittedLocalAssets: number
  data: PropertyFormData
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function isRemoteAsset(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function sanitizeHotspots(value: unknown): VirtualTourHotspot[] {
  if (!Array.isArray(value)) return []

  return value
    .slice(0, MAX_HOTSPOTS_PER_SCENE)
    .filter(isRecord)
    .map((hotspot) => ({
      id: asString(hotspot.id),
      label: asString(hotspot.label),
      yaw: typeof hotspot.yaw === 'number' && Number.isFinite(hotspot.yaw) ? hotspot.yaw : 0,
      pitch: typeof hotspot.pitch === 'number' && Number.isFinite(hotspot.pitch) ? hotspot.pitch : 0,
      targetSceneId: asString(hotspot.targetSceneId),
    }))
    .filter((hotspot) => hotspot.id && hotspot.targetSceneId)
}

function sanitizeScenes(value: unknown): VirtualTourScene[] {
  if (!Array.isArray(value)) return []

  const scenes = value
    .slice(0, MAX_TOUR_SCENES)
    .filter(isRecord)
    .filter((scene) => isRemoteAsset(asString(scene.imageUrl)))
    .map((scene, index): VirtualTourScene => {
      const storageBucket: VirtualTourScene['storageBucket'] = (
        scene.storageBucket === 'virtual-tour-drafts' || scene.storageBucket === 'virtual-tours'
      ) ? scene.storageBucket : undefined

      return {
        id: asString(scene.id),
        title: asString(scene.title, `Camera ${index + 1}`),
        imageUrl: asString(scene.imageUrl),
        storageBucket,
        storagePath: asString(scene.storagePath) || undefined,
        sortOrder: typeof scene.sortOrder === 'number' && Number.isFinite(scene.sortOrder)
          ? scene.sortOrder
          : index,
        initialYaw: typeof scene.initialYaw === 'number' && Number.isFinite(scene.initialYaw) ? scene.initialYaw : 0,
        initialPitch: typeof scene.initialPitch === 'number' && Number.isFinite(scene.initialPitch) ? scene.initialPitch : 0,
        initialFov: typeof scene.initialFov === 'number' && Number.isFinite(scene.initialFov) ? scene.initialFov : 100,
        hotspots: sanitizeHotspots(scene.hotspots),
      }
    })
    .filter((scene) => scene.id)

  const sceneIds = new Set(scenes.map((scene) => scene.id))
  return scenes.map((scene) => ({
    ...scene,
    hotspots: scene.hotspots.filter((hotspot) => sceneIds.has(hotspot.targetSceneId)),
  }))
}

function sanitizeVirtualTour(value: unknown): VirtualTourDraft {
  if (!isRecord(value)) return createEmptyPropertyFormData().virtualTour

  const mode = value.mode === 'EXTERNAL' || value.mode === 'NATIVE' ? value.mode : 'NONE'
  const provider = value.provider === 'MATTERPORT' || value.provider === 'KUULA'
    ? value.provider
    : null
  const scenes = sanitizeScenes(value.scenes)
  const requestedEntrySceneId = asString(value.entrySceneId) || null

  return {
    mode,
    provider,
    externalUrl: asString(value.externalUrl),
    entrySceneId: requestedEntrySceneId && scenes.some((scene) => scene.id === requestedEntrySceneId)
      ? requestedEntrySceneId
      : scenes[0]?.id || null,
    scenes,
  }
}

function sanitizeFormData(value: unknown): PropertyFormData | null {
  if (!isRecord(value)) return null

  const empty = createEmptyPropertyFormData()
  const galleryUrls = Array.isArray(value.galleryUrls)
    ? value.galleryUrls
      .slice(0, MAX_GALLERY_IMAGES)
      .filter((url): url is string => typeof url === 'string' && isRemoteAsset(url))
    : []

  return {
    title: asString(value.title),
    description: asString(value.description),
    type: asString(value.type),
    transaction: asString(value.transaction, empty.transaction),
    price: asString(value.price),
    currency: asString(value.currency, empty.currency),
    areaSqm: asString(value.areaSqm),
    rooms: asString(value.rooms),
    bathrooms: asString(value.bathrooms),
    floor: asString(value.floor),
    totalFloors: asString(value.totalFloors),
    yearBuilt: asString(value.yearBuilt),
    address: asString(value.address),
    zone: asString(value.zone),
    sector: asString(value.sector),
    lat: asNullableNumber(value.lat),
    lng: asNullableNumber(value.lng),
    featured: value.featured === true,
    coverUrl: isRemoteAsset(asString(value.coverUrl))
      ? asString(value.coverUrl)
      : galleryUrls[0] || '',
    galleryUrls,
    virtualTour: sanitizeVirtualTour(value.virtualTour),
  }
}

export function propertyPublicationDraftKey(userId: string): string {
  return `hqs:property-publication-draft:${userId}`
}

export function hasMeaningfulPropertyDraft(data: PropertyFormData): boolean {
  return [
    data.title,
    data.description,
    data.type,
    data.price,
    data.areaSqm,
    data.rooms,
    data.bathrooms,
    data.floor,
    data.totalFloors,
    data.yearBuilt,
    data.address,
    data.zone,
    data.sector,
  ].some((value) => value.trim().length > 0)
    || data.lat !== null
    || data.lng !== null
    || data.featured
    || data.galleryUrls.length > 0
    || data.virtualTour.mode !== 'NONE'
}

export function createPropertyPublicationDraft(
  data: PropertyFormData,
  savedAt = new Date(),
): PropertyPublicationDraft {
  const safeData = sanitizeFormData(data) || createEmptyPropertyFormData()
  const omittedGalleryImages = data.galleryUrls.filter((url) => !isRemoteAsset(url)).length
  const omittedTourScenes = data.virtualTour.scenes.filter((scene) => !isRemoteAsset(scene.imageUrl)).length

  return {
    version: DRAFT_VERSION,
    savedAt: savedAt.toISOString(),
    omittedLocalAssets: omittedGalleryImages + omittedTourScenes,
    data: safeData,
  }
}

export function parsePropertyPublicationDraft(rawValue: string | null): PropertyPublicationDraft | null {
  if (!rawValue || rawValue.length > MAX_DRAFT_SIZE) return null

  try {
    const parsed: unknown = JSON.parse(rawValue)
    if (!isRecord(parsed) || parsed.version !== DRAFT_VERSION) return null

    const savedAt = asString(parsed.savedAt)
    const timestamp = Date.parse(savedAt)
    const data = sanitizeFormData(parsed.data)
    if (!Number.isFinite(timestamp) || !data) return null

    return {
      version: DRAFT_VERSION,
      savedAt: new Date(timestamp).toISOString(),
      omittedLocalAssets: typeof parsed.omittedLocalAssets === 'number'
        ? Math.max(0, Math.floor(parsed.omittedLocalAssets))
        : 0,
      data,
    }
  } catch {
    return null
  }
}

export function loadPropertyPublicationDraft(storageKey: string): PropertyPublicationDraft | null {
  if (typeof window === 'undefined') return null
  try {
    return parsePropertyPublicationDraft(window.localStorage.getItem(storageKey))
  } catch {
    return null
  }
}

export function savePropertyPublicationDraft(
  storageKey: string,
  data: PropertyFormData,
): PropertyPublicationDraft | null {
  if (typeof window === 'undefined') return null

  const draft = createPropertyPublicationDraft(data)
  if (!hasMeaningfulPropertyDraft(data) && draft.omittedLocalAssets === 0) {
    window.localStorage.removeItem(storageKey)
    return null
  }

  window.localStorage.setItem(storageKey, JSON.stringify(draft))
  return draft
}

export function clearPropertyPublicationDraft(storageKey: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(storageKey)
  } catch {
    // Browsers can disable storage; clearing a draft must never block the form.
  }
}
