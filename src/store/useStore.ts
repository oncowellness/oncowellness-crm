import { create } from 'zustand'
import type { View } from '../types'

interface UIState {
  view: View
  selectedPatientId: string | null
  setView: (view: View) => void
  selectPatient: (id: string | null) => void
}

export const useStore = create<UIState>((set) => ({
  view: 'dashboard',
  selectedPatientId: null,
  setView: (view) => set({ view }),
  selectPatient: (id) => set({ selectedPatientId: id }),
}))
