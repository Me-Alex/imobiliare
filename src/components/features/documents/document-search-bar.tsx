'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  X,
  FileText,
  FileCheck,
  FileSignature,
  Ban,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DOC_TYPE_LABELS } from '@/lib/constants'
import type { ViewingDocument } from '@/lib/types'
import { cn } from '@/lib/utils'

const STATUS_FILTER_OPTIONS: Array<{ value: ViewingDocument['status']; label: string; icon: React.ElementType }> = [
  { value: 'UPLOADED', label: 'Incarcat', icon: FileText },
  { value: 'READY_TO_SIGN', label: 'De semnat', icon: FileSignature },
  { value: 'PARTIALLY_SIGNED', label: 'Semnat partial', icon: Clock },
  { value: 'SIGNED', label: 'Semnat', icon: CheckCircle2 },
  { value: 'APPROVED', label: 'Aprobat', icon: FileCheck },
  { value: 'DECLINED', label: 'Refuzat', icon: Ban },
  { value: 'REJECTED', label: 'Respins', icon: AlertCircle },
]

export interface DocumentFilterState {
  search: string
  types: Set<string>
  statuses: Set<string>
}

interface DocumentSearchBarProps {
  documents: ViewingDocument[]
  filter: DocumentFilterState
  onFilterChange: (filter: DocumentFilterState) => void
}

export function DocumentSearchBar({ documents, filter, onFilterChange }: DocumentSearchBarProps) {
  const [showFilters, setShowFilters] = useState(false)

  const availableTypes = Array.from(new Set(documents.map((d) => d.docType)))
  const activeFilterCount = filter.types.size + filter.statuses.size

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cauta dupa titlu sau nume fisier..."
            value={filter.search}
            onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
            className="pl-9"
          />
          {filter.search && (
            <button
              onClick={() => onFilterChange({ ...filter, search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative" aria-label="Filtrează documentele">
              <Filter className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Tip document</div>
            {availableTypes.map((type) => (
              <DropdownMenuItem
                key={type}
                onClick={() => {
                  const next = new Set(filter.types)
                  if (next.has(type)) next.delete(type)
                  else next.add(type)
                  onFilterChange({ ...filter, types: next })
                }}
                className="flex items-center justify-between"
              >
                <span>{DOC_TYPE_LABELS[type] ?? type}</span>
                {filter.types.has(type) && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
              </DropdownMenuItem>
            ))}
            <div className="border-t my-1" />
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Status</div>
            {STATUS_FILTER_OPTIONS.map(({ value, label, icon: Icon }) => (
              <DropdownMenuItem
                key={value}
                onClick={() => {
                  const next = new Set(filter.statuses)
                  if (next.has(value)) next.delete(value)
                  else next.add(value)
                  onFilterChange({ ...filter, statuses: next })
                }}
                className="flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </span>
                {filter.statuses.has(value) && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
              </DropdownMenuItem>
            ))}
            {activeFilterCount > 0 && (
              <>
                <div className="border-t my-1" />
                <DropdownMenuItem
                  onClick={() => onFilterChange({ search: '', types: new Set(), statuses: new Set() })}
                  className="text-destructive focus:text-destructive"
                >
                  Reseteaza toate filtrele
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AnimatePresence>
        {activeFilterCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-1.5"
          >
            {Array.from(filter.types).map((type) => (
              <Badge
                key={type}
                variant="secondary"
                className="cursor-pointer gap-1 pr-1.5"
                onClick={() => {
                  const next = new Set(filter.types)
                  next.delete(type)
                  onFilterChange({ ...filter, types: next })
                }}
              >
                {DOC_TYPE_LABELS[type] ?? type}
                <X className="h-3 w-3" />
              </Badge>
            ))}
            {Array.from(filter.statuses).map((status) => {
              const option = STATUS_FILTER_OPTIONS.find((o) => o.value === status)
              return (
                <Badge
                  key={status}
                  variant="secondary"
                  className="cursor-pointer gap-1 pr-1.5"
                  onClick={() => {
                    const next = new Set(filter.statuses)
                    next.delete(status)
                    onFilterChange({ ...filter, statuses: next })
                  }}
                >
                  {option?.label ?? status}
                  <X className="h-3 w-3" />
                </Badge>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function filterDocuments(
  documents: ViewingDocument[],
  filter: DocumentFilterState,
): ViewingDocument[] {
  return documents.filter((doc) => {
    const matchesSearch =
      !filter.search.trim() ||
      doc.title.toLowerCase().includes(filter.search.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(filter.search.toLowerCase())
    const matchesType = filter.types.size === 0 || filter.types.has(doc.docType)
    const matchesStatus = filter.statuses.size === 0 || filter.statuses.has(doc.status)
    return matchesSearch && matchesType && matchesStatus
  })
}
