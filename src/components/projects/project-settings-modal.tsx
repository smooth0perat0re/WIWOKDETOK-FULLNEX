"use client"

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { 
  useUpdateProject, 
  useWorkspaceMembers, 
  useProjectMembers, 
  useAddProjectMember, 
  useRemoveProjectMember, 
  useWorkspaces 
} from '@/lib/hooks'
import { toast } from 'sonner'
import { Loader2, UserPlus, UserMinus } from 'lucide-react'

interface ProjectSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  project: any
}

export function ProjectSettingsModal({ isOpen, onClose, workspaceId, project }: ProjectSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'members'>('general')

  // General tab state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('active')
  const [icon, setIcon] = useState('')
  const [chainedTicket, setChainedTicket] = useState('')
  
  const updateProjectMutation = useUpdateProject(workspaceId)

  // Members tab state
  const { data: workspaces } = useWorkspaces()
  const workspace = workspaces?.find((w: any) => w.slug === workspaceId)
  
  const { data: workspaceMembers, isLoading: isLoadingWM } = useWorkspaceMembers(workspace?.id)
  const projectId = project?.id?.toString()
  const { data: projectMembers, isLoading: isLoadingPM } = useProjectMembers(workspaceId, projectId)
  
  const { mutate: addMember, isPending: isAdding } = useAddProjectMember(workspaceId, projectId)
  const { mutate: removeMember, isPending: isRemoving } = useRemoveProjectMember(workspaceId, projectId)

  const availableMembers = workspaceMembers?.filter((wm: any) => 
    !projectMembers?.some((pm: any) => pm.user_id === wm.id)
  ) || []

  useEffect(() => {
    if (project && isOpen) {
      setName(project.name || '')
      setDescription(project.description || '')
      setStatus(project.status || 'active')
      setIcon(project.icon || '')
      setChainedTicket(project.chained_ticket || '')
      setActiveTab('general')
    }
  }, [project, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      await updateProjectMutation.mutateAsync({
        projectId: project.id.toString(),
        name,
        description,
        status,
        icon,
        chained_ticket: chainedTicket
      })
      toast.success('Project updated successfully')
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update project')
    }
  }

  const handleAdd = (userId: number) => {
    addMember({ user_id: userId, role: 'member' })
  }

  const handleRemove = (userId: number) => {
    if (window.confirm("Are you sure you want to remove this member from the project?")) {
        removeMember(userId)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Project Settings"
      description="Update your project details and settings."
      className={activeTab === 'members' ? 'max-w-2xl' : 'max-w-md'}
    >
      <div className="flex border-b border-[var(--border-subtle)] mt-2">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'general'
              ? 'border-brand-500 text-brand-500'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'members'
              ? 'border-brand-500 text-brand-500'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Members
        </button>
      </div>

      <div className="mt-4">
        {activeTab === 'general' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  placeholder="e.g., Redevelop SID"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 min-h-[80px] custom-scrollbar"
                  placeholder="Brief description of the project"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="active">Active</option>
                    <option value="waiting/hold">Waiting/Hold</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Project Icon (Emoji)
                  </label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    placeholder="e.g., 🚀, 💼"
                    maxLength={10}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Chained Ticket (Optional)
                </label>
                <input
                  type="text"
                  value={chainedTicket}
                  onChange={(e) => setChainedTicket(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  placeholder="Ticket number or URL"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateProjectMutation.isPending || !name.trim()}
                className="px-4 py-2 text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
              >
                {updateProjectMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        )}

        {activeTab === 'members' && (
          <div className="space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
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
        )}
      </div>
    </Modal>
  )
}
