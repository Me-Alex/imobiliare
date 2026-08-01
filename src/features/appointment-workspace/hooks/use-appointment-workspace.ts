'use client'

import { useState, useCallback } from 'react'
import type {
  Appointment,
  DocumentChecklist,
  Signature,
  AppointmentWorkspaceState,
  ScheduleData,
} from '../lib/types'

interface UseAppointmentWorkspaceOptions {
  appointmentId?: string
  onSuccess?: (appointment: Appointment) => void
  onError?: (error: string) => void
}

interface UseAppointmentWorkspaceReturn {
  state: AppointmentWorkspaceState
  // Actions
  createAppointment: (data: ScheduleData) => Promise<Appointment | null>
  loadAppointment: (id: string) => Promise<void>
  updateAppointment: (id: string, data: Partial<Appointment>) => Promise<void>
  cancelAppointment: (id: string, reason?: string) => Promise<void>
  // Document checklist actions
  loadChecklists: (appointmentId: string) => Promise<void>
  createChecklists: (appointmentId: string, items: { documentType: string; isRequired?: boolean }[]) => Promise<void>
  updateChecklistItem: (id: string, data: Partial<DocumentChecklist>) => Promise<void>
  // Signature actions
  loadSignatures: (appointmentId: string) => Promise<void>
  createSignature: (data: {
    appointmentId: string
    documentType: string
    signerName: string
    signerRole: 'CLIENT' | 'AGENT'
    method: 'TYPED' | 'DRAWN'
    signatureText?: string
    signatureImageUrl?: string
    consentAccepted: boolean
  }) => Promise<Signature | null>
  // UI state
  setStep: (step: 'SCHEDULE' | 'PREPARE' | 'SIGN' | 'CONFIRM') => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState: AppointmentWorkspaceState = {
  appointment: null,
  currentStep: 'SCHEDULE',
  documents: [],
  signatures: [],
  isLoading: false,
  error: null,
}

export function useAppointmentWorkspace(
  options: UseAppointmentWorkspaceOptions = {}
): UseAppointmentWorkspaceReturn {
  const [state, setState] = useState<AppointmentWorkspaceState>(initialState)

  const setStep = useCallback((step: AppointmentWorkspaceState['currentStep']) => {
    setState(prev => ({ ...prev, currentStep: step }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }))
  }, [])

  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  // Create a new appointment
  const createAppointment = useCallback(async (data: ScheduleData): Promise<Appointment | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const token = await getAuthToken()
      if (!token) throw new Error('Nu sunteți autentificat.')

      const res = await fetch('/api/appointments-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          propertyId: data.propertyId,
          propertyTitle: data.propertyTitle,
          agentId: data.agentId,
          agentName: data.agentName,
          scheduledAt: data.date + 'T' + data.startTime + ':00',
          scheduledEnd: data.date + 'T' + data.endTime + ':00',
          notes: data.notes,
          termsAccepted: true,
          privacyAccepted: true,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Nu am putut crea programarea.')
      }

      setState(prev => ({
        ...prev,
        appointment: json.appointment,
        isLoading: false,
      }))

      options.onSuccess?.(json.appointment)
      return json.appointment
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Eroare necunoscută'
      setState(prev => ({ ...prev, isLoading: false, error: message }))
      options.onError?.(message)
      return null
    }
  }, [options])

  // Load existing appointment
  const loadAppointment = useCallback(async (id: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const token = await getAuthToken()
      if (!token) throw new Error('Nu sunteți autentificat.')

      const res = await fetch(`/api/appointments-v2/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Nu am putut încărca programarea.')
      }

      setState(prev => ({
        ...prev,
        appointment: json.appointment,
        isLoading: false,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Eroare necunoscută'
      setState(prev => ({ ...prev, isLoading: false, error: message }))
      options.onError?.(message)
    }
  }, [options])

  // Update appointment
  const updateAppointment = useCallback(async (id: string, data: Partial<Appointment>): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const token = await getAuthToken()
      if (!token) throw new Error('Nu sunteți autentificat.')

      const res = await fetch(`/api/appointments-v2/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Nu am putut actualiza programarea.')
      }

      setState(prev => ({
        ...prev,
        appointment: json.appointment,
        isLoading: false,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Eroare necunoscută'
      setState(prev => ({ ...prev, isLoading: false, error: message }))
      options.onError?.(message)
    }
  }, [options])

  // Cancel appointment
  const cancelAppointment = useCallback(async (id: string, _reason?: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const token = await getAuthToken()
      if (!token) throw new Error('Nu sunteți autentificat.')

      const res = await fetch(`/api/appointments-v2/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Nu am putut anula programarea.')
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Eroare necunoscută'
      setState(prev => ({ ...prev, isLoading: false, error: message }))
      options.onError?.(message)
    }
  }, [options])

  // Load document checklists
  const loadChecklists = useCallback(async (appointmentId: string): Promise<void> => {
    try {
      const token = await getAuthToken()
      if (!token) return

      const res = await fetch(`/api/appointments-v2/document-checklists?appointmentId=${appointmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const json = await res.json()

      if (res.ok) {
        setState(prev => ({ ...prev, documents: json.checklists ?? [] }))
      }
    } catch {
      // Silently fail for checklists
    }
  }, [])

  // Create checklists
  const createChecklists = useCallback(async (
    appointmentId: string,
    items: { documentType: string; isRequired?: boolean }[]
  ): Promise<void> => {
    try {
      const token = await getAuthToken()
      if (!token) throw new Error('Nu sunteți autentificat.')

      const res = await fetch('/api/appointments-v2/document-checklists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ appointmentId, items }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Nu am putut crea listele de documente.')
      }

      setState(prev => ({
        ...prev,
        documents: json.checklists ?? [],
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Eroare necunoscută'
      setState(prev => ({ ...prev, error: message }))
      options.onError?.(message)
    }
  }, [options])

  // Update checklist item
  const updateChecklistItem = useCallback(async (
    id: string,
    data: Partial<DocumentChecklist>
  ): Promise<void> => {
    try {
      const token = await getAuthToken()
      if (!token) throw new Error('Nu sunteți autentificat.')

      const res = await fetch(`/api/appointments-v2/document-checklists/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Nu am putut actualiza documentul.')
      }

      setState(prev => ({
        ...prev,
        documents: prev.documents.map(d => d.id === id ? json.checklist : d),
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Eroare necunoscută'
      setState(prev => ({ ...prev, error: message }))
      options.onError?.(message)
    }
  }, [options])

  // Load signatures
  const loadSignatures = useCallback(async (appointmentId: string): Promise<void> => {
    try {
      const token = await getAuthToken()
      if (!token) return

      const res = await fetch(`/api/appointments-v2/signatures?appointmentId=${appointmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const json = await res.json()

      if (res.ok) {
        setState(prev => ({ ...prev, signatures: json.signatures ?? [] }))
      }
    } catch {
      // Silently fail for signatures
    }
  }, [])

  // Create signature
  const createSignature = useCallback(async (data: {
    appointmentId: string
    documentType: string
    signerName: string
    signerRole: 'CLIENT' | 'AGENT'
    method: 'TYPED' | 'DRAWN'
    signatureText?: string
    signatureImageUrl?: string
    consentAccepted: boolean
  }): Promise<Signature | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const token = await getAuthToken()
      if (!token) throw new Error('Nu sunteți autentificat.')

      const res = await fetch('/api/appointments-v2/signatures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Nu am putut crea semnătura.')
      }

      setState(prev => ({
        ...prev,
        signatures: [...prev.signatures, json.signature],
        isLoading: false,
      }))

      return json.signature
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Eroare necunoscută'
      setState(prev => ({ ...prev, isLoading: false, error: message }))
      options.onError?.(message)
      return null
    }
  }, [options])

  return {
    state,
    createAppointment,
    loadAppointment,
    updateAppointment,
    cancelAppointment,
    loadChecklists,
    createChecklists,
    updateChecklistItem,
    loadSignatures,
    createSignature,
    setStep,
    setError,
    reset,
  }
}

// Helper to get auth token
async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  
  try {
    const { supabase } = await import('@/lib/supabase')
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  } catch {
    return null
  }
}
