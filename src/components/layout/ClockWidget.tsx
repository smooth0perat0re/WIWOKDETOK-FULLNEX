"use client"

import { useState, useEffect, useRef } from 'react'
import { CalendarDays, Clock, MapPin } from 'lucide-react'

interface PrayerTimes {
  imsak: string
  subuh: string
  terbit: string
  dhuha: string
  dzuhur: string
  ashar: string
  maghrib: string
  isya: string
  tanggal: string
}

export function ClockWidget() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // Fetch prayer times for Batam (ID: 0506) when component mounts or dropdown opens
    const fetchPrayerTimes = async () => {
      setIsLoading(true)
      try {
        const date = new Date()
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        
        const response = await fetch(`https://api.myquran.com/v2/sholat/jadwal/0506/${year}/${month}/${day}`)
        const data = await response.json()
        
        if (data.status) {
          setPrayerTimes(data.data.jadwal)
        }
      } catch (error) {
        console.error("Failed to fetch prayer times:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen && !prayerTimes) {
      fetchPrayerTimes()
    }
  }, [isOpen, prayerTimes])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (!mounted) {
    return <div className="w-24 h-full border-l border-[var(--border-subtle)] bg-[var(--bg-primary)]"></div>
  }

  const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false }
  const timeString = currentTime.toLocaleTimeString('id-ID', timeOptions)
  
  // Custom date format for the widget DD/MM/YYYY
  const day = String(currentTime.getDate()).padStart(2, '0')
  const month = String(currentTime.getMonth() + 1).padStart(2, '0')
  const year = currentTime.getFullYear()
  const dateString = `${day}/${month}/${year}`

  return (
    <div className="relative h-full flex items-stretch border-l border-[var(--border-subtle)] bg-[var(--bg-primary)]" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 flex flex-col justify-center items-center hover:bg-[var(--bg-tertiary)] transition-colors min-w-[100px]"
      >
        <div className="text-base font-semibold text-brand-500 tracking-tight flex items-center gap-1">
          {timeString} <span className="text-xs font-normal">WIB</span>
        </div>
        <div className="text-[10px] text-[var(--text-muted)] tracking-wider">
          {dateString}
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-72 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl shadow-xl overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2">
          <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-tertiary)]">
            <h3 className="font-semibold text-sm text-[var(--text-primary)]">Jadwal Salat</h3>
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] mt-1">
              <MapPin className="w-3 h-3" />
              <span>Batam, Kepulauan Riau - {prayerTimes?.tanggal || dateString}</span>
            </div>
          </div>
          
          <div className="p-2">
            {isLoading ? (
              <div className="py-8 flex justify-center">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : prayerTimes ? (
              <div className="space-y-1">
                <PrayerRow name="Subuh" time={prayerTimes.subuh} isNext={isNextPrayer(timeString, prayerTimes.subuh, '00:00')} />
                <PrayerRow name="Terbit" time={prayerTimes.terbit} isNext={false} />
                <PrayerRow name="Dzuhur" time={prayerTimes.dzuhur} isNext={isNextPrayer(timeString, prayerTimes.dzuhur, prayerTimes.terbit)} />
                <PrayerRow name="Ashar" time={prayerTimes.ashar} isNext={isNextPrayer(timeString, prayerTimes.ashar, prayerTimes.dzuhur)} />
                <PrayerRow name="Maghrib" time={prayerTimes.maghrib} isNext={isNextPrayer(timeString, prayerTimes.maghrib, prayerTimes.ashar)} />
                <PrayerRow name="Isya" time={prayerTimes.isya} isNext={isNextPrayer(timeString, prayerTimes.isya, prayerTimes.maghrib)} />
              </div>
            ) : (
              <div className="text-xs text-[var(--text-muted)] text-center py-4">Gagal memuat jadwal salat</div>
            )}
          </div>
          <div className="px-4 py-2 bg-[var(--bg-tertiary)] border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] text-center">
            Sumber: Kemenag RI (MyQuran API)
          </div>
        </div>
      )}
    </div>
  )
}

function PrayerRow({ name, time, isNext }: { name: string, time: string, isNext: boolean }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${isNext ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}>
      <span>{name}</span>
      <span>{time}</span>
    </div>
  )
}

// Simple helper to roughly determine next prayer. 
// Requires proper date parsing for real accuracy, but simple string compare works for HH:mm
function isNextPrayer(currentTime: string, prayerTime: string, prevPrayerTime: string) {
  return currentTime >= prevPrayerTime && currentTime < prayerTime
}
