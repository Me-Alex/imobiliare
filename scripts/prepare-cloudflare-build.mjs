import { readdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

const appDir = join(process.cwd(), "app")
const runtimeLine = /^export const runtime = ['"]edge['"]\r?\n/gm

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      await walk(path)
      continue
    }

    if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) continue

    const source = await readFile(path, "utf8")
    const nextSource = source.replace(runtimeLine, "")
    if (nextSource !== source) {
      await writeFile(path, nextSource)
    }
  }
}

await walk(appDir)
