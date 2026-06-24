"use client"

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { useUpdateTaskStatus, useWorkspaces, useWorkspaceMembers } from '@/lib/hooks'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface ReviewerModalProps {
  isOpen: boolean
  onClose: () => void
  task: any | null
  projectId: string
  workspaceSlug?: string
  onSuccess: () => void
}

export function ReviewerModal({ isOpen, onClose, task, projectId, workspaceSlug, onSuccess }: ReviewerModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedReviewer, setSelectedReviewer] = useState<string>('')
  const updateTaskMutation = useUpdateTaskStatus(projectId)

  const { data: workspaces } = useWorkspaces()
  const currentWorkspace = workspaces?.find((w: any) => w.slug === workspaceSlug)
  const { data: members } = useWorkspaceMembers(currentWorkspace?.id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReviewer || !task) return

    setIsSubmitting(true)
    try {
      await updateTaskMutation.mutateAsync({
        taskId: task.id,
        status: task.targetStatus || 'in_review',
        reviewer_id: parseInt(selectedReviewer)
      })
      toast.success('Task moved to review queue')
      onSuccess()
      onClose()
    } catch (error) {
      toast.error('Failed to update status')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Reviewer" description="Assign a reviewer to check your work before it can be marked as Done.">
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Reviewer</label>
          <select 
            value={selectedReviewer}
            onChange={(e) => setSelectedReviewer(e.target.value)}
            required
            className="w-full px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-[var(--text-primary)] appearance-none"
          >
            <option value="" disabled>Select a team member...</option>
            {members?.map((m: any) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border-subtle)]">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-xl transition-colors">Cancel</button>
          <button type="submit" disabled={isSubmitting || !selectedReviewer} className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 text-sm">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Submit
          </button>
        </div>
      </form>
    </Modal>
  )
}
