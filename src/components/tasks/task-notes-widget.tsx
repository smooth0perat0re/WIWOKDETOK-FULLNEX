"use client"

import { useState, useRef, useEffect } from 'react'
import { Send, Image as ImageIcon, X, Loader2 } from 'lucide-react'
import { useTaskNotes, useCreateTaskNote } from '@/lib/hooks'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth'

interface TaskNotesWidgetProps {
  taskId: string | number
  isOpen: boolean
}

export function TaskNotesWidget({ taskId, isOpen }: TaskNotesWidgetProps) {
  const { user } = useAuthStore()
  const { data: notes, isLoading } = useTaskNotes(taskId)
  const createNoteMutation = useCreateTaskNote(taskId)
  
  const [content, setContent] = useState('')
  const [attachment, setAttachment] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100)
    }
  }, [notes, isOpen])

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) {
          const reader = new FileReader()
          reader.onload = (event) => {
            setAttachment(event.target?.result as string)
          }
          reader.readAsDataURL(file)
        }
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setAttachment(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && !attachment) return

    try {
      await createNoteMutation.mutateAsync({
        content: content.trim() || 'Attached an image',
        attachment_url: attachment || undefined
      })
      setContent('')
      setAttachment(null)
    } catch (error) {
      toast.error('Failed to send note')
    }
  }

  return (
    <div 
      className={`fixed inset-y-0 right-[42rem] left-0 bg-[var(--bg-primary)] shadow-2xl z-[65] border-r border-[var(--border-subtle)] flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+42rem)] opacity-0 pointer-events-none'}`}
      style={{ right: 'max(672px, 42rem)' }} // Align it exactly left of the max-w-2xl (672px) side panel
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 shrink-0 h-[81px]">
        <h3 className="font-semibold text-[var(--text-primary)]">Notes</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : notes && notes.length > 0 ? (
          notes.map((note: any) => {
            const isMe = note.user_id === user?.id;
            return (
              <div key={note.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="text-xs mb-1">
                  <span className={isMe ? 'text-green-500' : 'text-purple-500'}>
                    By {isMe ? 'me' : note.user_name}
                  </span>
                  <span className="text-[var(--text-muted)]">
                    {' - '}
                    {new Date(note.created_at + 'Z').toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }).replace(':', '.')}
                    {' | '}
                    {new Date(note.created_at + 'Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className={`max-w-[90%] p-3 rounded-2xl ${isMe ? 'bg-[var(--bg-tertiary)] rounded-tr-sm' : 'bg-brand-500/10 rounded-tl-sm'}`}>
                  <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{note.content}</p>
                  {note.attachment_url && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-[var(--border-subtle)]">
                      <img src={note.attachment_url} alt="Attachment" className="max-w-full h-auto" />
                    </div>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-[var(--text-muted)] italic">
            No notes yet.
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 shrink-0">
        {attachment && (
          <div className="relative inline-block mb-2">
            <img src={attachment} alt="Preview" className="h-20 rounded-md border border-[var(--border-subtle)] object-cover" />
            <button 
              onClick={() => setAttachment(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-md"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2 relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            placeholder="Type a note or paste an image..."
            className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none min-h-[40px] max-h-[120px] custom-scrollbar"
            rows={1}
          />
          <div className="flex flex-col gap-1 shrink-0 justify-end pb-1">
            <label className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-full cursor-pointer transition-colors">
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <ImageIcon className="w-4 h-4" />
            </label>
            <button
              type="submit"
              disabled={createNoteMutation.isPending || (!content.trim() && !attachment)}
              className="p-2 bg-brand-500 text-white rounded-full hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {createNoteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
