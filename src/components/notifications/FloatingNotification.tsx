"use client"

import { useState, useEffect } from 'react'
import { X, Check, Clock, BellRing } from 'lucide-react'
import { useNotifications, useMarkNotificationRead, useRemindNotification } from '@/lib/hooks'

export function FloatingNotification() {
  const { data: notifications } = useNotifications()
  const { mutate: markAsRead } = useMarkNotificationRead()
  const { mutate: remindNotification } = useRemindNotification()

  const [activeNotif, setActiveNotif] = useState<any>(null)
  const [isDismissedLocally, setIsDismissedLocally] = useState(false)
  const [isSnoozing, setIsSnoozing] = useState(false)

  useEffect(() => {
    if (!notifications) return

    // Find the first notification that is unread and either has no remind_at or remind_at is in the past
    const now = new Date()
    const active = notifications.find((n: any) => {
      if (n.is_read) return false
      if (!n.remind_at) return true
      return new Date(n.remind_at) <= now
    })

    if (active) {
      if (!activeNotif || activeNotif.id !== active.id) {
        setActiveNotif(active)
        setIsDismissedLocally(false)
      }
    } else {
      setActiveNotif(null)
    }
  }, [notifications, activeNotif])

  if (!activeNotif || isDismissedLocally) return null

  const handleClose = () => {
    setIsDismissedLocally(true)
  }

  const handleMarkAsRead = () => {
    markAsRead(activeNotif.id)
    setIsDismissedLocally(true)
  }

  const handleSnooze = (hours: number) => {
    const remindAt = new Date()
    remindAt.setHours(remindAt.getHours() + hours)
    remindNotification({ id: activeNotif.id, remindAt: remindAt.toISOString() })
    setIsDismissedLocally(true)
    setIsSnoozing(false)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-8 fade-in duration-300">
      <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] shadow-2xl rounded-xl p-4 w-80 relative overflow-hidden group">
        {/* Accent line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-brand-500"></div>
        
        <button onClick={handleClose} className="absolute top-3 right-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <X className="w-4 h-4" />
        </button>

        <div className="flex gap-3">
          <div className="shrink-0 mt-1">
            <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500">
              <BellRing className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1 pr-4">{activeNotif.title}</h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">{activeNotif.message}</p>
            
            {!isSnoozing ? (
              <div className="flex items-center gap-2">
                <button onClick={handleMarkAsRead} className="flex-1 bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium py-1.5 rounded-md transition-colors flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Mark as read
                </button>
                <button onClick={() => setIsSnoozing(true)} className="flex-1 bg-[var(--bg-tertiary)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-medium py-1.5 rounded-md transition-colors flex items-center justify-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Remind me
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => handleSnooze(12)} className="flex-1 bg-[var(--bg-tertiary)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-medium py-1.5 rounded-md transition-colors">
                  In 12 hours
                </button>
                <button onClick={() => handleSnooze(24)} className="flex-1 bg-[var(--bg-tertiary)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-medium py-1.5 rounded-md transition-colors">
                  Tomorrow
                </button>
                <button onClick={() => setIsSnoozing(false)} className="px-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
