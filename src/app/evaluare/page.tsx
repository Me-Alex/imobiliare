import type { Metadata } from 'next'
import { PlatformApp } from '@/app/page'

export const metadata: Metadata = {
  title: 'Evaluare proprietate online București | HQS Imobiliare',
  description: 'Obține o estimare orientativă a prețului proprietății pe baza caracteristicilor și datelor recente de piață.',
  alternates: { canonical: '/evaluare' },
  openGraph: { title: 'Estimare proprietate online', description: 'Află intervalul orientativ de piață al proprietății tale.', url: '/evaluare', type: 'website' },
}

export default function ValuationRoute() { return <PlatformApp initialPage="evaluare" /> }
