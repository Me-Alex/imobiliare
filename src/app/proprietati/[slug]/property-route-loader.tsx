'use client'

import dynamic from 'next/dynamic'
import { ThemeProvider } from 'next-themes'
import type { Property } from '@/lib/types'

const PropertyRouteClient = dynamic(
  () => import('./property-route-client').then((module) => module.PropertyRouteClient),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-background text-foreground">
        <div className="h-16 border-b bg-background" />
        <div className="aspect-[4/3] animate-pulse bg-muted sm:aspect-[16/8] lg:aspect-[21/7]" />
        <div className="mx-auto max-w-7xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-8 w-2/3 animate-pulse rounded-lg bg-muted" />
          <div className="h-12 w-52 animate-pulse rounded-lg bg-muted" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
    ),
  },
)

export function PropertyRouteLoader({ property }: { property: Property }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <PropertyRouteClient property={property} />
    </ThemeProvider>
  )
}
