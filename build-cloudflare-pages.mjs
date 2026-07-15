import { access, cp, mkdir, rename, rm } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(fileURLToPath(import.meta.url))
const apiDirectory = path.join(root, 'src', 'app', 'api')
const disabledApiDirectory = path.join(root, 'src', 'app', '_api_disabled')
const exportDirectory = path.join(root, 'out')
const nextBuildDirectory = path.join(root, '.next')
const pagesOutputDirectory = path.join(root, '.vercel', 'output', 'static')

async function exists(target) {
  try {
    await access(target)
    return true
  } catch {
    return false
  }
}

function runNextExport() {
  const nextBinary = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next')

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [nextBinary, 'build'], {
      cwd: root,
      env: { ...process.env, NEXT_PUBLIC_OUTPUT_EXPORT: '1' },
      stdio: 'inherit',
    })

    child.once('error', reject)
    child.once('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Next.js static export failed with exit code ${code ?? 'unknown'}.`))
    })
  })
}

let apiDirectoryMoved = false

try {
  if (await exists(disabledApiDirectory)) {
    if (await exists(apiDirectory)) {
      throw new Error('Both API directories exist; refusing to overwrite either one.')
    }

    await rename(disabledApiDirectory, apiDirectory)
  }

  await rename(apiDirectory, disabledApiDirectory)
  apiDirectoryMoved = true

  await rm(exportDirectory, { recursive: true, force: true })
  await rm(nextBuildDirectory, { recursive: true, force: true })
  await rm(pagesOutputDirectory, { recursive: true, force: true })
  await runNextExport()

  await mkdir(pagesOutputDirectory, { recursive: true })
  await cp(exportDirectory, pagesOutputDirectory, { recursive: true })
  console.log(`Cloudflare Pages output ready at ${path.relative(root, pagesOutputDirectory)}.`)
} finally {
  if (apiDirectoryMoved) {
    await rename(disabledApiDirectory, apiDirectory)
  }
}
