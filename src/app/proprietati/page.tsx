import type { Metadata } from 'next'
import { PlatformApp } from '@/app/page'

export const metadata: Metadata = {
  title: 'Proprietăți de vânzare și închiriat în București | HQS Imobiliare',
  description: 'Descoperă apartamente, case și spații atent prezentate în București. Compară prețuri, explorează tururi virtuale și programează o vizionare online.',
  alternates: { canonical: '/proprietati' },
  openGraph: { title: 'Proprietăți în București | HQS Imobiliare', description: 'Anunțuri imobiliare cu date de piață, tururi virtuale și programări online.', url: '/proprietati', type: 'website' },
}

export default function PropertiesIndexPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Proprietăți în București',
    description: metadata.description,
    url: '/proprietati',
    isPartOf: { '@type': 'WebSite', name: 'HQS Imobiliare' },
  }
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><PlatformApp initialPage="proprietati" /></>
}
