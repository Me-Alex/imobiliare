'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import type { Vizionare } from '@/lib/types'
import { toast } from 'sonner'

interface VizionareFeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vizionare: Vizionare | null
  onSaved: (input: { rating: number | null; feedback: string; wouldProceed: boolean; notes: string }) => Promise<void>
}

/** Mounted for one viewing by the parent; closing discards an unsaved draft. */
export function VizionareFeedbackDialog({ open, onOpenChange, vizionare, onSaved }: VizionareFeedbackDialogProps) {
  const [wouldProceed, setWouldProceed] = useState<boolean | null>(vizionare?.wouldProceed ?? null)
  const [rating, setRating] = useState(vizionare?.rating || 0)
  const [feedback, setFeedback] = useState(vizionare?.feedback || '')
  const [saving, setSaving] = useState(false)
  if (!vizionare) return null
  const save = async () => {
    if (wouldProceed === null || saving) return
    setSaving(true)
    try {
      await onSaved({ rating: rating || null, feedback, wouldProceed, notes: vizionare.notes || '' })
      toast.success('Decizia a fost salvată.')
      onOpenChange(false)
    } catch { toast.error('Decizia nu a putut fi salvată. Încearcă din nou.') }
    finally { setSaving(false) }
  }
  return <Dialog open={open} onOpenChange={value => { if (!saving) onOpenChange(value) }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader><DialogTitle>Decizia după vizionare</DialogTitle><DialogDescription>{vizionare.propertyTitle}</DialogDescription></DialogHeader>
      <form className="space-y-5" onSubmit={event => { event.preventDefault(); void save() }}>
        <fieldset disabled={saving} className="space-y-2">
          <legend className="mb-3 text-sm font-medium">Vrei să continui cu această proprietate?</legend>
          {[{ value: true, label: 'Da, vreau să discut oferta' }, { value: false, label: 'Nu, proprietatea nu mi se potrivește' }].map(choice => <label key={String(choice.value)} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm">
            <input type="radio" name="viewing-decision" required checked={wouldProceed === choice.value} onChange={() => setWouldProceed(choice.value)} />
            {choice.label}
          </label>)}
        </fieldset>
        <details><summary className="cursor-pointer py-2 text-sm text-muted-foreground">Adaugă feedback (opțional)</summary>
          <div className="mt-3 space-y-4">
            <div><Label htmlFor="viewing-rating">Cum a fost vizita?</Label><select id="viewing-rating" disabled={saving} className="mt-2 h-11 w-full rounded-md border bg-background px-3 text-sm" value={rating} onChange={event => setRating(Number(event.target.value))}><option value="0">Fără evaluare</option>{['Foarte slab', 'Slab', 'Mediu', 'Bun', 'Excelent'].map((label, index) => <option key={label} value={index + 1}>{index + 1} · {label}</option>)}</select></div>
            <div><Label htmlFor="viewing-feedback">Comentariu</Label><Textarea id="viewing-feedback" className="mt-2" value={feedback} onChange={event => setFeedback(event.target.value)} disabled={saving} rows={3} /></div>
          </div>
        </details>
        <DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>Anuleaza</Button><Button type="submit" disabled={saving || wouldProceed === null}>{saving ? 'Se salvează…' : 'Salvează decizia'}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
}
