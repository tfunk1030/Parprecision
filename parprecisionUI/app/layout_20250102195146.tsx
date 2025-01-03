'use client'

import React, { ReactNode } from 'react'
import './globals.css'
import Navigation from '@/components/navigation'
import { ThemeProvider } from '@/lib/theme-context'
import { WebGLProvider } from '@/lib/webgl-context'
import { PremiumProvider } from '@/lib/premium-context'
import { ClubSettingsProvider } from '@/lib/club-settings-context'
import { SettingsProvider } from '@/lib/settings-context'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { UpgradeModal } from '@/components/ui/upgrade-modal'
import { EnvironmentalService } from '@/lib/environmental-service'
import { ShotCalcProvider } from '@/lib/shot-calc-context'
import { WeatherProvider } from '@/context/WeatherContext'

const RootLayout = ({
  children,
}: {
  children: ReactNode
}) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-900 text-gray-100 transition-colors">
        <ThemeProvider>
          <WebGLProvider>
            <PremiumProvider>
              <SettingsProvider>
                <ClubSettingsProvider>
                  <ShotCalcProvider>
                    <WeatherProvider>
                      <main className="pb-20">
                        {children}
                      </main>
                      <Navigation />
                      <ThemeToggle />
                      <UpgradeModal />
                    </WeatherProvider>
                  </ShotCalcProvider>
                </ClubSettingsProvider>
              </SettingsProvider>
            </PremiumProvider>
          </WebGLProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

export default RootLayout
