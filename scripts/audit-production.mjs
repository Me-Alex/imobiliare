const baseUrl = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://hqsimobiliare.ro").replace(/\/$/, "")

const staticRoutes = [
  "/",
  "/proprietati",
  "/zone",
  "/zone/pipera",
  "/contact",
  "/despre",
  "/login",
  "/favorite",
  "/comparare",
  "/portal",
  "/owner",
  "/admin/login",
  "/sitemap.xml",
  "/api/health",
  "/api/search/suggestions?q=pi",
  "/api/calendar-slots",
]

async function read(path, init) {
  const url = `${baseUrl}${path}`
  const response = await fetch(url, { redirect: "follow", ...init })
  const text = await response.text()
  return {
    path,
    status: response.status,
    ok: response.ok,
    crash: /Application error|500 Internal|NEXT_PUBLIC_SUPABASE|Variabila de mediu/i.test(text),
    sample: text.slice(0, 160).replace(/\s+/g, " ").trim(),
  }
}

const results = []
for (const route of staticRoutes) {
  results.push(await read(route))
}

const searchResponse = await fetch(`${baseUrl}/api/properties/search?limit=1`)
const searchBody = await searchResponse.json().catch(() => null)
const firstSlug = searchBody?.properties?.[0]?.slug
if (firstSlug) {
  results.push(await read(`/proprietate/${firstSlug}`))
}

const failed = results.filter((item) => !item.ok || item.status >= 500 || item.crash)
for (const result of results) {
  console.log(`${result.ok && !result.crash ? "ok" : "fail"} ${result.status} ${baseUrl}${result.path}`)
}

if (failed.length) {
  console.error(JSON.stringify({ failed }, null, 2))
  process.exit(1)
}
