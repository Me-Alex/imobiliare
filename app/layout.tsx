import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { siteConfig } from '@/lib/site-config'

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
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    title: 'HQS Imobiliare',
    description: 'Proprietati premium in Bucuresti',
    url: siteConfig.url,
    siteName: 'HQS Imobiliare',
    locale: 'ro_RO',
    type: 'website',
    images: [{ url: '/images/hqs-hero.png', width: 1200, height: 630, alt: 'HQS Imobiliare' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HQS Imobiliare',
    description: 'Proprietati premium in Bucuresti',
    images: ['/images/hqs-hero.png'],
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
