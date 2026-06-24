"use client"

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Timer as TimerIcon, Settings, Volume2 } from 'lucide-react'
import { toast } from 'sonner'

type Mode = 'focus' | 'shortBreak' | 'longBreak'

const MODES = {
  focus: { label: 'Focus', minutes: 25, color: 'text-brand-500', bg: 'bg-brand-500' },
  shortBreak: { label: 'Short Break', minutes: 5, color: 'text-emerald-500', bg: 'bg-emerald-500' },
  longBreak: { label: 'Long Break', minutes: 15, color: 'text-blue-500', bg: 'bg-blue-500' },
}

const SOUNDS = [
  { name: 'Saya akan lawan!!!', url: '/sounds/pak-jokowi-lawan.mp3' },
  { name: 'Antek Ahseng', url: '/sounds/antek-aseng.mp3' },
  { name: 'Hidup Jokowin...', url: '/sounds/hidup-jokowi.mp3' },
  { name: 'Alarm digital biasa maintream', url: '/sounds/digital-alarm.mp3' },
]

export default function PomodoroPage() {
  const [mode, setMode] = useState<Mode>('focus')
  const [timeLeft, setTimeLeft] = useState(MODES.focus.minutes * 60)
  const [isActive, setIsActive] = useState(false)
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

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1)
      }, 1000)
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false)
      playAlarm()
      toast.success(`${MODES[mode].label} session completed!`)
    }

    return () => clearInterval(interval)
  }, [isActive, timeLeft, mode])

  // Change title to show time left
  useEffect(() => {
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    document.title = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} - Pomodoro`
    return () => { document.title = 'WIWOKDETOK' }
  }, [timeLeft])

  const toggleTimer = () => setIsActive(!isActive)

  const resetTimer = () => {
    setIsActive(false)
    setTimeLeft(MODES[mode].minutes * 60)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }

  const switchMode = (newMode: Mode) => {
    setMode(newMode)
    setIsActive(false)
    setTimeLeft(MODES[newMode].minutes * 60)
  }

  const playAlarm = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(e => console.log('Audio play failed:', e))
    }
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

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const progress = ((MODES[mode].minutes * 60 - timeLeft) / (MODES[mode].minutes * 60)) * 100

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500">
          <TimerIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Pomodoro Timer</h1>
          <p className="text-sm text-[var(--text-muted)]">Boost your productivity with timed work sessions.</p>
        </div>
      </div>

      <div className="bg-[var(--bg-primary)] rounded-3xl border border-[var(--border-subtle)] p-8 shadow-sm flex flex-col items-center">
        {/* Mode Selector */}
        <div className="flex items-center gap-2 p-1.5 bg-[var(--bg-tertiary)] rounded-full mb-12">
          {(Object.keys(MODES) as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                mode === m 
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {MODES[m].label}
            </button>
          ))}
        </div>

        {/* Circular Timer */}
        <div className="relative w-72 h-72 flex items-center justify-center mb-12">
          {/* Background Ring */}
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle
              cx="144"
              cy="144"
              r="136"
              className="stroke-[var(--bg-tertiary)]"
              strokeWidth="12"
              fill="transparent"
            />
            {/* Progress Ring */}
            <circle
              cx="144"
              cy="144"
              r="136"
              className={MODES[mode].color}
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 136}
              strokeDashoffset={2 * Math.PI * 136 * (1 - progress / 100)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          
          <div className="text-center z-10">
            <div className="text-7xl font-bold tracking-tighter text-[var(--text-primary)] tabular-nums">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="text-sm font-medium text-[var(--text-muted)] mt-2 uppercase tracking-widest">
              {isActive ? 'Running' : 'Paused'}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button 
            onClick={resetTimer}
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
          
          <button 
            onClick={toggleTimer}
            className={`w-20 h-20 rounded-3xl flex items-center justify-center text-white transition-all hover:scale-105 shadow-lg ${MODES[mode].bg}`}
          >
            {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
          </button>
          
          <div className="w-14 h-14" /> {/* Spacer to keep play button centered */}
        </div>
      </div>

      {/* Settings */}
      <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-subtle)] p-6 shadow-sm">
        <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2 text-sm">
          <Settings className="w-4 h-4 text-[var(--text-muted)]" />
          Sound Settings
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">Notification Sound</label>
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
