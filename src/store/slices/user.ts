import type { StateCreator } from 'zustand'
import type { UserProperty } from '@/lib/types'

export interface UserSlice {
  userProperties: Array<UserProperty>
  setUserProperties: (props: Array<UserProperty>) => void
  vizionarePropertyId: string | null
  vizionarePropertyTitle: string | null
  setVizionareProperty: (id: string | null, title: string | null) => void
}

export const createUserSlice: StateCreator<UserSlice> = (set) => ({
  userProperties: [],
  setUserProperties: (props) => set({ userProperties: props }),
  vizionarePropertyId: null,
  vizionarePropertyTitle: null,
  setVizionareProperty: (id, title) => set({ vizionarePropertyId: id, vizionarePropertyTitle: title }),
})