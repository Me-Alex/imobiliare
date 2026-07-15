'use client'

import { motion } from 'framer-motion'
import {
  CalendarDays, Clock, Star, CalendarClock, MessageSquarePlus,
  Upload, XCircle, CheckCircle2, UserCheck, UserX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAppStore } from '@/store/use-app-store'
import { saveToLS } from '@/lib/storage'
import { DEFAULT_STAFF, VIZIONARE_STATUS_CONFIG, LS_KEYS } from '@/lib/constants'
import type { Vizionare } from '@/lib/types'
import { StarRating } from '@/components/dialogs/vizionare-feedback-dialog'
import { VizionareDocumentsSection } from '@/components/features/vizionare-documents-section'
import { formatDateRO } from '@/lib/utils'

// ─── Helpers ────────────────────────────────────────────────────────────────

function getStaffById(id: string) {
  return DEFAULT_STAFF.find(s => s.id === id)
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
  const statusCfg = VIZIONARE_STATUS_CONFIG[vizionare.status]
  const isCancelled = ['cancelled', 'cancelled_by_client', 'cancelled_by_agent'].includes(vizionare.status)
  const isPast = vizionare.status === 'completed' || vizionare.status === 'no_show' || isCancelled
  const isActive = ['pending', 'confirmed', 'checked_in'].includes(vizionare.status)
  const isCompleted = vizionare.status === 'completed'
  const hasFeedback = typeof vizionare.rating === 'number' && vizionare.rating > 0
  const canClientManage = !canManage && vizionare.clientId === currentUserId
  const noShowEligible = Boolean(
    vizionare.noShowEligibleAt && Date.now() >= new Date(vizionare.noShowEligibleAt).getTime(),
  )

  const handleUploadDocs = () => {
    saveToLS(LS_KEYS.SELECTED_VIZIONARE, vizionare.id)
    navigateTo('documente')
  }

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
                  {staff?.avatarInitials || '?'}
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
                  {vizionare.wouldProceed ? 'Doreste sa continue' : 'Nu este interesat'}
                </Badge>
              )}
              <Badge className={statusCfg.className} variant={statusCfg.variant}>
                {statusCfg.label}
              </Badge>
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

          {/* Documents */}
          <VizionareDocumentsSection vizionareId={vizionare.id} />

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={handleUploadDocs}
            >
              <Upload className="h-3.5 w-3.5" />
              Incarca Documente
            </Button>

            {/* Add Feedback button — completed vizionari without rating */}
            {isCompleted && !hasFeedback && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8 text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/20"
                onClick={() => onAddFeedback(vizionare)}
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                Adauga Feedback
              </Button>
            )}

            {/* Edit Feedback button — completed vizionari with rating */}
            {isCompleted && hasFeedback && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs h-8 text-muted-foreground"
                onClick={() => onAddFeedback(vizionare)}
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                Editeaza Feedback
              </Button>
            )}

            {/* Reschedule button — active vizionari */}
            {canClientManage && [
              'pending', 'confirmed', 'cancelled', 'cancelled_by_client',
              'cancelled_by_agent', 'no_show',
            ].includes(vizionare.status) && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8 text-primary border-primary/30 hover:bg-primary/5 dark:border-primary/50"
                onClick={() => onReschedule(vizionare)}
              >
                <CalendarClock className="h-3.5 w-3.5" />
                {vizionare.status === 'pending' || vizionare.status === 'confirmed'
                  ? 'Reprogramare'
                  : 'Programează din nou'}
              </Button>
            )}

            {/* Cancel button — pending vizionari */}
            {canClientManage && (vizionare.status === 'pending' || vizionare.status === 'confirmed') && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 ml-auto"
                onClick={() => onCancel(vizionare.id)}
              >
                <XCircle className="h-3.5 w-3.5" />
                Anuleaza
              </Button>
            )}

            {canManage && vizionare.status === 'pending' && (
              <Button size="sm" className="gap-1.5 text-xs h-8" onClick={() => onConfirm(vizionare.id)}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Confirmă
              </Button>
            )}

            {canManage && vizionare.status === 'confirmed' && (
              <Button size="sm" className="gap-1.5 text-xs h-8" onClick={() => onCheckIn(vizionare.id)}>
                <UserCheck className="h-3.5 w-3.5" /> Client prezent
              </Button>
            )}

            {canManage && vizionare.status === 'checked_in' && (
              <Button size="sm" className="gap-1.5 text-xs h-8" onClick={() => onComplete(vizionare.id)}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Finalizează vizionarea
              </Button>
            )}

            {canManage && (vizionare.status === 'pending' || vizionare.status === 'confirmed') && (
              <Button
                variant="outline"
                size="sm"
                disabled={!noShowEligible}
                title={noShowEligible ? 'Consemnează neprezentarea' : 'Disponibil după interval și cele 15 minute de grație'}
                className="gap-1.5 text-xs h-8 text-orange-700 border-orange-300"
                onClick={() => onNoShow(vizionare.id)}
              >
                <UserX className="h-3.5 w-3.5" /> Nu s-a prezentat
              </Button>
            )}

            {canManage && isActive && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs h-8 text-red-600 ml-auto"
                onClick={() => onCancelByAgent(vizionare.id)}
              >
                <XCircle className="h-3.5 w-3.5" /> Anulează agenția
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
