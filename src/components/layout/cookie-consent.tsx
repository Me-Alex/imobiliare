'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LS_KEYS } from '@/lib/constants'

const STORAGE_KEY = LS_KEYS.COOKIES_ACCEPTED

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY)
}

function getServerSnapshot() {
  return 'all' // On server, assume accepted to prevent flash
}

export function CookieConsent() {
  const accepted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const visible = !accepted

  const handleAccept = useCallback((value: 'all' | 'necessary') => {
    localStorage.setItem(STORAGE_KEY, value)
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }))
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="fixed bottom-0 left-0 right-0 z-50"
        >
          <div className="bg-background/90 backdrop-blur-lg border-t border-border/50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Cookie className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Acest site foloseste cookie-uri pentru a imbunatati experienta ta. Continuand, accepti
                    politica noastra de cookie-uri.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => handleAccept('all')}
                  >
                    Accepta toate
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