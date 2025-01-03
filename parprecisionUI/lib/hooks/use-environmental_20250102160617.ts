'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface EnvironmentalConditions {
  temperature: number
  humidity: number
  pressure: number
  altitude: number
  windSpeed: number
  windDirection: number
}

interface EnvironmentalStore {
  conditions: EnvironmentalConditions
  updateConditions: (newConditions: Partial<EnvironmentalConditions>) => void
  resetConditions: () => void
}

const DEFAULT_CONDITIONS: EnvironmentalConditions = {
  temperature: 70,
  humidity: 50,
  pressure: 29.92,
  altitude: 0,
  windSpeed: 0,
  windDirection: 0
}

export const useEnvironmental = create<EnvironmentalStore>()(
  persist(
    (set) => ({
      conditions: DEFAULT_CONDITIONS,
      updateConditions: (newConditions) =>
        set((state) => ({
          conditions: {
            ...state.conditions,
            ...newConditions
          }
        })),
      resetConditions: () =>
        set(() => ({
          conditions: DEFAULT_CONDITIONS
        }))
    }),
    {
      name: 'environmental-storage',
      partialize: (state) => ({ conditions: state.conditions })
    }
  )
)
