'use client'

import { Check } from 'lucide-react'
import type { AppointmentStep } from '../lib/types'

interface StepIndicatorProps {
  currentStep: AppointmentStep
  onStepClick?: (step: AppointmentStep) => void
}

const STEPS: { key: AppointmentStep; label: string }[] = [
  { key: 'SCHEDULE', label: 'Programare' },
  { key: 'PREPARE', label: 'Documente' },
  { key: 'SIGN', label: 'Semnare' },
  { key: 'CONFIRM', label: 'Confirmare' },
]

export function AppointmentStepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex(s => s.key === currentStep)

  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const isCompleted = i < currentIndex
        const isActive = i === currentIndex
        const isClickable = isCompleted && onStepClick

        return (
          <div key={step.key} className="flex items-center">
            <button
              type="button"
              onClick={() => isClickable && onStepClick?.(step.key)}
              disabled={!isClickable}
              className="flex items-center gap-2 group"
            >
              <div
                className={`
                  flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold transition-all duration-300
                  ${isCompleted
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : isActive
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-110'
                      : 'bg-muted text-muted-foreground'
                  }
                  ${isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}
                `}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`
                  hidden sm:inline text-sm font-medium transition-colors
                  ${isActive ? 'text-foreground' : 'text-muted-foreground'}
                `}
              >
                {step.label}
              </span>
            </button>

            {i < STEPS.length - 1 && (
              <div
                className={`
                  w-8 sm:w-16 lg:w-24 h-0.5 mx-2 sm:mx-3 rounded-full transition-colors duration-300
                  ${i < currentIndex ? 'bg-emerald-500' : 'bg-muted'}
                `}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export { STEPS as APPOINTMENT_STEPS }
