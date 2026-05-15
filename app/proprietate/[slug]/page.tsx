import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PropertyDetailFresh } from "@/components/fresh/Public"
import { getPropertyBySlug, getSimilarProperties } from "@/lib/fresh-server"

export const runtime = "edge"

export const revalidate = 60

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const property = await getPropertyBySlug(params.slug)
  if (!property) return { title: "Proprietate indisponibila | HQS Imobiliare" }
  return {
    title: `${property.title} | HQS Imobiliare`,
    description: property.description.slice(0, 160),
  }
}

export default async function PropertyPage({ params }: { params: { slug: string } }) {
  const property = await getPropertyBySlug(params.slug)
  if (!property) notFound()
  const similar = await getSimilarProperties(property)
  return <PropertyDetailFresh property={property} similar={similar} />
}
