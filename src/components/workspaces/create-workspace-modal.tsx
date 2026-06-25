"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import api from '@/lib/api'

const formSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  description: z.string().optional(),
  is_private: z.boolean(),
  icon: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface CreateWorkspaceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  initialIsPrivate?: boolean
}

export function CreateWorkspaceModal({ isOpen, onClose, onSuccess, initialIsPrivate = false }: CreateWorkspaceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      is_private: initialIsPrivate,
      icon: '📁',
    }
  })

  // Update default value when prop changes
  useEffect(() => {
    if (isOpen) {
      reset({
        name: '',
        description: '',
        is_private: initialIsPrivate,
        icon: '📁',
      })
    }
  }, [isOpen, initialIsPrivate, reset])

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      await api.post('/workspaces', data)
      toast.success('Workspace created successfully!')
      reset()
      onSuccess?.()
      onClose()
    } catch (error) {
      // Error handling is mostly done globally in api.ts
      console.error(error)
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
      title="Create New Workspace"
      description="Workspaces help you organize your projects and team members."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Workspace Name</label>
          <input 
            {...register('name')}
            className="w-full px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-[var(--text-primary)]"
            placeholder="e.g. Engineering Team"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Workspace Icon (Emoji)</label>
          <input 
            {...register('icon')}
            className="w-full px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-[var(--text-primary)]"
            placeholder="e.g. 🚀, 💼, 🏠"
            maxLength={10}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Description (Optional)</label>
          <textarea 
            {...register('description')}
            rows={3}
            className="w-full px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-[var(--text-primary)] resize-none"
            placeholder="What is this workspace for?"
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
        </div>

        <div className="flex items-center gap-3 py-2">
          <input 
            type="checkbox" 
            id="is_private"
            {...register('is_private')}
            className="w-4 h-4 rounded border-[var(--border-subtle)] text-brand-500 focus:ring-brand-500 bg-[var(--bg-secondary)]"
          />
          <div>
            <label htmlFor="is_private" className="text-sm font-medium text-[var(--text-primary)] block">Personal Space (Private Workspace)</label>
            <span className="text-xs text-[var(--text-muted)]">Only you can access this workspace. It will appear under Personal Space.</span>
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
            {isSubmitting ? 'Creating...' : 'Create Workspace'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
