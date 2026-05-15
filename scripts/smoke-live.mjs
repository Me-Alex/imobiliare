const baseUrl = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://hqsimobiliare.ro").replace(/\/$/, "")

const checks = [
  { path: "/", expected: "HQS Imobiliare" },
  { path: "/proprietati", expected: "Proprietati disponibile" },
  { path: "/sitemap.xml", expected: "<urlset" },
]

for (const check of checks) {
  const url = `${baseUrl}${check.path}`
  const response = await fetch(url, { redirect: "follow" })
  const body = await response.text()

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`)
  }

  if (!body.includes(check.expected)) {
    throw new Error(`${url} did not include expected marker: ${check.expected}`)
  }

  console.log(`ok ${response.status} ${url}`)
}
