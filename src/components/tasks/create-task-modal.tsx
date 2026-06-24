"use client"

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import api from '@/lib/api'
import dynamic from 'next/dynamic'

// Dynamically import MD editor to prevent SSR issues
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  ticket_reference: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  workspaceId: string
  projectId: string
}

export function CreateTaskModal({ isOpen, onClose, onSuccess, workspaceId, projectId }: CreateTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      ticket_reference: '',
    }
  })

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      await api.post(`/workspaces/${workspaceId}/projects/${projectId}/tasks`, data)
      toast.success('Task created successfully!')
      reset()
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error(error)
      toast.error('Failed to create task')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Task"
      description="Add a new task to your project."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Task Title</label>
          <input 
            {...register('title')}
            className="w-full px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-[var(--text-primary)]"
            placeholder="What needs to be done?"
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Priority</label>
            <select 
              {...register('priority')}
              className="w-full px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-[var(--text-primary)] appearance-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Ticket OS (Optional)</label>
            <input 
              {...register('ticket_reference')}
              className="w-full px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-[var(--text-primary)]"
              placeholder="e.g. TICKET-123"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Description</label>
          <div data-color-mode="dark">
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <MDEditor
                  value={field.value || ''}
                  onChange={field.onChange}
                  height={200}
                  preview="edit"
                  className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl overflow-hidden"
                />
              )}
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border-subtle)]">
          <button 
            type="button" 
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 text-sm"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
