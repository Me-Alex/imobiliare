import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PropertyRouteLoader } from './property-route-loader'
import { getPropertyBySlugServer } from '@/lib/property-server'
import { formatPrice } from '@/lib/utils'
import { getPropertyImages, PROPERTY_TYPE_LABELS, TRANSACTION_LABELS } from '@/lib/property-details'

interface PropertyRouteProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PropertyRouteProps): Promise<Metadata> {
  const { slug } = await params
  const property = await getPropertyBySlugServer(slug)

  if (!property) {
    return {
      title: 'Proprietate indisponibilă | HQS Imobiliare',
      robots: { index: false, follow: false },
    }
  }

  const type = PROPERTY_TYPE_LABELS[property.type] || property.type
  const transaction = TRANSACTION_LABELS[property.transaction] || property.transaction
  const title = `${property.title} | ${formatPrice(property.price, property.currency)}`
  const description = `${type} pentru ${transaction.toLocaleLowerCase('ro-RO')} în ${property.zone}, București. ${property.rooms ? `${property.rooms} camere, ` : ''}${property.areaSqm} m².`
  const image = getPropertyImages(property)[0]
  const canonical = `/proprietati/${property.slug}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      images: [{ url: image, alt: property.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export default async function PropertyRoute({ params }: PropertyRouteProps) {
  const { slug } = await params
  const property = await getPropertyBySlugServer(slug)
  if (!property) notFound()

  return <PropertyRouteLoader property={property} />
}
