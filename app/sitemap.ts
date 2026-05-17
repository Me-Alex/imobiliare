import type { MetadataRoute } from "next"
import { zoneProfiles } from "@/lib/experience"
import { siteConfig } from "@/lib/site-config"
import { supabase } from "@/lib/supabase"


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, "")
  const routes = ['/', '/proprietati', '/zone', '/despre', '/contact', '/comparare', '/favorite', '/portal']
  const now = new Date()

  const { data: properties } = await supabase
    .from("properties")
    .select("slug, updated_at, published_at, created_at")
    .eq("status", "PUBLISHED")
    .order("created_at", { ascending: false })
    .limit(500)

  const staticRoutes = routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: now,
    changeFrequency: route === "/" || route === "/proprietati" ? "daily" as const : "weekly" as const,
    priority: route === "/" ? 1 : route === "/proprietati" ? 0.9 : 0.7,
  }))

  const zoneRoutes = zoneProfiles.map((zone) => ({
    url: `${base}/zone/${zone.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }))

  const propertyRoutes = (properties || []).filter((property) => property.slug).map((property) => ({
    url: `${base}/proprietate/${property.slug}`,
    lastModified: new Date(property.updated_at || property.published_at || property.created_at || now),
    changeFrequency: "daily" as const,
    priority: 0.85,
  }))

  return [...staticRoutes, ...zoneRoutes, ...propertyRoutes]
}
