import type { ReactNode } from "react"

export const metadata = {
  title: {
    default: "HQS Admin | Control Panel",
    template: "%s | HQS Admin",
  },
  description: "Panou de administrare HQS pentru proprietati, lead-uri, programari, clienti si rapoarte.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminLayout({ children }: { children: ReactNode }) { return <div className="min-h-screen bg-bg-primary text-text-primary">{children}</div> }
