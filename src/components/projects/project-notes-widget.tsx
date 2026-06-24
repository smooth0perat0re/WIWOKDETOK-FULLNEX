"use client"

import { useState, useRef } from 'react'
import { Plus, X, Upload } from 'lucide-react'
import { useProjectNotes, useCreateProjectNote } from '@/lib/hooks'
import { toast } from 'sonner'

export function ProjectNotesWidget({ workspaceId, projectId, className = "" }: { workspaceId: string, projectId: string, className?: string }) {
  const { data: notes, isLoading } = useProjectNotes(workspaceId, projectId)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<any | null>(null)

  return (
    <>
      <div className={`flex flex-col h-full relative overflow-hidden ${className || 'bg-[var(--bg-secondary)]/50 rounded-xl p-3 border border-[var(--border-subtle)] animate-in fade-in zoom-in-95 duration-500'}`}>
        {!className && <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent pointer-events-none"></div>}

        <div className="relative z-10 flex items-center justify-between mb-4 px-1 shrink-0">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            📝 Notes
          </h2>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="relative z-10 flex-1 px-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-[var(--bg-tertiary)] rounded w-3/4"></div>
              <div className="h-4 bg-[var(--bg-tertiary)] rounded w-1/2"></div>
            </div>
          ) : notes && notes.length > 0 ? (
            <ul className="space-y-2">
              {notes.map((note: any, index: number) => (
                <li 
                  key={note.id} 
                  onClick={() => setSelectedNote(note)}
                  className="text-sm text-[var(--text-primary)] cursor-pointer hover:underline truncate"
                >
                  {index + 1}. {note.title} - {note.created_by_name}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-[var(--text-muted)] mt-2">No notes available.</div>
          )}
        </div>
      </div>

      {isCreateModalOpen && (
        <CreateNoteModal 
          workspaceId={workspaceId} 
          projectId={projectId} 
          onClose={() => setIsCreateModalOpen(false)} 
        />
      )}

      {selectedNote && (
        <NoteDetailModal 
          note={selectedNote} 
          onClose={() => setSelectedNote(null)} 
        />
      )}
    </>
  )
}

function CreateNoteModal({ workspaceId, projectId, onClose }: { workspaceId: string, projectId: string, onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const createNote = useCreateProjectNote(workspaceId, projectId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    setIsUploading(true)
    let attachmentUrl = ''

    try {
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('file_location', '/worktracker/ss')

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!res.ok) throw new Error('Upload failed')

        const data = await res.json()
        if (data.status && data.data && data.data.url) {
          attachmentUrl = data.data.url
        } else {
          throw new Error('Invalid response from CDN')
        }
      }

      await createNote.mutateAsync({
        title,
        content,
        attachment_url: attachmentUrl
      })

      toast.success('Note created')
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create note')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Add Note</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Title <span className="text-red-500">*</span></label>
            <input 
              autoFocus
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-brand-500 transition-colors"
              placeholder="E.g. UI Jelek harus ganti"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Content</label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-brand-500 transition-colors min-h-[100px] resize-none"
              placeholder="Details..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Attachment (Image)</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-[var(--border-subtle)] rounded-lg p-4 flex flex-col items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors cursor-pointer"
            >
              <Upload className="w-6 h-6 mb-2" />
              <span className="text-sm">{file ? file.name : 'Click to select an image'}</span>
            </div>
            <input 
              type="file" 
              accept="image/*"
              ref={fileInputRef}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isUploading || !title.trim()}
              className="px-4 py-2 text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isUploading ? 'Uploading...' : 'Save Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function NoteDetailModal({ note, onClose }: { note: any, onClose: () => void }) {
  const createdAt = new Date(note.created_at.replace(' ', 'T')).toLocaleString()
  const updatedAt = new Date(note.updated_at.replace(' ', 'T')).toLocaleString()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-[var(--bg-secondary)] border border-brand-500/30 rounded-xl shadow-[0_0_40px_-10px_rgba(124,58,237,0.3)] w-full max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 pb-0">
          <div className="flex-1"></div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar pt-0">
          <div className="space-y-1 mb-6">
            <div className="grid grid-cols-[100px_1fr] gap-4 text-sm">
              <span className="text-[var(--text-primary)] font-semibold">Created at</span>
              <span className="text-[var(--text-primary)]">: {createdAt}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-4 text-sm">
              <span className="text-[var(--text-primary)] font-semibold">Updated</span>
              <span className="text-[var(--text-primary)]">: {updatedAt}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] gap-4 text-sm mt-2">
              <span className="text-[var(--text-primary)] font-semibold">Title</span>
              <span className="text-[var(--text-primary)]">: {note.title}</span>
            </div>
          </div>

          <div className="w-full h-px bg-brand-500/50 mb-6 shadow-[0_0_10px_rgba(124,58,237,0.5)]"></div>

          <div className="text-sm text-[var(--text-primary)] whitespace-pre-wrap mb-6">
            {note.content}
          </div>

          {note.attachment_url && (
            <div className="mt-4 rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] flex justify-center p-2">
              {/* Using img tag to avoid Next.js Image domain configuration issues for external CDN */}
              <img 
                src={note.attachment_url} 
                alt="Attachment" 
                className="max-w-full h-auto max-h-[400px] object-contain rounded"
              />
            </div>
          )}
          
          {/* Sesuai desain user, tambah info di bawah */}
          <div className="mt-8 text-sm text-[var(--text-primary)]">
            Created dan updatednya otomatis beserta siapa yang menambahkannya
          </div>
        </div>
      </div>
    </div>
  )
}
