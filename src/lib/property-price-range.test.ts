import { describe, expect, it } from 'vitest'
import { priceRangeQuery, restorePriceRange, type PropertyPriceRange } from './property-price-range'

describe('explicit property budgets', () => {
  it.each([0, 999_999, 1_000_000, 1_200_000])('preserves %i as a real upper bound through JSON storage and query construction', (max) => {
    const saved = JSON.parse(JSON.stringify({ priceRange: [0, max], priceRangeVersion: 2 }))
    const restored = restorePriceRange(saved.priceRange, saved.priceRangeVersion)
    expect(restored).toEqual([0, max])
    expect(priceRangeQuery(restored)).toEqual({ maxPrice: max })
  })
  it('keeps unlimited budgets unbounded, including a minimum above one million', () => {
    const range: PropertyPriceRange = JSON.parse(JSON.stringify([1_500_000, null]))
    expect(priceRangeQuery(restorePriceRange(range, 2))).toEqual({ minPrice: 1_500_000 })
    expect(priceRangeQuery(restorePriceRange())).toEqual({})
  })
  it('restores legacy saved searches with their original query behavior', () => {
    expect(priceRangeQuery(restorePriceRange([100, 999_999]))).toEqual({ minPrice: 100, maxPrice: 999_999 })
    expect(priceRangeQuery(restorePriceRange([100, 1_000_000]))).toEqual({ minPrice: 100 })
    expect(priceRangeQuery(restorePriceRange([0, 1_200_000]))).toEqual({})
  })
})
