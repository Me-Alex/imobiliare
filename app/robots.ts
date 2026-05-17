import { siteConfig } from "@/lib/site-config"


export default function robots() {
  const base = siteConfig.url.replace(/\/$/, "")
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
