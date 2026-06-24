"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { useInviteToWorkspace } from '@/lib/hooks'

const formSchema = z.object({
  username: z.string().min(3, { message: "Username/NIP/NIM must be at least 3 characters" }),
})

type FormValues = z.infer<typeof formSchema>

interface InviteMemberModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: number
}

export function InviteMemberModal({ isOpen, onClose, workspaceId }: InviteMemberModalProps) {
  const { mutate: inviteMember, isPending } = useInviteToWorkspace()
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
    }
  })

  const onSubmit = (data: FormValues) => {
    if (!workspaceId) return
    inviteMember({ workspaceId, username: data.username }, {
      onSuccess: () => {
        toast.success('Invitation sent successfully!')
        reset()
        onClose()
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to send invitation')
      }
    })
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite Member"
      description="Invite someone to collaborate in this workspace using their Username, NIP, or NIM."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Username / NIP / NIM</label>
          <input 
            {...register('username')}
            className="w-full px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-[var(--text-primary)]"
            placeholder="e.g. febyfebrian"
            autoFocus
          />
          {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
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
            disabled={isPending}
            className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 text-sm"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? 'Sending...' : 'Send Invite'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
