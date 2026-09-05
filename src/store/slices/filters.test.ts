import { describe, expect, it } from 'vitest'
import { createStore } from 'zustand/vanilla'
import { createFiltersSlice, type FiltersSlice } from './filters'

describe('clearing a property search', () => {
  it('clears every criterion while keeping the selected presentation', () => {
    const store = createStore<FiltersSlice>()(createFiltersSlice)
    store.setState({
      searchQuery: 'terasă', selectedZone: 'Pipera', selectedType: 'HOUSE',
      priceRange: [100, 200], rooms: 3, transaction: 'RENT', featuredOnly: true,
      sort: 'priceAsc', minArea: '80', maxArea: '120', virtualTourFilter: 'with',
      viewMode: 'list', mapViewMode: true,
    })
    store.getState().resetFilters()
    expect(store.getState()).toMatchObject({
      searchQuery: '', selectedZone: '', selectedType: '', priceRange: [0, 1000000],
      rooms: 0, transaction: '', featuredOnly: false, sort: '', minArea: '', maxArea: '',
      virtualTourFilter: 'all', viewMode: 'list', mapViewMode: true,
    })
  })
})
