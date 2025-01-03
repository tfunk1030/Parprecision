'use client'

import { useEffect, useState } from 'react'
import { useEnvironmental } from '@/lib/hooks/use-environmental'
import WindDirectionCompass from './wind-direction-compass'

interface WindCalcResult {
  distanceEffect: number
  lateralEffect: number
  totalEffect: number
}

export function WindCalculator() {
  const { conditions, updateConditions } = useEnvironmental()
  const [result, setResult] = useState<WindCalcResult | null>(null)

  useEffect(() => {
    if (!conditions) return

    try {
      const calculateWindEffect = () => {
        const { windSpeed, windDirection } = conditions
        
        // Convert angles to radians
        const windRad = (windDirection * Math.PI) / 180
        const shotRad = (0 * Math.PI) / 180 // Shot direction fixed at 0 (North)
        
        // Calculate relative angle between wind and shot
        const relativeAngle = windRad - shotRad
        
        // Calculate headwind/tailwind component
        const headwindComponent = Math.cos(relativeAngle) * windSpeed
        
        // Calculate crosswind component
        const crosswindComponent = Math.sin(relativeAngle) * windSpeed
        
        // Calculate effects (these multipliers can be tuned)
        const distanceEffect = -headwindComponent * 2.5 // Negative because headwind reduces distance
        const lateralEffect = crosswindComponent * 2.0
        
        setResult({
          distanceEffect: Math.round(distanceEffect),
          lateralEffect: Math.round(lateralEffect),
          totalEffect: Math.round(Math.sqrt(distanceEffect ** 2 + lateralEffect ** 2))
        })
      }

      calculateWindEffect()
    } catch (error) {
      console.error('Error calculating wind effect:', error)
      setResult(null)
    }
  }, [conditions])

  const handleDirectionChange = (_type: 'wind' | 'shot', degrees: number) => {
    try {
      if (conditions) {
        updateConditions({ windDirection: Math.round(degrees) })
      }
    } catch (error) {
      console.error('Error updating wind direction:', error)
    }
  }

  const handleSpeedChange = (speed: number) => {
    try {
      if (conditions) {
        updateConditions({ windSpeed: Math.round(speed) })
      }
    } catch (error) {
      console.error('Error updating wind speed:', error)
    }
  }

  if (!conditions) {
    return null
  }

  return (
    <div className="space-y-6 bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700/50">
      <div className="flex flex-col items-center">
        <div className="text-sm font-medium text-gray-400 mb-2 bg-gray-900/50 px-4 py-2 rounded-full">
          <span>
            <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1 shadow-lg shadow-blue-500/50"></span>
            Wind: {Math.round(conditions.windDirection)}°
          </span>
        </div>
        
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-2xl"></div>
          <WindDirectionCompass
            windDirection={Math.round(conditions.windDirection)}
            shotDirection={0}
            onChange={handleDirectionChange}
            size={280}
            lockShot={true}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Wind Speed (mph)
        </label>
        <input
          type="number"
          value={Math.round(conditions.windSpeed)}
          onChange={(e) => handleSpeedChange(parseFloat(e.target.value) || 0)}
          className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white"
          min="0"
          step="1"
        />
      </div>

      {result && (
        <div className="space-y-4 bg-gray-900/30 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-emerald-400">Wind Effect</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-gray-400">Distance Effect</label>
              <div className="text-lg font-medium">
                {result.distanceEffect > 0 ? '+' : ''}{result.distanceEffect} yards
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm text-gray-400">Lateral Effect</label>
              <div className="text-lg font-medium">
                {result.lateralEffect > 0 ? 'Right ' : 'Left '}
                {Math.abs(result.lateralEffect)} yards
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-700">
            <div className="text-sm text-gray-400">Total Effect</div>
            <div className="text-xl font-semibold text-emerald-400">
              {result.totalEffect} yards
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 