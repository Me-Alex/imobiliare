import { mkdir, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"

const routesPath = join(process.cwd(), ".vercel", "output", "static", "_routes.json")
const routes = {
  version: 1,
  include: ["/*"],
  exclude: ["/_next/static/*", "/favicon.svg"],
}

await mkdir(dirname(routesPath), { recursive: true })
await writeFile(routesPath, `${JSON.stringify(routes, null, 2)}\n`)
console.log(`Patched Cloudflare Pages routes at ${routesPath}`)
