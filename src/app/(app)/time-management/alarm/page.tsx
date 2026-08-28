"use client"

import { useState, useEffect, useRef } from 'react'
import { AlarmClock, Plus, Trash2, Power, PowerOff, BellRing, Settings, Volume2 } from 'lucide-react'
import { toast } from 'sonner'

interface AlarmItem {
  id: string
  time: string // format "HH:MM"
  label: string
  isActive: boolean
  hasRung: boolean // prevent ringing multiple times in the same minute
}

const SOUNDS = [
  { name: 'Saya akan lawan!!!', url: '/sounds/pak-jokowi-lawan.mp3' },
  { name: 'Antek Ahseng', url: '/sounds/antek-aseng.mp3' },
  { name: 'Hidup Jokowin...', url: '/sounds/hidup-jokowi.mp3' },
  { name: 'Alarm digital biasa maintream', url: '/sounds/digital-alarm.mp3' },
]

export default function AlarmPage() {
  const [alarms, setAlarms] = useState<AlarmItem[]>([])
  const [newTime, setNewTime] = useState('08:00')
  const [newLabel, setNewLabel] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedSound, setSelectedSound] = useState(SOUNDS[0].url)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }
  }, [])

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('wiwokdetok_alarms')
    if (saved) {
      try {
        setAlarms(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse alarms')
      }
    }
    
    const savedSound = localStorage.getItem('wiwokdetok_alarm_sound')
    if (savedSound) setSelectedSound(savedSound)
  }, [])

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem('wiwokdetok_alarms', JSON.stringify(alarms))
  }, [alarms])

  // Save sound setting
  useEffect(() => {
    localStorage.setItem('wiwokdetok_alarm_sound', selectedSound)
  }, [selectedSound])

  // Clock tick & Alarm checker
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now)
      
      const currentHHMM = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      
      setAlarms(prev => {
        let changed = false
        const updated = prev.map(alarm => {
          if (alarm.isActive && !alarm.hasRung && alarm.time === currentHHMM) {
            // Ring the alarm!
            ringAlarm(alarm)
            changed = true
            return { ...alarm, hasRung: true, isActive: false } // Auto turn off after ring
          }
          
          // Reset hasRung if time has passed
          if (alarm.hasRung && alarm.time !== currentHHMM) {
            changed = true
            return { ...alarm, hasRung: false }
          }
          
          return alarm
        })
        return changed ? updated : prev
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [alarms])

  const ringAlarm = (alarm: AlarmItem) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(e => console.log('Audio play failed:', e))
    }
    toast.success(`ALARM: ${alarm.label || 'Wake up!'}`, {
      duration: 10000,
      icon: <BellRing className="w-5 h-5 text-brand-500 animate-bounce" />,
    })
  }

  const testSound = (url: string) => {
    setSelectedSound(url)
    // If the main audio is playing, stop it
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    const audio = new Audio(url)
    audio.play().catch(e => console.log('Audio test failed:', e))
  }

  const addAlarm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTime) return
    
    const alarm: AlarmItem = {
      id: Date.now().toString(),
      time: newTime,
      label: newLabel.trim() || 'Alarm',
      isActive: true,
      hasRung: false
    }
    
    setAlarms([...alarms, alarm].sort((a, b) => a.time.localeCompare(b.time)))
    setNewLabel('')
  }

  const toggleAlarm = (id: string) => {
    setAlarms(alarms.map(a => a.id === id ? { ...a, isActive: !a.isActive, hasRung: false } : a))
  }

  const deleteAlarm = (id: string) => {
    setAlarms(alarms.filter(a => a.id !== id))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500">
          <AlarmClock className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Alarms</h1>
          <p className="text-sm text-[var(--text-muted)]">Set alarms and reminders straight from your workspace.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Time Widget */}
        <div className="bg-[var(--bg-primary)] rounded-3xl border border-[var(--border-subtle)] p-8 shadow-sm flex flex-col items-center justify-center h-48 md:col-span-1">
          <div className="text-4xl font-bold tracking-tighter text-[var(--text-primary)] tabular-nums mb-2">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
        </div>

        {/* Add Alarm Form */}
        <div className="bg-[var(--bg-primary)] rounded-3xl border border-[var(--border-subtle)] p-6 shadow-sm md:col-span-2">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4 text-sm">Create New Alarm</h3>
          <form onSubmit={addAlarm} className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-1 w-full space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-muted)]">Time</label>
              <input 
                type="time" 
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-[var(--text-primary)]"
              />
            </div>
            <div className="flex-[2] w-full space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-muted)]">Label (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. Daily Standup"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-[var(--text-primary)]"
              />
            </div>
            <button 
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </form>
        </div>
      </div>

      {/* Alarm List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-[var(--text-primary)] text-sm mb-4 px-1">Your Alarms</h3>
        
        {alarms.length === 0 ? (
          <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-subtle)] p-10 text-center shadow-sm">
            <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--text-muted)]">
              <AlarmClock className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-[var(--text-primary)] font-medium">No alarms set</p>
            <p className="text-[var(--text-muted)] text-sm mt-1">Create an alarm using the form above.</p>
          </div>
        ) : (
          alarms.map(alarm => (
            <div 
              key={alarm.id} 
              className={`bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-subtle)] p-5 flex items-center justify-between transition-all ${!alarm.isActive ? 'opacity-60' : 'shadow-sm hover:border-brand-500'}`}
            >
              <div className="flex flex-col">
                <span className={`text-3xl font-bold tracking-tight tabular-nums ${alarm.isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                  {alarm.time}
                </span>
                <span className="text-sm font-medium text-[var(--text-secondary)] mt-1">
                  {alarm.label}
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => toggleAlarm(alarm.id)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    alarm.isActive 
                      ? 'bg-brand-500/10 text-brand-500 hover:bg-brand-500/20' 
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]'
                  }`}
                  title={alarm.isActive ? "Turn Off" : "Turn On"}
                >
                  {alarm.isActive ? <Power className="w-5 h-5" /> : <PowerOff className="w-5 h-5" />}
                </button>
                
                <button 
                  onClick={() => deleteAlarm(alarm.id)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Settings */}
      <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-subtle)] p-6 shadow-sm mt-8">
        <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2 text-sm">
          <Settings className="w-4 h-4 text-[var(--text-muted)]" />
          Alarm Sound Settings
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap gap-3">
              {SOUNDS.map((sound) => (
                <button
                  key={sound.name}
                  onClick={() => testSound(sound.url)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                    selectedSound === sound.url 
                      ? 'border-brand-500 bg-brand-500/10 text-brand-500' 
                      : 'border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                  {sound.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <audio ref={audioRef} src={selectedSound} preload="auto" />
    </div>
  )
}
