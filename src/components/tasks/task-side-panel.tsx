"use client"

import { X, Calendar, User, Tag, Ticket, Activity, Link as LinkIcon, Plus, Trash2, Check, Edit2, MessageSquare } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useEffect, useState, useRef } from 'react'
import { LinkTaskModal } from './link-task-modal'
import { TaskNotesWidget } from './task-notes-widget'
import { 
  useWorkspaces, 
  useWorkspaceMembers, 
  useUpdateTaskAssignee,
  useUpdateTask,
  useUpdateTaskStatus,
  useTaskActivities,
  useTaskLinks,
  useDeleteTaskLink
} from '@/lib/hooks'
import { toast } from 'sonner'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })
const MDViewer = dynamic(() => import('@uiw/react-md-editor').then(mod => mod.default.Markdown), { ssr: false })

interface TaskSidePanelProps {
  task: any | null
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  projectId: string
}

export function TaskSidePanel({ task, isOpen, onClose, workspaceId, projectId }: TaskSidePanelProps) {
  const [mounted, setMounted] = useState(false)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  
  const { data: workspaces } = useWorkspaces()
  const currentWorkspace = workspaces?.find((w: any) => w.slug === workspaceId)
  const { data: members } = useWorkspaceMembers(currentWorkspace?.id)
  
  const updateAssigneeMutation = useUpdateTaskAssignee(projectId)
  const updateTaskMutation = useUpdateTask(projectId)
  const updateStatusMutation = useUpdateTaskStatus(projectId)
  const deleteLinkMutation = useDeleteTaskLink(task?.id)
  
  const { data: activities } = useTaskActivities(task?.id)
  const { data: links } = useTaskLinks(task?.id)

  const [titleValue, setTitleValue] = useState('')
  const [descValue, setDescValue] = useState('')
  const [iconValue, setIconValue] = useState('•')
  const [progressValue, setProgressValue] = useState(0)
  const [chainedTicket, setChainedTicket] = useState('')
  const [tags, setTags] = useState('')
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [isNotesOpen, setIsNotesOpen] = useState(false)

  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync state when task changes
  useEffect(() => {
    if (task) {
      setTitleValue(task.title || '')
      setDescValue(task.description || '')
      setIconValue(task.icon || '•')
      setProgressValue(task.progress || 0)
      setChainedTicket(task.chained_ticket || '')
      setTags(task.tags || '')
      setIsEditingDesc(false)
      setIsNotesOpen(false)
    }
  }, [task])

  const handleTitleBlurOrEnter = async (e?: React.KeyboardEvent<HTMLInputElement>) => {
    if (e && e.key !== 'Enter') return;
    if (e) e.preventDefault();
    if (titleInputRef.current) titleInputRef.current.blur();

    if (titleValue.trim() !== task.title) {
      try {
        await updateTaskMutation.mutateAsync({ taskId: task.id, title: titleValue })
        toast.success("Title updated")
        task.title = titleValue
      } catch (error) {
        toast.error("Failed to update title")
        setTitleValue(task.title)
      }
    }
  }

  const handleIconBlurOrEnter = async (e?: React.KeyboardEvent<HTMLInputElement>) => {
    if (e && e.key !== 'Enter') return;
    if (e) e.preventDefault();
    
    if (iconValue !== (task.icon || '•')) {
      const finalIcon = iconValue.trim() || '•'
      try {
        await updateTaskMutation.mutateAsync({ taskId: task.id, icon: finalIcon === '•' ? '' : finalIcon })
        toast.success("Icon updated")
        task.icon = finalIcon === '•' ? null : finalIcon
        setIconValue(finalIcon)
      } catch (error) {
        toast.error("Failed to update icon")
        setIconValue(task.icon || '•')
      }
    }
  }

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProgressValue(parseInt(e.target.value) || 0)
  }

  const handleProgressBlur = async () => {
    if (progressValue !== (task.progress || 0)) {
      try {
        await updateTaskMutation.mutateAsync({ taskId: task.id, progress: progressValue })
        toast.success("Progress updated")
        task.progress = progressValue
      } catch (error) {
        toast.error("Failed to update progress")
        setProgressValue(task.progress || 0)
      }
    }
  }

  const handleSaveDesc = async () => {
    try {
      await updateTaskMutation.mutateAsync({ taskId: task.id, description: descValue })
      toast.success("Description updated")
      task.description = descValue
      setIsEditingDesc(false)
    } catch (error) {
      toast.error("Failed to update description")
    }
  }

  const handlePriorityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPriority = e.target.value
    try {
      await updateTaskMutation.mutateAsync({ taskId: task.id, priority: newPriority })
      toast.success("Priority updated")
      task.priority = newPriority
    } catch (error) {
      toast.error("Failed to update priority")
    }
  }

  const handleChainedTicketBlur = async () => {
    if (chainedTicket !== (task.chained_ticket || '')) {
      try {
        await updateTaskMutation.mutateAsync({ taskId: task.id, chained_ticket: chainedTicket })
        toast.success("Chained ticket updated")
        task.chained_ticket = chainedTicket
      } catch (error) {
        toast.error("Failed to update chained ticket")
        setChainedTicket(task.chained_ticket || '')
      }
    }
  }

  const handleTagsBlur = async () => {
    if (tags !== (task.tags || '')) {
      try {
        await updateTaskMutation.mutateAsync({ taskId: task.id, tags: tags })
        toast.success("Tags updated")
        task.tags = tags
      } catch (error) {
        toast.error("Failed to update tags")
        setTags(task.tags || '')
      }
    }
  }

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    try {
      await updateStatusMutation.mutateAsync({ taskId: task.id, status: newStatus })
      toast.success("Status updated")
      task.status = newStatus
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update status")
    }
  }

  const handleAssigneeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAssigneeId = e.target.value ? Number(e.target.value) : null
    try {
      await updateAssigneeMutation.mutateAsync({ taskId: task.id, assignee_id: newAssigneeId })
      toast.success("Assignee updated")
      task.assignee_id = newAssigneeId
    } catch (error) {
      toast.error("Failed to update assignee")
    }
  }

  const handleDeleteLink = async (linkId: number) => {
    if (!confirm("Are you sure you want to remove this link?")) return;
    try {
      await deleteLinkMutation.mutateAsync(linkId)
      toast.success("Link removed")
    } catch (error) {
      toast.error("Failed to remove link")
    }
  }

  if (!task) return null

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Panel */}
      <div 
        className={`fixed inset-y-0 right-0 w-full max-w-2xl bg-[var(--bg-primary)] shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out border-l border-[var(--border-subtle)] flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+42rem)]'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)] shrink-0 bg-[var(--bg-secondary)]/50 h-[81px]">
          <div className="flex-1 flex items-center gap-2">
            <input 
              value={iconValue}
              onChange={(e) => setIconValue(e.target.value)}
              onBlur={() => handleIconBlurOrEnter()}
              onKeyDown={(e) => handleIconBlurOrEnter(e)}
              maxLength={2}
              className="text-2xl font-bold text-[var(--text-muted)] text-center bg-transparent border border-dashed border-transparent hover:border-[var(--border-subtle)] focus:border-brand-500 rounded outline-none w-10 shrink-0 transition-colors cursor-text"
              title="Custom Emoji / Icon"
            />
            <input 
              ref={titleInputRef}
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={() => handleTitleBlurOrEnter()}
              onKeyDown={(e) => handleTitleBlurOrEnter(e)}
              className="text-2xl font-bold text-[var(--text-primary)] leading-tight bg-transparent border-none outline-none focus:bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)] px-2 py-1 -ml-2 rounded-lg transition-colors w-full cursor-text"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <button
              onClick={() => setIsNotesOpen(!isNotesOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isNotesOpen ? 'bg-brand-500 text-white' : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              <MessageSquare className="w-4 h-4" />
              Notes
            </button>
            {task.ticket_reference && (
              <span className="flex items-center gap-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 px-2 py-1 rounded-md text-sm">
                <Ticket className="w-3.5 h-3.5" />
                {task.ticket_reference}
              </span>
            )}
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-6 flex flex-col md:flex-row gap-6 md:gap-0">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col md:pr-6 md:border-r border-[var(--border-subtle)] min-h-0">
            
            <div className="shrink-0 space-y-6">
              <div className="space-y-3 relative group">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Description</h3>
                {!isEditingDesc && (
                  <button 
                    onClick={() => setIsEditingDesc(true)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[var(--bg-tertiary)] rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all flex items-center gap-1 text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
              </div>
              
              {isEditingDesc ? (
                <div data-color-mode="dark" className="space-y-3">
                  <MDEditor
                    value={descValue}
                    onChange={(val) => setDescValue(val || '')}
                    height={250}
                    preview="edit"
                    className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl overflow-hidden"
                  />
                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={() => {
                        setDescValue(task.description || '')
                        setIsEditingDesc(false)
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveDesc}
                      disabled={updateTaskMutation.isPending}
                      className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors text-xs flex items-center gap-1 disabled:opacity-70"
                    >
                      <Check className="w-3.5 h-3.5" /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  data-color-mode="dark" 
                  className="prose prose-invert max-w-none text-sm text-[var(--text-primary)] bg-[var(--bg-secondary)]/30 p-4 rounded-xl border border-transparent hover:border-[var(--border-subtle)] transition-colors cursor-text min-h-[100px]"
                  onClick={() => setIsEditingDesc(true)}
                >
                  {mounted && (
                    <MDViewer 
                      source={task.description || '*No description provided. Click to edit.*'} 
                      style={{ backgroundColor: 'transparent' }}
                    />
                  )}
                </div>
              )}
            </div>
            
            {/* Linked Tasks */}
            <div className="pt-6 mt-6 border-t border-[var(--border-subtle)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Linked Tasks</h3>
                <button 
                  onClick={() => setIsLinkModalOpen(true)}
                  className="p-1 hover:bg-[var(--bg-tertiary)] rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  title="Link to another task"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {links && links.length > 0 ? (
                  links.map((link: any) => (
                    <div key={link.id} className="flex items-center gap-3 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-3 rounded-xl group/link">
                      <div className="bg-brand-500/10 text-brand-600 dark:text-brand-400 p-1.5 rounded-lg">
                        <LinkIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-[var(--text-muted)] capitalize">{link.link_type.replace('_', ' ')}</p>
                        <p className="text-sm text-[var(--text-primary)] font-medium">{link.target_title}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteLink(link.id)}
                        disabled={deleteLinkMutation.isPending}
                        className="opacity-0 group-hover/link:opacity-100 p-1.5 text-red-500 hover:bg-red-500/10 rounded-md transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-[var(--text-muted)] italic px-2">No linked tasks.</div>
                )}
              </div>
            </div>
            </div>
            
            {/* Activity Log */}
            <div className="pt-6 mt-6 border-t border-[var(--border-subtle)] flex flex-col flex-1 min-h-0">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4 shrink-0">Activity</h3>
              <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-2 pb-4">
                {activities && activities.length > 0 ? (
                  activities.map((act: any) => (
                    <div key={act.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0 border border-[var(--border-subtle)]">
                        <User className="w-4 h-4 text-[var(--text-muted)]" />
                      </div>
                      <div className="flex-1 bg-[var(--bg-secondary)]/50 rounded-xl border border-[var(--border-subtle)] p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium text-[var(--text-secondary)]">{act.user_name}</p>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {new Date(act.created_at + 'Z').toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '.')}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-primary)]">{act.action}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-[var(--text-muted)] italic px-2">No activity logged yet.</div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar / Properties Area */}
          <div className="w-full md:w-64 md:pl-6 shrink-0 mt-8 md:mt-0 overflow-y-auto custom-scrollbar pb-4">
            <div>
              <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Properties</h4>
              <div className="space-y-4">
                
                <div className="flex flex-col gap-1 text-sm">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Activity className="w-4 h-4" />
                    <span>Status</span>
                  </div>
                  <select 
                    className="text-[var(--text-primary)] font-medium bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-md px-2.5 py-1.5 outline-none focus:border-brand-500 w-full capitalize"
                    value={task.status}
                    onChange={handleStatusChange}
                    disabled={updateStatusMutation.isPending}
                  >
                    <option value="backlog">Backlog</option>
                    <option value="in_progress">In Progress</option>
                    <option value="ready_to_test">Ready to Test</option>
                    <option value="in_review">In Review</option>
                    <option value="not_passed">Not Passed</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1 text-sm">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Tag className="w-4 h-4" />
                    <span>Priority</span>
                  </div>
                  <select 
                    className="text-[var(--text-primary)] font-medium bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-md px-2.5 py-1.5 outline-none focus:border-brand-500 w-full capitalize"
                    value={task.priority || 'medium'}
                    onChange={handlePriorityChange}
                    disabled={updateTaskMutation.isPending}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1 text-sm pt-2">
                  <div className="flex items-center justify-between text-[var(--text-secondary)]">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      <span>Progress</span>
                    </div>
                    <span className="font-medium text-[var(--text-primary)]">{progressValue}%</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progressValue}
                    onChange={handleProgressChange}
                    onMouseUp={handleProgressBlur}
                    onTouchEnd={handleProgressBlur}
                    disabled={updateTaskMutation.isPending}
                    className="w-full accent-brand-500 mt-1 cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-1 text-sm pt-2">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <User className="w-4 h-4" />
                    <span>Assignee</span>
                  </div>
                  <select 
                    className="text-[var(--text-primary)] font-medium bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-md px-2.5 py-1.5 outline-none focus:border-brand-500 w-full"
                    value={task.assignee_id || ''}
                    onChange={handleAssigneeChange}
                    disabled={updateAssigneeMutation.isPending}
                  >
                    <option value="">Unassigned</option>
                    {members?.map((member: any) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1 text-sm">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Calendar className="w-4 h-4" />
                    <span>Created At</span>
                  </div>
                  <span className="text-[var(--text-primary)] font-medium">
                    {new Date(task.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex flex-col gap-1 text-sm pt-2">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <LinkIcon className="w-4 h-4" />
                    <span>Chained Ticket</span>
                  </div>
                  <input
                    type="text"
                    value={chainedTicket}
                    onChange={(e) => setChainedTicket(e.target.value)}
                    onBlur={handleChainedTicketBlur}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur()
                      }
                    }}
                    placeholder="E.g. #1234 or URL"
                    className="text-[var(--text-primary)] font-medium bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-md px-2.5 py-1.5 outline-none focus:border-brand-500 w-full"
                    disabled={updateTaskMutation.isPending}
                  />
                </div>

                <div className="flex flex-col gap-1 text-sm pt-2">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Tag className="w-4 h-4" />
                    <span>Tags</span>
                  </div>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    onBlur={handleTagsBlur}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur()
                      }
                    }}
                    placeholder="Comma separated tags"
                    className="text-[var(--text-primary)] font-medium bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-md px-2.5 py-1.5 outline-none focus:border-brand-500 w-full"
                    disabled={updateTaskMutation.isPending}
                  />
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      <LinkTaskModal 
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        task={task}
        workspaceId={workspaceId}
        projectId={projectId}
        onSuccess={() => {
          // Empty, react-query invalidates
        }}
      />
      
      {isOpen && (
        <TaskNotesWidget 
          taskId={task.id} 
          isOpen={isNotesOpen} 
        />
      )}
    </>
  )
}
