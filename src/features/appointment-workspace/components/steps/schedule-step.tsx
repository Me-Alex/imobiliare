'use client'

import { useState } from 'react'
import { Calendar, Clock, User, Building, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ScheduleData, StaffMember } from '../../lib/types'

interface ScheduleStepProps {
  onSubmit: (data: ScheduleData) => void
  isLoading?: boolean
  error?: string | null
  preselectedProperty?: {
    id: string
    title: string
  }
  preselectedAgent?: StaffMember
  availableAgents?: StaffMember[]
}

export function ScheduleStep({
  onSubmit,
  isLoading,
  error,
  preselectedProperty,
  preselectedAgent,
  availableAgents = [],
}: ScheduleStepProps) {
  const [formData, setFormData] = useState({
    propertyId: preselectedProperty?.id || '',
    propertyTitle: preselectedProperty?.title || '',
    agentId: preselectedAgent?.id || preselectedAgent?.id || '',
    agentName: preselectedAgent?.name || preselectedAgent?.name || '',
    date: '',
    startTime: '10:00',
    endTime: '11:00',
    notes: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.propertyTitle) {
      errors.propertyTitle = 'Selectați o proprietate.'
    }
    if (!formData.agentName) {
      errors.agentName = 'Selectați un agent.'
    }
    if (!formData.date) {
      errors.date = 'Selectați o dată.'
    }
    if (!formData.startTime) {
      errors.startTime = 'Selectați ora de începere.'
    }
    if (!formData.endTime) {
      errors.endTime = 'Selectați ora de sfârșit.'
    }
    if (formData.endTime <= formData.startTime) {
      errors.endTime = 'Ora de sfârșit trebuie să fie după ora de începere.'
    }
    if (!formData.clientName || formData.clientName.length < 2) {
      errors.clientName = 'Numele este obligatoriu (min. 2 caractere).'
    }
    if (!formData.clientEmail || !formData.clientEmail.includes('@')) {
      errors.clientEmail = 'Email invalid.'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit({
        propertyId: formData.propertyId,
        propertyTitle: formData.propertyTitle,
        agentId: formData.agentId,
        agentName: formData.agentName,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        notes: formData.notes || undefined,
      })
    }
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Programează o Vizionare
        </h2>
        <p className="text-muted-foreground">
          Completează detaliile pentru a programa vizionarea proprietății.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Client Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <User className="h-5 w-5" />
          Informații Client
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Nume complet *</Label>
            <Input
              id="clientName"
              value={formData.clientName}
              onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
              placeholder="Introduceți numele dumneavoastră"
              className={validationErrors.clientName ? 'border-destructive' : ''}
            />
            {validationErrors.clientName && (
              <p className="text-sm text-destructive">{validationErrors.clientName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientEmail">Email *</Label>
            <Input
              id="clientEmail"
              type="email"
              value={formData.clientEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
              placeholder="email@exemplu.ro"
              className={validationErrors.clientEmail ? 'border-destructive' : ''}
            />
            {validationErrors.clientEmail && (
              <p className="text-sm text-destructive">{validationErrors.clientEmail}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="clientPhone">Telefon (opțional)</Label>
            <Input
              id="clientPhone"
              type="tel"
              value={formData.clientPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
              placeholder="+40 7XX XXX XXX"
            />
          </div>
        </div>
      </div>

      {/* Property Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Building className="h-5 w-5" />
          Proprietate
        </h3>
        
        <div className="space-y-2">
          <Label htmlFor="propertyTitle">Denumire proprietate *</Label>
          <Input
            id="propertyTitle"
            value={formData.propertyTitle}
            onChange={(e) => setFormData(prev => ({ ...prev, propertyTitle: e.target.value }))}
            placeholder="Ex: Apartament 2 camere în Centru"
            className={validationErrors.propertyTitle ? 'border-destructive' : ''}
          />
          {validationErrors.propertyTitle && (
            <p className="text-sm text-destructive">{validationErrors.propertyTitle}</p>
          )}
        </div>
      </div>

      {/* Agent Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <User className="h-5 w-5" />
          Agent Imobiliar
        </h3>
        
        {availableAgents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableAgents.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  agentId: agent.id,
                  agentName: agent.name,
                }))}
                className={`
                  p-4 rounded-lg border-2 text-left transition-all hover:border-primary/50
                  ${formData.agentId === agent.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/30'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-fullbg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {agent.avatarInitials || agent.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{agent.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{agent.email}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="agentName">Nume agent *</Label>
            <Input
              id="agentName"
              value={formData.agentName}
              onChange={(e) => setFormData(prev => ({ ...prev, agentName: e.target.value }))}
              placeholder="Introduceți numele agentului"
              className={validationErrors.agentName ? 'border-destructive' : ''}
            />
            {validationErrors.agentName && (
              <p className="text-sm text-destructive">{validationErrors.agentName}</p>
            )}
          </div>
        )}
      </div>

      {/* Schedule */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Programare
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Dată *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              min={today}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className={validationErrors.date ? 'border-destructive' : ''}
            />
            {validationErrors.date && (
              <p className="text-sm text-destructive">{validationErrors.date}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="startTime">Ora începerii *</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className={`pl-10 ${validationErrors.startTime ? 'border-destructive' : ''}`}
              />
            </div>
            {validationErrors.startTime && (
              <p className="text-sm text-destructive">{validationErrors.startTime}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endTime">Ora sfârșitului *</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className={`pl-10 ${validationErrors.endTime ? 'border-destructive' : ''}`}
              />
            </div>
            {validationErrors.endTime && (
              <p className="text-sm text-destructive">{validationErrors.endTime}</p>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notițe (opțional)</Label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Adăugați orice informații suplimentare..."
          className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="min-w-[200px]"
        >
          {isLoading ? 'Se procesează...' : 'Continuă'}
        </Button>
      </div>
    </form>
  )
}
