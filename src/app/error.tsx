'use client'

import { useEffect } from 'react'
import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Eroare neasteptata:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <Card className="w-full max-w-md border-emerald-200 bg-card shadow-xl dark:border-emerald-800">
        <CardHeader className="flex flex-col items-center gap-4 pb-2 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
            <Building2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Ceva nu a mers bine
          </h2>
          <p className="text-muted-foreground">
            A aparut o eroare neasteptata. Te rugam sa incerci din nou sau sa revii
            mai tarziu.
          </p>
        </CardHeader>

        <CardContent className="text-center">
          {error.message && (
            <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error.message}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex-col gap-3">
          <Button
            onClick={reset}
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500"
          >
            Reincearca
          </Button>
          <Button
            variant="outline"
            className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950"
            onClick={() => (window.location.href = '/')}
          >
            Mergi la pagina principala
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}