/** null means no maximum; every finite amount, including one million, is a real limit. */
export type PropertyPriceRange = [number, number | null]

export function restorePriceRange(range?: PropertyPriceRange, version?: number): PropertyPriceRange {
  if (!range) return [0, null]
  const [min, max] = range
  // Old searches used all values >= one million as the unlimited sentinel.
  return [min, version === 2 || max === null || max < 1_000_000 ? max : null]
}

export function priceRangeQuery([min, max]: PropertyPriceRange): { minPrice?: number; maxPrice?: number } {
  return { ...(min > 0 ? { minPrice: min } : {}), ...(max !== null ? { maxPrice: max } : {}) }
}
