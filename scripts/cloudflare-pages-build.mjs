import { cp, mkdir, rm, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { spawn } from "node:child_process"

const fallbackPublicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://spmapzhlcwhzfrxuvgxd.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_24oJXCI0JLY1VyLq_Ls-AA_-tYFf729",
  NEXT_PUBLIC_SITE_URL: "https://hqsimobiliare.ro",
  NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN: "https://hqsimobiliare.ro",
}

const childEnv = { ...process.env }
const injected = []

for (const [key, value] of Object.entries(fallbackPublicEnv)) {
  if (!childEnv[key]) {
    childEnv[key] = value
    injected.push(key)
  }
}

childEnv.NEXT_TELEMETRY_DISABLED ??= "1"
childEnv.VERCEL_TELEMETRY_DISABLED ??= "1"

if (injected.length) {
  console.warn(
    `[HQS] Cloudflare build is missing ${injected.join(", ")}. ` +
      "Using committed public production values so static prerender and client bundles stay functional.",
  )
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const executable = process.platform === "win32" && ["npm", "npx"].includes(command) ? "cmd.exe" : command
    const executableArgs =
      process.platform === "win32" && ["npm", "npx"].includes(command)
        ? ["/d", "/s", "/c", [command, ...args].join(" ")]
        : args

    const child = spawn(executable, executableArgs, {
      env: childEnv,
      stdio: "inherit",
    })

    child.on("error", reject)
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`)))
  })
}

async function preparePagesFallbackOutput() {
  const openNextDir = join(process.cwd(), ".open-next")
  const assetsDir = join(openNextDir, "assets")
  const pagesDir = join(process.cwd(), ".vercel", "output", "static")

  const workerEntrypoint = join(openNextDir, "worker.js")
  if (!existsSync(assetsDir)) throw new Error(`OpenNext assets not found at ${assetsDir}`)
  if (!existsSync(workerEntrypoint)) throw new Error(`OpenNext worker entrypoint not found at ${workerEntrypoint}`)

  // Ensure we don't keep old files around (which could push the bundle over Pages limits).
  await rm(pagesDir, { recursive: true, force: true })

  await mkdir(pagesDir, { recursive: true })
  await cp(assetsDir, pagesDir, { recursive: true, force: true })

  // Cloudflare Pages "advanced mode" expects a `_worker.js` entry in the output directory.
  // We keep all server-only modules inside `_worker.js/` so they don't get served as static assets.
  const pagesWorkerDir = join(pagesDir, "_worker.js")
  await mkdir(pagesWorkerDir, { recursive: true })

  await cp(workerEntrypoint, join(pagesWorkerDir, "index.js"), { force: true })

  const workerModuleDirs = [
    ".build",
    "cloudflare",
    "dynamodb-provider",
    "middleware",
    "server-functions",
  ]

  for (const dir of workerModuleDirs) {
    const src = join(openNextDir, dir)
    if (!existsSync(src)) continue
    await cp(src, join(pagesWorkerDir, dir), { recursive: true, force: true })
  }

  // Cloudflare Pages Functions have a strict uncompressed size limit (25 MiB). OpenNext's output contains
  // build-time-only artifacts that can be safely removed after bundling to keep the deployed bundle small.
  // This pruning is intentionally conservative: remove known-large dev/build-only files and cache seeds.
  await rm(join(pagesWorkerDir, "cache"), { recursive: true, force: true })
  await rm(join(pagesWorkerDir, "server-functions", "default", "handler.mjs.meta.json"), { force: true })
  await rm(
    join(
      pagesWorkerDir,
      "server-functions",
      "default",
      "node_modules",
      "next",
      "dist",
      "server",
      "capsize-font-metrics.json",
    ),
    { force: true },
  )
  await rm(
    join(
      pagesWorkerDir,
      "server-functions",
      "default",
      "node_modules",
      "next",
      "dist",
      "compiled",
      "@next",
      "font",
      "dist",
      "fontkit",
    ),
    { recursive: true, force: true },
  )
  await rm(
    join(
      pagesWorkerDir,
      "server-functions",
      "default",
      "node_modules",
      "next",
      "dist",
      "compiled",
      "@next",
      "font",
      "dist",
      "google",
      "font-data.json",
    ),
    { force: true },
  )
  await rm(
    join(pagesWorkerDir, "server-functions", "default", "node_modules", "next", "dist", "compiled", "next-devtools"),
    { recursive: true, force: true },
  )

  const routesPath = join(pagesDir, "_routes.json")
  const routes = {
    version: 1,
    include: ["/*"],
    exclude: ["/_next/static/*", "/favicon.svg", "/images/*"],
  }
  await mkdir(dirname(routesPath), { recursive: true })
  await writeFile(routesPath, `${JSON.stringify(routes, null, 2)}\n`)
  console.log(`Prepared Pages fallback assets at ${pagesDir}`)
}

try {
  await run("npm", ["run", "worker:build"])
  await preparePagesFallbackOutput()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
