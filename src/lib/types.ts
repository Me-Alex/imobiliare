// Staff Member
export interface StaffMember {
  id: string
  name: string
  email: string
  phone: string
  role: string
  avatarInitials: string
  isActive: boolean
}

// Availability Slot
export interface AvailabilitySlot {
  id: string
  staffId: string
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  isBooked: boolean
  bookedBy: string | null // user id
  bookedByName: string | null
}

// Vizionare (viewing appointment)
export interface Vizionare {
  id: string
  propertyId: string
  propertyTitle: string
  userId: string
  userName: string
  userEmail: string
  staffId: string
  staffName: string
  date: string
  startTime: string
  endTime: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes: string
  createdAt: string
  rating?: number
  feedback?: string
  wouldProceed?: boolean
  completedAt?: string
}

// Uploaded Document
export interface UploadedDocument {
  id: string
  vizionareId: string
  fileName: string
  fileType: string
  fileData: string // base64
  filePreview: string // data URL for preview
  docType: 'id_card' | 'proof_of_income' | 'vizionare_sign' | 'rental_contract' | 'other'
  uploadedAt: string
}

// Document type labels (type only — value lives in @/lib/constants)
export type DocTypeLabelMap = Record<UploadedDocument['docType'], string>

// Property
export interface Property {
  id: string
  title: string
  slug: string
  description: string
  type: string
  transaction: string
  price: number
  currency: string
  areaSqm: number
  rooms: number
  bathrooms: number
  floor: number | null
  yearBuilt: number | null
  address: string
  zone: string
  sector: string | null
  city: string
  lat: number | null
  lng: number | null
  status: string
  featured: boolean
  coverUrl: string | null
  galleryUrls: string
  pricePerSqm: number | null
  createdAt: string
  updatedAt: string
}

export interface MarketDataPoint {
  id: string
  zone: string
  type: string
  avgPriceSqm: number
  avgAreaSqm: number
  totalListed: number
  soldCount: number
  week: string
}

export interface Zone {
  id: string
  name: string
  slug: string
  sector: string | null
  description: string | null
  avgPriceSqm: number | null
  demand: string
  popularFor: string
  sortOrder: number
  _count?: { properties: number }
}

export interface ZoneSuggestion {
  type: 'zone'
  name: string
  sector: string | null
  avgPriceSqm: number | null
}

export interface PropertySuggestion {
  type: 'property'
  name: string
  slug: string
  zone: string
  propertyType: string
  transaction: string
  price: number
  areaSqm: number
}

export type SearchSuggestion = ZoneSuggestion | PropertySuggestion

export interface PropertyFilters {
  zone?: string
  type?: string
  transaction?: string
  minPrice?: number
  maxPrice?: number
  rooms?: number
  featured?: boolean
  search?: string
  sort?: string
  minArea?: number
  maxArea?: number
}

export interface PaginatedPropertiesResponse {
  properties: Property[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}