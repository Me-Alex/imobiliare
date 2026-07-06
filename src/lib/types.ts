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

// Document type labels
export const DOC_TYPE_LABELS: Record<UploadedDocument['docType'], string> = {
  id_card: 'Carte de Identitate',
  proof_of_income: 'Adeverinta de Venit',
  vizionare_sign: 'Semnatura Vizionare',
  rental_contract: 'Contract de Inchiriere',
  other: 'Alt Document',
}

// Default staff members (hardcoded for MVP)
export const DEFAULT_STAFF: StaffMember[] = [
  { id: 'staff-1', name: 'Maria Ionescu', email: 'maria@hqs.ro', phone: '+40 721 123 456', role: 'Agent Imobiliar', avatarInitials: 'MI', isActive: true },
  { id: 'staff-2', name: 'Alexandru Popa', email: 'alex@hqs.ro', phone: '+40 722 234 567', role: 'Agent Imobiliar', avatarInitials: 'AP', isActive: true },
  { id: 'staff-3', name: 'Elena Dumitrescu', email: 'elena@hqs.ro', phone: '+40 723 345 678', role: 'Consilier Imobiliar', avatarInitials: 'ED', isActive: true },
  { id: 'staff-4', name: 'Cristian Marinescu', email: 'cristian@hqs.ro', phone: '+40 724 456 789', role: 'Director Vanzari', avatarInitials: 'CM', isActive: true },
]

// LocalStorage helpers
export function loadFromLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : fallback
  } catch {
    return fallback
  }
}

export function saveToLS(key: string, data: unknown): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // Storage full or unavailable
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}