import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAllProperties } from './api'

afterEach(() => vi.unstubAllGlobals())

describe('the catalog map result set', () => {
  it('loads later pages, preserves filters, and deduplicates listings', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ properties: [{ id: 'first' }], hasMore: true }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ properties: [{ id: 'first' }, { id: 'last' }], hasMore: false }) })
    vi.stubGlobal('fetch', fetchMock)

    expect(await getAllProperties({ transaction: 'RENT', zone: 'Dorobanți', maxPrice: 1500 }))
      .toEqual([{ id: 'first' }, { id: 'last' }])
    expect(fetchMock).toHaveBeenCalledTimes(2)
    for (const [index, call] of fetchMock.mock.calls.entries()) {
      const params = new URL(String(call[0]), 'https://example.test').searchParams
      expect(params.get('transaction')).toBe('RENT')
      expect(params.get('zone')).toBe('Dorobanți')
      expect(params.get('maxPrice')).toBe('1500')
      expect(params.get('page')).toBe(String(index + 1))
    }
  })

  it('stops on an empty page even if hasMore is inconsistent', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ properties: [], hasMore: true }) })
    vi.stubGlobal('fetch', fetchMock)
    expect(await getAllProperties()).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('surfaces a later-page error instead of showing an incomplete map', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ properties: [{ id: 'first' }], hasMore: true }) })
      .mockResolvedValueOnce({ ok: false, status: 503 }))
    await expect(getAllProperties()).rejects.toThrow('API error: 503')
  })
})
