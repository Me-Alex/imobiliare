'use client'

import { IdCard, FileCheck, FileSignature, FileText, File, CheckCircle2, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { DOC_TYPE_LABELS } from '@/lib/constants'
import type { UploadedDocument } from '@/lib/types'
import { cn } from '@/lib/utils'

// ─── Doc type alias ──────────────────────────────────────────────────────

export type DocType = UploadedDocument['docType']

// ─── Config for each document type ──────────────────────────────────────

export const DOC_TYPE_CONFIG: Array<{
  type: DocType
  icon: React.ElementType
  color: string
  bgColor: string
  description: string
}> = [
  {
    type: 'id_card',
    icon: IdCard,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    description: 'Copie CI/Passport',
  },
  {
    type: 'proof_of_income',
    icon: FileCheck,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    description: 'Adeverinta salariu / venit',
  },
  {
    type: 'vizionare_sign',
    icon: FileSignature,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    description: 'Semnatura proces-verbal vizionare',
  },
  {
    type: 'rental_contract',
    icon: FileText,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
    description: 'Contract de inchiriere semnat',
  },
  {
    type: 'other',
    icon: File,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50 border-border',
    description: 'Alte documente necesare',
  },
]

// ─── Component ──────────────────────────────────────────────────────────

interface DocumentTypeSelectorProps {
  uploadedTypes: Set<DocType>
  uploadingType: DocType | null
  uploadProgress: number
  onTypeClick: (type: DocType) => void
}

export function DocumentTypeSelector({
  uploadedTypes,
  uploadingType,
  uploadProgress,
  onTypeClick,
}: DocumentTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {DOC_TYPE_CONFIG.map((config) => {
        const isUploaded = uploadedTypes.has(config.type)
        const isUploading = uploadingType === config.type
        const Icon = config.icon

        return (
          <button
            key={config.type}
            onClick={() => !isUploaded && !isUploading && onTypeClick(config.type)}
            disabled={isUploading}
            className={cn(
              'w-full rounded-xl border-2 border-dashed p-4 text-left transition-all duration-200 relative overflow-hidden',
              config.bgColor,
              isUploaded
                ? 'border-solid cursor-default'
                : 'hover:shadow-md hover:scale-[1.01] cursor-pointer active:scale-[0.99]',
              isUploading && 'pointer-events-none opacity-80',
            )}
          >
            {/* Upload progress overlay */}
            <AnimatePresence>
              {isUploading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-10"
                >
                  <div className="flex flex-col items-center gap-2 w-3/4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <Progress value={uploadProgress} className="h-1.5" />
                    <span className="text-xs text-muted-foreground">Se incarca...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                  isUploaded ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-background/80',
                )}
              >
                {isUploaded ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Icon className={cn('h-5 w-5', config.color)} />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{DOC_TYPE_LABELS[config.type]}</p>
                <p className="text-xs text-muted-foreground truncate">{config.description}</p>
                {isUploaded && (
                  <Badge
                    variant="outline"
                    className="mt-1 text-[10px] border-emerald-200 text-emerald-600 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-950/30"
                  >
                    Incarcat
                  </Badge>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}