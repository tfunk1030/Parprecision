'use client'

import React, { createContext, useContext, useState } from 'react'

interface ShotCalcData {
  targetYardage: number | null
  adjustedDistance: number | null
  elevation: number | null
  temperature: number | null
  humidity: number | null
  pressure: number | null
}

interface ShotCalcContextType {
  shotCalcData: ShotCalcData | null;
  setShotCalcData: (data: ShotCalcData | null) => void;
}

const ShotCalcContext = createContext<ShotCalcContextType>({
  shotCalcData: null,
  setShotCalcData: (data: ShotCalcData | null) => {
    console.warn('ShotCalcContext provider is not initialized')
  }
})

export function ShotCalcProvider({ children }: { children: React.ReactNode }) {
  const [shotCalcData, setShotCalcData] = useState<ShotCalcData | null>(null)

  return (
    <ShotCalcContext.Provider value={{ shotCalcData, setShotCalcData }}>
      {children}
    </ShotCalcContext.Provider>
  )
}

export function useShotCalc() {
  const context = useContext(ShotCalcContext)
  if (!context) {
    throw new Error('useShotCalc must be used within a ShotCalcProvider')
  }
  return context
}
