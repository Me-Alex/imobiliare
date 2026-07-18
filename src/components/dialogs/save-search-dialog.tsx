'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bookmark, SlidersHorizontal, MapPin, BedDouble, Euro } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/use-app-store'
import { loadFromLS, saveToLS } from '@/lib/storage'
import { LS_KEYS } from '@/lib/constants'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import type { SavedSearch } from '@/lib/types'

const propertyTypeLabels: Record<string, string> = {
  APARTMENT: 'Apartament',
  HOUSE: 'Casa',
  VILLA: 'Vila',
  LAND: 'Teren',
  COMMERCIAL: 'Comercial',
}

const transactionLabels: Record<string, string> = {
  SALE: 'Vanzare',
  RENT: 'Inchiriere',
}

interface SaveSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SaveSearchDialog({ open, onOpenChange }: SaveSearchDialogProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const {
    selectedType,
    selectedZone,
    priceRange,
    rooms,
    transaction,
    featuredOnly,
    sort,
    minArea,
    maxArea,
    searchQuery,
    virtualTourFilter,
  } = useAppStore()

  // Reset form when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setName('')
      setError('')
    }
    onOpenChange(isOpen)
  }

  // Build filter badges for preview
  const filterBadges: string[] = []
  if (selectedType) filterBadges.push(propertyTypeLabels[selectedType] || selectedType)
  if (selectedZone) filterBadges.push(selectedZone)
  if (rooms > 0) filterBadges.push(`${rooms}+ camere`)
  if (transaction) filterBadges.push(transactionLabels[transaction] || transaction)
  if (priceRange[0] > 0 || priceRange[1] < 1000000) {
    const parts: string[] = []
    if (priceRange[0] > 0) parts.push(`${priceRange[0].toLocaleString()}€`)
    if (priceRange[1] < 1000000) parts.push(`${priceRange[1].toLocaleString()}€`)
    filterBadges.push(parts.join(' - '))
  }
  if (minArea) filterBadges.push(`Min ${minArea}m²`)
  if (maxArea) filterBadges.push(`Max ${maxArea}m²`)
  if (featuredOnly) filterBadges.push('Doar populare')
  if (searchQuery) filterBadges.push(`"${searchQuery}"`)
  if (virtualTourFilter !== 'all') filterBadges.push(virtualTourFilter === 'with' ? 'Cu tur virtual' : 'Fără tur virtual')

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Numele cautarii este obligatoriu.')
      return
    }
    if (trimmed.length > 50) {
      setError('Numele nu poate depasi 50 de caractere.')
      return
    }

    const newSearch: SavedSearch = {
      id: uuidv4(),
      name: trimmed,
      filters: {
        selectedType: selectedType || undefined,
        selectedZone: selectedZone || undefined,
        priceRange: priceRange,
        rooms: rooms || undefined,
        transaction: transaction || undefined,
        featuredOnly: featuredOnly || undefined,
        sort: sort || undefined,
        minArea: minArea || undefined,
        maxArea: maxArea || undefined,
        searchQuery: searchQuery || undefined,
        virtualTourFilter,
      },
      createdAt: new Date().toISOString(),
    }

    const existing = loadFromLS<SavedSearch[]>(LS_KEYS.SAVED_SEARCHES, [])
    const updated = [newSearch, ...existing]
    saveToLS(LS_KEYS.SAVED_SEARCHES, updated)

    // Dispatch event so other components can react
    window.dispatchEvent(new Event('pm-saved-searches-updated'))

    toast.success('Cautarea a fost salvata!')
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            Salveaza Cautarea
          </DialogTitle>
          <DialogDescription>
            Salveaza configuratia curenta a filtrelor ca un profil de cautare pe care il poti reincarca oricand.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="search-name">Numele cautarii</Label>
            <Input
              id="search-name"
              placeholder="ex: Apartament 2 camere Dorobanti"
              value={name}
              onChange={(e) => {
                setName(e.target.value.slice(0, 50))
                if (error) setError('')
              }}
              maxLength={50}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
              }}
            />
            <div className="flex items-center justify-between">
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive"
                >
                  {error}
                </motion.p>
              )}
              {!error && <span />}
              <span className="text-xs text-muted-foreground">
                {name.length}/50
              </span>
            </div>
          </div>

          {/* Filter preview */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtre active
            </Label>
            {filterBadges.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {filterBadges.map((badge, i) => (
                  <Badge key={i} variant="secondary" className="text-xs font-normal">
                    {badge}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Niciun filtru activ — se vor salva setarile implicite.</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Anuleaza
          </Button>
          <Button onClick={handleSave} className="gap-1.5">
            <Bookmark className="h-4 w-4" />
            Salveaza
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
