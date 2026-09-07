'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Star, User, CalendarDays, Clock, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { MONTH_NAMES_SHORT } from '@/lib/constants'
import type { Vizionare } from '@/lib/types'
import { toast } from 'sonner'

// ─── Rating Labels ────────────────────────────────────────────────────────

const RATING_LABELS: Record<number, string> = {
  1: 'Foarte slab',
  2: 'Slab',
  3: 'Mediu',
  4: 'Bun',
  5: 'Excelent',
}

// ─── Star Rating Component ────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
}) {
  const [hoverValue, setHoverValue] = useState(0)
  const displayValue = hoverValue || value

  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= displayValue
        return (
          <motion.button
            key={star}
            type="button"
            disabled={readonly}
            whileHover={!readonly ? { scale: 1.1 } : {}}
            whileTap={!readonly ? { scale: 0.9 } : {}}
            className={`transition-colors duration-150 focus:outline-none ${
              readonly ? 'cursor-default' : 'cursor-pointer'
            }`}
            onMouseEnter={() => !readonly && setHoverValue(star)}
            onMouseLeave={() => !readonly && setHoverValue(0)}
            onClick={() => onChange?.(star)}
            aria-label={`Rating ${star} stea${star > 1 ? 're' : ''}`}
          >
            <Star
              className={`h-8 w-8 transition-colors duration-150 ${
                isFilled
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-muted-foreground/30'
              }`}
            />
          </motion.button>
        )
      })}
    </div>
  )
}

// ─── Dialog Props ─────────────────────────────────────────────────────────

interface VizionareFeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vizionare: Vizionare | null
  onSaved: (input: { rating: number; feedback: string; wouldProceed: boolean; notes: string }) => Promise<void>
}

// ─── Main Component ───────────────────────────────────────────────────────

export function VizionareFeedbackDialog({
  open,
  onOpenChange,
  vizionare,
  onSaved,
}: VizionareFeedbackDialogProps) {
  const [rating, setRating] = useState(vizionare?.rating || 0)
  const [feedback, setFeedback] = useState(vizionare?.feedback || '')
  const [wouldProceed, setWouldProceed] = useState<boolean | null>(vizionare?.wouldProceed ?? null)
  const [notes, setNotes] = useState(vizionare?.notes || '')
  const [saving, setSaving] = useState(false)

  // Reset form when dialog opens with a new vizionare
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen && vizionare) {
        setRating(vizionare.rating || 0)
        setFeedback(vizionare.feedback || '')
        setWouldProceed(vizionare.wouldProceed ?? null)
        setNotes(vizionare.notes || '')
      }
      onOpenChange(isOpen)
    },
    [vizionare, onOpenChange]
  )

  const handleSave = useCallback(async () => {
    if (!vizionare || wouldProceed === null) return
    if (rating === 0) {
      toast.error('Rating obligatoriu', {
        description: 'Te rugam sa selectezi un rating intre 1 si 5 stele.',
      })
      return
    }

    setSaving(true)
    try {
      await onSaved({ rating, feedback, wouldProceed, notes })
      toast.success('Feedback salvat', {
        description: 'Multumim pentru feedback-ul tau!',
      })
      onOpenChange(false)
    } catch {
      toast.error('Eroare', {
        description: 'Nu s-a putut salva feedback-ul. Incearca din nou.',
      })
    } finally {
      setSaving(false)
    }
  }, [vizionare, rating, feedback, wouldProceed, notes, onSaved, onOpenChange])

  if (!vizionare) return null

  const dateObj = new Date(vizionare.date + 'T00:00:00')
  const formattedDate = `${dateObj.getDate()} ${MONTH_NAMES_SHORT[dateObj.getMonth()]} ${dateObj.getFullYear()}`

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto p-0">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-6 space-y-5"
        >
          {/* Header */}
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Decizia după vizionare
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground line-clamp-2">
              {vizionare.propertyTitle}
            </DialogDescription>
          </DialogHeader>

          {/* Staff Info */}
          <div className="glass-card rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-2.5 text-sm">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{vizionare.staffName}</p>
                <p className="text-xs text-muted-foreground">Agent Imobiliar</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {vizionare.startTime} — {vizionare.endTime}
                </span>
              </div>
            </div>
          </div>

          <fieldset className="space-y-3 rounded-xl border p-4">
            <legend className="px-1 text-sm font-semibold">Vrei să continui cu această proprietate?</legend>
            <p className="text-sm text-muted-foreground">Alege explicit. Poți reveni asupra deciziei.</p>
            {[{ value: true, label: 'Da, vreau să discut oferta' }, { value: false, label: 'Nu, proprietatea nu mi se potrivește' }].map(choice => (
              <label key={String(choice.value)} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                <input type="radio" name="viewing-decision" checked={wouldProceed === choice.value} onChange={() => setWouldProceed(choice.value)} />
                {choice.label}
              </label>
            ))}
          </fieldset>

          {/* Star Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-400" />
              Rating
              <span className="text-xs text-red-500">*</span>
            </label>
            <StarRating value={rating} onChange={setRating} />
            {rating > 0 && (
              <motion.p
                key={rating}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-muted-foreground"
              >
                {RATING_LABELS[rating]}
              </motion.p>
            )}
          </div>

          {/* Feedback Textarea */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              Cum a fost experienta ta?
            </label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Descrie experienta ta la vizionare..."
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              Note
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adauga note suplimentare..."
              rows={2}
              className="resize-none text-sm"
            />
          </div>

          {/* Actions */}
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-sm"
            >
              Anuleaza
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || rating === 0 || wouldProceed === null}
              className="text-sm"
            >
              {saving ? 'Se salveaza...' : 'Salvează decizia'}
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

// Export StarRating for reuse
export { StarRating }
