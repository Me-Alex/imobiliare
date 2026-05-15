import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/ThemeProvider"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://hqsimobiliare.ro"),
  title: {
    default: "HQS Imobiliare | Platforma imobiliara completa",
    template: "%s | HQS Imobiliare",
  },
  description: "Website imobiliar reconstruit complet pentru proprietati, cautare, comparare, lead-uri, programari, portal client si admin.",
  keywords: ["HQS Imobiliare", "imobiliare Bucuresti", "proprietati Bucuresti", "portal client imobiliare"],
  icons: { icon: "/favicon.svg" },
  alternates: { canonical: "/" },
  openGraph: {
    title: "HQS Imobiliare",
    description: "Proprietati verificate, portal client si CRM operational.",
    url: "https://hqsimobiliare.ro",
    siteName: "HQS Imobiliare",
    locale: "ro_RO",
    type: "website",
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
