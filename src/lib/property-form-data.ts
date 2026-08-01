import {
  EMPTY_VIRTUAL_TOUR_DRAFT,
  type VirtualTourDraft,
} from '@/lib/virtual-tours'

export interface PropertyFormData {
  title: string
  description: string
  type: string
  transaction: string
  price: string
  currency: string
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
  featured: boolean
  coverUrl: string
  galleryUrls: string[]
  virtualTour: VirtualTourDraft
}

export function createEmptyPropertyFormData(): PropertyFormData {
  return {
    title: '',
    description: '',
    type: '',
    transaction: 'VANZARE',
    price: '',
    currency: 'EUR',
    areaSqm: '',
    rooms: '',
    bathrooms: '',
    floor: '',
    totalFloors: '',
    yearBuilt: '',
    address: '',
    zone: '',
    sector: '',
    lat: null,
    lng: null,
    featured: false,
    coverUrl: '',
    galleryUrls: [],
    virtualTour: {
      ...EMPTY_VIRTUAL_TOUR_DRAFT,
      scenes: [],
    },
  }
}
