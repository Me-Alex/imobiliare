import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://imobiliare2.pages.dev'

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['/', '/proprietati', '/analiza-piata', '/zone', '/evaluare', '/despre-noi', '/confidentialitate']
  return routes.map((route, index) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: index < 2 ? 'daily' : 'weekly',
    priority: index === 0 ? 1 : index === 1 ? 0.9 : 0.7,
  }))
}
