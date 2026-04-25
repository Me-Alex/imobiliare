import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HQS Imobiliare | Proprietăți Premium București',
  description: 'Găsește proprietatea perfectă în București. Apartamente, case și vile de vânzare și închiriere.',
  keywords: 'imobiliare, apartamente, case, vânzare, închiriere, București',
  openGraph: {
    title: 'HQS Imobiliare',
    description: 'Proprietăți premium în București',
    url: 'https://hqsimobiliare.ro',
    siteName: 'HQS Imobiliare',
    locale: 'ro_RO',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  )
}
