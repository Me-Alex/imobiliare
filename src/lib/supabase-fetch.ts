/** Bound authentication outages without imposing short deadlines on storage uploads. */
export async function supabaseFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
  if (!url.pathname.startsWith('/auth/v1/')) return fetch(input, init)

  const controller = new AbortController()
  const sourceSignal = init?.signal ?? (input instanceof Request ? input.signal : undefined)
  const abort = () => controller.abort(sourceSignal?.reason)
  if (sourceSignal?.aborted) abort()
  else sourceSignal?.addEventListener('abort', abort, { once: true })
  const timer = setTimeout(() => controller.abort(new DOMException('Authentication timed out', 'TimeoutError')), 15_000)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
    sourceSignal?.removeEventListener('abort', abort)
  }
}
