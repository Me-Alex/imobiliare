'use client'

import {
  CalendarDays, Building2, CalendarCheck, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { StaffMember, AvailabilitySlot, UserProperty } from '@/lib/types'
import { formatDateRO } from '@/lib/utils'

interface ConfirmationStepProps {
  property: UserProperty
  staff: StaffMember
  date: string
  slot: AvailabilitySlot
  notes: string
  onNotesChange: (notes: string) => void
  isSubmitting: boolean
  onSubmit: () => void
}

export function ConfirmationStep({
  property,
  staff,
  date,
  slot,
  notes,
  onNotesChange,
  isSubmitting,
  onSubmit,
}: ConfirmationStepProps) {
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