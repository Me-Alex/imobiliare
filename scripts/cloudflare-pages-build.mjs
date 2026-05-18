import { cp, mkdir, writeFile } from "node:fs/promises"
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
  const assetsDir = join(process.cwd(), ".open-next", "assets")
  const pagesDir = join(process.cwd(), ".vercel", "output", "static")
  if (!existsSync(assetsDir)) throw new Error(`OpenNext assets not found at ${assetsDir}`)

  await mkdir(pagesDir, { recursive: true })
  await cp(assetsDir, pagesDir, { recursive: true, force: true })

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
