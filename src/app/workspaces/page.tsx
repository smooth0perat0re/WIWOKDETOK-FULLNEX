"use client"

import { useState, useEffect, useRef } from 'react'
import { Plus, Maximize2, Link as LinkIcon, FileText, Layers, Search, Clock, CloudSun, ChevronDown, X, Upload, Pencil, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useQuicklinks, useAddQuicklink, useUpdateQuicklink, useDeleteQuicklink, useRecents, useStickies, useAddSticky, useUpdateSticky, useDeleteSticky, useDashboardPhotos, useAddDashboardPhoto, useDeleteDashboardPhoto } from '@/lib/hooks'
import { WeeklyActivityChart } from '@/components/dashboard/weekly-activity-chart'
import { TodoList } from '@/components/dashboard/todo-list'
import { toast } from 'sonner'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mounted, setMounted] = useState(false)
  
  const { data: quicklinks } = useQuicklinks()
  const { data: recents } = useRecents()
  const { data: stickies } = useStickies()

  const [isQuicklinkModalOpen, setQuicklinkModalOpen] = useState(false)
  const [editingQuicklink, setEditingQuicklink] = useState<any>(null)
  const [isStickyModalOpen, setStickyModalOpen] = useState(false)
  const [editingSticky, setEditingSticky] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'recents' | 'sticky'>('recents')
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false)
  const [rightTab, setRightTab] = useState<'chart' | 'todo'>('chart')
  const [isRightTabDropdownOpen, setIsRightTabDropdownOpen] = useState(false)

  const { mutate: deleteQuicklink } = useDeleteQuicklink()
  const { mutate: deleteSticky } = useDeleteSticky()

  const { data: photos, isLoading: photosLoading } = useDashboardPhotos()
  const { mutateAsync: addPhoto } = useAddDashboardPhoto()
  const { mutate: deletePhoto } = useDeleteDashboardPhoto()
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('file_location', '/worktracker/dashboard');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      if (data.status && data.data && data.data.url) {
        await addPhoto({ photo_url: data.data.url });
        toast.success('Photo added');
      } else {
        throw new Error('Invalid response from CDN');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  if (!mounted) return null

  const hour = currentTime.getHours()
  const minute = currentTime.getMinutes()
  let greeting = ''
  let specialMessage = ''

  if (hour >= 21 || hour < 6) {
    greeting = 'Hallo users!'
    specialMessage = 'Jangan lupa istirahat, kerja bisa dilakukan nanti tapi quality time tidak akan terulang kembali. Jangan lupa makan, berolahraga, istirahat, menghabiskan waktu dengan keluarga dan bahagiakan diri sendiri ya.'
  } else if (hour === 9 && minute <= 15) {
    greeting = 'Good morning'
    specialMessage = 'Jam rawan nih udah ngopi belum? ngopi ngapa ngopi! ☕'
  } else if (hour === 12) {
    greeting = 'Good afternoon'
    specialMessage = 'Hai ganteng atau cantik, udah jam makan siang nih. Jangan lupa makan ya kamu💖'
  } else if (hour >= 6 && hour < 12) {
    greeting = 'Good morning'
  } else if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon'
  } else if (hour >= 17 && hour < 21) {
    greeting = 'Good evening'
  }

  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' }
  const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false }
  const dateString = `${currentTime.toLocaleDateString('en-US', dateOptions)} ${currentTime.toLocaleTimeString('en-US', timeOptions)}`

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      {/* Top Grid for Greetings and Quicklinks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 shrink-0">
        <div className="lg:col-span-2 text-center flex flex-col items-center">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
            {greeting}, {user?.name || 'Guest'}
          </h1>
          {specialMessage ? (
            <p className="text-sm text-[var(--text-secondary)] max-w-2xl mb-2 leading-relaxed">
              {specialMessage}
            </p>
          ) : null}
          <div className="flex items-center justify-center gap-1.5 text-sm text-[var(--text-secondary)]">
            <CloudSun className="w-4 h-4 text-yellow-500" />
            <span>{dateString}</span>
          </div>
        </div>

        <div className="lg:col-span-1 relative z-10">
          {/* Quicklinks (absolutely positioned to align with Breadcrumbs above) */}
          <div className="hidden lg:block absolute left-0 -top-[44px]">
            <div className="flex flex-col items-start">
              <div className="flex items-center justify-start mb-4">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">Quicklinks</h2>
              </div>
              <div className="flex gap-4 justify-start">
                {quicklinks && quicklinks.length > 0 ? quicklinks.map((ql: any) => {
                  let hostname = ql.url
                  try {
                    hostname = new URL(ql.url).hostname
                  } catch (e) {}
                  return (
                    <div key={ql.id} className="relative group w-[100px] flex flex-col items-center gap-3">
                      <a href={ql.url} target="_blank" rel="noreferrer" className="flex flex-col items-center w-full p-2 hover:bg-[var(--bg-tertiary)] rounded-xl transition-colors">
                        <div className="w-14 h-14 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] group-hover:shadow-md flex items-center justify-center shrink-0 overflow-hidden transition-all duration-300 relative">
                          <img src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=64`} alt={ql.title} className="w-7 h-7 object-contain" />
                        </div>
                        <div className="text-xs font-medium text-[var(--text-primary)] truncate w-full text-center mt-3">
                          {ql.title}
                        </div>
                      </a>
                      <div className="absolute top-0 right-0 hidden group-hover:flex items-center gap-1 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-full p-1 shadow-sm z-10">
                        <button onClick={(e) => { e.preventDefault(); setEditingQuicklink(ql); setQuicklinkModalOpen(true); }} className="p-1 text-[var(--text-muted)] hover:text-blue-500 rounded-full transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => { e.preventDefault(); if (confirm('Delete quicklink?')) deleteQuicklink(ql.id); }} className="p-1 text-[var(--text-muted)] hover:text-red-500 rounded-full transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                }) : null}
                
                <button onClick={() => { setEditingQuicklink(null); setQuicklinkModalOpen(true); }} className="flex flex-col items-center gap-3 w-[100px] group p-2 hover:bg-[var(--bg-tertiary)] rounded-xl transition-colors">
                  <div className="w-14 h-14 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] group-hover:shadow-md flex items-center justify-center shrink-0 transition-all duration-300">
                    <Plus className="w-6 h-6 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
                  </div>
                  <div className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] truncate w-full text-center transition-colors">
                    Tambahkan...
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 flex-1 min-h-0">
        <div className="lg:col-span-2 flex flex-col gap-10 min-h-0">

          {/* Remember what you work for */}
          <div className="shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                Remember what you work for
                {isUploadingPhoto && <span className="text-xs text-brand-500 animate-pulse">Uploading...</span>}
              </h2>
            </div>
            <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl p-6 flex flex-wrap justify-between gap-4">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                className="hidden"
              />

              {Array.from({ length: 4 }).map((_, i) => {
                const photo = photos?.[i];

                return photo ? (
                  <PhotoTile key={photo.id} photo={photo} onDelete={deletePhoto} />
                ) : (
                  <div key={`empty-${i}`} className="flex-1 min-w-[150px] h-32 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg overflow-hidden relative group">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center opacity-50 cursor-pointer hover:opacity-100 hover:bg-[var(--bg-tertiary)] transition-all"
                    >
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto rounded bg-[var(--bg-tertiary)] flex items-center justify-center mb-2 shadow-sm">
                          <Plus className="w-6 h-6 text-[var(--text-muted)] group-hover:text-brand-500 transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recents & Sticky Notes Tabs */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-6 mb-3 relative shrink-0">
              <div className="relative">
                <button 
                  onClick={() => setIsTabDropdownOpen(!isTabDropdownOpen)}
                  className="text-sm font-semibold flex items-center gap-1 transition-colors text-[var(--text-primary)]"
                >
                  {activeTab === 'recents' ? 'Recents' : 'Sticky Notes'} <ChevronDown className={`w-3.5 h-3.5 opacity-50 transition-transform ${isTabDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isTabDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 z-20 flex flex-col gap-1 w-48 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl shadow-xl overflow-hidden">
                    <button onClick={() => { setActiveTab('recents'); setIsTabDropdownOpen(false); }} className={`text-sm font-semibold text-left px-4 py-2 hover:bg-[var(--bg-secondary)] whitespace-nowrap transition-colors ${activeTab === 'recents' ? 'bg-[var(--bg-tertiary)]' : ''}`}>
                      Recents
                    </button>
                    <button onClick={() => { setActiveTab('sticky'); setIsTabDropdownOpen(false); }} className={`text-sm font-semibold text-left px-4 py-2 hover:bg-[var(--bg-secondary)] whitespace-nowrap transition-colors ${activeTab === 'sticky' ? 'bg-[var(--bg-tertiary)]' : ''}`}>
                      Sticky Notes
                    </button>
                  </div>
                )}
              </div>
              
              <div className="ml-auto flex items-center gap-3">
                {activeTab === 'recents' ? (
                  null
                ) : (
                  <>
                    <button className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><Search className="w-4 h-4" /></button>
                    <button onClick={() => { setEditingSticky(null); setStickyModalOpen(true); }} className="text-sm text-brand-500 hover:text-brand-600 flex items-center gap-1 font-medium">
                      <Plus className="w-3.5 h-3.5" /> Add sticky
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl p-10 flex flex-col items-center justify-center text-center min-h-[300px] flex-1">
              {activeTab === 'recents' ? (
                recents && recents.length > 0 ? (
                  <ul className="w-full text-left self-start">
                    {recents.map((recent: any) => (
                      <li key={recent.id} className="text-sm text-[var(--text-secondary)] py-2 border-b border-[var(--border-subtle)] last:border-0">{recent.action} - {recent.target_title}</li>
                    ))}
                  </ul>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-muted)] mb-4">
                      <Layers className="w-6 h-6 opacity-50" />
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">You don't have any recents yet.</p>
                  </>
                )
              ) : (
                stickies && stickies.length > 0 ? (
                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 self-start">
                    {stickies.map((sticky: any) => (
                      <div key={sticky.id} className={`p-4 rounded-lg text-left shadow-sm relative group ${sticky.color === 'yellow' ? 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-100' : 'bg-[var(--bg-tertiary)]'}`}>
                        <p className="text-sm whitespace-pre-wrap">{sticky.content}</p>
                        <div className="absolute top-2 right-2 hidden group-hover:flex gap-1 bg-black/10 dark:bg-black/40 rounded-full p-1">
                          <button onClick={() => { setEditingSticky(sticky); setStickyModalOpen(true); }} className="p-1 text-black/50 hover:text-blue-600 dark:text-white/50 dark:hover:text-blue-400 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { if (confirm('Delete sticky note?')) deleteSticky(sticky.id); }} className="p-1 text-black/50 hover:text-red-600 dark:text-white/50 dark:hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-muted)] mb-4">
                      <FileText className="w-6 h-6 opacity-50" />
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">Jot down an idea, capture an aha, or record a brainwave. Add a sticky to get started.</p>
                  </>
                )
              )}
            </div>
          </div>

        </div> {/* End of lg:col-span-2 */}

        <div className="lg:col-span-1 flex flex-col relative min-h-0">
          <div className="flex items-center gap-6 mb-3 relative z-30 shrink-0">
            <div className="relative">
              <button 
                onClick={() => setIsRightTabDropdownOpen(!isRightTabDropdownOpen)}
                className="text-sm font-semibold flex items-center gap-1 transition-colors text-[var(--text-primary)]"
              >
                {rightTab === 'chart' ? 'What has been done...?' : 'What to do..?'} <ChevronDown className={`w-3.5 h-3.5 opacity-50 transition-transform ${isRightTabDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isRightTabDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 flex flex-col gap-1 w-48 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl shadow-xl overflow-hidden">
                  <button onClick={() => { setRightTab('chart'); setIsRightTabDropdownOpen(false); }} className={`text-sm font-semibold text-left px-4 py-2 hover:bg-[var(--bg-secondary)] whitespace-nowrap transition-colors ${rightTab === 'chart' ? 'bg-[var(--bg-tertiary)]' : ''}`}>
                    What has been done...?
                  </button>
                  <button onClick={() => { setRightTab('todo'); setIsRightTabDropdownOpen(false); }} className={`text-sm font-semibold text-left px-4 py-2 hover:bg-[var(--bg-secondary)] whitespace-nowrap transition-colors ${rightTab === 'todo' ? 'bg-[var(--bg-tertiary)]' : ''}`}>
                    What to do..?
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-[300px]">
            {rightTab === 'chart' ? (
              <WeeklyActivityChart type="dashboard" hideTitle={true} />
            ) : (
              <TodoList />
            )}
          </div>
        </div>
      </div> {/* End of grid */}

      <QuicklinkModal isOpen={isQuicklinkModalOpen} onClose={() => setQuicklinkModalOpen(false)} initialData={editingQuicklink} />
      <StickyModal isOpen={isStickyModalOpen} onClose={() => setStickyModalOpen(false)} initialData={editingSticky} />
    </div>
  )
}

function PhotoTile({ photo, onDelete }: { photo: any, onDelete: (id: any) => void }) {
  const [isPinned, setIsPinned] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const isOpen = isPinned || isHovering

  // Unpin when clicking anywhere except this tile itself (image click below toggles pin)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && wrapperRef.current.contains(event.target as Node)) {
        return
      }
      setIsPinned(false)
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div
      ref={wrapperRef}
      className="relative flex-1 min-w-[150px]"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        onClick={() => setIsPinned((prev) => !prev)}
        className="h-32 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg overflow-hidden relative group cursor-pointer"
      >
        <img src={photo.photo_url} alt="Motivation" className="w-full h-full object-cover" />
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(photo.id) }}
          className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl shadow-xl p-1.5 animate-in fade-in slide-in-from-top-2">
          <img src={photo.photo_url} alt="Motivation preview" className="max-w-[280px] max-h-[280px] w-auto h-auto object-contain rounded-lg" />
        </div>
      )}
    </div>
  )
}

function QuicklinkModal({ isOpen, onClose, initialData }: { isOpen: boolean, onClose: () => void, initialData?: any }) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const { mutate: addQuicklink, isPending: isAdding } = useAddQuicklink()
  const { mutate: updateQuicklink, isPending: isUpdating } = useUpdateQuicklink()
  
  const isPending = isAdding || isUpdating;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title)
        setUrl(initialData.url)
      } else {
        setTitle('')
        setUrl('')
      }
    }
  }, [isOpen, initialData])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !url) return
    
    if (initialData) {
      updateQuicklink({ id: initialData.id, title, url }, {
        onSuccess: () => { onClose() }
      })
    } else {
      addQuicklink({ title, url }, {
        onSuccess: () => { onClose() }
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
          <h3 className="font-medium text-[var(--text-primary)]">{initialData ? 'Edit situs web' : 'Tambahkan situs web'}</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Nama</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-brand-500" 
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">URL</label>
            <input 
              type="text" 
              value={url} 
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-brand-500" 
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={isPending} className="flex-1 bg-[var(--bg-tertiary)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] px-4 py-2 rounded-md text-sm font-medium transition-colors">
              {initialData ? 'Simpan' : 'Tambahkan'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-[var(--bg-tertiary)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function StickyModal({ isOpen, onClose, initialData }: { isOpen: boolean, onClose: () => void, initialData?: any }) {
  const [content, setContent] = useState('')
  const { mutate: addSticky, isPending: isAdding } = useAddSticky()
  const { mutate: updateSticky, isPending: isUpdating } = useUpdateSticky()
  
  const isPending = isAdding || isUpdating;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setContent(initialData.content)
      } else {
        setContent('')
      }
    }
  }, [isOpen, initialData])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content) return
    
    if (initialData) {
      updateSticky({ id: initialData.id, content }, {
        onSuccess: () => { onClose() }
      })
    } else {
      addSticky({ content }, {
        onSuccess: () => { onClose() }
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
          <h3 className="font-medium text-[var(--text-primary)]">{initialData ? 'Edit Sticky Note' : 'Tambahkan Sticky Note'}</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          <div>
            <textarea 
              value={content} 
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-32 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-brand-500 resize-none" 
              placeholder="Jot down an idea..."
              autoFocus
            />
          </div>
          <div className="flex gap-2 pt-2 justify-end">
            <button type="button" onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Batal
            </button>
            <button type="submit" disabled={isPending} className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm">
              {initialData ? 'Simpan' : 'Tambahkan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
