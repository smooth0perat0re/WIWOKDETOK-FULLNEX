"use client"

import { useState } from 'react'
import { Inbox as InboxIcon, CheckCircle2, Clock, MailOpen, Mail, Trash2, Flag, MoreVertical } from 'lucide-react'
import { useNotifications, useMarkNotificationRead, useRemindNotification, useFlagNotification, useDeleteNotification, useInboxInvitations, useRespondInvitation } from '@/lib/hooks'

export default function InboxPage() {
  const { data: notifications, isLoading: isNotifLoading } = useNotifications()
  const { data: invitations, isLoading: isInvLoading } = useInboxInvitations()
  const { mutate: markAsRead } = useMarkNotificationRead()
  const { mutate: remindNotification } = useRemindNotification()
  const { mutate: flagNotification } = useFlagNotification()
  const { mutate: deleteNotification } = useDeleteNotification()
  const { mutate: respondInvitation } = useRespondInvitation()

  const [selectedId, setSelectedId] = useState<string | number | null>(null)
  const [snoozeOpenFor, setSnoozeOpenFor] = useState<string | number | null>(null)
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([])

  const allItems = [
    ...(notifications || []).map((n: any) => ({ ...n, itemType: 'notification' })),
    ...(invitations || []).map((i: any) => ({ 
        id: `inv-${i.id}`, 
        originalId: i.id,
        itemType: 'invitation',
        title: `Workspace Invitation: ${i.workspace_name}`,
        message: `${i.inviter_name} has invited you to join the workspace "${i.workspace_name}".`,
        created_at: i.created_at,
        is_read: false,
        type: 'invitation'
    }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const selectedItem = allItems.find((n: any) => n.id === selectedId)

  const handleMarkAsRead = (id: number) => {
    markAsRead(id)
  }

  const handleSnooze = (id: number, hours: number) => {
    const remindAt = new Date()
    remindAt.setHours(remindAt.getHours() + hours)
    remindNotification({ id, remindAt: remindAt.toISOString() })
    setSnoozeOpenFor(null)
  }

  const handleToggleSelect = (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation()
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleSelectAll = () => {
    if (selectedIds.length === allItems.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(allItems.map((n: any) => n.id))
    }
  }

  const handleDelete = (id: string | number) => {
    const item = allItems.find(i => i.id === id);
    if (item?.itemType === 'notification') {
        deleteNotification(item.id)
    } else if (item?.itemType === 'invitation') {
        respondInvitation({ id: item.originalId, status: 'rejected' })
    }
    if (selectedId === id) setSelectedId(null)
  }

  if (isNotifLoading || isInvLoading) {
    return <div className="p-10 text-center text-[var(--text-muted)] animate-pulse">Loading inbox...</div>
  }

  return (
    <div className="absolute inset-1 flex bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl overflow-hidden shadow-sm z-10">
      
      {/* Left Pane: List */}
      <div className="w-1/3 min-w-[320px] border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex flex-col">
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0 bg-[var(--bg-primary)]">
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-[var(--border-subtle)] cursor-pointer"
              checked={allItems.length > 0 && selectedIds.length === allItems.length}
              onChange={handleSelectAll}
            />
            <h2 className="font-semibold text-[var(--text-primary)]">Inbox</h2>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
               <span className="text-xs text-brand-500 font-medium">{selectedIds.length} selected</span>
            )}
            <span className="text-xs font-medium bg-brand-500/10 text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded-full">
              {allItems.filter((n: any) => !n.is_read).length || 0} unread
            </span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {allItems.length > 0 ? (
            allItems.map((notif: any) => {
              const isSelected = selectedId === notif.id;
              const isUnread = !notif.is_read;
              const date = new Date(notif.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
              
              return (
                <div 
                  key={notif.id}
                  onClick={() => setSelectedId(notif.id)}
                  className={`p-4 border-b border-[var(--border-subtle)] cursor-pointer transition-colors relative group flex gap-3 ${isSelected ? 'bg-brand-50 dark:bg-brand-500/10' : 'hover:bg-[var(--bg-tertiary)]'}`}
                >
                  {isUnread && !isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500"></div>}
                  
                  <div className="pt-0.5">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-[var(--border-subtle)] cursor-pointer"
                      checked={selectedIds.includes(notif.id)}
                      onClick={(e) => handleToggleSelect(e, notif.id)}
                      onChange={() => {}}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-1.5 min-w-0 pr-2">
                        {notif.is_flagged && <Flag className="w-3.5 h-3.5 text-orange-500 shrink-0 fill-orange-500" />}
                        <h3 className={`text-sm truncate ${isUnread ? 'font-bold text-[var(--text-primary)]' : 'font-medium text-[var(--text-secondary)]'}`}>
                          {notif.title}
                        </h3>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] shrink-0">{date}</span>
                    </div>
                    <p className={`text-xs line-clamp-2 pr-6 ${isUnread ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]'}`}>
                      {notif.message}
                    </p>
                  </div>
                  
                  {/* Quick actions on hover */}
                  <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(notif.id) }}
                      className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] p-6 text-center">
              <InboxIcon className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">You're all caught up!</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Detail */}
      <div className="flex-1 flex flex-col bg-[var(--bg-primary)]">
        {selectedItem ? (
          <>
            <div className="p-6 border-b border-[var(--border-subtle)] shrink-0 flex justify-between items-start gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">{selectedItem.title}</h2>
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <span className="font-medium bg-[var(--bg-tertiary)] px-2 py-0.5 rounded">{selectedItem.type.replace('_', ' ').toUpperCase()}</span>
                  <span>•</span>
                  <span>{new Date(selectedItem.created_at).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 relative">
                {selectedItem.itemType === 'notification' && (
                  <>
                    <button 
                      onClick={() => flagNotification(selectedItem.id as number)}
                      className={`p-2 rounded-md transition-colors ${selectedItem.is_flagged ? 'text-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'text-[var(--text-secondary)] hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10'}`}
                      title={selectedItem.is_flagged ? 'Remove flag' : 'Flag as important'}
                    >
                      <Flag className={`w-4 h-4 ${selectedItem.is_flagged ? 'fill-orange-500' : ''}`} />
                    </button>
                    <button 
                      onClick={() => handleMarkAsRead(selectedItem.id as number)}
                      disabled={selectedItem.is_read}
                      className="p-2 text-[var(--text-secondary)] hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-md transition-colors disabled:opacity-50"
                      title="Mark as read"
                    >
                      {selectedItem.is_read ? <MailOpen className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => setSnoozeOpenFor(snoozeOpenFor === selectedItem.id ? null : selectedItem.id)}
                      className="p-2 text-[var(--text-secondary)] hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-md transition-colors"
                      title="Remind me later"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                  </>
                )}
                
                <div className="w-px h-5 bg-[var(--border-subtle)] mx-1"></div>
                <button 
                  onClick={() => handleDelete(selectedItem.id)}
                  className="p-2 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                  title={selectedItem.itemType === 'invitation' ? 'Decline' : 'Delete'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                {/* Snooze Dropdown */}
                {snoozeOpenFor === selectedItem.id && selectedItem.itemType === 'notification' && (
                  <div className="absolute right-0 top-10 w-48 bg-[var(--bg-primary)] border border-[var(--border-subtle)] shadow-lg rounded-md overflow-hidden z-10 animate-in fade-in zoom-in-95">
                    <button onClick={() => handleSnooze(selectedItem.id as number, 12)} className="w-full text-left px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                      In 12 hours
                    </button>
                    <button onClick={() => handleSnooze(selectedItem.id as number, 24)} className="w-full text-left px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                      Tomorrow
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="prose prose-sm dark:prose-invert max-w-none text-[var(--text-secondary)]">
                {selectedItem.message.split('\n').map((line: string, i: number) => (
                  <p key={i} className="mb-2">{line}</p>
                ))}
              </div>
              
              {selectedItem.itemType === 'invitation' && (
                <div className="mt-8 flex gap-3">
                  <button 
                    onClick={() => {
                        respondInvitation({ id: selectedItem.originalId, status: 'accepted' })
                        setSelectedId(null)
                    }}
                    className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Accept Invitation
                  </button>
                  <button 
                    onClick={() => {
                        respondInvitation({ id: selectedItem.originalId, status: 'rejected' })
                        setSelectedId(null)
                    }}
                    className="bg-[var(--bg-tertiary)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)]">
            <Mail className="w-16 h-16 mb-4 opacity-10" />
            <p className="text-sm">Select an item to read</p>
          </div>
        )}
      </div>

    </div>
  )
}
