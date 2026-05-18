import { spawn } from "node:child_process"

const fallbackPublicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "cloudflare-pages-build-placeholder",
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
    `[HQS] Cloudflare Pages build is missing ${injected.join(", ")}. ` +
      "Using public build placeholders so static prerender can complete. " +
      "Configure the real values in Cloudflare Pages for live Supabase features.",
  )
}

function commandName(command) {
  if (process.platform === "win32" && ["npm", "npx"].includes(command)) {
    return `${command}.cmd`
  }

  return command
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(commandName(command), args, {
      env: childEnv,
      shell: process.platform === "win32",
      stdio: "inherit",
    })

    child.on("error", reject)
    child.on("close", (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`))
    })
  })
}

try {
  await run("npx", ["@cloudflare/next-on-pages@1"])
  await run("node", ["scripts/patch-cloudflare-routes.mjs"])
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
