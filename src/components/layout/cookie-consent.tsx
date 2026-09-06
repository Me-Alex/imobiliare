'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LS_KEYS } from '@/lib/constants'
import { readBrowserPreference, writeBrowserPreference } from '@/lib/storage'

const STORAGE_KEY = LS_KEYS.COOKIES_ACCEPTED

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

function getSnapshot() {
  return readBrowserPreference(STORAGE_KEY)
}

function getServerSnapshot() {
  return 'all' // On server, assume accepted to prevent flash
}

export function CookieConsent() {
  const accepted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const visible = !accepted

  const handleAccept = useCallback((value: 'all' | 'necessary') => {
    writeBrowserPreference(STORAGE_KEY, value)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-6"
        >
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border/70 bg-background/95 shadow-2xl backdrop-blur-lg">
            <div className="px-4 py-3 sm:px-5 sm:py-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Cookie className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Folosim cookie-uri necesare și, cu acordul tău, cookie-uri pentru îmbunătățirea experienței.{' '}
                    <a href="/confidentialitate" className="font-medium text-foreground underline-offset-4 hover:underline">Detalii</a>
                  </p>
                </div>
                <div className="grid w-full shrink-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => handleAccept('all')}
                  >
                    Acceptă toate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => handleAccept('necessary')}
                  >
                    Doar necesare
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
