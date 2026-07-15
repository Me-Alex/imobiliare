'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  History,
  ChevronDown,
  FilePlus,
  Upload,
  CheckCircle2,
  FileCheck,
  Send,
  PenTool,
  Ban,
  AlertCircle,
  Clock,
  ShieldCheck,
  XCircle,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { DocumentEvent, ViewingDocument } from '@/lib/types'
import { cn } from '@/lib/utils'

const EVENT_CONFIG: Record<
  DocumentEvent['eventType'],
  { label: string; icon: React.ElementType; color: string }
> = {
  CREATED: { label: 'Creat', icon: FilePlus, color: 'text-blue-600' },
  UPLOADED: { label: 'Încărcat', icon: Upload, color: 'text-emerald-600' },
  GENERATED: { label: 'Generat', icon: FileCheck, color: 'text-violet-600' },
  VALIDATED: { label: 'Validat', icon: ShieldCheck, color: 'text-teal-600' },
  CONSENT_RECORDED: { label: 'Consimțământ înregistrat', icon: CheckCircle2, color: 'text-emerald-600' },
  APPROVED: { label: 'Aprobat', icon: CheckCircle2, color: 'text-emerald-600' },
  SENT_FOR_SIGNATURE: { label: 'Trimis pentru semnare', icon: Send, color: 'text-amber-600' },
  SIGNED: { label: 'Semnat', icon: PenTool, color: 'text-emerald-600' },
  DECLINED: { label: 'Refuzat', icon: Ban, color: 'text-red-600' },
  COMPLETED: { label: 'Finalizat', icon: CheckCircle2, color: 'text-emerald-600' },
  SUPERSEDED: { label: 'Înlocuit', icon: Clock, color: 'text-slate-600' },
  EXPIRED: { label: 'Expirat', icon: AlertCircle, color: 'text-orange-600' },
  EXTERNAL_SIGNATURE_ATTACHED: { label: 'Semnătură externă atașată', icon: PenTool, color: 'text-blue-600' },
}

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface DocumentEventTimelineProps {
  document: ViewingDocument
}

export function DocumentEventTimeline({ document }: DocumentEventTimelineProps) {
  const [expanded, setExpanded] = useState(false)
  const events = document.events || []
  const signers = document.signers || []

  if (events.length === 0 && signers.length === 0) return null

  const timelineItems: Array<{
    id: string
    type: 'event' | 'signer'
    label: string
    description?: string
    date: string
    icon: React.ElementType
    color: string
    status?: string
  }> = []

  events.forEach((event) => {
    const config = EVENT_CONFIG[event.eventType] || { label: event.eventType, icon: Clock, color: 'text-muted-foreground' }
    timelineItems.push({
      id: `ev-${event.id}`,
      type: 'event',
      label: config.label,
      description: event.metadata?.note ? String(event.metadata.note) : undefined,
      date: event.createdAt,
      icon: config.icon,
      color: config.color,
    })
  })

  signers.forEach((signer) => {
    const label = signer.status === 'SIGNED' ? 'Semnătură înregistrată' : signer.status === 'DECLINED' ? 'Semnătură refuzată' : 'Așteaptă semnătura'
    const color = signer.status === 'SIGNED' ? 'text-emerald-600' : signer.status === 'DECLINED' ? 'text-red-600' : 'text-amber-600'
    const Icon = signer.status === 'SIGNED' ? PenTool : signer.status === 'DECLINED' ? XCircle : Clock
    timelineItems.push({
      id: `sg-${signer.id}`,
      type: 'signer',
      label,
      description: signer.signatureName ? `Semnat ca: ${signer.signatureName}` : `Rol: ${signer.role}`,
      date: signer.signedAt || document.uploadedAt,
      icon: Icon,
      color,
      status: signer.status,
    })
  })

  timelineItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const visibleItems = expanded ? timelineItems : timelineItems.slice(-3)
  const hasMore = timelineItems.length > 3

  return (
    <div className="mt-3 pt-3 border-t">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <History className="h-3.5 w-3.5" />
        <span>Istoric & semnături</span>
        {hasMore && (
          <Badge variant="outline" className="text-[10px] h-4 px-1">
            {timelineItems.length}
          </Badge>
        )}
        <ChevronDown className={cn('h-3 w-3 transition-transform', expanded && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-0 relative pl-4">
              <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border" />
              {visibleItems.map((item, index) => {
                const Icon = item.icon
                const isLast = index === visibleItems.length - 1
                return (
                  <div key={item.id} className="relative flex items-start gap-2.5 pb-3">
                    <div
                      className={cn(
                        'relative z-10 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border bg-background',
                        item.color.replace('text-', 'border-'),
                      )}
                    >
                      <div className={cn('h-1.5 w-1.5 rounded-full', item.color.replace('text-', 'bg-'))} />
                    </div>
                    <div className="min-w-0 flex-1 -mt-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-medium">{item.label}</span>
                        {item.status && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1">
                            {item.status}
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{item.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">{formatEventDate(item.date)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
