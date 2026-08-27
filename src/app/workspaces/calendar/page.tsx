"use client"

import { useState, useEffect } from 'react'
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay
} from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info } from 'lucide-react'

// Nager.Date API types
interface PublicHoliday {
  date: string
  localName: string
  name: string
  countryCode: string
  fixed: boolean
  global: boolean
  counties: string[] | null
  launchYear: number | null
  types: string[]
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [holidays, setHolidays] = useState<PublicHoliday[]>([])
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Fetch holidays for the current year
  useEffect(() => {
    const fetchHolidays = async () => {
      setIsLoadingHolidays(true)
      try {
        const year = currentDate.getFullYear()
        // Diproxy lewat backend sendiri — src/app/api/calendar/holidays punya 2 source
        // (tabel internal EIS.LIBUR_NASIONAL / API publik Nager.Date), switchable di sana.
        const response = await fetch(`/api/calendar/holidays?year=${year}`)
        if (response.ok) {
          const data = await response.json()
          setHolidays(data)
        }
      } catch (error) {
        console.error('Failed to fetch holidays:', error)
      } finally {
        setIsLoadingHolidays(false)
      }
    }

    fetchHolidays()
  }, [currentDate.getFullYear()])

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const today = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  // Calendar logic
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const dateFormat = "MMMM yyyy"
  const days = eachDayOfInterval({ start: startDate, end: endDate })
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Helper to find holiday for a specific date
  const getHolidayForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd')
    return holidays.find(h => h.date === dateString)
  }

  const selectedHoliday = getHolidayForDate(selectedDate)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Calendar</h1>
            <p className="text-sm text-[var(--text-muted)]">Keep track of your schedule and public holidays.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[var(--bg-primary)] p-1 rounded-xl border border-[var(--border-subtle)]">
          <button onClick={prevMonth} className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors text-[var(--text-secondary)]">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={today} className="px-4 py-1.5 text-sm font-medium hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors text-[var(--text-primary)]">
            Today
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors text-[var(--text-secondary)]">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{format(currentDate, dateFormat)}</h2>
            {isLoadingHolidays && <span className="text-xs text-[var(--text-muted)] animate-pulse">Updating holidays...</span>}
          </div>
          
          <div className="grid grid-cols-7 border-b border-[var(--border-subtle)] bg-[var(--bg-tertiary)]">
            {weekDays.map(day => (
              <div key={day} className="py-3 text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 auto-rows-fr">
            {days.map((day, dayIdx) => {
              const holiday = getHolidayForDate(day)
              const isCurrentMonth = isSameMonth(day, monthStart)
              const isSelected = isSameDay(day, selectedDate)
              const isDayToday = isToday(day)

              return (
                <div 
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    min-h-[100px] p-2 border-b border-r border-[var(--border-subtle)] relative cursor-pointer transition-colors
                    ${!isCurrentMonth ? 'bg-[var(--bg-secondary)] opacity-50' : 'hover:bg-[var(--bg-tertiary)]'}
                    ${isSelected ? 'ring-2 ring-inset ring-brand-500 bg-brand-500/5' : ''}
                    ${(dayIdx + 1) % 7 === 0 ? 'border-r-0' : ''}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <span className={`
                      w-7 h-7 flex items-center justify-center text-sm rounded-full
                      ${isDayToday ? 'bg-brand-500 text-white font-bold' : 'text-[var(--text-primary)]'}
                      ${!isCurrentMonth && !isDayToday ? 'text-[var(--text-muted)]' : ''}
                    `}>
                      {format(day, 'd')}
                    </span>
                  </div>
                  
                  {holiday && (
                    <div className="mt-1 px-1.5 py-1 text-[10px] font-medium bg-red-500/10 text-red-500 dark:text-red-400 rounded-md truncate border border-red-500/20" title={holiday.localName}>
                      {holiday.localName}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-subtle)] p-5 shadow-sm">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-brand-500" />
              Selected Date
            </h3>
            <div className="text-3xl font-bold text-[var(--text-primary)] mb-1">
              {format(selectedDate, 'dd')}
            </div>
            <div className="text-sm font-medium text-[var(--text-secondary)] mb-6">
              {format(selectedDate, 'MMMM yyyy, EEEE')}
            </div>

            {selectedHoliday ? (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <div className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Public Holiday</div>
                <div className="text-sm font-medium text-[var(--text-primary)]">{selectedHoliday.localName}</div>
                {selectedHoliday.name !== selectedHoliday.localName && (
                  <div className="text-xs text-[var(--text-muted)] mt-1">{selectedHoliday.name}</div>
                )}
              </div>
            ) : (
              <div className="text-sm text-[var(--text-muted)] py-4 text-center border border-dashed border-[var(--border-subtle)] rounded-xl">
                No public holidays on this date.
              </div>
            )}
          </div>

          <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-subtle)] p-5 shadow-sm">
            <h3 className="font-semibold text-[var(--text-primary)] mb-3 text-sm">Upcoming Holidays</h3>
            <div className="space-y-3">
              {holidays
                .filter(h => new Date(h.date) >= new Date(new Date().setHours(0,0,0,0)))
                .slice(0, 3)
                .map(h => (
                  <div key={h.date} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] flex flex-col items-center justify-center shrink-0 border border-[var(--border-subtle)]">
                      <span className="text-xs font-medium text-[var(--text-muted)]">{format(new Date(h.date), 'MMM')}</span>
                      <span className="text-sm font-bold text-[var(--text-primary)]">{format(new Date(h.date), 'dd')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[var(--text-primary)] truncate">{h.localName}</div>
                      <div className="text-xs text-[var(--text-muted)]">{format(new Date(h.date), 'EEEE')}</div>
                    </div>
                  </div>
                ))}
              {holidays.length > 0 && holidays.filter(h => new Date(h.date) >= new Date()).length === 0 && (
                <div className="text-xs text-[var(--text-muted)]">No more holidays this year.</div>
              )}
              {isLoadingHolidays && <div className="text-xs text-[var(--text-muted)]">Loading...</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
