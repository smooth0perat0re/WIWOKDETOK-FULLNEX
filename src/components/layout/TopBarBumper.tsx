"use client"

import { useEffect, useState } from 'react'
import { HOME_BUMPER_TEXT, RANDOM_BUMPER_TEXTS } from '@/lib/bumper-texts'

interface TopBarBumperProps {
  pathname: string | null
}

export function TopBarBumper({ pathname }: TopBarBumperProps) {
  const [mounted, setMounted] = useState(false)
  const [randomText, setRandomText] = useState('')

  useEffect(() => {
    setMounted(true)
    const randomIndex = Math.floor(Math.random() * RANDOM_BUMPER_TEXTS.length)
    setRandomText(RANDOM_BUMPER_TEXTS[randomIndex])
  }, [pathname]) // Re-roll random text when pathname changes

  if (!mounted) {
    return <div className="h-full w-full flex items-center px-4 overflow-hidden shrink-0 text-sm text-[var(--text-secondary)]"></div>
  }

  const isHome = !pathname || pathname === '/dashboard' || pathname === '/'

  return (
    <div className="h-full w-full flex items-center overflow-hidden shrink-0 px-4">
      <div className="w-full flex items-center h-full relative">
        <div key={pathname} className="relative inline-block">
          {/* Invisible text to set the fixed container width */}
          <div className="invisible whitespace-nowrap text-sm font-medium">
            {isHome ? HOME_BUMPER_TEXT : randomText}
          </div>
          {/* Visible typing text overlay */}
          <div className="typing-bumper absolute top-0 left-0 h-full text-sm text-[var(--text-primary)] font-medium whitespace-nowrap overflow-hidden">
            {isHome ? HOME_BUMPER_TEXT : randomText}
          </div>
        </div>
      </div>
    </div>
  )
}
