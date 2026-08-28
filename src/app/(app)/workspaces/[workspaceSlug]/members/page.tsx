"use client"

import { use, useState } from 'react'
import { UserPlus, UserMinus, LogOut, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useWorkspaces, useWorkspaceMembers, useRemoveMember } from '@/lib/hooks'
import { useAuthStore } from '@/store/auth'
import { InviteMemberModal } from '@/components/workspaces/invite-member-modal'
import { LoadingSection } from '@/components/ui/loading-section'
import { ErrorSection } from '@/components/ui/error-section'

export default function WorkspaceMembersPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>
}) {
  const resolvedParams = use(params)
  const { data: workspaces } = useWorkspaces()
  const { user: currentUser } = useAuthStore()
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const { mutate: removeMember, isPending: isRemoving } = useRemoveMember()
  
  const currentWorkspace = workspaces?.find((w: any) => w.slug === resolvedParams.workspaceSlug)
  const { data: members, isLoading, isError, refetch } = useWorkspaceMembers(currentWorkspace?.id)

  const handleRemove = (memberId: number, memberName: string) => {
    if (!currentWorkspace) return;
    
    const isSelf = currentUser?.id === memberId;
    const actionText = isSelf ? "leave this workspace" : `kick ${memberName} from this workspace`;
    
    if (window.confirm(`Are you sure you want to ${actionText}?`)) {
        removeMember({ workspaceId: currentWorkspace.id, userId: memberId });
    }
  }

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <Link href={`/workspaces/${resolvedParams.workspaceSlug}`} className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-brand-500 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Overview
      </Link>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Members
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Manage who has access to {currentWorkspace?.name || 'this workspace'}.
          </p>
        </div>
        
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

      <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)] shadow-sm overflow-hidden min-h-[200px]">
        {isLoading ? (
            <LoadingSection text="Loading members..." />
        ) : isError ? (
            <ErrorSection message="Failed to load workspace members" onRetry={refetch} />
        ) : members && members.length > 0 ? (
            <div className="divide-y divide-[var(--border-subtle)]">
                {members.map((member: any) => {
                    const isSelf = Number(currentUser?.id) === Number(member.id);
                    const joinDate = new Date(member.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    
                    return (
                        <div key={member.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--bg-tertiary)] transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold shrink-0">
                                    {member.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-medium text-[var(--text-primary)] flex items-center gap-2">
                                        {member.name}
                                        {isSelf && <span className="text-[10px] bg-[var(--bg-secondary)] border border-[var(--border-subtle)] px-1.5 py-0.5 rounded text-[var(--text-muted)]">You</span>}
                                    </h3>
                                    <p className="text-sm text-[var(--text-secondary)]">{member.email}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between sm:justify-end gap-4 sm:w-1/3">
                                <span className="text-xs text-[var(--text-muted)]">Joined {joinDate}</span>
                                <button 
                                    onClick={() => handleRemove(member.id, member.name)}
                                    disabled={isRemoving}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        isSelf 
                                        ? 'text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10' 
                                        : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                                    } disabled:opacity-50`}
                                >
                                    {isSelf ? <LogOut className="w-4 h-4" /> : <UserMinus className="w-4 h-4" />}
                                    {isSelf ? 'Leave Workspace' : 'Kick'}
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        ) : (
            <div className="p-8 text-center text-[var(--text-muted)]">No members found.</div>
        )}
      </div>

      {currentWorkspace && (
        <InviteMemberModal 
          isOpen={isInviteModalOpen} 
          onClose={() => setIsInviteModalOpen(false)} 
          workspaceId={currentWorkspace.id} 
        />
      )}
    </div>
  )
}
