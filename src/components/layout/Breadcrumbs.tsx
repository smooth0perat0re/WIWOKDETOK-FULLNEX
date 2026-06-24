"use client"

import { usePathname, useParams } from 'next/navigation'
import Link from 'next/link'
import { Home, Bell, Settings, ChevronRight } from 'lucide-react'
import { useWorkspaces, useProjects } from '@/lib/hooks'

export function Breadcrumbs() {
  const pathname = usePathname()
  const params = useParams()

  const workspaceSlug = params?.workspaceSlug as string | undefined
  const projectId = params?.projectId as string | undefined

  const { data: workspaces } = useWorkspaces()
  const { data: projects } = useProjects(workspaceSlug || '')

  const currentWorkspace = workspaces?.find((w: any) => w.slug === workspaceSlug)
  const currentProject = projects?.find((p: any) => p.id.toString() === projectId)

  if (!pathname || pathname === '/workspaces') {
    return (
      <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] mb-6 opacity-70">
        <Home className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        <span className="text-[var(--text-primary)] font-medium">HOME & DASHBOARD</span>
      </div>
    )
  }

  if (pathname === '/workspaces/inbox') {
    return (
      <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] mb-6 opacity-70">
        <Bell className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        <span className="text-[var(--text-primary)] font-medium">INBOX</span>
      </div>
    )
  }

  if (pathname === '/workspaces/settings') {
    return (
      <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] mb-6 opacity-70">
        <Settings className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        <span className="text-[var(--text-primary)] font-medium">SETTINGS</span>
      </div>
    )
  }

  const breadcrumbs = []
  
  breadcrumbs.push({
    icon: <Home className="w-3.5 h-3.5" />,
    label: 'DASHBOARD',
    href: '/workspaces'
  })

  if (workspaceSlug) {
    breadcrumbs.push({
      label: 'WORKSPACES',
      href: '/workspaces',
      isStatic: true
    })
    
    breadcrumbs.push({
      label: `Overview: ${currentWorkspace?.name || workspaceSlug}`,
      href: `/workspaces/${workspaceSlug}`
    })
  }

  if (pathname?.includes('/projects')) {
    breadcrumbs.push({
      label: 'Projects',
      href: `/workspaces/${workspaceSlug}/projects`
    })

    if (projectId) {
      breadcrumbs.push({
        label: `Project Board - ${currentProject?.name || projectId}`,
        href: `/workspaces/${workspaceSlug}/projects/${projectId}`
      })
    }
  }

  return (
    <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] mb-6 opacity-70">
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1
        
        return (
          <div key={index} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
            {crumb.isStatic ? (
              <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                {crumb.icon}
                {crumb.label}
              </span>
            ) : (
              <Link 
                href={crumb.href}
                className={`flex items-center gap-1.5 transition-colors ${
                  isLast 
                    ? 'text-[var(--text-primary)] font-medium' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {crumb.icon}
                {crumb.label}
              </Link>
            )}
          </div>
        )
      })}
    </div>
  )
}
