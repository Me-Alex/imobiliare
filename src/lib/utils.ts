import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { MONTH_NAMES_SHORT, DAY_NAMES_FULL, MONTH_NAMES_FULL } from './constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatPricePerSqm(price: number): string {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price) + '/m²'
}

export function formatSector(sector?: string | null): string {
  const value = sector?.trim()
  if (!value) return ''

  if (/^sector(?:ul)?\b/i.test(value)) {
    return value.replace(/^sectorul\b/i, 'Sector')
  }

  return `Sector ${value}`
}

export function formatBucharestLocation(zone: string, sector?: string | null): string {
  return [zone, formatSector(sector), 'Bucuresti'].filter(Boolean).join(', ')
}

// ─── Date utilities (Romanian locale) ───────────────────────────────────────

/** Format a YYYY-MM-DD date string as "DD Month YYYY" using short Romanian month names */
export function formatDateRO(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()} ${MONTH_NAMES_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

/** Get Romanian full weekday name from a YYYY-MM-DD string */
export function getWeekdayRO(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return DAY_NAMES_FULL[d.getDay() === 0 ? 6 : d.getDay() - 1]
}

/** Check if a YYYY-MM-DD date string is in the past (before today) */
export function isDatePast(dateStr: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr + 'T00:00:00')
  return d < today
}

/** Check if a YYYY-MM-DD date string is today */
export function isToday(dateStr: string): boolean {
  const today = new Date()
  const d = new Date(dateStr + 'T00:00:00')
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  )
}

/** Convert a Date object to a YYYY-MM-DD string */
export function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Format an ISO string as a relative time string in Romanian */
export function formatRelativeTime(isoString: string): string {
  const now = Date.now()
  const then = new Date(isoString).getTime()
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffH = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffH / 24)

  if (diffSec < 60) return 'acum cateva secunde'
  if (diffMin < 60) return `acum ${diffMin} min`
  if (diffH < 24) return `acum ${diffH} ${diffH === 1 ? 'ora' : 'ore'}`
  if (diffDays === 1) return 'ieri'
  if (diffDays < 7) return `acum ${diffDays} zile`
  if (diffDays < 30) return `acum ${Math.floor(diffDays / 7)} saptamani`
  return `acum ${Math.floor(diffDays / 30)} luni`
}

/** Get the next Monday from today */
export function getNextMonday(): Date {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? 1 : 8 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// Re-export MONTH_NAMES_FULL for convenience (used by calendar components)
export { MONTH_NAMES_FULL }
