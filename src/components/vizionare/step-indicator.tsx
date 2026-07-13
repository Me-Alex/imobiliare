'use client'

import { Check } from 'lucide-react'

const STEP_LABELS = ['Alege Proprietatea', 'Alege Agent si Data', 'Confirmare']

interface StepIndicatorProps {
  currentStep: number
  onStepClick: (step: number) => void
}

export function StepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEP_LABELS.map((label, i) => {
        const stepNum = i + 1
        const isActive = stepNum === currentStep
        const isCompleted = stepNum < currentStep
        const isClickable = stepNum <= currentStep

        return (
          <div key={label} className="flex items-center">
            <button
              type="button"
              onClick={() => isClickable && onStepClick(stepNum)}
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
                  ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                `}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
              </div>
              <span
                className={`hidden sm:inline text-sm font-medium transition-colors ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
            </button>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`w-8 sm:w-16 lg:w-24 h-0.5 mx-2 sm:mx-3 rounded-full transition-colors duration-300 ${
                  stepNum < currentStep ? 'bg-emerald-500' : 'bg-muted'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}