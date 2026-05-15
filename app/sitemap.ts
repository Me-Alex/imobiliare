export const runtime = "edge"

export default function sitemap() {
  const base = 'https://hqsimobiliare.ro'
  const routes = ['/', '/proprietati', '/despre', '/contact', '/comparare', '/favorite']
  return routes.map((route) => ({ url: `${base}${route}`, lastModified: new Date() }))
}
