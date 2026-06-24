"use client"

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import api from '@/lib/api'
import { toast } from 'sonner'
import { Loader2, Link as LinkIcon } from 'lucide-react'
import { useTasks } from '@/lib/hooks'

interface LinkTaskModalProps {
  isOpen: boolean
  onClose: () => void
  task: any | null
  workspaceId: string
  projectId: string
  onSuccess: () => void
}

export function LinkTaskModal({ isOpen, onClose, task, workspaceId, projectId, onSuccess }: LinkTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedTask, setSelectedTask] = useState<string>('')
  const [linkType, setLinkType] = useState<string>('related')
  const { data: tasks, isLoading } = useTasks(workspaceId, projectId)

  const availableTasks = tasks?.filter((t: any) => t.id !== task?.id) || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTask || !task) return

    setIsSubmitting(true)
    try {
      await api.post(`/tasks/${task.id}/link`, {
        target_task_id: parseInt(selectedTask),
        link_type: linkType
      })
      toast.success('Task linked successfully')
      onSuccess()
      onClose()
    } catch (error) {
      toast.error('Failed to link task')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Link Task" description={`Create a dependency or relationship for #${task?.id}`}>
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Relationship</label>
          <select 
            value={linkType}
            onChange={(e) => setLinkType(e.target.value)}
            className="w-full px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-[var(--text-primary)] appearance-none"
          >
            <option value="related">Relates to</option>
            <option value="blocks">Blocks</option>
            <option value="blocked_by">Is blocked by</option>
            <option value="continues_from">Continues from</option>
          </select>
        </div>
        
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Task</label>
          <select 
            value={selectedTask}
            onChange={(e) => setSelectedTask(e.target.value)}
            required
            className="w-full px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-[var(--text-primary)] appearance-none"
          >
            <option value="" disabled>Select a task...</option>
            {isLoading ? <option disabled>Loading tasks...</option> : null}
            {availableTasks.map((t: any) => (
              <option key={t.id} value={t.id}>#{t.id} - {t.title}</option>
            ))}
          </select>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border-subtle)]">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-xl transition-colors">Cancel</button>
          <button type="submit" disabled={isSubmitting || !selectedTask} className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 text-sm">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />} Link Task
          </button>
        </div>
      </form>
    </Modal>
  )
}
