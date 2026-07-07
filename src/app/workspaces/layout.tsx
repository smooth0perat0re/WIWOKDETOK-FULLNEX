"use client"

import { useAuthStore } from '@/store/auth'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import logo from '@/app/icon.jpg'
import { LogOut, Home, FolderKanban, Settings, Bell, ChevronLeft, Command, Search, Moon, Sun, Plus, ChevronDown, ChevronRight, BarChart2, Calendar, Timer, AlarmClock } from 'lucide-react'
import { FloatingNotification } from '@/components/notifications/FloatingNotification'
import { Header } from '@/components/layout/Header'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { useWorkspaces } from '@/lib/hooks'
import { CreateWorkspaceModal } from '@/components/workspaces/create-workspace-modal'
import { useUpdateProfile } from '@/lib/hooks'
import { Edit2 } from 'lucide-react'

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createModalIsPrivate, setCreateModalIsPrivate] = useState(false)
  
  // Section collapsible states
  const [isWorkspacesExpanded, setIsWorkspacesExpanded] = useState(true)
  const [isPersonalSpaceExpanded, setIsPersonalSpaceExpanded] = useState(true)
  const [isReportsExpanded, setIsReportsExpanded] = useState(true)
  const [isTimeManagementExpanded, setIsTimeManagementExpanded] = useState(true)
  
  const { data: workspaces, isLoading: isWorkspacesLoading } = useWorkspaces()
  const { mutate: updateProfile } = useUpdateProfile()

  const isWorkspacePrivate = (w: any) => w.is_private === true || w.is_private === 'true' || w.is_private === '1' || w.is_private === 1 || w.is_private === 't';
  const sharedWorkspaces = workspaces?.filter((w: any) => !isWorkspacePrivate(w)) || [];
  const personalWorkspaces = workspaces?.filter((w: any) => isWorkspacePrivate(w)) || [];

  const handleEditNotesIcon = () => {
    const newIcon = window.prompt('Enter an emoji for your Notes:', user?.personal_notes_icon || '📝');
    if (newIcon !== null) {
      updateProfile({ personal_notes_icon: newIcon });
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !user) {
      window.location.href = '/login'
    }
  }, [mounted, user])

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  if (mounted && !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-secondary)]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[var(--bg-secondary)] overflow-hidden">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 ease-in-out border-r border-[var(--border-subtle)] bg-[var(--bg-primary)] flex flex-col z-20`}>
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--border-subtle)]">
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
              <Image src={logo} alt="WIWOKDETOK" className="w-6 h-6 rounded shrink-0" />
              <span className="font-bold text-base tracking-tight text-[var(--text-primary)] truncate">
                WIWOKDETOK
              </span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded overflow-hidden shrink-0 mx-auto cursor-pointer" onClick={() => setCollapsed(false)}>
              <Image src={logo} alt="WIWOKDETOK" className="w-full h-full object-cover" />
            </div>
          )}
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} className="p-1 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          {!collapsed && (
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-muted)] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] hover:border-brand-500 hover:text-[var(--text-primary)] rounded-md transition-all w-full mb-4 shadow-sm">
              <Search className="w-4 h-4 shrink-0" />
              <span>Search</span>
            </button>
          )}

          <NavItem href="/workspaces" icon={<Home className="w-4 h-4" />} label="Home" collapsed={collapsed} />
          <NavItem href="/workspaces/inbox" icon={<Bell className="w-4 h-4" />} label="Inbox" collapsed={collapsed} />
          <NavItem href="/workspaces/calendar" icon={<Calendar className="w-4 h-4" />} label="Calendar" collapsed={collapsed} />

          {/* Time Management Section */}
          <div className="mt-4 mb-1 px-2 flex items-center justify-between group">
            {!collapsed && (
              <button 
                onClick={() => setIsTimeManagementExpanded(!isTimeManagementExpanded)}
                className="flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider hover:text-[var(--text-primary)] transition-colors"
              >
                {isTimeManagementExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                Time Management
              </button>
            )}
          </div>
          
          {isTimeManagementExpanded && (
            <>
              <NavItem 
                href="/workspaces/time-management/pomodoro" 
                icon={<Timer className="w-4 h-4" />} 
                label="Pomodoro Timer" 
                collapsed={collapsed} 
              />
              <NavItem 
                href="/workspaces/time-management/alarm" 
                icon={<AlarmClock className="w-4 h-4" />} 
                label="Alarm" 
                collapsed={collapsed} 
              />
            </>
          )}

          {/* Workspaces Section */}
          <div className="mt-4 mb-1 px-2 flex items-center justify-between group">
            {!collapsed && (
              <button 
                onClick={() => setIsWorkspacesExpanded(!isWorkspacesExpanded)}
                className="flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider hover:text-[var(--text-primary)] transition-colors"
              >
                {isWorkspacesExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                Workspaces
              </button>
            )}
            {!collapsed && (
              <button onClick={() => { setCreateModalIsPrivate(false); setIsCreateModalOpen(true); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-0.5 rounded-md hover:bg-[var(--bg-tertiary)] opacity-0 group-hover:opacity-100" aria-label="Add workspace">
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          {isWorkspacesExpanded && (
            <>
              {/* Dynamic Workspaces list */}
              {isWorkspacesLoading ? (
                <div className="px-3 py-2 text-xs text-[var(--text-muted)]">Loading workspaces...</div>
              ) : sharedWorkspaces.length > 0 ? (
                sharedWorkspaces.map((workspace: any) => (
                  <NavItem 
                    key={workspace.id} 
                    href={`/workspaces/${workspace.slug}`} 
                    icon={<div className="w-4 h-4 rounded bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center text-[10px] font-bold">{workspace.icon && workspace.icon !== '📁' ? workspace.icon : workspace.name.charAt(0).toUpperCase()}</div>} 
                    label={workspace.name} 
                    collapsed={collapsed} 
                  />
                ))
              ) : (
                 <div className="px-3 py-2 text-xs text-[var(--text-muted)]">No shared workspaces.</div>
              )}
            </>
          )}

          {/* Personal Space Section */}
          <div className="mt-4 mb-1 px-2 flex items-center justify-between group">
            {!collapsed && (
              <button 
                onClick={() => setIsPersonalSpaceExpanded(!isPersonalSpaceExpanded)}
                className="flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider hover:text-[var(--text-primary)] transition-colors"
              >
                {isPersonalSpaceExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                Personal Space
              </button>
            )}
            {!collapsed && (
              <button onClick={() => { setCreateModalIsPrivate(true); setIsCreateModalOpen(true); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-0.5 rounded-md hover:bg-[var(--bg-tertiary)] opacity-0 group-hover:opacity-100" aria-label="Add personal space">
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          {isPersonalSpaceExpanded && (
            <>
              {/* Personal Workspaces */}
              {personalWorkspaces.map((workspace: any) => (
                <NavItem 
                  key={workspace.id} 
                  href={`/workspaces/${workspace.slug}`} 
                  icon={<div className="w-4 h-4 flex items-center justify-center text-sm">{workspace.icon || '🚀'}</div>} 
                  label={workspace.name} 
                  collapsed={collapsed} 
                />
              ))}

              {/* Notes Item with Edit Hover */}
              <div className="relative group/note">
                <NavItem 
                  href="/workspaces/personal-notes" 
                  icon={<div className="w-4 h-4 flex items-center justify-center text-sm">{user?.personal_notes_icon || '📝'}</div>} 
                  label="Notes" 
                  collapsed={collapsed} 
                />
                {!collapsed && (
                  <button 
                    onClick={(e) => { e.preventDefault(); handleEditNotesIcon(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/note:opacity-100 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-all"
                    aria-label="Edit Notes Icon"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </>
          )}

          {/* Reports Section */}
          <div className="mt-4 mb-1 px-2 flex items-center justify-between group">
            {!collapsed && (
              <button 
                onClick={() => setIsReportsExpanded(!isReportsExpanded)}
                className="flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider hover:text-[var(--text-primary)] transition-colors"
              >
                {isReportsExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                Reports
              </button>
            )}
          </div>

          {isReportsExpanded && (
            <>
              <NavItem 
                href="#" 
                icon={<BarChart2 className="w-4 h-4" />} 
                label="Dashboard (Coming Soon)" 
                collapsed={collapsed} 
              />
            </>
          )}
        </div>

        {/* Footer Settings */}
        <div className="p-3 border-t border-[var(--border-subtle)] flex flex-col gap-1">
           <button onClick={toggleTheme} className="flex items-center gap-2 px-2 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] rounded-md transition-colors w-full justify-center md:justify-start">
             {mounted && theme === 'dark' ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
             {!collapsed && <span>{mounted && theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
           </button>
           <button className="flex items-center gap-2 px-2 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] rounded-md transition-colors w-full justify-center md:justify-start">
             <Settings className="w-4 h-4 shrink-0" />
             {!collapsed && <span>Settings</span>}
           </button>
           <button onClick={handleLogout} className="flex items-center gap-2 px-2 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors w-full justify-center md:justify-start">
             <LogOut className="w-4 h-4 shrink-0" />
             {!collapsed && <span>Log out</span>}
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[var(--bg-secondary)]">
        {/* Top Navbar */}
        <Header />

        {/* Scrollable Main View */}
        <div className="flex-1 overflow-auto relative">
          <div className="absolute inset-0 w-full px-6 pb-6 pt-6 md:px-10 md:pb-10 md:pt-6">
            <Breadcrumbs />
            {children}
          </div>
        </div>
      </main>
      <FloatingNotification />
      <CreateWorkspaceModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} initialIsPrivate={createModalIsPrivate} />
    </div>
  )
}

function NavItem({ href, icon, label, collapsed }: { href: string, icon: React.ReactNode, label: string, collapsed: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2 px-2 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] rounded-md transition-colors group">
      <div className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] shrink-0 flex justify-center w-5">
        {icon}
      </div>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  )
}
