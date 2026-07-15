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
  clientId?: string | null
  propertyId: string
  propertyUuid?: string | null
  propertyTitle: string
  userId: string
  userName: string
  userEmail: string
  staffId: string
  staffName: string
  date: string
  startTime: string
  endTime: string
  status:
    | 'pending'
    | 'confirmed'
    | 'checked_in'
    | 'completed'
    | 'cancelled'
    | 'cancelled_by_client'
    | 'cancelled_by_agent'
    | 'no_show'
  notes: string
  createdAt: string
  rating?: number
  feedback?: string
  wouldProceed?: boolean
  completedAt?: string
  checkedInAt?: string
  cancellationReason?: string
  noShowMarkedAt?: string
  noShowEligibleAt?: string
  bookingTermsAcceptedAt?: string
}

// Uploaded Document
export interface UploadedDocument {
  id: string
  vizionareId: string
  fileName: string
  fileType: string
  fileData: string // base64
  filePreview: string // data URL for preview
  docType:
    | 'id_card'
    | 'proof_of_income'
    | 'vizionare_sign'
    | 'brokerage_contract'
    | 'owner_mandate'
    | 'reservation_offer'
    | 'rental_contract'
    | 'handover_protocol'
    | 'addendum'
    | 'termination_notice'
    | 'other'
  uploadedAt: string
}

export type ViewingDocumentType = UploadedDocument['docType']

export type ViewingDocumentStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'UPLOADED'
  | 'READY_TO_SIGN'
  | 'PARTIALLY_SIGNED'
  | 'SIGNED'
  | 'DECLINED'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'SUPERSEDED'

export interface DocumentSigner {
  id: string
  userId: string
  role: 'CLIENT' | 'OWNER' | 'AGENT' | 'ADMIN'
  status: 'PENDING' | 'SIGNED' | 'DECLINED'
  required: boolean
  signatureName: string | null
  signatureMethod: 'TYPED' | 'EXTERNAL_PROVIDER' | null
  documentChecksum: string | null
  signedAt: string | null
}

export interface DocumentEvent {
  id: number
  actorId: string | null
  eventType:
    | 'CREATED'
    | 'UPLOADED'
    | 'GENERATED'
    | 'VALIDATED'
    | 'CONSENT_RECORDED'
    | 'APPROVED'
    | 'SENT_FOR_SIGNATURE'
    | 'SIGNED'
    | 'DECLINED'
    | 'COMPLETED'
    | 'SUPERSEDED'
    | 'EXPIRED'
    | 'EXTERNAL_SIGNATURE_ATTACHED'
  metadata: Record<string, unknown>
  createdAt: string
}

export interface ViewingDocument {
  id: string
  appointmentId: string | null
  propertyId: string | null
  templateId: string | null
  userId: string
  title: string
  docType: ViewingDocumentType
  status: ViewingDocumentStatus
  visibility: 'PRIVATE' | 'PARTICIPANTS' | 'AGENT' | 'OWNER'
  storageBucket: string
  storagePath: string | null
  fileName: string
  fileType: string
  byteSize: number
  checksum: string | null
  version: number
  uploadedAt: string
  lockedAt: string | null
  signedAt: string | null
  signatureLevel: string | null
  signatureRequirement: 'SIMPLE' | 'ADVANCED_OR_QUALIFIED' | 'QUALIFIED'
  templateName: string | null
  templateVersion: number | null
  legalVersion: string | null
  consumerContract: boolean
  fiscalRegistrationDueAt: string | null
  retentionUntil: string | null
  signers: DocumentSigner[]
  events: DocumentEvent[]
}

// Document type labels (type only — value lives in @/lib/constants)
export type DocTypeLabelMap = Record<UploadedDocument['docType'], string>

// User Property (stored in localStorage, created via adauga-proprietate)
export interface UserProperty {
  id: string
  title: string
  type?: string
  transaction?: string
  price?: string | number
  currency?: string
  areaSqm?: string | number
  rooms?: string | number
  bathrooms?: string | number
  floor?: string | number | null
  yearBuilt?: string | number | null
  address?: string
  zone?: string
  sector?: string
  description?: string
  coverUrl?: string
  cover_url?: string
  galleryUrls?: string[]
  [key: string]: unknown
}

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

// Saved Search
export interface SavedSearch {
  id: string
  name: string
  filters: {
    selectedType?: string
    selectedZone?: string
    priceRange?: [number, number]
    rooms?: number
    transaction?: string
    featuredOnly?: boolean
    sort?: string
    minArea?: string
    maxArea?: string
    searchQuery?: string
  }
  createdAt: string
}

// Valuation Result
export interface ValuationResult {
  estimatedValue: number
  pricePerSqm: number
  confidenceRange: [number, number]
  marketTrend: string
  zoneAnalysis: string
  recommendations: string[]
  comparableProperties: Array<{
    title: string
    zone: string
    price: number
    areaSqm: number
    pricePerSqm: number
  }>
}

// ─── Coins / Loyalty System ───────────────────────────────────────────

export type CoinTransactionType =
  | 'daily_login'
  | 'daily_streak_bonus'
  | 'view_property'
  | 'favorite'
  | 'contact_form'
  | 'book_viewing'
  | 'complete_viewing'
  | 'newsletter'
  | 'add_property'
  | 'save_search'
  | 'price_alert'
  | 'reward_featured'
  | 'reward_priority'
  | 'reward_valuation'
  | 'reward_voucher_5'
  | 'reward_voucher_10'
  | 'reward_highlight'
  | 'admin_bonus'

export interface CoinTransaction {
  id: string
  type: CoinTransactionType
  amount: number            // positive = earned, negative = spent
  description: string
  timestamp: string
  relatedId?: string        // property id, reward id, etc.
}

export interface CoinReward {
  id: string
  title: string
  description: string
  cost: number              // coins needed
  icon: string              // lucide icon name
  category: 'listing' | 'service' | 'discount'
  duration?: string         // e.g. "7 zile"
  value?: string            // e.g. "5% reducere"
}

export interface CoinDailyStreak {
  lastLoginDate: string     // YYYY-MM-DD
  currentStreak: number
}
