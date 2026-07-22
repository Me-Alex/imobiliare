import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hqs-imobiliare.floreaalexandru2002.workers.dev'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/?page=admin', '/?page=crm', '/?page=deal-room', '/?page=owner-dashboard'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
