import { create } from 'zustand'
import { createNavigationSlice, type NavigationSlice } from './slices/navigation'
import type { PageKey } from './slices/navigation'
import { createFavoritesSlice, type FavoritesSlice } from './slices/favorites'
import { createFiltersSlice, type FiltersSlice } from './slices/filters'
import { createUISlice, type UISlice } from './slices/ui'
import { createUserSlice, type UserSlice } from './slices/user'
import { createCoinsSlice, type CoinsSlice } from './slices/coins'

export type { PageKey }

type AppStore = NavigationSlice & FavoritesSlice & FiltersSlice & UISlice & UserSlice & CoinsSlice

export const useAppStore = create<AppStore>()((...args) => ({
  ...createNavigationSlice(...args),
  ...createFavoritesSlice(...args),
  ...createFiltersSlice(...args),
  ...createUISlice(...args),
  ...createUserSlice(...args),
  ...createCoinsSlice(...args),
}))