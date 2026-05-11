import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: 'HQS Imobiliare | Proprietăți premium în București',
  description: 'Proprietăți atent selecționate în București: apartamente, case și vile pentru vânzare sau închiriere.',
  keywords: ['imobiliare București', 'apartamente București', 'case București', 'vile București', 'proprietăți premium'],
  metadataBase: new URL('https://hqsimobiliare.ro'),
  alternates: { canonical: '/' },
  openGraph: {
    title: 'HQS Imobiliare',
    description: 'Proprietăți premium în București',
    url: 'https://hqsimobiliare.ro',
    siteName: 'HQS Imobiliare',
    locale: 'ro_RO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HQS Imobiliare',
    description: 'Proprietăți premium în București',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className="dark" suppressHydrationWarning>
      <body>
        <a href="#continut" className="skip-link">Sari la conținut</a>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
