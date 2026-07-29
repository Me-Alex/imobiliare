'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Phone,
  SlidersHorizontal,
  Sparkles,
  User,
} from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { DEFAULT_STAFF, DAY_NAMES_SHORT, LS_KEYS } from '@/lib/constants'
import { getRecommendedViewingSlots } from '@/lib/viewing-schedule'
import { loadFromLS } from '@/lib/storage'
import type { AvailabilitySlot, StaffMember } from '@/lib/types'
import { formatDateRO, toDateString } from '@/lib/utils'

interface StaffDatePickerStepProps {
  selectedStaffId: string | null
  selectedDate: string | null
  selectedSlotId: string | null
  onStaffSelect: (staff: StaffMember) => void
  onDateSelect: (date: string) => void
  onSlotSelect: (slot: AvailabilitySlot) => void
}

const ACTIVE_STAFF = DEFAULT_STAFF.filter((member) => member.isActive)

export function StaffDatePickerStep({
  selectedStaffId,
  selectedDate,
  selectedSlotId,
  onStaffSelect,
  onDateSelect,
  onSlotSelect,
}: StaffDatePickerStepProps) {
  const [availability] = useState<AvailabilitySlot[]>(() =>
    loadFromLS<AvailabilitySlot[]>(LS_KEYS.STAFF_AVAILABILITY, []),
  )
  const [today] = useState(() => toDateString(new Date()))
  const [showAgentChoice, setShowAgentChoice] = useState(false)

  const recommendedSlots = useMemo(
    () => getRecommendedViewingSlots(availability, ACTIVE_STAFF, today, 6),
    [availability, today],
  )

  const calendarDays = useMemo(() => {
    const base = new Date(`${today}T12:00:00`)
    const days: Array<{ date: string; dayName: string; dayNum: number; month: string }> = []

    for (let index = 1; index <= 14; index += 1) {
      const date = new Date(base)
      date.setDate(base.getDate() + index)
      const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1
      days.push({
        date: toDateString(date),
        dayName: DAY_NAMES_SHORT[dayIndex],
        dayNum: date.getDate(),
        month: date.toLocaleDateString('ro-RO', { month: 'short' }),
      })
    }
    return days
  }, [today])

  const weeks = useMemo(() => {
    const grouped: typeof calendarDays[] = []
    for (let index = 0; index < calendarDays.length; index += 7) {
      grouped.push(calendarDays.slice(index, index + 7))
    }
    return grouped
  }, [calendarDays])

  const availableSlots = useMemo(() => {
    if (!selectedStaffId || !selectedDate) return []
    return availability
      .filter((slot) => slot.staffId === selectedStaffId && slot.date === selectedDate && !slot.isBooked)
      .sort((left, right) => left.startTime.localeCompare(right.startTime))
  }, [availability, selectedDate, selectedStaffId])

  const datesWithSlots = useMemo(() => {
    if (!selectedStaffId) return new Set<string>()
    return new Set(
      availability
        .filter((slot) => slot.staffId === selectedStaffId && !slot.isBooked && slot.date > today)
        .map((slot) => slot.date),
    )
  }, [availability, selectedStaffId, today])

  const selectedStaff = ACTIVE_STAFF.find((member) => member.id === selectedStaffId)
  const selectedSlot = availability.find((slot) => slot.id === selectedSlotId)
  const manualVisible = showAgentChoice || recommendedSlots.length === 0

  const selectRecommendedSlot = (staff: StaffMember, slot: AvailabilitySlot) => {
    onStaffSelect(staff)
    onDateSelect(slot.date)
    onSlotSelect(slot)
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="recommended-slots-title">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h3 id="recommended-slots-title" className="text-sm font-semibold">Alege rapid un interval</h3>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              Îți arătăm cele mai apropiate ore și alocăm automat agentul disponibil.
            </p>
          </div>
        </div>

        {recommendedSlots.length > 0 ? (
          <div className="scroll-horizontal mt-4 flex snap-x gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-3">
            {recommendedSlots.map(({ staff, slot }) => {
              const isSelected = selectedSlotId === slot.id
              return (
                <motion.button
                  key={slot.id}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => selectRecommendedSlot(staff, slot)}
                  className={`min-w-[82%] snap-start rounded-xl border-2 p-3 text-left transition-colors sm:min-w-0 ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/35 hover:bg-muted/40'
                  }`}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold capitalize">{formatDateRO(slot.date)}</p>
                      <p className="mt-0.5 text-base font-bold text-primary">{slot.startTime} – {slot.endTime}</p>
                    </div>
                    {isSelected ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 truncate text-[11px] text-muted-foreground">cu {staff.name}</p>
                </motion.button>
              )
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            Nu există un interval rapid disponibil. Poți alege manual un agent și o altă zi.
          </div>
        )}

        {selectedStaff && selectedSlot ? (
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold">Interval selectat</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateRO(selectedSlot.date)}, {selectedSlot.startTime} · {selectedStaff.name}
                </p>
              </div>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowAgentChoice(true)}>
              Schimbă agentul
            </Button>
          </div>
        ) : null}

        {recommendedSlots.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-3 gap-2 text-muted-foreground"
            onClick={() => setShowAgentChoice((visible) => !visible)}
            aria-expanded={showAgentChoice}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Prefer un anumit agent sau altă zi
            {showAgentChoice
              ? <ChevronUp className="h-4 w-4" aria-hidden="true" />
              : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
          </Button>
        ) : null}
      </section>

      {manualVisible ? (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          aria-label="Alegere manuală a agentului și datei"
          className="space-y-6"
        >
          <Separator />

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <User className="h-4 w-4 text-primary" aria-hidden="true" />
              Alege agentul preferat
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ACTIVE_STAFF.map((member) => {
                const isSelected = selectedStaffId === member.id
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => onStaffSelect(member)}
                    className={`rounded-xl border-2 p-4 text-left transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/35 hover:bg-muted/40'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                          {member.avatarInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                      {isSelected ? <Check className="h-4 w-4 text-primary" aria-hidden="true" /> : null}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" aria-hidden="true" />
                      {member.phone}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {selectedStaffId ? (
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                Alege ziua
              </h3>
              <div className="glass-card rounded-xl p-4">
                <div className="mb-2 grid grid-cols-7 gap-1">
                  {DAY_NAMES_SHORT.map((day) => (
                    <div key={day} className="py-1 text-center text-xs font-medium text-muted-foreground">{day}</div>
                  ))}
                </div>
                {weeks.map((week) => (
                  <div key={week[0]?.date} className="grid grid-cols-7 gap-1">
                    {week.map((day) => {
                      const hasSlots = datesWithSlots.has(day.date)
                      const isSelected = selectedDate === day.date
                      return (
                        <button
                          key={day.date}
                          type="button"
                          disabled={!hasSlots}
                          onClick={() => onDateSelect(day.date)}
                          className={`relative flex flex-col items-center rounded-lg px-1 py-2 text-xs transition-colors ${
                            !hasSlots
                              ? 'cursor-not-allowed text-muted-foreground/35'
                              : isSelected
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'cursor-pointer hover:bg-muted'
                          }`}
                        >
                          <span className="font-medium">{day.dayName}</span>
                          <span className="text-base font-bold leading-tight">{day.dayNum}</span>
                          <span className="text-[10px] leading-tight">{day.month}</span>
                          {hasSlots && !isSelected ? <span className="absolute bottom-1 h-1 w-1 rounded-full bg-emerald-500" /> : null}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {selectedStaffId && selectedDate ? (
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
                Ore disponibile · {formatDateRO(selectedDate)}
              </h3>
              {availableSlots.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlotId === slot.id
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => onSlotSelect(slot)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background hover:border-primary/40 hover:bg-primary/5'
                        }`}
                        aria-pressed={isSelected}
                      >
                        {slot.startTime} – {slot.endTime}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed py-6 text-center text-sm text-muted-foreground">
                  <Clock className="mx-auto mb-2 h-7 w-7 opacity-30" aria-hidden="true" />
                  Nu sunt intervale disponibile în această zi.
                </div>
              )}
            </div>
          ) : null}
        </motion.section>
      ) : null}
    </div>
  )
}
