import type { Metadata } from 'next'
import { PlatformApp } from '@/app/page'

export const metadata: Metadata = {
  title: 'Servicii imobiliare București | HQS Imobiliare',
  description: 'Evaluare orientativă, fotografie imobiliară, tur virtual 360°, video, promovare și organizarea documentelor pentru tranzacție.',
  alternates: { canonical: '/servicii' },
  openGraph: {
    title: 'Servicii pentru prezentarea și tranzacționarea proprietății',
    description: 'Alege servicii individuale sau un pachet potrivit proprietății tale.',
    url: '/servicii',
    type: 'website',
  },
}

export default function ServicesRoute() {
  return <PlatformApp initialPage="servicii" />
}
