'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Building2,
  CalendarCheck,
  FileText,
  CheckCheck,
  Trash2,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { loadFromLS, saveToLS, generateId } from '@/lib/storage'
import { LS_KEYS } from '@/lib/constants'
import { useAppStore, type PageKey } from '@/store/use-app-store'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn, formatRelativeTime } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotificationItem {
  id: string
  type:
    | 'property_published'
    | 'vizionare_scheduled'
    | 'vizionare_reminder'
    | 'vizionare_completed'
    | 'document_uploaded'
    | 'document_signed'
    | 'system'
  title: string
  message: string
  read: boolean
  createdAt: string // ISO string
  link?: PageKey // PageKey to navigate to when clicked
}

export interface NotificationsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_KEY = LS_KEYS.NOTIFICATIONS
const MAX_NOTIFICATIONS = 20

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNotificationIcon(type: NotificationItem['type']) {
  switch (type) {
    case 'property_published':
      return <Building2 className="size-4 shrink-0 text-amber-600" />
    case 'vizionare_scheduled':
    case 'vizionare_reminder':
    case 'vizionare_completed':
      return <CalendarCheck className="size-4 shrink-0 text-emerald-600" />
    case 'document_uploaded':
    case 'document_signed':
      return <FileText className="size-4 shrink-0 text-violet-600" />
    case 'system':
    default:
      return <Bell className="size-4 shrink-0 text-primary" />
  }
}

function loadNotifications(): NotificationItem[] {
  return loadFromLS<NotificationItem[]>(LS_KEY, [])
}

function persistNotifications(notifications: NotificationItem[]): void {
  saveToLS(LS_KEY, notifications)
}

// ─── Exported helper ──────────────────────────────────────────────────────────

export function addNotification(
  notification: Omit<NotificationItem, 'id' | 'read' | 'createdAt'>,
): void {
  const current = loadNotifications()
  const newItem: NotificationItem = {
    ...notification,
    id: generateId(),
    read: false,
    createdAt: new Date().toISOString(),
  }
  // Keep only the newest MAX_NOTIFICATIONS
  const updated = [newItem, ...current].slice(0, MAX_NOTIFICATIONS)
  persistNotifications(updated)
  // Dispatch a custom event so any open panels can refresh
  window.dispatchEvent(new CustomEvent('hqs-notifications-updated'))
}

// ─── Hook: useNotifications ───────────────────────────────────────────────────

function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    loadFromLS<NotificationItem[]>(LS_KEY, []),
  )

  // Listen for external notification updates (from addNotification helper)
  useEffect(() => {
    const handler = () => setNotifications(loadNotifications())
    window.addEventListener('hqs-notifications-updated', handler)
    return () => window.removeEventListener('hqs-notifications-updated', handler)
  }, [])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  )

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }))
      persistNotifications(updated)
      window.dispatchEvent(new CustomEvent('hqs-notifications-updated'))
      return updated
    })
  }, [])

  const markOneRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      )
      persistNotifications(updated)
      window.dispatchEvent(new CustomEvent('hqs-notifications-updated'))
      return updated
    })
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
    persistNotifications([])
    window.dispatchEvent(new CustomEvent('hqs-notifications-updated'))
  }, [])

  return { notifications, unreadCount, markAllRead, markOneRead, clearAll }
}

// ─── Notification row ─────────────────────────────────────────────────────────

function NotificationRow({
  item,
  onRead,
}: {
  item: NotificationItem
  onRead: (id: string) => void
}) {
  const navigateTo = useAppStore((s) => s.navigateTo)

  const handleClick = () => {
    onRead(item.id)
    if (item.link) {
      navigateTo(item.link)
    }
  }

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      onClick={handleClick}
      className={cn(
        'relative flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent/60 cursor-pointer',
        !item.read && 'bg-primary/5 border-l-2 border-l-primary',
      )}
    >
      {/* Unread dot */}
      {!item.read && (
        <span className="absolute left-0.5 top-4 size-1.5 rounded-full bg-primary" />
      )}

      {/* Icon */}
      <span className="mt-0.5">{getNotificationIcon(item.type)}</span>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm leading-tight',
            !item.read
              ? 'font-semibold text-foreground'
              : 'font-medium text-foreground/80',
          )}
        >
          {item.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {item.message}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground/70">
          {formatRelativeTime(item.createdAt)}
        </p>
      </div>
    </motion.button>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
      <Bell className="size-10 stroke-1" />
      <p className="text-sm font-medium">Nicio notificare</p>
    </div>
  )
}

// ─── Shared list content ─────────────────────────────────────────────────────

function NotificationsList({
  notifications,
  onMarkAllRead,
  onMarkOneRead,
  onClearAll,
  isMobile = false,
}: {
  notifications: NotificationItem[]
  onMarkAllRead: () => void
  onMarkOneRead: (id: string) => void
  onClearAll: () => void
  isMobile?: boolean
}) {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-1 pb-3">
        <h3
          className={cn('font-semibold', isMobile ? 'text-base' : 'text-sm')}
        >
          Notificari
        </h3>
        {notifications.some((n) => !n.read) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation()
              onMarkAllRead()
            }}
          >
            <CheckCheck className="size-3.5" />
            <span className="hidden sm:inline">
              Marcheaza toate ca citite
            </span>
            <span className="sm:hidden">Marcheaza citite</span>
          </Button>
        )}
      </div>

      {/* Notifications list */}
      {notifications.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="max-h-96 overflow-y-auto notifications-scroll">
          <AnimatePresence initial={false}>
            {notifications.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                onRead={onMarkOneRead}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto w-full gap-1.5 px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onClearAll()
            }}
          >
            <Trash2 className="size-3.5" />
            Sterge toate
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Desktop dropdown (portal-based) ─────────────────────────────────────────

function DesktopDropdown({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Delay to avoid closing on the same click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick)
    }, 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [open, onClose])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          ref={ref}
          className="fixed right-4 top-14 z-50 w-80 origin-top-right rounded-lg border bg-popover text-popover-foreground p-4 shadow-lg"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NotificationsPanel({
  open,
  onOpenChange,
}: NotificationsPanelProps) {
  const isMobile = useIsMobile()
  const { notifications, markAllRead, markOneRead, clearAll } =
    useNotifications()

  // Sort by createdAt desc
  const sorted = useMemo(
    () =>
      [...notifications].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [notifications],
  )

  const list = (
    <NotificationsList
      notifications={sorted}
      onMarkAllRead={markAllRead}
      onMarkOneRead={markOneRead}
      onClearAll={clearAll}
      isMobile={isMobile}
    />
  )

  // ── Mobile: Sheet ──
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-sm">
          <SheetHeader className="sr-only">
            <SheetTitle>Notificari</SheetTitle>
          </SheetHeader>
          <div className="flex h-full flex-col p-4">{list}</div>
        </SheetContent>
      </Sheet>
    )
  }

  // ── Desktop: Portal dropdown ──
  return (
    <DesktopDropdown open={open} onClose={() => onOpenChange(false)}>
      {list}
    </DesktopDropdown>
  )
}