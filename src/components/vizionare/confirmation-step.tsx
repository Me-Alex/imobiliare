'use client'

import { useState } from 'react'
import {
  CalendarDays, Building2, CalendarCheck, Loader2, ShieldCheck, AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { StaffMember, AvailabilitySlot, UserProperty } from '@/lib/types'
import { formatDateRO } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ClientFlow, type ClientSubmission, type ClientFieldValue } from '@/components/documents-v2'
import type { TransactionKind } from '@/lib/documents/flow-shape'

interface ConfirmationStepProps {
  property: UserProperty
  staff: StaffMember
  date: string
  slot: AvailabilitySlot
  notes: string
  onNotesChange: (notes: string) => void
  termsAccepted: boolean
  onTermsAcceptedChange: (accepted: boolean) => void
  privacyAccepted: boolean
  onPrivacyAcceptedChange: (accepted: boolean) => void
  privacyNoticeUrl: string | null
  privacyNoticeVersion: string | null
  complianceLoading: boolean
  isSubmitting: boolean
  onSubmit: () => void
  /**
   * RENTAL → single 9-field viewing-report form.
   * SALE   → three progressive stages (identity → offer → contract).
   * Driven by the property's transaction type.
   */
  clientFlowKind: TransactionKind
  /** Values pre-filled into the ClientFlow (name/email/phone from auth). */
  clientFlowPrefill: Record<string, ClientFieldValue>
  /**
   * Called for every stage submission. For SALE, the parent should
   * accumulate submissions keyed by `stageId`; the final stage is the
   * one with `stageId === 'contract'`.
   */
  onClientFlowSubmit: (submission: ClientSubmission) => void
}

export function ConfirmationStep({
  property,
  staff,
  date,
  slot,
  notes,
  onNotesChange,
  termsAccepted,
  onTermsAcceptedChange,
  privacyAccepted,
  onPrivacyAcceptedChange,
  privacyNoticeUrl,
  privacyNoticeVersion,
  complianceLoading,
  isSubmitting,
  onSubmit,
  clientFlowKind,
  clientFlowPrefill,
  onClientFlowSubmit,
}: ConfirmationStepProps) {
  // The ClientFlow is considered "done" only when the user has submitted
  // its final stage: the single RENTAL form, or the SALE `contract` stage.
  const [flowDone, setFlowDone] = useState(false)

  const handleFlowSubmit = (submission: ClientSubmission) => {
    onClientFlowSubmit(submission)
    const isFinal = clientFlowKind === 'RENTAL' || submission.stageId === 'contract'
    setFlowDone(isFinal)
  }

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

      {/* ClientFlow — the new minimal data-collection surface.
          One form for RENTAL, three progressive stages for SALE. */}
      <section
        aria-label={
          clientFlowKind === 'RENTAL'
            ? 'Fișă de vizionare'
            : 'Date pentru ofertă și contract'
        }
        className="rounded-xl border border-border/70 bg-card p-4 sm:p-5"
      >
        <ClientFlow
          kind={clientFlowKind}
          summary={{
            propertyTitle: property.title,
            propertyZone:
              property.address
              || property.zone
              || [property.sector, property.city].filter(Boolean).join(', '),
          }}
          prefill={clientFlowPrefill}
          onSubmit={handleFlowSubmit}
        />
      </section>

      {/* Notes — kept for backward compat. The new ClientFlow is the
          primary data-collection surface; this textarea captures any
          free-form observations the user wants to add on top. */}
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

      {!flowDone ? (
        <p className="text-xs text-muted-foreground">
          Completează mai întâi{' '}
          {clientFlowKind === 'RENTAL' ? 'fișa de vizionare' : 'cele 3 etape'} de mai sus
          ca să poți confirma programarea.
        </p>
      ) : null}

      <div className="space-y-3 rounded-xl border p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Reguli și informare înainte de programare
        </div>
        <p className="text-xs text-muted-foreground">
          Programarea nu dovedește că vizionarea a avut loc. Agentul confirmă prezența la întâlnire,
          iar fișa de vizionare se generează abia după finalizarea vizionării efective.
        </p>
        <label className="flex items-start gap-3 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => onTermsAcceptedChange(event.target.checked)}
            className="mt-1 h-4 w-4 accent-primary"
          />
          <span>
            Am citit regulile programării: voi anunța anularea cât mai curând; neprezentarea poate fi
            consemnată după interval și 15 minute de grație; nu se aplică automat o taxă sau o penalizare.
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={privacyAccepted}
            disabled={!privacyNoticeUrl || complianceLoading}
            onChange={(event) => onPrivacyAcceptedChange(event.target.checked)}
            className="mt-1 h-4 w-4 accent-primary"
          />
          <span>
            Am primit informarea privind prelucrarea datelor
            {privacyNoticeUrl && (
              <>{' '}(<a href={privacyNoticeUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">versiunea {privacyNoticeVersion || 'curentă'}</a>)</>
            )}.
          </span>
        </label>
      </div>

      {!complianceLoading && !privacyNoticeUrl && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Programările sunt temporar blocate</AlertTitle>
          <AlertDescription>
            Administratorul trebuie să completeze profilul juridic și să publice informarea GDPR.
          </AlertDescription>
        </Alert>
      )}

      {/* Submit */}
      <Button
        onClick={onSubmit}
        disabled={
          isSubmitting
          || complianceLoading
          || !privacyNoticeUrl
          || !termsAccepted
          || !privacyAccepted
          || !flowDone
        }
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
