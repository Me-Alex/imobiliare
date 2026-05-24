// Custom Cloudflare Worker entrypoint.
// Reuses OpenNext's generated fetch handler and adds a scheduled handler for cron jobs.

// @ts-ignore `.open-next/worker.js` is generated at build time.
import handler from "./.open-next/worker.js"
import { processAdminQueues } from "./lib/admin-queue"

function setCloudflareRequestContext(env: Record<string, any>) {
  const contextKey = Symbol.for("__cloudflare-request-context__")
  ;(globalThis as typeof globalThis & Record<symbol, any>)[contextKey] = { env }
}

export default {
  async fetch(request: Request, env: Record<string, any>, ctx: any) {
    setCloudflareRequestContext(env)
    return handler.fetch(request, env, ctx)
  },
  async scheduled(_event: any, env: Record<string, any>, ctx: any) {
    setCloudflareRequestContext(env)
    ctx.waitUntil(
      processAdminQueues({ outboxLimit: 25, jobLimit: 25 }).catch((error) => {
        console.error("[HQS] scheduled queue processor failed", error)
      }),
    )
  },
} as any

// Re-export is only required when using DO Queue / DO Tag Cache in the adapter.
// @ts-ignore `.open-next/worker.js` is generated at build time.
export { DOQueueHandler, DOShardedTagCache } from "./.open-next/worker.js"
