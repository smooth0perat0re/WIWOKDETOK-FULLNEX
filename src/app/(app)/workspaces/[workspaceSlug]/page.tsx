"use client"

import { use, useState } from 'react'
import { UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useWorkspaces, useWorkspaceStats, useWorkspaceActivities, useWorkspaceActiveTasks } from '@/lib/hooks'
import { InviteMemberModal } from '@/components/workspaces/invite-member-modal'
import { Modal } from '@/components/ui/modal'
import { LoadingSection } from '@/components/ui/loading-section'
import { ErrorSection } from '@/components/ui/error-section'

export default function WorkspaceOverviewPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>
}) {
  const resolvedParams = use(params)
  const { data: workspaces } = useWorkspaces()
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  
  const currentWorkspace = workspaces?.find((w: any) => w.slug === resolvedParams.workspaceSlug)
  const { data: stats, isLoading: isLoadingStats, isError: isErrorStats, refetch: refetchStats } = useWorkspaceStats(currentWorkspace?.id?.toString() || '')
  const { data: activities, isLoading: isLoadingActivities, isError: isErrorActivities, refetch: refetchActivities } = useWorkspaceActivities(currentWorkspace?.id?.toString() || '')
  const { data: activeTasks, isLoading: isLoadingTasks, isError: isErrorTasks, refetch: refetchTasks } = useWorkspaceActiveTasks(currentWorkspace?.id?.toString() || '')
  const [isActiveTasksModalOpen, setIsActiveTasksModalOpen] = useState(false)

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Overview: {currentWorkspace?.name || resolvedParams.workspaceSlug}
        </h1>
        {currentWorkspace && (
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href={`/workspaces/${resolvedParams.workspaceSlug}/projects`} className="bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--border-subtle)] shadow-sm hover:border-brand-500 transition-colors group cursor-pointer flex flex-col justify-between min-h-[120px]">
          <h3 className="text-sm font-medium text-[var(--text-muted)] group-hover:text-brand-500 transition-colors uppercase tracking-wider">Total Projects</h3>
          {isLoadingStats ? (
            <LoadingSection text="loading..." className="p-0 mt-4 items-start" />
          ) : isErrorStats ? (
            <ErrorSection message="Failed to load" onRetry={refetchStats} className="p-0 mt-4 items-start text-left [&>div]:items-start [&_p]:text-left [&_button]:mt-2" />
          ) : (
            <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{stats ? stats.total_projects : '0'}</p>
          )}
        </Link>
        <div onClick={() => setIsActiveTasksModalOpen(true)} className="bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--border-subtle)] shadow-sm hover:border-brand-500 transition-colors group cursor-pointer flex flex-col justify-between min-h-[120px]">
          <h3 className="text-sm font-medium text-[var(--text-muted)] group-hover:text-brand-500 transition-colors uppercase tracking-wider">Active Tasks</h3>
          {isLoadingTasks ? (
            <LoadingSection text="loading..." className="p-0 mt-4 items-start" />
          ) : isErrorTasks ? (
            <ErrorSection message="Failed to load" onRetry={refetchTasks} className="p-0 mt-4 items-start text-left [&>div]:items-start [&_p]:text-left [&_button]:mt-2" />
          ) : (
            <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{activeTasks ? activeTasks.length : '0'}</p>
          )}
        </div>
        <Link href={`/workspaces/${resolvedParams.workspaceSlug}/members`} className="bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--border-subtle)] shadow-sm hover:border-brand-500 transition-colors group cursor-pointer flex flex-col justify-between min-h-[120px]">
          <h3 className="text-sm font-medium text-[var(--text-muted)] group-hover:text-brand-500 transition-colors uppercase tracking-wider">Members</h3>
          {isLoadingStats ? (
            <LoadingSection text="loading..." className="p-0 mt-4 items-start" />
          ) : isErrorStats ? (
            <ErrorSection message="Failed to load" onRetry={refetchStats} className="p-0 mt-4 items-start text-left [&>div]:items-start [&_p]:text-left [&_button]:mt-2" />
          ) : (
            <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{stats ? stats.total_members : '0'}</p>
          )}
        </Link>
      </div>
      
      <div className="mt-8 bg-[var(--bg-primary)] p-6 rounded-xl border border-[var(--border-subtle)] shadow-sm min-h-[300px]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Activity</h2>
        {isLoadingActivities ? (
          <LoadingSection text="Loading activities..." />
        ) : isErrorActivities ? (
          <ErrorSection message="Failed to load recent activities." onRetry={refetchActivities} />
        ) : activities && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((act: any) => (
              <div key={act.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 shrink-0 mt-0.5">
                  <span className="text-xs font-bold">{act.user_name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm text-[var(--text-primary)]">
                    <span className="font-medium">{act.user_name}</span> {act.action} <span className="font-medium">pada task {act.target_title}</span>
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {new Date(act.created_at + 'Z').toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '.')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-[var(--text-muted)] text-center py-8">
            Belum ada aktivitas yang tercatat.
          </div>
        )}
      </div>
      {currentWorkspace && (
        <InviteMemberModal 
          isOpen={isInviteModalOpen} 
          onClose={() => setIsInviteModalOpen(false)} 
          workspaceId={currentWorkspace.id} 
        />
      )}

      <Modal
        isOpen={isActiveTasksModalOpen}
        onClose={() => setIsActiveTasksModalOpen(false)}
        title="Your Active Tasks"
        description="Tasks assigned to you that are currently in progress."
      >
        <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {activeTasks && activeTasks.length > 0 ? (
            activeTasks.map((task: any) => (
              <Link
                key={task.id}
                href={`/workspaces/${resolvedParams.workspaceSlug}/projects/${task.project_id}`}
                className="block p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] hover:border-brand-500 transition-colors"
                onClick={() => setIsActiveTasksModalOpen(false)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-medium text-[var(--text-primary)] line-clamp-1">{task.title}</h4>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Project: <span className="font-medium">{task.project_name}</span>
                    </p>
                  </div>
                  <div className="px-2 py-1 bg-brand-500/10 text-brand-500 text-xs font-medium rounded-md whitespace-nowrap">
                    In Progress
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-8 text-[var(--text-muted)] text-sm">
              You have no active tasks right now.
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
