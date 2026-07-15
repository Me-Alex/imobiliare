import { access, cp, mkdir, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(fileURLToPath(import.meta.url))
const redirectDirectory = path.join(root, 'legacy-pages-redirect')
const pagesOutputDirectory = path.join(root, '.vercel', 'output', 'static')

async function assertExists(target) {
  try {
    await access(target)
  } catch {
    throw new Error(`Required Cloudflare Pages file is missing: ${path.relative(root, target)}`)
  }
}

await assertExists(path.join(redirectDirectory, 'index.html'))
await assertExists(path.join(redirectDirectory, '_headers'))
await rm(pagesOutputDirectory, { recursive: true, force: true })
await mkdir(pagesOutputDirectory, { recursive: true })
await cp(redirectDirectory, pagesOutputDirectory, { recursive: true })

console.log(`Cloudflare Pages redirect ready at ${path.relative(root, pagesOutputDirectory)}.`)
