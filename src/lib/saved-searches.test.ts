import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { describeSavedSearch, readSavedSearches, restoreDeletedSearches, savedSearchFilterError, updateSavedSearches } from './saved-searches'
import type { SavedSearch } from './types'

const search = (id: string): SavedSearch => ({ id, name: id, filters: {}, createdAt: '2026-09-10T00:00:00Z' })

describe('saved search criteria', () => {
  it('distinguishes one-sided budgets and preserves zero and versioned million limits', () => {
    expect(describeSavedSearch({ priceRange: [100, null] })).toContain('Buget: de la 100 €')
    expect(describeSavedSearch({ priceRange: [0, 100] })).toContain('Buget: până la 100 €')
    expect(describeSavedSearch({ priceRange: [0, 0], priceRangeVersion: 2 })).toContain('Buget: până la 0 €')
    expect(describeSavedSearch({ priceRange: [0, 1_000_000], priceRangeVersion: 2 })).toContain('Buget: până la 1.000.000 €')
    expect(describeSavedSearch({ priceRange: [0, 1_000_000] })).toEqual(['Ordine: Cele mai noi'])
  })
  it('describes criteria omitted by the old panel, including ordering', () => {
    expect(describeSavedSearch({ searchQuery: 'curte', minArea: '50', maxArea: '150', featuredOnly: true, virtualTourFilter: 'without', sort: 'priceAsc' })).toEqual([
      'Cuvinte: „curte”', 'Suprafață: 50–150 m²', 'Doar populare', 'Fără tur virtual', 'Ordine: Preț crescător',
    ])
  })
  it('prevents inverted or nonnumeric bounds while accepting zero and unlimited', () => {
    expect(savedSearchFilterError({ priceRange: [101, 100] })).toContain('bugetul')
    expect(savedSearchFilterError({ minArea: '101', maxArea: '100' })).toContain('suprafața')
    expect(savedSearchFilterError({ minArea: 'invalid' })).toContain('suprafața')
    expect(savedSearchFilterError({ priceRange: [0, 0], priceRangeVersion: 2 })).toBeNull()
    expect(savedSearchFilterError({ priceRange: [2_000_000, null] })).toBeNull()
  })
})

describe('saved search persistence and recovery', () => {
  let raw: string | null
  const notify = vi.fn()
  const write = vi.fn((_key: string, value: string) => { raw = value })
  beforeEach(() => {
    raw = null
    notify.mockClear()
    write.mockClear()
    vi.stubGlobal('window', { localStorage: { getItem: () => raw, setItem: write }, dispatchEvent: notify })
  })
  afterEach(() => vi.unstubAllGlobals())
  it('does not overwrite damaged or incompatible storage', () => {
    for (const value of ['{broken', '{}', '[null]', JSON.stringify([{ ...search('a'), filters: { searchQuery: 3 } }])]) {
      raw = value
      expect(() => updateSavedSearches(() => [search('new')])).toThrow()
      expect(raw).toBe(value)
    }
    expect(write).not.toHaveBeenCalled()
    expect(notify).not.toHaveBeenCalled()
  })
  it('reports storage failure without notifying a successful change', () => {
    raw = JSON.stringify([search('existing')])
    write.mockImplementationOnce(() => { throw new Error('Quota exceeded') })
    expect(() => updateSavedSearches(() => [])).toThrow('Quota exceeded')
    expect(readSavedSearches()).toEqual([search('existing')])
    expect(notify).not.toHaveBeenCalled()
  })
  it('mutates the latest list and undo retains subsequent additions and edits', () => {
    raw = JSON.stringify([search('a'), search('b')])
    updateSavedSearches(current => current.filter(item => item.id !== 'a'))
    // Another tab saves a search and restores/changes an existing identifier.
    raw = JSON.stringify([{ ...search('b'), name: 'edited elsewhere' }, search('c')])
    restoreDeletedSearches([search('a'), search('b')])
    expect(readSavedSearches()).toEqual([search('a'), { ...search('b'), name: 'edited elsewhere' }, search('c')])
    expect(notify).toHaveBeenCalledTimes(2)
  })
})
