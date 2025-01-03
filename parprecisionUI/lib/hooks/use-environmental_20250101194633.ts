'use client'

import { useState, useEffect } from 'react'
import { environmentalService } from '../environmental-service'
import { EnvironmentalConditions } from '../environmental-calculations'

interface Adjustments {
  distanceAdjustment: number
  trajectoryShift: number
  spinAdjustment: number
  launchAngleAdjustment: number
}

export function useEnvironmental(shotDirection: number = 0) {
  const [conditions, setConditions] = useState<EnvironmentalConditions | null>(null)
  const [adjustments, setAdjustments] = useState<Adjustments | null>(null)

  useEffect(() => {
    const unsubscribe = environmentalService.subscribe((newConditions) => {
      setConditions(newConditions)
    })

    environmentalService.startMonitoring()

    return () => {
      unsubscribe()
      environmentalService.stopMonitoring()
    }
  }, [])

  useEffect(() => {
    if (conditions) {
      const windEffect = environmentalService.calculateWindEffect(shotDirection)
      const altitudeEffect = environmentalService.calculateAltitudeEffect(conditions.altitude)

      setAdjustments({
        distanceAdjustment: altitudeEffect + (windEffect.headwind * -1.5),
        trajectoryShift: windEffect.crosswind * 2,
        spinAdjustment: 0,
        launchAngleAdjustment: 0
      })
    }
  }, [conditions, shotDirection])

  return {
    conditions,
    adjustments,
    isLoading: !conditions
  }
}
