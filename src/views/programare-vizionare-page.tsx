'use client'

import { useState, useEffect, type ElementType } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Clock3,
  FileSignature,
  LogIn,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'
import { loadFromLS, saveToLS, generateId } from '@/lib/storage'
import { LS_KEYS, DEFAULT_STAFF } from '@/lib/constants'
import type { StaffMember, AvailabilitySlot, UserProperty } from '@/lib/types'
import { toast } from 'sonner'
import { PageContainer, PageHero, PageShell, PageSurface } from '@/components/layout'
import { PageState } from '@/components/ui/page-state'
import { toDateString } from '@/lib/utils'
import { StepIndicator } from '@/components/vizionare/step-indicator'
import { PropertyPickerStep } from '@/components/vizionare/property-picker-step'
import { StaffDatePickerStep } from '@/components/vizionare/staff-date-picker-step'
import { ConfirmationStep } from '@/components/vizionare/confirmation-step'
import { createViewing, getAgencyLegalProfile } from '@/lib/viewing-documents'
import {
  getViewingSchedulingJourney,
  type ViewingSchedulingJourney,
  type ViewingSchedulingStage,
  type ViewingSchedulingStageState,
} from '@/lib/viewing-scheduling-journey'

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

const SCHEDULING_STAGE_ICONS: Record<ViewingSchedulingStage['id'], ElementType> = {
  property: Building2,
  slot: CalendarCheck,
  consent: ShieldCheck,
  afterBooking: FileSignature,
}

const SCHEDULING_STAGE_STATE_META: Record<ViewingSchedulingStageState, {
  label: string
  className: string
  markerClassName: string
  badgeClassName: string
}> = {
  complete: {
    label: 'Gata',
    className: 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/70 dark:bg-emerald-950/25',
    markerClassName: 'bg-emerald-600 text-white',
    badgeClassName: 'bg-emerald-600 text-white hover:bg-emerald-600',
  },
  current: {
    label: 'Acum',
    className: 'border-primary/30 bg-primary/[0.06]',
    markerClassName: 'bg-primary text-primary-foreground',
    badgeClassName: 'bg-primary text-primary-foreground',
  },
  blocked: {
    label: 'Blocat',
    className: 'border-rose-300 bg-rose-50/80 dark:border-rose-900/70 dark:bg-rose-950/25',
    markerClassName: 'bg-rose-600 text-white',
    badgeClassName: 'bg-rose-600 text-white hover:bg-rose-600',
  },
  pending: {
    label: 'Urmează',
    className: 'border-border bg-background/80',
    markerClassName: 'bg-muted text-muted-foreground',
    badgeClassName: 'bg-background text-muted-foreground hover:bg-background',
  },
}

function ViewingSchedulingJourneyPanel({
  journey,
  onSelectStep,
}: {
  journey: ViewingSchedulingJourney
  onSelectStep: (step: number) => void
}) {
  const PrimaryIcon = SCHEDULING_STAGE_ICONS[journey.currentStage.id]

  return (
    <PageSurface tone="elevated" className="mb-6 overflow-hidden">
      <div className="border-b bg-background/75 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Badge className="mb-2 w-fit bg-primary/10 text-primary hover:bg-primary/10">
              Hartă programare
            </Badge>
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <PrimaryIcon className="h-5 w-5 text-primary" />
              {journey.headline}
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              {journey.description}
            </p>
          </div>
          <div className="min-w-[190px] rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  progres
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-primary">{journey.progressPercent}%</p>
              </div>
              <Badge variant="secondary">{journey.completedCount}/{journey.totalCount} gata</Badge>
            </div>
            <Progress value={journey.progressPercent} className="mt-3 h-2" />
          </div>
        </div>
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-2">
        {journey.stages.map((stageItem) => {
          const Icon = SCHEDULING_STAGE_ICONS[stageItem.id]
          const meta = SCHEDULING_STAGE_STATE_META[stageItem.state]

          return (
            <button
              key={stageItem.id}
              type="button"
              onClick={() => onSelectStep(stageItem.step)}
              disabled={stageItem.state === 'pending'}
              className={`group rounded-2xl border p-4 text-left transition-all enabled:hover:-translate-y-0.5 enabled:hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-75 ${meta.className}`}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.markerClassName}`}>
                  {stageItem.state === 'complete'
                    ? <CheckCircle2 className="h-5 w-5" />
                    : stageItem.state === 'pending'
                      ? <Clock3 className="h-5 w-5" />
                      : <Icon className="h-5 w-5" />}
                </span>
                <Badge className={`text-[10px] ${meta.badgeClassName}`}>{meta.label}</Badge>
              </div>
              <p className="text-sm font-semibold">{stageItem.title}</p>
              <p className="mt-1 line-clamp-3 text-xs leading-5 text-muted-foreground">{stageItem.description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                {stageItem.actionLabel}
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-enabled:group-hover:translate-x-1" />
              </span>
            </button>
          )
        })}
      </div>
    </PageSurface>
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
        notes: notes.trim(),
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
      toast.success('Vizionare programată cu succes!', {
        description: `Vei fi contactat de ${selectedStaff.name} pentru confirmare.`,
      })
      navigateTo('vizionarile-mele')
    } catch (error) {
      toast.error('Vizionarea nu a putut fi programată.', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceedStep2 = !!selectedProperty
  const canProceedStep3 = !!selectedStaff && !!selectedDate && !!selectedSlot && !!selectedSlot.id
  const schedulingJourney = getViewingSchedulingJourney({
    hasProperty: Boolean(selectedProperty),
    hasStaff: Boolean(selectedStaff),
    hasDate: Boolean(selectedDate),
    hasSlot: Boolean(selectedSlot?.id),
    termsAccepted,
    privacyAccepted,
    privacyNoticeReady: Boolean(privacyNoticeUrl),
    complianceLoading,
  })

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
      <PageShell>
        <PageContainer width="narrow" className="py-10">
          <PageState
            tone="loading"
            title="Pregătim programarea"
            description="Verificăm sesiunea și disponibilitatea contului tău."
          />
        </PageContainer>
      </PageShell>
    )
  }

  if (!user) {
    return (
      <PageShell>
        <PageContainer width="narrow" className="py-10">
          <PageState
            tone="neutral"
            icon={LogIn}
            title="Autentifică-te pentru a programa vizionarea"
            description="Păstrăm proprietatea selectată și continui imediat după autentificare."
            action={<Button onClick={() => navigateTo('login')}>Autentificare</Button>}
          />
        </PageContainer>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PageContainer width="narrow" className="py-8 sm:py-10">
        <PageHero
          variant="simple"
          icon={CalendarCheck}
          title="Programează o vizionare"
          description="Alege proprietatea și intervalul potrivit. Agentul este alocat automat, iar noi îți arătăm clar fiecare pas următor."
          showBackButton
          onBack={() => navigateTo('proprietati')}
          backLabel="Înapoi la proprietăți"
        />

        <ViewingSchedulingJourneyPanel
          journey={schedulingJourney}
          onSelectStep={handleStepClick}
        />

        {/* Step Indicator */}
        <StepIndicator currentStep={step} onStepClick={handleStepClick} />

        {/* Step Content */}
        <PageSurface tone="elevated" className="min-h-[400px] p-5 sm:p-8">
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
        </PageSurface>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={step === 1}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Înapoi
          </Button>

          {step < 3 && (
            <Button
              onClick={goNext}
              disabled={step === 1 ? !canProceedStep2 : !canProceedStep3}
              className="gap-2"
            >
              Următorul
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </PageContainer>
    </PageShell>
  )
}
