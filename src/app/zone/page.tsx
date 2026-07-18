import type { Metadata } from 'next'
import { PlatformApp } from '@/app/page'

export const metadata: Metadata = {
  title: 'Zone și cartiere din București | Ghid imobiliar HQS',
  description: 'Compară cartierele din București după prețuri, transport, școli, facilități și profilul locuirii.',
  alternates: { canonical: '/zone' },
  openGraph: { title: 'Ghidul cartierelor din București', description: 'Date locale pentru alegerea zonei potrivite.', url: '/zone', type: 'website' },
}

export default function ZonesRoute() { return <PlatformApp initialPage="zone" /> }
