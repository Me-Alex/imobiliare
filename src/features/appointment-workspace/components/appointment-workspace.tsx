'use client'

import { useEffect } from 'react'
import { useAppointmentWorkspace } from '../hooks/use-appointment-workspace'
import { AppointmentStepIndicator } from './step-indicator'
import { ScheduleStep } from './steps/schedule-step'
import { PrepareStep } from './steps/prepare-step'
import { SignStep } from './steps/sign-step'
import { ConfirmStep } from './steps/confirm-step'
import type { AppointmentStep, ScheduleData, DocumentType } from '../lib/types'

interface AppointmentWorkspaceProps {
  appointmentId?: string
  onComplete?: (appointmentId: string) => void
  onCancel?: () => void
}

export function AppointmentWorkspace({
  appointmentId,
  onComplete,
  onCancel,
}: AppointmentWorkspaceProps) {
  const {
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
    reset,
  } = useAppointmentWorkspace()

  const { appointment, currentStep, documents, signatures, isLoading, error } = state

  // Load existing appointment if ID provided
  useEffect(() => {
    if (appointmentId) {
      loadAppointment(appointmentId)
      loadChecklists(appointmentId)
      loadSignatures(appointmentId)
    }
  }, [appointmentId, loadAppointment, loadChecklists, loadSignatures])

  // Handle schedule submission
  const handleScheduleSubmit = async (data: ScheduleData) => {
    const apt = await createAppointment(data)
    if (apt) {
      // Create default checklists for the appointment
      await createChecklists(apt.id, [
        { documentType: 'id_card', isRequired: true },
        { documentType: 'proof_of_income', isRequired: true },
        { documentType: 'ownership_title', isRequired: false },
      ])
      setStep('PREPARE')
    }
  }

  // Handle document upload
  const handleUploadDocument = async (documentType: DocumentType) => {
    // In a real app, this would open a file picker
    // For now, we'll simulate uploading
    console.log('Upload document:', documentType)
    // The actual upload logic would be handled by the parent or a separate component
  }

  // Handle document verification (staff only)
  const handleVerifyDocument = async (checklistId: string) => {
    await updateChecklistItem(checklistId, {
      status: 'VERIFIED',
      verifiedAt: new Date().toISOString(),
    })
  }

  // Handle document rejection (staff only)
  const handleRejectDocument = async (checklistId: string, reason: string) => {
    await updateChecklistItem(checklistId, {
      status: 'REJECTED',
      rejectionReason: reason,
    })
  }

  // Handle prepare completion
  const handlePrepareComplete = () => {
    setStep('SIGN')
  }

  // Handle signature submission
  const handleSignatureSubmit = async (data: {
    documentType: string
    signerName: string
    method: 'TYPED' | 'DRAWN'
    signatureText?: string
    signatureImageUrl?: string
    consentAccepted: boolean
  }) => {
    if (!appointment) return

    await createSignature({
      appointmentId: appointment.id,
      ...data,
      signerRole: 'CLIENT',
    })
  }

  // Handle sign completion
  const handleSignComplete = () => {
    setStep('CONFIRM')
  }

  // Handle final confirmation
  const handleConfirm = async () => {
    if (!appointment) return

    await updateAppointment(appointment.id, { status: 'CONFIRMED' })
    onComplete?.(appointment.id)
  }

  // Handle edit (go back to previous step)
  const handleEdit = () => {
    if (currentStep === 'CONFIRM') {
      setStep('SIGN')
    }
  }

  // Handle cancel
  const handleCancel = async () => {
    if (appointment) {
      await cancelAppointment(appointment.id)
    }
    onCancel?.()
  }

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 'SCHEDULE':
        return (
          <ScheduleStep
            onSubmit={handleScheduleSubmit}
            isLoading={isLoading}
            error={error}
          />
        )

      case 'PREPARE':
        return appointment ? (
          <PrepareStep
            checklists={documents}
            onUploadDocument={handleUploadDocument}
            onVerifyDocument={handleVerifyDocument}
            onRejectDocument={handleRejectDocument}
            onComplete={handlePrepareComplete}
            isLoading={isLoading}
            error={error}
          />
        ) : null

      case 'SIGN':
        return (
          <SignStep
            signatures={signatures}
            onSubmitSignature={handleSignatureSubmit}
            onComplete={handleSignComplete}
            isLoading={isLoading}
            error={error}
          />
        )

      case 'CONFIRM':
        return appointment ? (
          <ConfirmStep
            appointment={appointment}
            documents={documents}
            signatures={signatures}
            onConfirm={handleConfirm}
            onEdit={handleEdit}
            onCancel={handleCancel}
            isLoading={isLoading}
            error={error}
          />
        ) : null

      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Step Indicator */}
      <AppointmentStepIndicator
        currentStep={currentStep}
        onStepClick={(step) => {
          // Only allow going back
          const stepOrder: AppointmentStep[] = ['SCHEDULE', 'PREPARE', 'SIGN', 'CONFIRM']
          const currentIndex = stepOrder.indexOf(currentStep)
          const targetIndex = stepOrder.indexOf(step)
          if (targetIndex < currentIndex) {
            setStep(step)
          }
        }}
      />

      {/* Step Content */}
      <div className="mt-8">
        {renderStep()}
      </div>
    </div>
  )
}
