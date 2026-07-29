'use client'

import { useSyncExternalStore } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarDays, Clock, Star, CalendarClock, MessageSquarePlus,
  XCircle, CheckCircle2, UserCheck, UserX, WalletCards, FileSignature,
  MoreHorizontal, ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAppStore } from '@/store/use-app-store'
import { DEFAULT_STAFF } from '@/lib/constants'
import type { Vizionare } from '@/lib/types'
import { StarRating } from '@/components/dialogs/vizionare-feedback-dialog'
import { cn, formatDateRO } from '@/lib/utils'
import { openDealRoomForViewing, openViewingDocuments } from '@/lib/document-navigation'
import { getViewingGuidance, type ViewingPrimaryAction } from '@/lib/viewing-guidance'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ─── Helpers ────────────────────────────────────────────────────────────────

function getStaffById(id: string) {
  return DEFAULT_STAFF.find(s => s.id === id)
}

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
  const staff = getStaffById(vizionare.staffId)
  const staffInitials = staff?.avatarInitials || vizionare.staffName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AH'
  const isCancelled = ['cancelled', 'cancelled_by_client', 'cancelled_by_agent'].includes(vizionare.status)
  const isPast = vizionare.status === 'completed' || vizionare.status === 'no_show' || isCancelled
  const isActive = ['pending', 'confirmed', 'checked_in'].includes(vizionare.status)
  const isCompleted = vizionare.status === 'completed'
  const hasFeedback = typeof vizionare.rating === 'number' && vizionare.rating > 0
  const canClientManage = !canManage && vizionare.clientId === currentUserId
  const audience = canManage ? 'staff' : canClientManage ? 'client' : 'observer'
  const guidance = getViewingGuidance(vizionare, audience)
  const clockSnapshot = useSyncExternalStore(subscribeToClock, getClockSnapshot, getServerClockSnapshot)
  const currentTime = clockSnapshot * 30_000
  const noShowEligible = Boolean(
    vizionare.noShowEligibleAt && currentTime >= new Date(vizionare.noShowEligibleAt).getTime(),
  )

  const handleDealRoom = () => {
    openDealRoomForViewing(navigateTo, vizionare.id)
  }

  const handleDocuments = () => {
    openViewingDocuments(navigateTo, vizionare.id)
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
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`glass-card border-0 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md ${
        isPast ? 'opacity-75' : ''
      }`}>
        <CardContent className="p-4 sm:p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-3 min-w-0">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {staffInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h4 className="font-semibold text-sm truncate">{vizionare.propertyTitle}</h4>
                <p className="text-xs text-muted-foreground">{vizionare.staffName}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {isCompleted && hasFeedback && (
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                >
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400 mr-1" />
                  {vizionare.rating}
                </Badge>
              )}
              {isCompleted && typeof vizionare.wouldProceed === 'boolean' && (
                <Badge
                  variant="outline"
                  className={
                    vizionare.wouldProceed
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                      : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-700'
                  }
                >
                  {vizionare.wouldProceed ? 'Dorește să continue' : 'Nu este interesat'}
                </Badge>
              )}
              <StatusBadge status={vizionare.status} />
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>{formatDateRO(vizionare.date)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{vizionare.startTime} — {vizionare.endTime}</span>
            </div>
          </div>

          {/* Completed vizionare with feedback — show read-only stars + feedback text */}
          {isCompleted && hasFeedback && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-3 space-y-2"
            >
              <div className="flex items-center gap-2">
                <StarRating value={vizionare.rating!} readonly />
                <span className="text-xs text-muted-foreground">
                  {vizionare.rating}/5
                </span>
              </div>
              {vizionare.feedback && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5 line-clamp-3">
                  {vizionare.feedback}
                </p>
              )}
            </motion.div>
          )}

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
          <div
            className={cn(
              'mt-3 rounded-xl border p-3.5',
              guidance.tone === 'warning' && 'border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20',
              guidance.tone === 'info' && 'border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/20',
              guidance.tone === 'success' && 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20',
              guidance.tone === 'neutral' && 'border-border bg-muted/35',
            )}
          >
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Pasul următor
            </p>
            <p className="text-sm font-semibold text-foreground">{guidance.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{guidance.description}</p>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
            {guidance.action !== 'none' && (
              <Button
                size="sm"
                className="h-9 flex-1 gap-1.5 text-xs sm:flex-none"
                onClick={() => handlePrimaryAction(guidance.action)}
              >
                <GuidanceIcon className="h-3.5 w-3.5" />
                {guidance.actionLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}

            {canClientManage && isActive && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs"
                onClick={() => onReschedule(vizionare)}
              >
                <CalendarClock className="h-3.5 w-3.5" />
                Reprogramează
              </Button>
            )}

            {canClientManage && isCompleted && hasFeedback && (
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

            {canManage && isCompleted && vizionare.wouldProceed === true && (
              <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs" onClick={handleDealRoom}>
                <WalletCards className="h-3.5 w-3.5" />
                Continuă tranzacția
              </Button>
            )}

            {((canClientManage && isActive) || (canManage && isActive)) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-9 w-9"
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
