'use client'

import { useId, useState, type FormEvent } from 'react'
import { Bookmark, X } from 'lucide-react'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/store/use-app-store'
import { describeSavedSearch, savedSearchFilterError, updateSavedSearches } from '@/lib/saved-searches'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import type { SavedSearch } from '@/lib/types'

interface SaveSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SaveSearchDialog({ open, onOpenChange }: SaveSearchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogClose asChild><Button variant="ghost" size="icon" className="absolute right-2 top-2 size-11" aria-label="Închide salvarea căutării"><X className="size-4" /></Button></DialogClose>
        {open && <SaveSearchForm onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

// Mount a fresh form for every opening, including openings controlled by the parent.
function SaveSearchForm({ onClose }: { onClose: () => void }) {
  const id = useId()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [nameError, setNameError] = useState(false)
  const { selectedType, selectedZone, priceRange, rooms, transaction, featuredOnly, sort, minArea, maxArea, searchQuery, virtualTourFilter } = useAppStore()
  const filters: SavedSearch['filters'] = {
    selectedType, selectedZone, priceRange, priceRangeVersion: 2, rooms, transaction,
    featuredOnly, sort, minArea, maxArea, searchQuery, virtualTourFilter,
  }
  const filterError = savedSearchFilterError(filters)
  const summary = describeSavedSearch(filters)

  function handleSave(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setNameError(true)
      setError('Scrie un nume pentru căutare.')
      document.getElementById(id)?.focus()
      return
    }
    if (filterError) return
    try {
      const search: SavedSearch = { id: uuidv4(), name: name.trim(), filters, createdAt: new Date().toISOString() }
      updateSavedSearches(current => [search, ...current])
      toast.success('Căutare salvată în acest browser.')
      onClose()
    } catch {
      setError('Căutarea nu a fost salvată. Verifică dacă browserul permite stocarea datelor și încearcă din nou. Căutările existente nu au fost modificate.')
    }
  }

  return (
    <form onSubmit={handleSave} className="min-w-0 space-y-5">
      <DialogHeader className="pr-7 text-left">
        <DialogTitle className="leading-snug">Salvează căutarea</DialogTitle>
        <DialogDescription>Revino la aceste filtre din „Căutări salvate”. Sunt păstrate doar în acest browser, pe acest dispozitiv.</DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        <Label htmlFor={id}>Numele căutării</Label>
        <Input id={id} className="min-h-11" placeholder="Ex.: Apartament în Dorobanți" value={name} maxLength={50} autoFocus aria-invalid={nameError} aria-describedby={error ? `${id}-error` : undefined}
          onChange={event => { setName(event.target.value); setNameError(false); setError('') }} />
        <p className="text-xs text-muted-foreground">Alege un nume ușor de recunoscut. Maximum 50 de caractere.</p>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Ce se salvează</p>
        <ul className="space-y-1 text-sm text-muted-foreground" aria-label="Criteriile căutării">
          {summary.map((label, index) => <li key={index} className="[overflow-wrap:anywhere]">{label}</li>)}
        </ul>
      </div>
      {(error || filterError) && <p id={`${id}-error`} role="alert" className="text-sm text-destructive">{error || filterError}{filterError && ' Revino la filtre pentru a modifica valorile.'}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" className="min-h-11" onClick={onClose}>{filterError ? 'Înapoi la filtre' : 'Anulează'}</Button>
        <Button type="submit" className="min-h-11" disabled={!!filterError}><Bookmark className="size-4" />Salvează</Button>
      </DialogFooter>
    </form>
  )
}
