import type { Metadata } from 'next'
import { PlatformApp } from '@/app/page'

export const metadata: Metadata = {
  title: 'Analiza pieței imobiliare București | HQS Imobiliare',
  description: 'Urmărește prețurile pe metru pătrat, tendințele și indicatorii pieței imobiliare din București.',
  alternates: { canonical: '/analiza-piata' },
  openGraph: { title: 'Analiza pieței imobiliare București', description: 'Date și tendințe pentru decizii imobiliare mai bine informate.', url: '/analiza-piata', type: 'website' },
}

export default function MarketAnalysisRoute() { return <PlatformApp initialPage="analiza" /> }
