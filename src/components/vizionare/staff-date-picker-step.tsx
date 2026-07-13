'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarDays, Clock, User, Check, Phone,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { loadFromLS } from '@/lib/storage'
import { DEFAULT_STAFF, DAY_NAMES_SHORT, LS_KEYS } from '@/lib/constants'
import type { StaffMember, AvailabilitySlot } from '@/lib/types'
import { formatDateRO } from '@/lib/utils'

interface StaffDatePickerStepProps {
  selectedStaffId: string | null
  selectedDate: string | null
  selectedSlotId: string | null
  onStaffSelect: (staff: StaffMember) => void
  onDateSelect: (date: string) => void
  onSlotSelect: (slot: AvailabilitySlot) => void
}

export function StaffDatePickerStep({
  selectedStaffId,
  selectedDate,
  selectedSlotId,
  onStaffSelect,
  onDateSelect,
  onSlotSelect,
}: StaffDatePickerStepProps) {
  const [availability] = useState<AvailabilitySlot[]>(() =>
    loadFromLS<AvailabilitySlot[]>(LS_KEYS.STAFF_AVAILABILITY, [])
  )
  const staff = DEFAULT_STAFF.filter(s => s.isActive)

  // Generate next 14 days grid
  const calendarDays = useMemo(() => {
    const today = new Date()
    const days: Array<{ date: string; dayName: string; dayNum: number; month: string; isToday: boolean }> = []

    for (let i = 0; i < 14; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i + 1)
      const dow = d.getDay() === 0 ? 6 : d.getDay() - 1
      days.push({
        date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        dayName: DAY_NAMES_SHORT[dow],
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
              {DAY_NAMES_SHORT.map(d => (
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
                      <span className="text-base font-bold leading-tight">
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