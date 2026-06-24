import { useState } from 'react'
import { X, UserPlus, UserMinus } from 'lucide-react'
import { useWorkspaceMembers, useProjectMembers, useAddProjectMember, useRemoveProjectMember, useWorkspaces } from '@/lib/hooks'

interface ProjectMembersModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceSlug: string
  projectId: string
}

export function ProjectMembersModal({ isOpen, onClose, workspaceSlug, projectId }: ProjectMembersModalProps) {
  const { data: workspaces } = useWorkspaces()
  const workspace = workspaces?.find((w: any) => w.slug === workspaceSlug)
  
  const { data: workspaceMembers, isLoading: isLoadingWM } = useWorkspaceMembers(workspace?.id)
  const { data: projectMembers, isLoading: isLoadingPM } = useProjectMembers(workspaceSlug, projectId)
  
  const { mutate: addMember, isPending: isAdding } = useAddProjectMember(workspaceSlug, projectId)
  const { mutate: removeMember, isPending: isRemoving } = useRemoveProjectMember(workspaceSlug, projectId)

  if (!isOpen) return null

  // Filter out workspace members that are already project members
  const availableMembers = workspaceMembers?.filter((wm: any) => 
    !projectMembers?.some((pm: any) => pm.user_id === wm.id)
  ) || []

  const handleAdd = (userId: number) => {
    addMember({ user_id: userId, role: 'member' })
  }

  const handleRemove = (userId: number) => {
    if (window.confirm("Are you sure you want to remove this member from the project?")) {
        removeMember(userId)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-primary)] w-full max-w-2xl rounded-2xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden flex flex-col max-h-[85vh]">
        
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)] shrink-0">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Project Members</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Manage who is assigned to this project.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Current Members */}
          <section>
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Current Members</h3>
            <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
                {isLoadingPM ? (
                    <div className="p-4 text-center text-sm text-[var(--text-muted)] animate-pulse">Loading...</div>
                ) : projectMembers && projectMembers.length > 0 ? (
                    <div className="divide-y divide-[var(--border-subtle)]">
                        {projectMembers.map((member: any) => (
                            <div key={member.user_id} className="p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs shrink-0">
                                        {member.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm text-[var(--text-primary)]">{member.name}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{member.email}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleRemove(member.user_id)}
                                    disabled={isRemoving}
                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded disabled:opacity-50 transition-colors"
                                    title="Remove from project"
                                >
                                    <UserMinus className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-4 text-center text-sm text-[var(--text-muted)]">No active members yet.</div>
                )}
            </div>
          </section>

          {/* Available Members */}
          <section>
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Add from Workspace</h3>
            <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
                {isLoadingWM ? (
                    <div className="p-4 text-center text-sm text-[var(--text-muted)] animate-pulse">Loading...</div>
                ) : availableMembers.length > 0 ? (
                    <div className="divide-y divide-[var(--border-subtle)]">
                        {availableMembers.map((member: any) => (
                            <div key={member.id} className="p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 flex items-center justify-center font-bold text-xs shrink-0">
                                        {member.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm text-[var(--text-primary)]">{member.name}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{member.email}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleAdd(member.id)}
                                    disabled={isAdding}
                                    className="p-1.5 text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded disabled:opacity-50 transition-colors"
                                    title="Add to project"
                                >
                                    <UserPlus className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-4 text-center text-sm text-[var(--text-muted)]">All workspace members are already in this project.</div>
                )}
            </div>
          </section>

        </div>
        
        <div className="p-6 border-t border-[var(--border-subtle)] flex justify-end shrink-0 bg-[var(--bg-primary)]">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  )
}
