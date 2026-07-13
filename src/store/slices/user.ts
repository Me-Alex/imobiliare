import type { StateCreator } from 'zustand'

export interface UserSlice {
  userProperties: Array<Record<string, unknown>>
  setUserProperties: (props: Array<Record<string, unknown>>) => void
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