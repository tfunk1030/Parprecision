'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePremium } from '@/lib/premium-context'
import ShotVisualization from '@/components/shot-visualization'

export default function ShotVisualizationPage() {
  const { isPremium } = usePremium()
  const router = useRouter()

  useEffect(() => {
    if (!isPremium) {
      router.push('/')
    }
  }, [isPremium, router])

  if (!isPremium) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <ShotVisualization
        distance={220}
        windSpeed={12}
        windDirection={45}
      />
    </div>
  )
}
