import OwnerPortal from "@/components/OwnerPortal"

export const metadata = {
  title: "Portal proprietar | HQS Imobiliare",
  description:
    "Portal proprietar cu proprietati, rapoarte, documente si mandate filtrate pe emailul autentificat.",
  robots: { index: false, follow: true },
}

export default function OwnerPage() {
  return <OwnerPortal />
}
