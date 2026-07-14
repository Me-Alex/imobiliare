'use client'

import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Building2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ZONES, SECTOARE } from '@/lib/constants'
import { toast } from 'sonner'

export interface ValuationFormData {
  type: string
  transaction: string
  zone: string
  sector: string
  areaSqm: number
  rooms: number
  floor: number | null
  yearBuilt: number | null
  condition: string
}

const PROPERTY_TYPES = [
  'Apartament', 'Garsoniera', 'Casa', 'Vila', 'Teren',
  'Spatiu Comercial', 'Studio',
] as const

const CONDITION_OPTIONS = [
  'Nou', 'Renovat recent', 'Bun', 'Necesita renovare',
] as const

const APARTMENT_TYPES = new Set(['Apartament', 'Garsoniera', 'Studio'])

interface ValuationFormProps {
  onSubmit: (data: ValuationFormData) => void
  isLoading: boolean
}

export function ValuationForm({ onSubmit, isLoading }: ValuationFormProps) {
  const [type, setType] = useState('')
  const [transaction, setTransaction] = useState('')
  const [zone, setZone] = useState('')
  const [sector, setSector] = useState('')
  const [areaSqm, setAreaSqm] = useState('')
  const [rooms, setRooms] = useState('')
  const [floor, setFloor] = useState('')
  const [yearBuilt, setYearBuilt] = useState('')
  const [condition, setCondition] = useState('')

  const showFloor = type ? APARTMENT_TYPES.has(type) : false

  function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!type || !transaction || !zone || !areaSqm || !rooms) {
      toast.error('Completează toate câmpurile obligatorii')
      return
    }

    const areaNum = Number(areaSqm)
    const roomsNum = Number(rooms)

    if (!areaNum || areaNum < 1 || areaNum > 10000) {
      toast.error('Suprafața trebuie să fie între 1 și 10.000 m²')
      return
    }

    if (!roomsNum || roomsNum < 1 || roomsNum > 50) {
      toast.error('Numărul de camere trebuie să fie între 1 și 50')
      return
    }

    onSubmit({
      type,
      transaction,
      zone,
      sector,
      areaSqm: areaNum,
      rooms: roomsNum,
      floor: floor ? Number(floor) : null,
      yearBuilt: yearBuilt ? Number(yearBuilt) : null,
      condition,
    })
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card rounded-2xl p-6 space-y-6"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Detalii Proprietate</h2>
          <p className="text-sm text-muted-foreground">Completează informațiile pentru evaluare</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Property Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Tip proprietate *</Label>
          <Select value={type} onValueChange={(v) => { setType(v); setFloor('') }}>
            <SelectTrigger id="type" className="h-11">
              <SelectValue placeholder="Selectează tipul" />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Transaction Type */}
        <div className="space-y-2">
          <Label htmlFor="transaction">Tip tranzacție *</Label>
          <Select value={transaction} onValueChange={setTransaction}>
            <SelectTrigger id="transaction" className="h-11">
              <SelectValue placeholder="Selectează tranzacția" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Vanzare">Vânzare</SelectItem>
              <SelectItem value="Inchiriere">Închiriere</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Zone */}
        <div className="space-y-2">
          <Label htmlFor="zone">Zonă *</Label>
          <Select value={zone} onValueChange={setZone}>
            <SelectTrigger id="zone" className="h-11">
              <SelectValue placeholder="Selectează zona" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {ZONES.map((z) => (
                <SelectItem key={z} value={z}>{z}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sector */}
        <div className="space-y-2">
          <Label htmlFor="sector">Sector</Label>
          <Select value={sector} onValueChange={setSector}>
            <SelectTrigger id="sector" className="h-11">
              <SelectValue placeholder="Selectează sectorul" />
            </SelectTrigger>
            <SelectContent>
              {SECTOARE.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Area */}
        <div className="space-y-2">
          <Label htmlFor="areaSqm">Suprafață (m²) *</Label>
          <Input
            id="areaSqm"
            type="number"
            min={1}
            max={10000}
            placeholder="ex: 65"
            value={areaSqm}
            onChange={(e) => setAreaSqm(e.target.value)}
            className="h-11"
          />
        </div>

        {/* Rooms */}
        <div className="space-y-2">
          <Label htmlFor="rooms">Număr camere *</Label>
          <Input
            id="rooms"
            type="number"
            min={1}
            max={50}
            placeholder="ex: 3"
            value={rooms}
            onChange={(e) => setRooms(e.target.value)}
            className="h-11"
          />
        </div>

        {/* Floor (conditional) */}
        {showFloor && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <Label htmlFor="floor">Etaj</Label>
            <Input
              id="floor"
              type="number"
              min={-2}
              max={50}
              placeholder="ex: 4"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              className="h-11"
            />
          </motion.div>
        )}

        {/* Year Built */}
        <div className="space-y-2">
          <Label htmlFor="yearBuilt">An construcție</Label>
          <Input
            id="yearBuilt"
            type="number"
            min={1800}
            max={2025}
            placeholder="ex: 2005"
            value={yearBuilt}
            onChange={(e) => setYearBuilt(e.target.value)}
            className="h-11"
          />
        </div>

        {/* Condition */}
        <div className="space-y-2">
          <Label htmlFor="condition">Stare</Label>
          <Select value={condition} onValueChange={setCondition}>
            <SelectTrigger id="condition" className="h-11">
              <SelectValue placeholder="Selectează starea" />
            </SelectTrigger>
            <SelectContent>
              {CONDITION_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 text-base font-medium"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Se evaluează...
          </>
        ) : (
          <>
            Evaluează Proprietatea
            <ArrowRight className="ml-2 h-5 w-5" />
          </>
        )}
      </Button>
    </motion.form>
  )
}