import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HQS Imobiliare | Analiza Imobiliara Bucuresti",
  description:
    "Platforma de analiza imobiliara pentru Bucuresti. Descopera proprietati verificate, tendinte de pret si statistici de piata in timp real.",
  keywords: [
    "proprietati",
    "Bucuresti",
    "imobiliare",
    "analiza piata",
    "preturi",
    "apartamente",
    "case",
    "vile",
  ],
  authors: [{ name: "HQS Imobiliare" }],
  openGraph: {
    title: "HQS Imobiliare | Analiza Imobiliara Bucuresti",
    description:
      "Descopera proprietati verificate si tendinte de piata pentru Bucuresti.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <head>
        {/* OpenNext can reference this esbuild helper from next-themes' inline bootstrap. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "globalThis.__name=globalThis.__name||function(target){return target}",
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
