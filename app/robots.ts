import { siteConfig } from "@/lib/site-config"


export default function robots() {
  const base = siteConfig.url.replace(/\/$/, "")
  return {
    rules: [{
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/login', '/portal', '/owner', '/favorite', '/comparare'],
    }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
