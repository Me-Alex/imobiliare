export type VirtualTourProvider = 'MATTERPORT' | 'KUULA' | 'NATIVE'
export type VirtualTourStatus = 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED'
export type VirtualTourMode = 'NONE' | 'EXTERNAL' | 'NATIVE'

export interface VirtualTourHotspot {
  id: string
  label: string
  yaw: number
  pitch: number
  targetSceneId: string
}
export interface VirtualTourScene {
  id: string
  title: string
  imageUrl: string
  storageBucket?: 'virtual-tour-drafts' | 'virtual-tours'
  storagePath?: string
  sortOrder: number
  initialYaw: number
  initialPitch: number
  initialFov: number
  hotspots: VirtualTourHotspot[]
}

export interface VirtualTour {
  id?: string
  provider: VirtualTourProvider
  status?: VirtualTourStatus
  title: string
  externalUrl?: string | null
  entrySceneId?: string | null
  scenes: VirtualTourScene[]
}

export interface VirtualTourDraft {
  mode: VirtualTourMode
  provider: Exclude<VirtualTourProvider, 'NATIVE'> | null
  externalUrl: string
  entrySceneId: string | null
  scenes: VirtualTourScene[]
}

export const EMPTY_VIRTUAL_TOUR_DRAFT: VirtualTourDraft = {
  mode: 'NONE',
  provider: null,
  externalUrl: '',
  entrySceneId: null,
  scenes: [],
}

const SAFE_KUULA_PARAMS = new Set([
  'fs', 'vr', 'zoom', 'sd', 'autorotate', 'thumbs', 'chromeless', 'logo', 'initload',
])

export function parseExternalTourUrl(rawValue: string): {
  provider: Exclude<VirtualTourProvider, 'NATIVE'>
  embedUrl: string
} | null {
  const value = rawValue.trim()
  if (!value) return null

  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return null
    const hostname = url.hostname.toLocaleLowerCase('en-US').replace(/^www\./, '')

    if (hostname === 'my.matterport.com' && url.pathname === '/show') {
      const modelId = url.searchParams.get('m')?.trim()
      if (!modelId || !/^[a-z0-9_-]{6,64}$/i.test(modelId)) return null
      const embedUrl = new URL('https://my.matterport.com/show/')
      embedUrl.searchParams.set('m', modelId)
      embedUrl.searchParams.set('play', '1')
      embedUrl.searchParams.set('qs', '1')
      return { provider: 'MATTERPORT', embedUrl: embedUrl.toString() }
    }

    if (hostname === 'kuula.co' && /^\/share\/[a-z0-9/_-]+$/i.test(url.pathname)) {
      const embedUrl = new URL(`https://kuula.co${url.pathname}`)
      url.searchParams.forEach((paramValue, key) => {
        if (SAFE_KUULA_PARAMS.has(key)) embedUrl.searchParams.set(key, paramValue)
      })
      embedUrl.searchParams.set('fs', '1')
      embedUrl.searchParams.set('vr', '1')
      return { provider: 'KUULA', embedUrl: embedUrl.toString() }
    }
  } catch {
    return null
  }

  return null
}

export function isVirtualTourDraftValid(draft: VirtualTourDraft): boolean {
  if (draft.mode === 'NONE') return true
  if (draft.mode === 'EXTERNAL') return parseExternalTourUrl(draft.externalUrl) !== null
  return draft.scenes.length > 0 && draft.scenes.every((scene) => Boolean(scene.imageUrl && scene.title.trim()))
}

export function virtualTourProviderLabel(provider: VirtualTourProvider): string {
  if (provider === 'MATTERPORT') return 'Matterport'
  if (provider === 'KUULA') return 'Kuula'
  return 'Tur 360° HQS'
}

export function dataUrlMimeType(value: string): string {
  const match = /^data:([^;,]+)[;,]/.exec(value)
  return match?.[1] || 'image/jpeg'
}

export function extensionForMimeType(mimeType: string): string {
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'image/webp') return 'webp'
  return 'jpg'
}
