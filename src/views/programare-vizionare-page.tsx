'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays, Clock, MapPin, User, ChevronRight, ChevronLeft,
  Check, Building2, Phone, Loader2, ArrowLeft, CalendarCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'
import {
  loadFromLS, saveToLS, generateId, DEFAULT_STAFF,
  type StaffMember, type AvailabilitySlot, type Vizionare,
} from '@/lib/types'
import { toast } from 'sonner'

// ─── Helpers ────────────────────────────────────────────────────────────────

const STEP_LABELS = ['Alege Proprietatea', 'Alege Agent si Data', 'Confirmare']
const DAY_NAMES = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sam', 'Dum']
const MONTH_NAMES = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
]

interface UserProperty {
  id: string
  title: string
  type?: string
  transaction?: string
  price?: string
  currency?: string
  areaSqm?: string
  rooms?: string
  address?: string
  zone?: string
  coverUrl?: string
  galleryUrls?: string[]
  [key: string]: unknown
}

function seedAvailability() {
  const existing = loadFromLS<AvailabilitySlot[]>('hqs_staff_availability', [])
  if (existing.length > 0) return

  const toLocalDateStr = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const now = new Date()
  const slots: AvailabilitySlot[] = []
  const times = [
    ['09:00', '10:00'], ['10:00', '11:00'], ['11:00', '12:00'],
    ['13:00', '14:00'], ['14:00', '15:00'], ['15:00', '16:00'],
    ['16:00', '17:00'],
  ]

  for (let d = 1; d <= 14; d++) {
    const date = new Date(now)
    date.setDate(date.getDate() + d)
    const dayOfWeek = date.getDay() // 0=Sun
    if (dayOfWeek === 0) continue // Skip Sundays

    const dateStr = toLocalDateStr(date)
    const activeStaff = DEFAULT_STAFF.filter(s => s.isActive)
    const shuffledTimes = [...times].sort(() => Math.random() - 0.5)

    for (const staff of activeStaff) {
      const numSlots = 3 + Math.floor(Math.random() * 3)
      for (let t = 0; t < Math.min(numSlots, shuffledTimes.length); t++) {
        slots.push({
          id: generateId(),
          staffId: staff.id,
          date: dateStr,
          startTime: shuffledTimes[t][0],
          endTime: shuffledTimes[t][1],
          isBooked: false,
          bookedBy: null,
          bookedByName: null,
        })
      }
    }
  }
  saveToLS('hqs_staff_availability', slots)
}

function formatDateRO(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
}

// ─── Step Indicator ─────────────────────────────────────────────────────────

function StepIndicator({ currentStep, onStepClick }: { currentStep: number; onStepClick: (step: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEP_LABELS.map((label, i) => {
        const stepNum = i + 1
        const isActive = stepNum === currentStep
        const isCompleted = stepNum < currentStep
        const isClickable = stepNum <= currentStep

        return (
          <div key={label} className="flex items-center">
            <button
              type="button"
              onClick={() => isClickable && onStepClick(stepNum)}
              disabled={!isClickable}
              className="flex items-center gap-2 group"
            >
              <div
                className={`
                  flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold transition-all duration-300
                  ${isCompleted
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : isActive
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-110'
                      : 'bg-muted text-muted-foreground'
                  }
                  ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                `}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
              </div>
              <span
                className={`hidden sm:inline text-sm font-medium transition-colors ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
            </button>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`w-8 sm:w-16 lg:w-24 h-0.5 mx-2 sm:mx-3 rounded-full transition-colors duration-300 ${
                  stepNum < currentStep ? 'bg-emerald-500' : 'bg-muted'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1: Property Selection ─────────────────────────────────────────────

function StepPropertySelection({
  selectedId,
  onSelect,
}: {
  selectedId: string | null
  onSelect: (prop: UserProperty) => void
}) {
  const { user } = useAuth()
  const properties = loadFromLS<UserProperty[]>('hqs_user_properties', [])

  const allProperties = useMemo(() => {
    // Also include some demo properties if user has none
    if (properties.length > 0) return properties
    return [
      {
        id: 'demo-1', title: 'Apartament 2 camere Dorobanti',
        type: 'Apartament', transaction: 'VANZARE', price: '95000',
        currency: 'EUR', areaSqm: '58', rooms: '2', address: 'Str. Dorobanti nr. 45',
        zone: 'Dorobanti', coverUrl: '/images/prop-demo-1.jpg',
      },
      {
        id: 'demo-2', title: 'Garsoniera Centru',
        type: 'Garsoniera', transaction: 'INCHIRIERE', price: '450',
        currency: 'EUR', areaSqm: '35', rooms: '1', address: 'Str. Victoriei nr. 12',
        zone: 'Victoriei', coverUrl: '/images/prop-demo-2.jpg',
      },
      {
        id: 'demo-3', title: 'Casa 3 camere Pipera',
        type: 'Casa', transaction: 'VANZARE', price: '185000',
        currency: 'EUR', areaSqm: '120', rooms: '3', address: 'Str. Pipera nr. 78',
        zone: 'Pipera', coverUrl: '/images/prop-demo-3.jpg',
      },
    ]
  }, [properties])

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
          <User className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Autentifica-te</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Trebuie sa fii autentificat pentru a programa o vizionare.
        </p>
        <Button onClick={() => useAppStore.getState().navigateTo('login')} className="gap-2">
          Autentifica-te
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        Selecteaza o proprietate pentru a programa o vizionare
      </p>
      <div className="grid gap-3 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
        {allProperties.map((prop) => {
          const isSelected = selectedId === prop.id
          return (
            <motion.button
              key={prop.id}
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelect(prop)}
              className={`
                w-full text-left rounded-xl border-2 p-4 transition-all duration-200
                ${isSelected
                  ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                  : 'border-border hover:border-primary/40 hover:bg-muted/50'
                }
              `}
            >
              <div className="flex gap-4">
                {prop.coverUrl ? (
                  <div className="w-20 h-20 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                    <img
                      src={prop.coverUrl}
                      alt={prop.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                        ;(e.target as HTMLImageElement).parentElement!.innerHTML =
                          '<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>'
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-sm leading-tight truncate">{prop.title}</h4>
                    {isSelected && (
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {prop.type && <Badge variant="secondary" className="text-xs">{prop.type}</Badge>}
                    {prop.transaction && (
                      <Badge variant="outline" className="text-xs">
                        {prop.transaction === 'VANZARE' ? 'Vanzare' : 'Inchiriere'}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {prop.price && <span className="font-medium text-foreground">{prop.price} {prop.currency}</span>}
                    {prop.areaSqm && <span>{prop.areaSqm} m²</span>}
                    {prop.rooms && <span>{prop.rooms} cam.</span>}
                  </div>
                  {prop.address && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{prop.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 2: Agent & Date Selection ─────────────────────────────────────────

function StepAgentDate({
  selectedStaffId,
  selectedDate,
  selectedSlotId,
  onStaffSelect,
  onDateSelect,
  onSlotSelect,
}: {
  selectedStaffId: string | null
  selectedDate: string | null
  selectedSlotId: string | null
  onStaffSelect: (staff: StaffMember) => void
  onDateSelect: (date: string) => void
  onSlotSelect: (slot: AvailabilitySlot) => void
}) {
  const [availability, setAvailability] = useState<AvailabilitySlot[]>(() =>
    loadFromLS<AvailabilitySlot[]>('hqs_staff_availability', [])
  )
  const staff = DEFAULT_STAFF.filter(s => s.isActive)

  // Generate next 14 days grid
  const calendarDays = useMemo(() => {
    const today = new Date()
    const days: Array<{ date: string; dayName: string; dayNum: number; month: string; isToday: boolean }> = []
    // Find Monday of current week or next Monday if today is Sunday
    const currentDay = today.getDay() === 0 ? 6 : today.getDay() - 1
    const monday = new Date(today)
    monday.setDate(today.getDate() - currentDay + 1)
    // If Monday is today, start from today
    if (monday <= today) {
      // Start from today
    } else {
      // Start from today anyway
    }

    for (let i = 0; i < 14; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i + 1)
      const dow = d.getDay() === 0 ? 6 : d.getDay() - 1
      days.push({
        date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        dayName: DAY_NAMES[dow],
        dayNum: d.getDate(),
        month: d.toLocaleDateString('ro-RO', { month: 'short' }),
        isToday: false,
      })
    }
    return days
  }, [])

  // Group calendar into weeks
  const weeks = useMemo(() => {
    const result: typeof calendarDays[] = []
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7))
    }
    return result
  }, [calendarDays])

  // Get available slots for selected staff + date
  const availableSlots = useMemo(() => {
    if (!selectedStaffId || !selectedDate) return []
    return availability
      .filter(s => s.staffId === selectedStaffId && s.date === selectedDate && !s.isBooked)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }, [availability, selectedStaffId, selectedDate])

  const selectedStaff = staff.find(s => s.id === selectedStaffId)

  // Get dates that have at least one slot for the selected staff
  const datesWithSlots = useMemo(() => {
    if (!selectedStaffId) return new Set<string>()
    return new Set(
      availability.filter(s => s.staffId === selectedStaffId && !s.isBooked).map(s => s.date)
    )
  }, [availability, selectedStaffId])

  return (
    <div className="space-y-6">
      {/* Staff Selection */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          Alege un agent
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {staff.map((member) => {
            const isSelected = selectedStaffId === member.id
            return (
              <motion.button
                key={member.id}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onStaffSelect(member)
                  onDateSelect(null)
                  onSlotSelect({} as AvailabilitySlot)
                }}
                className={`
                  text-left rounded-xl border-2 p-4 transition-all duration-200
                  ${isSelected
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                    : 'border-border hover:border-primary/40 hover:bg-muted/50'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className={
                      isSelected
                        ? 'bg-primary text-primary-foreground text-sm font-bold'
                        : 'bg-muted text-muted-foreground text-sm font-bold'
                    }>
                      {member.avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-2.5 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {member.phone}
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* Calendar Grid */}
      {selectedStaffId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            Alege o data
          </h3>
          <div className="glass-card rounded-xl p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAY_NAMES.map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map((day) => {
                  const hasSlots = datesWithSlots.has(day.date)
                  const isSelected = selectedDate === day.date
                  const isDisabled = !hasSlots
                  return (
                    <button
                      key={day.date}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        onDateSelect(day.date)
                        onSlotSelect({} as AvailabilitySlot)
                      }}
                      className={`
                        relative flex flex-col items-center py-2 px-1 rounded-lg text-xs transition-all duration-200
                        ${isDisabled
                          ? 'text-muted-foreground/40 cursor-not-allowed'
                          : isSelected
                            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-105'
                            : 'hover:bg-muted cursor-pointer'
                        }
                      `}
                    >
                      <span className="font-medium">{day.dayName}</span>
                      <span className={`text-base font-bold leading-tight ${isSelected ? '' : ''}`}>
                        {day.dayNum}
                      </span>
                      <span className="text-[10px] leading-tight">{day.month}</span>
                      {hasSlots && !isSelected && (
                        <div className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Time Slots */}
      {selectedStaffId && selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Ore disponibile — {formatDateRO(selectedDate)}
            {selectedStaff && (
              <span className="text-muted-foreground font-normal">cu {selectedStaff.name}</span>
            )}
          </h3>
          {availableSlots.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {availableSlots.map((slot) => {
                const isSelected = selectedSlotId === slot.id
                return (
                  <motion.button
                    key={slot.id}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSlotSelect(slot)}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
                      ${isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25'
                        : 'bg-background border-border hover:border-primary/40 hover:bg-primary/5'
                      }
                    `}
                  >
                    {slot.startTime} — {slot.endTime}
                  </motion.button>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Nu sunt sloturi disponibile pentru aceasta data.
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

// ─── Step 3: Confirmation ───────────────────────────────────────────────────

function StepConfirmation({
  property,
  staff,
  date,
  slot,
  notes,
  onNotesChange,
  isSubmitting,
  onSubmit,
}: {
  property: UserProperty
  staff: StaffMember
  date: string
  slot: AvailabilitySlot
  notes: string
  onNotesChange: (notes: string) => void
  isSubmitting: boolean
  onSubmit: () => void
}) {
  return (
    <div className="space-y-5">
      {/* Summary Card */}
      <Card className="glass-card border-0 shadow-none overflow-hidden">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
            <CalendarCheck className="h-4 w-4" />
            Rezumat Programare
          </h3>

          <div className="grid gap-3">
            {/* Property */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Proprietate</p>
                <p className="font-semibold text-sm">{property.title}</p>
                {property.address && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{property.address}</p>
                )}
              </div>
            </div>

            {/* Agent */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {staff.avatarInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Agent Imobiliar</p>
                <p className="font-semibold text-sm">{staff.name}</p>
                <p className="text-xs text-muted-foreground">{staff.role} · {staff.phone}</p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CalendarDays className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Data si Ora</p>
                <p className="font-semibold text-sm">{formatDateRO(date)}</p>
                <p className="text-xs text-muted-foreground">{slot.startTime} — {slot.endTime}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-medium">
          Observatii <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="notes"
          placeholder="Adauga observatii pentru vizionare (ex: preferi sa vezi zona de noapte, ai intrebari specifice etc.)"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          className="resize-none"
        />
      </div>

      {/* Submit */}
      <Button
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full h-12 text-base font-semibold gap-2"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Se salveaza...
          </>
        ) : (
          <>
            <CalendarCheck className="h-4 w-4" />
            Confirma Programarea
          </>
        )}
      </Button>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export function ProgramareVizionarePage() {
  const { user, loading: authLoading } = useAuth()
  const { vizionarePropertyId, vizionarePropertyTitle, setVizionareProperty, navigateTo } = useAppStore()

  const [step, setStep] = useState(() => vizionarePropertyId ? 2 : 1)
  const [selectedProperty, setSelectedProperty] = useState<UserProperty | null>(() =>
    vizionarePropertyId && vizionarePropertyTitle
      ? { id: vizionarePropertyId, title: vizionarePropertyTitle } as UserProperty
      : null
  )
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Seed availability on first render
  useEffect(() => {
    seedAvailability()
  }, [])

  const handlePropertySelect = (prop: UserProperty) => {
    setSelectedProperty(prop)
    setSelectedStaff(null)
    setSelectedDate(null)
    setSelectedSlot(null)
    setNotes('')
  }

  const handleStaffSelect = (staff: StaffMember) => {
    setSelectedStaff(staff)
    setSelectedDate(null)
    setSelectedSlot(null)
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setSelectedSlot(null)
  }

  const handleSlotSelect = (slot: AvailabilitySlot) => {
    setSelectedSlot(slot)
  }

  const handleSubmit = () => {
    if (!user || !selectedProperty || !selectedStaff || !selectedDate || !selectedSlot) return

    setIsSubmitting(true)

    // Create vizionare
    const vizionare: Vizionare = {
      id: generateId(),
      propertyId: selectedProperty.id,
      propertyTitle: selectedProperty.title,
      userId: user.id,
      userName: user.user_metadata?.full_name || user.email || '',
      userEmail: user.email || '',
      staffId: selectedStaff.id,
      staffName: selectedStaff.name,
      date: selectedDate,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      status: 'pending',
      notes,
      createdAt: new Date().toISOString(),
    }

    // Save vizionare
    const existing = loadFromLS<Vizionare[]>('hqs_vizionari', [])
    existing.push(vizionare)
    saveToLS('hqs_vizionari', existing)

    // Mark slot as booked
    const slots = loadFromLS<AvailabilitySlot[]>('hqs_staff_availability', [])
    const slotIndex = slots.findIndex(s => s.id === selectedSlot.id)
    if (slotIndex !== -1) {
      slots[slotIndex].isBooked = true
      slots[slotIndex].bookedBy = user.id
      slots[slotIndex].bookedByName = user.user_metadata?.full_name || user.email || ''
      saveToLS('hqs_staff_availability', slots)
    }

    // Clear context
    setVizionareProperty(null, null)

    setTimeout(() => {
      setIsSubmitting(false)
      toast.success('Vizionare programata cu succes!', {
        description: `Vei fi contactat de ${selectedStaff.name} pentru confirmare.`,
      })
      navigateTo('vizionarile-mele')
    }, 600)
  }

  const canProceedStep2 = !!selectedProperty
  const canProceedStep3 = !!selectedStaff && !!selectedDate && !!selectedSlot && !!selectedSlot.id

  const handleStepClick = (newStep: number) => {
    if (newStep === 1) {
      setStep(1)
    } else if (newStep === 2 && canProceedStep2) {
      setStep(2)
    } else if (newStep === 3 && canProceedStep3) {
      setStep(3)
    }
  }

  const goNext = () => {
    if (step < 3) {
      setStep(step + 1)
    }
  }
  const goBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigateTo('proprietati')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Inapoi la proprietati
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Programare Vizionare
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Programeaza o vizionare la proprietatea dorita cu un agent specialist.
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={step} onStepClick={handleStepClick} />

        {/* Step Content */}
        <div className="glass-card rounded-2xl p-5 sm:p-8 min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {step === 1 && (
                <StepPropertySelection
                  selectedId={selectedProperty?.id ?? null}
                  onSelect={handlePropertySelect}
                />
              )}

              {step === 2 && (
                <StepAgentDate
                  selectedStaffId={selectedStaff?.id ?? null}
                  selectedDate={selectedDate}
                  selectedSlotId={selectedSlot?.id ?? null}
                  onStaffSelect={handleStaffSelect}
                  onDateSelect={handleDateSelect}
                  onSlotSelect={handleSlotSelect}
                />
              )}

              {step === 3 && selectedProperty && selectedStaff && selectedDate && selectedSlot && (
                <StepConfirmation
                  property={selectedProperty}
                  staff={selectedStaff}
                  date={selectedDate}
                  slot={selectedSlot}
                  notes={notes}
                  onNotesChange={setNotes}
                  isSubmitting={isSubmitting}
                  onSubmit={handleSubmit}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={step === 1}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Inapoi
          </Button>

          {step < 3 && (
            <Button
              onClick={goNext}
              disabled={step === 1 ? !canProceedStep2 : !canProceedStep3}
              className="gap-2"
            >
              Urmatorul
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}