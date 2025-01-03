'use client'

import { useState, useEffect } from 'react'

interface EnvironmentalConditions {
  temperature: number
  humidity: number
  pressure: number
  altitude: number
  windSpeed: number
  windDirection: number
}

const DEFAULT_CONDITIONS: EnvironmentalConditions = {
  temperature: 70,
  humidity: 50,
  pressure: 29.92,
  altitude: 0,
  windSpeed: 0,
  windDirection: 0
}

const STORAGE_KEY = 'environmental-conditions'

export function useEnvironmental() {
  const [conditions, setConditions] = useState<EnvironmentalConditions>(DEFAULT_CONDITIONS)

  // Load saved conditions from localStorage on mount
  useEffect(() => {
    try {
      const savedConditions = localStorage.getItem(STORAGE_KEY)
      if (savedConditions) {
        setConditions(JSON.parse(savedConditions))
      }
    } catch (error) {
      console.error('Error loading environmental conditions:', error)
    }
  }, [])

  // Save conditions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conditions))
    } catch (error) {
      console.error('Error saving environmental conditions:', error)
    }
  }, [conditions])

  const updateConditions = (newConditions: Partial<EnvironmentalConditions>) => {
    setConditions(current => ({
      ...current,
      ...newConditions
    }))
  }

  const resetConditions = () => {
    setConditions(DEFAULT_CONDITIONS)
  }

  return {
    conditions,
    updateConditions,
    resetConditions
  }
}
