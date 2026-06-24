"use client"

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useWeeklyDashboardReport, useProjectWeeklyReport } from '@/lib/hooks'

export function WeeklyActivityChart({ 
  type = 'dashboard', 
  workspaceId, 
  projectId,
  className = "",
  hideTitle = false
}: { 
  type?: 'dashboard' | 'project', 
  workspaceId?: string, 
  projectId?: string,
  className?: string,
  hideTitle?: boolean
}) {
  const [weekOffset, setWeekOffset] = useState(0)

  // Calculate start and end dates based on weekOffset
  const today = new Date()
  const dayOfWeek = today.getDay() || 7 // Make Sunday = 7
  
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - dayOfWeek + 1 + (weekOffset * 7))
  
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)

  const startDateStr = startOfWeek.toISOString().split('T')[0]
  const endDateStr = endOfWeek.toISOString().split('T')[0]

  const dashboardQuery = useWeeklyDashboardReport(startDateStr, endDateStr)
  const projectQuery = useProjectWeeklyReport(workspaceId || '', projectId || '', startDateStr, endDateStr)

  const { data: reportData, isLoading } = type === 'dashboard' ? dashboardQuery : projectQuery
  const tasks = reportData || []

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Heading outside the box */}
      {!hideTitle && (
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">What has been done...?</h2>
        </div>
      )}

      {/* Box */}
      <div className="flex-1 relative overflow-hidden bg-[var(--bg-primary)] rounded-xl p-6 border border-[var(--border-subtle)] shadow-sm animate-in fade-in zoom-in-95 duration-500 flex flex-col">
        {!className && <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent pointer-events-none"></div>}
        
        {/* Top row inside the box: counter and filter */}
        <div className="relative z-10 flex items-center justify-between mb-6">
          <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)] font-semibold shadow-sm shrink-0">
            {isLoading ? '...' : tasks.length}
          </div>
          
          <div className="relative shrink-0">
            <select 
              value={weekOffset}
              onChange={(e) => setWeekOffset(Number(e.target.value))}
              className="appearance-none bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] hover:border-[var(--text-muted)] text-[var(--text-primary)] text-xs font-medium rounded-full py-1.5 pl-3 pr-8 focus:outline-none transition-colors cursor-pointer shadow-sm"
            >
              <option value={0}>This week</option>
              <option value={-1}>Last week</option>
              <option value={-2}>2 weeks ago</option>
              <option value={-3}>3 weeks ago</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-2">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-[var(--bg-tertiary)] rounded w-3/4"></div>
              <div className="h-4 bg-[var(--bg-tertiary)] rounded w-1/2"></div>
              <div className="h-4 bg-[var(--bg-tertiary)] rounded w-5/6"></div>
            </div>
          ) : tasks.length > 0 ? (
            <ul className="space-y-3">
              {tasks.map((task: any, index: number) => {
                const date = new Date(task.completed_at.replace(' ', 'T'))
                const formattedDate = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                return (
                  <li key={task.id} className="text-sm text-[var(--text-primary)] font-medium tracking-wide bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-subtle)] shadow-sm transition-colors">
                    <div className="flex items-start gap-2">
                      <span className="text-[var(--text-muted)] mt-0.5 text-xs">{index + 1}.</span>
                      <div className="flex flex-col">
                        <span>{task.title}</span>
                        <span className="text-[var(--text-muted)] font-normal text-xs mt-1">{formattedDate}</span>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="text-sm text-[var(--text-muted)] mt-2">No tasks completed this week.</div>
          )}
        </div>
      </div>
    </div>
  )
}
