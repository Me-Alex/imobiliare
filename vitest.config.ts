import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': path.join(root, 'src'),
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // Unit tests for pure helpers don't need a DOM environment.
    environment: 'node',
    // Reasonable timeout for the network-free helpers we cover today.
    testTimeout: 10_000,
  },
  // The Next.js PostCSS config uses a Tailwind v4 plugin object form that
  // Vite (which Vitest sits on top of) cannot parse. The unit tests don't
  // touch CSS, so tell Vite to skip PostCSS entirely.
  css: {
    postcss: {
      plugins: [],
    },
  },
})
