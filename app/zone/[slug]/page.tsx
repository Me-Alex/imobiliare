import { ZoneDetailFresh } from "@/components/fresh/Public"
import { zoneGuides } from "@/lib/fresh-data"

export const revalidate = 3600

export function generateStaticParams() {
  return zoneGuides.map((zone) => ({ slug: zone.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const zone = zoneGuides.find((item) => item.slug === params.slug) || zoneGuides[0]
  return {
    title: `${zone.name} | HQS Imobiliare`,
    description: zone.summary,
  }
}

export default function ZoneDetailPage({ params }: { params: { slug: string } }) {
  return <ZoneDetailFresh slug={params.slug} />
}
