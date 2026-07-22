'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'
import { loadFromLS, saveToLS, generateId } from '@/lib/storage'
import { LS_KEYS, DEFAULT_STAFF } from '@/lib/constants'
import type { StaffMember, AvailabilitySlot, UserProperty } from '@/lib/types'
import { toast } from 'sonner'
import { PageHero } from '@/components/layout/page-hero'
import { toDateString } from '@/lib/utils'
import { StepIndicator } from '@/components/vizionare/step-indicator'
import { PropertyPickerStep } from '@/components/vizionare/property-picker-step'
import { StaffDatePickerStep } from '@/components/vizionare/staff-date-picker-step'
import { ConfirmationStep } from '@/components/vizionare/confirmation-step'
import { createViewing, getAgencyLegalProfile } from '@/lib/viewing-documents'

// ─── Seed availability helper ────────────────────────────────────────────────

function seedAvailability() {
  const existing = loadFromLS<AvailabilitySlot[]>(LS_KEYS.STAFF_AVAILABILITY, [])
  if (existing.length > 0) return

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

    const dateStr = toDateString(date)
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
  saveToLS(LS_KEYS.STAFF_AVAILABILITY, slots)
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
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [privacyNoticeUrl, setPrivacyNoticeUrl] = useState<string | null>(null)
  const [privacyNoticeVersion, setPrivacyNoticeVersion] = useState<string | null>(null)
  const [complianceLoading, setComplianceLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Seed availability on first render
  useEffect(() => {
    seedAvailability()
    getAgencyLegalProfile()
      .then((agency) => {
        if (agency?.status === 'ACTIVE' && agency.privacyNoticeUrl) {
          setPrivacyNoticeUrl(agency.privacyNoticeUrl)
          setPrivacyNoticeVersion(agency.privacyNoticeVersion)
        }
      })
      .catch(() => {
        setPrivacyNoticeUrl(null)
        setPrivacyNoticeVersion(null)
      })
      .finally(() => setComplianceLoading(false))
  }, [])

  const handlePropertySelect = (prop: UserProperty) => {
    setSelectedProperty(prop)
    setSelectedStaff(null)
    setSelectedDate(null)
    setSelectedSlot(null)
    setNotes('')
    setTermsAccepted(false)
    setPrivacyAccepted(false)
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

  const handleSubmit = async () => {
    if (!user || !selectedProperty || !selectedStaff || !selectedDate || !selectedSlot) return
    if (!termsAccepted || !privacyAccepted || !privacyNoticeUrl) {
      toast.error('Acceptă regulile programării și informarea de confidențialitate.')
      return
    }

    setIsSubmitting(true)
    try {
      await createViewing({
        user,
        propertyId: selectedProperty.id,
        propertyTitle: selectedProperty.title,
        staffId: selectedStaff.id,
        staffName: selectedStaff.name,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        notes,
        termsAccepted,
        privacyAccepted,
      })

      // Availability remains local for the current MVP, while the appointment
      // itself is now persisted and protected by Supabase RLS.
      const slots = loadFromLS<AvailabilitySlot[]>(LS_KEYS.STAFF_AVAILABILITY, [])
      const slotIndex = slots.findIndex(s => s.id === selectedSlot.id)
      if (slotIndex !== -1) {
        slots[slotIndex].isBooked = true
        slots[slotIndex].bookedBy = user.id
        slots[slotIndex].bookedByName = user.user_metadata?.full_name || user.email || ''
        saveToLS(LS_KEYS.STAFF_AVAILABILITY, slots)
      }

      setVizionareProperty(null, null)
      toast.success('Vizionare programata cu succes!', {
        description: `Vei fi contactat de ${selectedStaff.name} pentru confirmare.`,
      })
      navigateTo('vizionarile-mele')
    } catch (error) {
      toast.error('Vizionarea nu a putut fi programata.', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setIsSubmitting(false)
    }
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

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
        <div className="max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold">Autentifica-te pentru a programa vizionarea</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Pastreaza proprietatea selectata si continua cu un cont pentru confirmarea programarii.
          </p>
          <Button className="mt-6" onClick={() => navigateTo('login')}>
            Autentificare
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <PageHero
          variant="simple"
          title="Programare Vizionare"
          description="Programeaza o vizionare la proprietatea dorita cu un agent specialist."
          showBackButton
          onBack={() => navigateTo('proprietati')}
          backLabel="Inapoi la proprietati"
        />

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
                <PropertyPickerStep
                  selectedId={selectedProperty?.id ?? null}
                  onSelect={handlePropertySelect}
                />
              )}

              {step === 2 && (
                <StaffDatePickerStep
                  selectedStaffId={selectedStaff?.id ?? null}
                  selectedDate={selectedDate}
                  selectedSlotId={selectedSlot?.id ?? null}
                  onStaffSelect={handleStaffSelect}
                  onDateSelect={handleDateSelect}
                  onSlotSelect={handleSlotSelect}
                />
              )}

              {step === 3 && selectedProperty && selectedStaff && selectedDate && selectedSlot && (
                <ConfirmationStep
                  property={selectedProperty}
                  staff={selectedStaff}
                  date={selectedDate}
                  slot={selectedSlot}
                  notes={notes}
                  onNotesChange={setNotes}
                  termsAccepted={termsAccepted}
                  onTermsAcceptedChange={setTermsAccepted}
                  privacyAccepted={privacyAccepted}
                  onPrivacyAcceptedChange={setPrivacyAccepted}
                  privacyNoticeUrl={privacyNoticeUrl}
                  privacyNoticeVersion={privacyNoticeVersion}
                  complianceLoading={complianceLoading}
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
