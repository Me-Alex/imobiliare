'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays, Clock, Plus, Trash2, CalendarRange,
  Users, CheckCircle2, Lock, AlertCircle, CalendarPlus, ChevronDown, ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { loadFromLS, saveToLS, generateId } from '@/lib/storage'
import { DEFAULT_STAFF, LS_KEYS, MONTH_NAMES_FULL } from '@/lib/constants'
import type { StaffMember, AvailabilitySlot } from '@/lib/types'
import { toast } from 'sonner'
import { cn, formatDateRO, getWeekdayRO, isDatePast, isToday, toDateString, getNextMonday } from '@/lib/utils'
import { PageHero } from '@/components/layout/page-hero'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'

const LS_VIZIONARI = LS_KEYS.VIZIONARI

function toStaffMember(row: {
  id: string
  email?: string | null
  full_name?: string | null
  name?: string | null
  phone?: string | null
  is_active?: boolean | null
}): StaffMember {
  const name = row.full_name || row.name || row.email?.split('@')[0] || 'Agent HQS'
  const avatarInitials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AH'

  return {
    id: row.id,
    name,
    email: row.email || '',
    phone: row.phone || '',
    role: 'Agent Imobiliar',
    avatarInitials,
    isActive: row.is_active !== false,
  }
}

export function DisponibilitateStaffPage() {
  const { profile } = useAuth()
  const [slots, setSlots] = useState<AvailabilitySlot[]>(() => {
    if (typeof window === 'undefined') return []
    return loadFromLS<AvailabilitySlot[]>(LS_KEYS.STAFF_AVAILABILITY, [])
  })
  const [databaseAgents, setDatabaseAgents] = useState<StaffMember[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<string>(DEFAULT_STAFF[0].id)
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
  const [mounted] = useState(() => typeof window !== 'undefined')

  useEffect(() => {
    if (profile?.role !== 'ADMIN') return

    let cancelled = false
    void supabase
      .from('profiles')
      .select('id,email,name,full_name,phone,is_active')
      .eq('role', 'AGENT')
      .eq('is_active', true)
      .order('full_name')
      .then(({ data, error }) => {
        if (cancelled || error) return
        setDatabaseAgents((data || []).map((row) => toStaffMember(row)))
      })

    return () => { cancelled = true }
  }, [profile])

  const staffMembers = useMemo(() => {
    if (profile?.role === 'AGENT') {
      return [toStaffMember({
        id: profile.id,
        email: profile.email,
        full_name: profile.fullName,
        phone: profile.phone,
        is_active: profile.isActive,
      })]
    }
    if (profile?.role === 'ADMIN') {
      return [...databaseAgents, ...DEFAULT_STAFF].filter(
        (staff, index, all) => all.findIndex((candidate) => candidate.id === staff.id) === index,
      )
    }
    return DEFAULT_STAFF
  }, [databaseAgents, profile])

  const activeSelectedStaffId = staffMembers.some((staff) => staff.id === selectedStaffId)
    ? selectedStaffId
    : staffMembers[0]?.id || DEFAULT_STAFF[0].id

  // Persist slots
  const persistSlots = useCallback((newSlots: AvailabilitySlot[]) => {
    setSlots(newSlots)
    saveToLS(LS_KEYS.STAFF_AVAILABILITY, newSlots)
  }, [])

  // Filter slots for selected staff
  const staffSlots = useMemo(
    () => slots.filter((s) => s.staffId === activeSelectedStaffId),
    [slots, activeSelectedStaffId],
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
      staffId: activeSelectedStaffId,
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
        (s) => s.staffId === activeSelectedStaffId && s.date === dateStr && s.startTime === '09:00' && s.endTime === '17:00',
      )
      if (!exists) {
        newSlots.push({
          id: generateId(),
          staffId: activeSelectedStaffId,
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

  const selectedStaff = staffMembers.find((s) => s.id === activeSelectedStaffId) ?? staffMembers[0] ?? DEFAULT_STAFF[0]

  if (!mounted) return null

  return (
    <>
      <PageHero
        icon={CalendarDays}
        title="Disponibilitate Staff"
        description={profile?.role === 'AGENT'
          ? 'Gestioneaza intervalele tale orare disponibile'
          : 'Gestioneaza intervalele orare disponibile pentru fiecare membru al echipei'}
        breadcrumb={[{ label: 'Acasa', page: 'acasa' }, { label: 'Disponibilitate Staff' }]}
      />

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
              {profile?.role === 'AGENT' ? 'Profil agent' : 'Selecteaza membrul staff-ului'}
            </Label>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {staffMembers.filter((s) => s.isActive).map((staff) => (
                <button
                  key={staff.id}
                  onClick={() => setSelectedStaffId(staff.id)}
                  className={cn(
                    'flex items-center gap-3 shrink-0 rounded-xl border-2 px-4 py-3 transition-all duration-200 hover:shadow-md',
                    activeSelectedStaffId === staff.id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-card hover:border-primary/40',
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback
                      className={cn(
                        'text-sm font-semibold',
                        activeSelectedStaffId === staff.id
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
                              {MONTH_NAMES_FULL[new Date(dateStr + 'T00:00:00').getMonth()].slice(0, 3)}
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
