import Link from 'next/link'
import { Home, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PropertyNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <SearchX className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Proprietatea nu mai este disponibilă</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Anunțul a fost retras, adresa nu este corectă sau proprietatea nu mai este publicată.
        </p>
        <Button asChild className="mt-6 gap-2">
          <Link href="/?page=proprietati">
            <Home className="h-4 w-4" />
            Vezi proprietățile active
          </Link>
        </Button>
      </div>
    </main>
  )
}
