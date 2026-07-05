'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'pm-announcement-dismissed'

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY)
}

function getServerSnapshot() {
  return 'true' // On server, assume dismissed to prevent flash
}

export function AnnouncementBanner() {
  const dismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const visible = !dismissed

  const handleDismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true')
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }))
  }, [])

  const handleScrollToContact = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const contactEl = document.getElementById('contact')
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30 border-b border-emerald-200/60 dark:border-emerald-800/30">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-2 py-2 relative">
              <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-200 text-center pr-8">
                🎉 Oferta Speciala: Reducere 15% la comision pentru prima tranzactie!{' '}
                <Button
                  variant="link"
                  className="text-emerald-700 dark:text-emerald-300 p-0 h-auto font-semibold underline-offset-4 hover:underline text-xs sm:text-sm"
                  asChild
                >
                  <a href="#contact" onClick={handleScrollToContact}>
                    Contacteaza-ne acum →
                  </a>
                </Button>
              </p>
              <button
                type="button"
                onClick={handleDismiss}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-full text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-200 hover:bg-emerald-200/50 dark:hover:bg-emerald-800/30 transition-colors"
                aria-label="Inchide anuntul"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}