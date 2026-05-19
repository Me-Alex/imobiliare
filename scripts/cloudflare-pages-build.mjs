import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { spawn } from "node:child_process"
import { gzipSync } from "node:zlib"

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
  const workerBundleDir = join(process.cwd(), ".open-next-pages-worker")

  const workerEntrypoint = join(openNextDir, "worker.js")
  if (!existsSync(assetsDir)) throw new Error(`OpenNext assets not found at ${assetsDir}`)
  if (!existsSync(workerEntrypoint)) throw new Error(`OpenNext worker entrypoint not found at ${workerEntrypoint}`)

  // Ensure we don't keep old files around (which could push the bundle over Pages limits).
  await rm(pagesDir, { recursive: true, force: true })
  await rm(workerBundleDir, { recursive: true, force: true })

  await mkdir(pagesDir, { recursive: true })
  await cp(assetsDir, pagesDir, { recursive: true, force: true })

  // Pages advanced mode expects a single `_worker.js` file in the output directory.
  // Wrangler's bundler applies Cloudflare's Node compatibility transforms; raw esbuild leaves unsupported dynamic requires.
  const pagesWorkerFile = join(pagesDir, "_worker.js")
  await run("npx", [
    "--yes",
    "--package",
    "node@22.16.0",
    "node",
    "node_modules/wrangler/bin/wrangler.js",
    "deploy",
    "--dry-run",
    "--outdir",
    ".open-next-pages-worker",
  ])

  const bundledFiles = await readdir(workerBundleDir)
  const bundledWorker = bundledFiles.find((file) => file.endsWith(".js") && !file.endsWith(".js.map"))
  if (!bundledWorker) throw new Error(`Wrangler did not emit a Worker bundle in ${workerBundleDir}`)

  await cp(join(workerBundleDir, bundledWorker), pagesWorkerFile, { force: true })
  await rm(workerBundleDir, { recursive: true, force: true })

  const workerBytes = await readFile(pagesWorkerFile)
  const gzipBytes = gzipSync(workerBytes)
  console.log(
    `Prepared Pages worker at ${pagesWorkerFile} (${(workerBytes.length / 1024 / 1024).toFixed(2)} MiB raw, ${(gzipBytes.length / 1024 / 1024).toFixed(2)} MiB gzip)`,
  )

  if (gzipBytes.length > 3_000_000) {
    throw new Error(
      `Cloudflare Pages worker bundle is ${(gzipBytes.length / 1024 / 1024).toFixed(2)} MiB gzip, above the Workers Free 3 MB limit.`,
    )
  }

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
