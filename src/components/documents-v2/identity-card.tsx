'use client'

/**
 * Identity card — collects the participant identity once and reuses it
 * for every document in the transaction.
 *
 * The card replaces the dual "viewing document" / "legal request" forms
 * that the old code asked the user to fill in twice. It shows the
 * currently stored identity (if any) and exposes an inline editor.
 *
 * Style: same minimal surface as the timeline. White card, one accent
 * line for the status (complete / incomplete), no chrome.
 */

import { useState } from 'react'
import { Check, PencilLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface IdentityValue {
  fullName: string
  idDocument: string
  address: string
  email: string
  phone: string
}

const EMPTY: IdentityValue = {
  fullName: '',
  idDocument: '',
  address: '',
  email: '',
  phone: '',
}

function isComplete(v: IdentityValue): boolean {
  return Boolean(v.fullName && v.idDocument && v.address && v.email && v.phone)
}

const FIELDS: Array<{ key: keyof IdentityValue; label: string; placeholder: string; type?: string }> = [
  { key: 'fullName', label: 'Nume complet', placeholder: 'Ion Popescu' },
  { key: 'idDocument', label: 'Carte de identitate', placeholder: 'CI XX 000000' },
  { key: 'address', label: 'Adresă', placeholder: 'Str. Exemplu 1, București' },
  { key: 'email', label: 'Email', placeholder: 'ion@exemplu.ro', type: 'email' },
  { key: 'phone', label: 'Telefon', placeholder: '+40 700 000 000', type: 'tel' },
]

export interface IdentityCardProps {
  role: 'CLIENT' | 'OWNER'
  /** Currently stored identity. Pass null when the participant hasn't filled anything yet. */
  value: IdentityValue | null
  onSave: (next: IdentityValue) => void | Promise<void>
  className?: string
}

export function IdentityCard({ role, value, onSave, className }: IdentityCardProps) {
  const initial: IdentityValue = value ?? EMPTY
  const [editing, setEditing] = useState(!value)
  const [draft, setDraft] = useState<IdentityValue>(initial)
  const [saving, setSaving] = useState(false)

  const complete = isComplete(value ?? EMPTY)
  const roleLabel = role === 'CLIENT' ? 'Date de client' : 'Date de proprietar'

  async function handleSave() {
    if (!isComplete(draft)) return
    setSaving(true)
    try {
      await onSave(draft)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section
      aria-label={roleLabel}
      className={cn(
        'rounded-lg border border-border/70 bg-card p-5 shadow-sm',
        className,
      )}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-medium text-foreground">{roleLabel}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Completezi o singură dată. Le refolosim pe toate documentele tranzacției.
          </p>
        </div>
        {complete ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-700/20">
            <Check className="size-3" aria-hidden="true" />
            Complet
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-400/30">
            Necesită completare
          </span>
        )}
      </header>

      {editing ? (
        <div className="space-y-3">
          {FIELDS.map((field) => (
            <div key={field.key} className="grid grid-cols-3 items-center gap-3">
              <label
                htmlFor={`identity-${field.key}`}
                className="text-xs font-medium text-muted-foreground"
              >
                {field.label}
              </label>
              <Input
                id={`identity-${field.key}`}
                type={field.type ?? 'text'}
                value={draft[field.key]}
                onChange={(e) => setDraft((d) => ({ ...d, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="col-span-2 h-9 text-sm"
                autoComplete="off"
              />
            </div>
          ))}
          <div className="flex items-center justify-end gap-2 pt-1">
            {value ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDraft(initial)
                  setEditing(false)
                }}
                disabled={saving}
              >
                Anulează
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={!isComplete(draft) || saving}
            >
              {saving ? 'Se salvează…' : 'Salvează'}
            </Button>
          </div>
        </div>
      ) : (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {FIELDS.map((field) => (
            <div key={field.key} className="flex items-baseline justify-between gap-3 sm:flex-col sm:items-start">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground/80">
                {field.label}
              </dt>
              <dd className="font-mono text-[0.82rem] text-foreground/90">
                {value?.[field.key] || <span className="italic text-muted-foreground/60">—</span>}
              </dd>
            </div>
          ))}
          <div className="sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              className="mt-2"
            >
              <PencilLine className="mr-1.5 size-3.5" aria-hidden="true" />
              Editează
            </Button>
          </div>
        </dl>
      )}
    </section>
  )
}
