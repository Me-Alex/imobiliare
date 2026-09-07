'use client'

import { useSyncExternalStore } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarDays, Clock, CalendarClock, MessageSquarePlus,
  XCircle, CheckCircle2, UserCheck, UserX, WalletCards, FileSignature,
  MoreHorizontal, ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Card, CardContent } from '@/components/ui/card'
import { useAppStore } from '@/store/use-app-store'
import type { Vizionare } from '@/lib/types'
import { formatDateRO } from '@/lib/utils'
import { openDealRoomForViewing, openViewingDocuments } from '@/lib/document-navigation'
import type { TransactionProcess } from '@/lib/transaction-process'
import { getViewingGuidance, type ViewingPrimaryAction, type ViewingGuidance } from '@/lib/viewing-guidance'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ─── Helpers ────────────────────────────────────────────────────────────────

function subscribeToClock(callback: () => void) {
  const timer = window.setInterval(callback, 30_000)
  return () => window.clearInterval(timer)
}

function getClockSnapshot() {
  return Math.floor(Date.now() / 30_000)
}

function getServerClockSnapshot() {
  return 0
}

// ─── Vizionare Card ─────────────────────────────────────────────────────────

export function VizionareCard({
  vizionare,
  transaction,
  onCancel,
  onAddFeedback,
  onReschedule,
  onConfirm,
  onCheckIn,
  onComplete,
  onNoShow,
  onCancelByAgent,
  canManage,
  currentUserId,
}: {
  vizionare: Vizionare
  transaction?: { id: string; process: TransactionProcess }
  onCancel: (id: string) => void
  onAddFeedback: (v: Vizionare) => void
  onReschedule: (v: Vizionare) => void
  onConfirm: (id: string) => void
  onCheckIn: (id: string) => void
  onComplete: (id: string) => void
  onNoShow: (id: string) => void
  onCancelByAgent: (id: string) => void
  canManage: boolean
  currentUserId: string
}) {
  const { navigateTo } = useAppStore()
  const isActive = ['pending', 'confirmed', 'checked_in'].includes(vizionare.status)
  const isCompleted = vizionare.status === 'completed'
  const hasFeedback = typeof vizionare.rating === 'number' && vizionare.rating > 0
  const canClientManage = !canManage && vizionare.clientId === currentUserId
  const audience = canManage ? 'staff' : canClientManage ? 'client' : 'observer'
  const guidance: ViewingGuidance = isCompleted && transaction
    ? { title: transaction.process.title, description: transaction.process.description, action: 'deal_room', actionLabel: transaction.process.phase === 'closed' ? 'Consultă tranzacția' : 'Continuă în tranzacție', tone: 'neutral' }
    : getViewingGuidance(vizionare, audience)
  const clockSnapshot = useSyncExternalStore(subscribeToClock, getClockSnapshot, getServerClockSnapshot)
  const currentTime = clockSnapshot * 30_000
  const noShowEligible = Boolean(
    vizionare.noShowEligibleAt && currentTime >= new Date(vizionare.noShowEligibleAt).getTime(),
  )

  const handleDealRoom = () => {
    openDealRoomForViewing(navigateTo, vizionare.id, transaction?.id)
  }

  const handleDocuments = () => {
    openViewingDocuments(navigateTo, vizionare.id, null, { focus: 'primary' })
  }

  const handlePrimaryAction = (action: ViewingPrimaryAction) => {
    switch (action) {
      case 'confirm':
        onConfirm(vizionare.id)
        break
      case 'check_in':
        onCheckIn(vizionare.id)
        break
      case 'complete':
        onComplete(vizionare.id)
        break
      case 'feedback':
        onAddFeedback(vizionare)
        break
      case 'documents':
        handleDocuments()
        break
      case 'deal_room':
        handleDealRoom()
        break
      case 'reschedule':
        onReschedule(vizionare)
        break
      case 'none':
        break
    }
  }

  const GuidanceIcon = guidance.action === 'documents'
    ? FileSignature
    : guidance.action === 'deal_room'
      ? WalletCards
      : guidance.action === 'feedback'
        ? MessageSquarePlus
        : guidance.action === 'reschedule'
          ? CalendarClock
          : guidance.action === 'check_in'
            ? UserCheck
            : CheckCircle2

  return (
    <motion.div
      id={`viewing-${vizionare.id}`}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="gap-0 overflow-hidden border bg-card py-0 shadow-none">
        <CardContent className="p-4 sm:p-5">
          {/* Header row */}
          <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3 min-w-0">
              <div className="min-w-0">
                <h2 className="font-semibold text-base leading-snug">{vizionare.propertyTitle}</h2>
                <p className="text-xs text-muted-foreground">{vizionare.staffName}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={vizionare.status} />
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-muted/40 p-3 text-sm mb-4">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>{formatDateRO(vizionare.date)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{vizionare.startTime} — {vizionare.endTime}</span>
            </div>
          </div>

          {isCompleted && hasFeedback && <details className="mb-3 text-sm"><summary className="cursor-pointer py-2 text-muted-foreground">Feedbackul vizitei · {vizionare.rating}/5</summary><p className="py-2">{vizionare.feedback || 'Fără comentarii.'}</p></details>}

          {/* Notes */}
          {vizionare.notes && !isCompleted && (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2 bg-muted/50 rounded-lg p-2.5">
              {vizionare.notes}
            </p>
          )}

          {(vizionare.cancellationReason || vizionare.status === 'no_show') && (
            <p className="text-xs text-muted-foreground mb-3 rounded-lg border border-orange-200 bg-orange-50 p-2.5 dark:border-orange-900 dark:bg-orange-950/20">
              {vizionare.status === 'no_show'
                ? 'Neprezentarea a fost consemnată după expirarea perioadei de grație. Fișa de vizionare nu se generează.'
                : `Motiv anulare: ${vizionare.cancellationReason}`}
            </p>
          )}

          {/* One clear next step, followed by optional secondary actions. */}
          <div className="mt-3">
            <p className="text-sm font-semibold text-foreground">{guidance.title}</p>

          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
            {guidance.action !== 'none' && (
              <Button
                size="sm"
                className="min-h-11 h-auto flex-1 gap-2 whitespace-normal text-sm sm:flex-none"
                onClick={() => handlePrimaryAction(guidance.action)}
              >
                <GuidanceIcon className="h-3.5 w-3.5" />
                {guidance.actionLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}

            {canClientManage && ['pending', 'confirmed'].includes(vizionare.status) && (
              <Button
                variant="outline"
                size="sm"
                className="min-h-11 gap-2 text-sm"
                onClick={() => onReschedule(vizionare)}
              >
                <CalendarClock className="h-3.5 w-3.5" />
                Reprogramează
              </Button>
            )}

            {canClientManage && isCompleted && guidance.action !== 'feedback' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-1.5 text-xs text-muted-foreground"
                onClick={() => onAddFeedback(vizionare)}
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                Editează feedbackul
              </Button>
            )}

            {((canClientManage && isActive) || (canManage && isActive)) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-11 w-11"
                    aria-label="Mai multe acțiuni"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {canManage && (vizionare.status === 'pending' || vizionare.status === 'confirmed') && (
                    <DropdownMenuItem
                      disabled={!noShowEligible}
                      onSelect={() => onNoShow(vizionare.id)}
                    >
                      <UserX />
                      {noShowEligible ? 'Consemnează neprezentarea' : 'Neprezentare — după grație'}
                    </DropdownMenuItem>
                  )}
                  {canManage && (vizionare.status === 'pending' || vizionare.status === 'confirmed') && (
                    <DropdownMenuSeparator />
                  )}
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => canManage ? onCancelByAgent(vizionare.id) : onCancel(vizionare.id)}
                  >
                    <XCircle />
                    {canManage ? 'Anulează din partea agenției' : 'Anulează programarea'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
