import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'HQS Imobiliare | Proprietati premium in Bucuresti',
  description: 'Proprietati atent selectionate in Bucuresti: apartamente, case si vile pentru vanzare sau inchiriere.',
  keywords: ['imobiliare Bucuresti', 'apartamente Bucuresti', 'case Bucuresti', 'vile Bucuresti', 'proprietati premium'],
  icons: {
    icon: '/favicon.svg',
  },
  metadataBase: new URL('https://hqsimobiliare.ro'),
  alternates: { canonical: '/' },
  openGraph: {
    title: 'HQS Imobiliare',
    description: 'Proprietati premium in Bucuresti',
    url: 'https://hqsimobiliare.ro',
    siteName: 'HQS Imobiliare',
    locale: 'ro_RO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HQS Imobiliare',
    description: 'Proprietati premium in Bucuresti',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={inter.variable} suppressHydrationWarning>
      <body className={inter.className}>
        <a href="#continut" className="skip-link">Sari la continut</a>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
