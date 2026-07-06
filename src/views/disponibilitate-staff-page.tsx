'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, ChevronRight, CalendarDays, Clock, Plus, Trash2, CalendarRange,
  Users, CheckCircle2, Lock, AlertCircle, CalendarPlus, ChevronDown, ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  loadFromLS, saveToLS, generateId, DEFAULT_STAFF,
  type StaffMember, type AvailabilitySlot,
} from '@/lib/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const LS_KEY = 'hqs_staff_availability'
const LS_VIZIONARI = 'hqs_vizionari'

const WEEKDAY_NAMES_RO = ['Luni', 'Marti', 'Miercuri', 'Joi', 'Vineri', 'Sambata', 'Duminica']
const MONTH_NAMES_RO = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
]

function formatDateRO(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()} ${MONTH_NAMES_RO[d.getMonth()]} ${d.getFullYear()}`
}

function getWeekdayRO(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return WEEKDAY_NAMES_RO[d.getDay() === 0 ? 6 : d.getDay() - 1]
}

function isDatePast(dateStr: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr + 'T00:00:00')
  return d < today
}

function isToday(dateStr: string): boolean {
  const today = new Date()
  const d = new Date(dateStr + 'T00:00:00')
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  )
}

function getNextMonday(): Date {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? 1 : 8 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function DisponibilitateStaffPage() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(() => {
    if (typeof window === 'undefined') return []
    return loadFromLS<AvailabilitySlot[]>(LS_KEY, [])
  })
  const [selectedStaffId, setSelectedStaffId] = useState<string>(DEFAULT_STAFF[0].id)
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
  const [mounted] = useState(() => typeof window !== 'undefined')

  // Persist slots
  const persistSlots = useCallback((newSlots: AvailabilitySlot[]) => {
    setSlots(newSlots)
    saveToLS(LS_KEY, newSlots)
  }, [])

  // Filter slots for selected staff
  const staffSlots = useMemo(
    () => slots.filter((s) => s.staffId === selectedStaffId),
    [slots, selectedStaffId],
  )

  // Group slots by date, sorted ascending
  const groupedSlots = useMemo(() => {
    const groups: Record<string, AvailabilitySlot[]> = {}
    staffSlots.forEach((slot) => {
      if (!groups[slot.date]) groups[slot.date] = []
      groups[slot.date].push(slot)
    })
    // Sort within each group by startTime
    Object.values(groups).forEach((arr) => arr.sort((a, b) => a.startTime.localeCompare(b.startTime)))
    // Return sorted by date
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [staffSlots])

  const toggleDateExpanded = (dateStr: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev)
      if (next.has(dateStr)) next.delete(dateStr)
      else next.add(dateStr)
      return next
    })
  }

  // Get today as YYYY-MM-DD
  const todayStr = toDateString(new Date())

  // Add a single slot
  const handleAddSlot = () => {
    if (!date) {
      toast.error('Selecteaza o data')
      return
    }
    if (!startTime || !endTime) {
      toast.error('Selecteaza orele de inceput si sfarsit')
      return
    }
    if (startTime >= endTime) {
      toast.error('Ora de sfarsit trebuie sa fie dupa ora de inceput')
      return
    }

    const newSlot: AvailabilitySlot = {
      id: generateId(),
      staffId: selectedStaffId,
      date,
      startTime,
      endTime,
      isBooked: false,
      bookedBy: null,
      bookedByName: null,
    }

    persistSlots([...slots, newSlot])
    toast.success('Slot adaugat cu succes!')
    setDate('')
  }

  // Bulk add for next week Mon-Fri
  const handleBulkAddWeek = () => {
    const monday = getNextMonday()
    const newSlots: AvailabilitySlot[] = []

    for (let i = 0; i < 5; i++) {
      const d = new Date(monday)
      d.setDate(d.getDate() + i)
      const dateStr = toDateString(d)

      // Check if slot already exists for this staff+date+time
      const exists = slots.some(
        (s) => s.staffId === selectedStaffId && s.date === dateStr && s.startTime === '09:00' && s.endTime === '17:00',
      )
      if (!exists) {
        newSlots.push({
          id: generateId(),
          staffId: selectedStaffId,
          date: dateStr,
          startTime: '09:00',
          endTime: '17:00',
          isBooked: false,
          bookedBy: null,
          bookedByName: null,
        })
      }
    }

    if (newSlots.length === 0) {
      toast.info('Toate sloturile pentru saptamana viitoare exista deja')
      return
    }

    persistSlots([...slots, ...newSlots])
    toast.success(`${newSlots.length} sloturi adaugate pentru saptamana viitoare!`)
  }

  // Delete a slot
  const handleDeleteSlot = (slot: AvailabilitySlot) => {
    if (slot.isBooked) {
      toast.error('Acest slot este rezervat si nu poate fi sters')
      return
    }

    // Check if any vizionare references this slot
    const vizionari = loadFromLS(LS_VIZIONARI, [])
    const isReferenced = (vizionari as Array<{ staffId: string; date: string; startTime: string; endTime: string }>).some(
      (v) => v.staffId === slot.staffId && v.date === slot.date && v.startTime === slot.startTime && v.endTime === slot.endTime,
    )

    if (isReferenced) {
      toast.error('Exista o vizionare programata in acest interval')
      return
    }

    const newSlots = slots.filter((s) => s.id !== slot.id)
    persistSlots(newSlots)
    toast.success('Slot sters')
  }

  const selectedStaff = DEFAULT_STAFF.find((s) => s.id === selectedStaffId) ?? DEFAULT_STAFF[0]

  if (!mounted) return null

  return (
    <>
      {/* Page Hero */}
      <section className="relative py-16 lg:py-20 bg-gradient-to-b from-primary/5 via-transparent to-transparent overflow-hidden">
        <div className="absolute inset-0 dots-pattern opacity-30" />
        <div
          className="floating-blob w-[400px] h-[400px] -top-32 -right-32"
          style={{ background: 'radial-gradient(circle, oklch(0.527 0.14 160 / 10%) 0%, transparent 70%)' }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
              <Home className="h-4 w-4" />
              <span>Acasa</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium">Disponibilitate Staff</span>
            </nav>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarDays className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Disponibilitate Staff</h1>
                <p className="text-muted-foreground mt-1">
                  Gestioneaza intervalele orare disponibile pentru fiecare membru al echipei
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* Main Content */}
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Staff Selector */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Label className="text-sm font-medium text-muted-foreground mb-3 block">
              <Users className="h-4 w-4 inline mr-1.5" />
              Selecteaza membrul staff-ului
            </Label>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {DEFAULT_STAFF.filter((s) => s.isActive).map((staff) => (
                <button
                  key={staff.id}
                  onClick={() => setSelectedStaffId(staff.id)}
                  className={cn(
                    'flex items-center gap-3 shrink-0 rounded-xl border-2 px-4 py-3 transition-all duration-200 hover:shadow-md',
                    selectedStaffId === staff.id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-card hover:border-primary/40',
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback
                      className={cn(
                        'text-sm font-semibold',
                        selectedStaffId === staff.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {staff.avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-medium leading-tight">{staff.name}</p>
                    <p className="text-xs text-muted-foreground">{staff.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Add Availability Form */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card rounded-xl p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CalendarPlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Adauga Disponibilitate</h2>
                  <p className="text-xs text-muted-foreground">
                    pentru {selectedStaff.name}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleBulkAddWeek} className="shrink-0">
                <CalendarRange className="h-4 w-4 mr-1.5" />
                Toata Saptamana
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slot-date">Data</Label>
                <Input
                  id="slot-date"
                  type="date"
                  min={todayStr}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slot-start">Ora inceput</Label>
                <Input
                  id="slot-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slot-end">Ora sfarsit</Label>
                <Input
                  id="slot-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button onClick={handleAddSlot} disabled={!date}>
                <Plus className="h-4 w-4 mr-1.5" />
                Adauga Slot
              </Button>
            </div>
          </motion.div>

          {/* Availability List */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Sloturi Programate</h2>
              <Badge variant="secondary" className="ml-1">
                {staffSlots.length}
              </Badge>
            </div>

            {groupedSlots.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarDays className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground font-medium">Nu exista sloturi programate</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Adauga disponibilitati folosind formularul de mai sus
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {groupedSlots.map(([dateStr, dateSlots]) => {
                  const past = isDatePast(dateStr) && !isToday(dateStr)
                  const isExpanded = expandedDates.has(dateStr) || !past

                  return (
                    <Card
                      key={dateStr}
                      className={cn(
                        'transition-all duration-200',
                        past && 'opacity-60',
                        !past && 'hover:shadow-md',
                      )}
                    >
                      {/* Date header */}
                      <button
                        onClick={() => toggleDateExpanded(dateStr)}
                        className="w-full flex items-center justify-between p-4 text-left"
                        aria-expanded={isExpanded}
                      >
                        <div className="flex items-center gap-3">
                          {/* Calendar style date display */}
                          <div className={cn(
                            'flex flex-col items-center justify-center rounded-lg bg-primary/10 px-3 py-2 min-w-[56px]',
                            isToday(dateStr) && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                          )}>
                            <span className="text-2xl font-bold leading-none text-primary">
                              {new Date(dateStr + 'T00:00:00').getDate()}
                            </span>
                            <span className="text-[10px] font-medium uppercase text-primary/80 mt-0.5">
                              {MONTH_NAMES_RO[new Date(dateStr + 'T00:00:00').getMonth()].slice(0, 3)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {getWeekdayRO(dateStr)}, {formatDateRO(dateStr)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {dateSlots.length} {dateSlots.length === 1 ? 'slot' : 'sloturi'}
                              {isToday(dateStr) && (
                                <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
                                  Astazi
                                </Badge>
                              )}
                              {past && (
                                <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 text-muted-foreground">
                                  Trecut
                                </Badge>
                              )}
                            </p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4">
                              <Separator className="mb-3" />
                              <div className="space-y-2">
                                {dateSlots.map((slot) => (
                                  <div
                                    key={slot.id}
                                    className={cn(
                                      'flex items-center justify-between rounded-lg border px-4 py-3 transition-colors',
                                      slot.isBooked
                                        ? 'border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20'
                                        : past
                                          ? 'border-border/50 bg-muted/30'
                                          : 'border-border bg-card hover:bg-muted/50 hover:border-primary/30',
                                    )}
                                  >
                                    <div className="flex items-center gap-3">
                                      <Clock className={cn(
                                        'h-4 w-4',
                                        slot.isBooked ? 'text-amber-500' : past ? 'text-muted-foreground/50' : 'text-primary',
                                      )} />
                                      <span className={cn(
                                        'font-mono text-sm font-medium',
                                        past && 'text-muted-foreground/70',
                                      )}>
                                        {slot.startTime} – {slot.endTime}
                                      </span>
                                      {slot.isBooked ? (
                                        <Badge variant="outline" className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-[11px]">
                                          <Lock className="h-3 w-3 mr-1" />
                                          Rezervat
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[11px]">
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          Disponibil
                                        </Badge>
                                      )}
                                      {slot.isBooked && slot.bookedByName && (
                                        <span className="text-xs text-muted-foreground hidden sm:inline">
                                          ({slot.bookedByName})
                                        </span>
                                      )}
                                    </div>
                                    {!slot.isBooked && !past && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteSlot(slot)}
                                        className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                                        aria-label={`Sterge slot ${slot.startTime}-${slot.endTime}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  )
                })}
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </>
  )
}