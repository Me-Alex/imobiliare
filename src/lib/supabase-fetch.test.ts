import { afterEach, describe, expect, it, vi } from 'vitest'
import { supabaseFetch } from './supabase-fetch'

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

describe('authentication request deadlines', () => {
  it('aborts an unresponsive auth server', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn((_input, init) => new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(init.signal.reason))
    })))
    const pending = expect(supabaseFetch('https://example.test/auth/v1/token')).rejects.toThrow('Authentication timed out')
    await vi.advanceTimersByTimeAsync(15_000)
    await pending
  })
  it('preserves caller cancellation', async () => {
    const caller = new AbortController()
    vi.stubGlobal('fetch', vi.fn((_input, init) => new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(init.signal.reason))
    })))
    const pending = expect(supabaseFetch('https://example.test/auth/v1/user', { signal: caller.signal })).rejects.toThrow('cancelled')
    caller.abort(new Error('cancelled'))
    await pending
  })
  it('leaves storage uploads and database requests on their original cancellation signal', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'))
    vi.stubGlobal('fetch', fetchMock)
    const options = { method: 'POST', signal: new AbortController().signal }
    await supabaseFetch('https://example.test/storage/v1/object/photos/image', options)
    expect(fetchMock).toHaveBeenCalledWith('https://example.test/storage/v1/object/photos/image', options)
  })
})
