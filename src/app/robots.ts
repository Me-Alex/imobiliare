import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://imobiliare2.pages.dev'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/?page=admin', '/?page=crm', '/?page=deal-room', '/?page=owner-dashboard'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
