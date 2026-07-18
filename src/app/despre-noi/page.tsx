import type { Metadata } from 'next'
import { PlatformApp } from '@/app/page'

export const metadata: Metadata = {
  title: 'Despre HQS Imobiliare | Consultanță și tranzacții transparente',
  description: 'Află cum conectează HQS Imobiliare proprietățile, datele de piață, documentele și comunicarea într-un proces transparent.',
  alternates: { canonical: '/despre-noi' },
  openGraph: { title: 'Despre HQS Imobiliare', description: 'Consultanță imobiliară susținută de date și procese digitale clare.', url: '/despre-noi', type: 'website' },
}

export default function AboutRoute() { return <PlatformApp initialPage="de-ce-noi" /> }
