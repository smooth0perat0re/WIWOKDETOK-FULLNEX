"use client"

import { useState } from 'react'
import { Plus, Search, Edit2, FileText, Trash2, Calendar, Settings } from 'lucide-react'
import { format } from 'date-fns'
import { Modal } from '@/components/ui/modal'
import { 
  usePersonalNotes, 
  useCreatePersonalNote, 
  useUpdatePersonalNote, 
  useDeletePersonalNote,
  useUpdateProfile
} from '@/lib/hooks'
import { useAuthStore } from '@/store/auth'
import { toast } from 'sonner'

export default function PersonalNotesPage() {
  const { user } = useAuthStore()
  const { data: notes, isLoading } = usePersonalNotes()
  const { mutate: createNote } = useCreatePersonalNote()
  const { mutate: updateNote } = useUpdatePersonalNote()
  const { mutate: deleteNote } = useDeletePersonalNote()
  const { mutate: updateProfile } = useUpdateProfile()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNote, setSelectedNote] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filteredNotes = notes?.filter((note: any) => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const handleCreate = () => {
    createNote({ title: 'Untitled Note', content: '' }, {
      onSuccess: (data: any) => {
        setSelectedNote(data.note)
        setIsModalOpen(true)
      }
    })
  }

  const handleEditIcon = () => {
    const newIcon = window.prompt('Enter an emoji for your Personal Notes icon:', user?.personal_notes_icon || '📝')
    if (newIcon !== null) {
      updateProfile({ personal_notes_icon: newIcon })
    }
  }

  const handleUpdateNote = (id: number, title: string, content: string) => {
    updateNote({ id, title, content })
  }

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this note?')) {
      deleteNote(id)
      if (selectedNote?.id === id) {
        setIsModalOpen(false)
        setSelectedNote(null)
      }
      toast.success('Note deleted')
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-2xl relative group cursor-pointer" onClick={handleEditIcon} title="Click to change icon">
            {user?.personal_notes_icon || '📝'}
            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit2 className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Personal Notes</h1>
            <p className="text-sm text-[var(--text-muted)]">Your private space for thoughts, drafts, and ideas.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input 
              type="text" 
              placeholder="Search notes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-sm focus:outline-none focus:border-brand-500 text-[var(--text-primary)] w-full sm:w-64"
            />
          </div>
          <button 
            onClick={handleCreate}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-[var(--text-muted)]">
          <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full mr-3" />
          Loading notes...
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-20 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-subtle)] shadow-sm">
          <div className="w-16 h-16 bg-brand-500/10 text-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-1">No notes found</h3>
          <p className="text-[var(--text-muted)] text-sm mb-6 max-w-sm mx-auto">Create a new note to start capturing your thoughts and ideas in your personal space.</p>
          <button 
            onClick={handleCreate}
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Your First Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredNotes.map((note: any) => (
            <div 
              key={note.id}
              onClick={() => { setSelectedNote(note); setIsModalOpen(true); }}
              className="group bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-brand-500 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col h-64"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-[var(--text-primary)] line-clamp-2 text-lg">{note.title}</h3>
                <button 
                  onClick={(e) => handleDelete(note.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex-1 text-sm text-[var(--text-secondary)] line-clamp-6 mb-4 whitespace-pre-wrap">
                {note.content || <span className="text-[var(--text-muted)] italic">Empty note...</span>}
              </div>

              <div className="mt-auto flex items-center text-[11px] text-[var(--text-muted)] font-medium">
                <Calendar className="w-3 h-3 mr-1.5" />
                {format(new Date(note.updated_at), 'MMM d, yyyy')}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedNote && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Edit Note"
          className="max-w-4xl h-[80vh] flex flex-col"
        >
          <div className="flex flex-col h-full gap-4 mt-4">
            <input 
              type="text" 
              value={selectedNote.title}
              onChange={(e) => {
                setSelectedNote({ ...selectedNote, title: e.target.value })
                handleUpdateNote(selectedNote.id, e.target.value, selectedNote.content)
              }}
              className="text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 px-0 text-[var(--text-primary)] placeholder-[var(--text-muted)]"
              placeholder="Note Title"
            />
            <textarea
              value={selectedNote.content}
              onChange={(e) => {
                setSelectedNote({ ...selectedNote, content: e.target.value })
                handleUpdateNote(selectedNote.id, selectedNote.title, e.target.value)
              }}
              className="flex-1 w-full bg-transparent border-none focus:outline-none focus:ring-0 px-0 text-[var(--text-secondary)] placeholder-[var(--text-muted)] resize-none leading-relaxed"
              placeholder="Start typing your note here..."
            />
          </div>
        </Modal>
      )}
    </div>
  )
}
