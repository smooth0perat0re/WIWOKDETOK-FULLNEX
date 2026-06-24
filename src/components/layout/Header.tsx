"use client"

import { usePathname } from 'next/navigation'
import { TopBarBumper } from './TopBarBumper'
import { ClockWidget } from './ClockWidget'

export function Header() {
  const pathname = usePathname()

  return (
    <header className="flex w-full sticky top-0 z-50 shrink-0 bg-[var(--bg-tertiary)] border-b border-[var(--border-subtle)] h-14 items-stretch">
      <div className="flex-1 overflow-hidden">
        <TopBarBumper pathname={pathname} />
      </div>
      <div className="shrink-0 h-14 relative z-[9999]">
        <ClockWidget />
      </div>
    </header>
  )
}
