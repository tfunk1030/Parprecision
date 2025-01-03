'use client'

import { useState, useEffect } from 'react'

interface EnvironmentalConditions {
  temperature: number
  humidity: number
  pressure: number
  altitude: number
  windSpeed: number
  windDirection: number
  density: number
}

// Constants for air density calculation
const R = 287.05 // Gas constant for dry air in J/(kg·K)
const Rv = 461.495 // Gas constant for water vapor in J/(kg·K)

function calculateAirDensity(tempF: number, pressureInHg: number, relativeHumidity: number): number {
  // Convert temperature to Kelvin
  const tempC = (tempF - 32) * 5/9
  const tempK = tempC + 273.15

  // Convert pressure to Pascals
  const pressurePa = pressureInHg * 3386.39

  // Calculate saturation vapor pressure using Magnus formula
  const satVaporPressure = 611.2 * Math.exp((17.62 * tempC) / (243.12 + tempC))
  
  // Calculate actual vapor pressure
  const vaporPressure = (relativeHumidity / 100) * satVaporPressure

  // Calculate dry air pressure (total pressure minus vapor pressure)
  const dryAirPressure = pressurePa - vaporPressure

  // Calculate density using the combined gas law
  const density = (dryAirPressure / (R * tempK)) + (vaporPressure / (Rv * tempK))

  return density
}

const DEFAULT_CONDITIONS: EnvironmentalConditions = {
  temperature: 70,
  humidity: 50,
  pressure: 29.92,
  altitude: 0,
  windSpeed: 0,
  windDirection: 0,
  density: calculateAirDensity(70, 29.92, 50)
}

const STORAGE_KEY = 'environmental-conditions'

export function useEnvironmental() {
  const [conditions, setConditions] = useState<EnvironmentalConditions>(DEFAULT_CONDITIONS)

  // Load saved conditions from localStorage on mount
  useEffect(() => {
    try {
      const savedConditions = localStorage.getItem(STORAGE_KEY)
      if (savedConditions) {
        const parsed = JSON.parse(savedConditions)
        // Recalculate density when loading from storage
        parsed.density = calculateAirDensity(parsed.temperature, parsed.pressure, parsed.humidity)
        setConditions(parsed)
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
    setConditions(current => {
      const updated = {
        ...current,
        ...newConditions
      }
      // Recalculate density whenever temperature, pressure, or humidity changes
      if (newConditions.temperature || newConditions.pressure || newConditions.humidity) {
        updated.density = calculateAirDensity(
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
