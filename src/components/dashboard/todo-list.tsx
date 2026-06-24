"use client"

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { GripVertical, CheckCircle2, Circle, Trash2, Plus, ChevronDown } from 'lucide-react'
import { useTodos, useAddTodo, useUpdateTodo, useDeleteTodo, useReorderTodos } from '@/lib/hooks'

export function TodoList() {
  const [filter, setFilter] = useState<'yesterday' | 'today' | 'tomorrow'>('today')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  
  const { data: todos, isLoading } = useTodos(filter)
  const { mutate: addTodo, isPending: isAdding } = useAddTodo()
  const { mutate: updateTodo } = useUpdateTodo()
  const { mutate: deleteTodo } = useDeleteTodo()
  const { mutate: reorderTodos } = useReorderTodos()

  const [newTodo, setNewTodo] = useState('')
  const [localTodos, setLocalTodos] = useState<any[]>([])
  
  // Keep local state in sync with server data for optimistic dragging
  useEffect(() => {
    if (todos) {
      setLocalTodos(todos)
    }
  }, [todos])

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(localTodos)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update locally immediately
    setLocalTodos(items)

    // Send to backend
    const updatedPositions = items.map((item, index) => ({
      id: item.id,
      position: index + 1
    }))
    
    reorderTodos({ items: updatedPositions, filter })
  }

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim()) return
    addTodo({ content: newTodo, filter }, {
      onSuccess: () => setNewTodo('')
    })
  }

  return (
    <div className="flex flex-col h-full bg-[#18181b] border border-[var(--border-subtle)] rounded-xl relative">
      <div className="p-6 pb-2">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-full border border-[var(--border-subtle)] flex items-center justify-center bg-[#1f1f22]">
            <span className="text-lg font-semibold text-white">{todos?.length || 0}</span>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 text-sm bg-[#1f1f22] text-[var(--text-secondary)] hover:text-white px-4 py-1.5 rounded-full border border-[var(--border-subtle)] transition-colors"
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)} <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {isFilterOpen && (
              <div className="absolute top-full right-0 mt-2 w-32 bg-[#1f1f22] border border-[var(--border-subtle)] rounded-lg shadow-xl overflow-hidden z-20">
                {['yesterday', 'today', 'tomorrow'].map(f => (
                  <button
                    key={f}
                    onClick={() => { setFilter(f as any); setIsFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-[#27272a] transition-colors ${filter === f ? 'text-white' : 'text-[var(--text-secondary)]'}`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <h3 className="text-lg font-bold text-white mb-4">To do list</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {isLoading ? (
          <div className="text-center py-8 text-[var(--text-secondary)] text-sm">Loading...</div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="todos">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {localTodos.map((todo, index) => (
                    <Draggable key={todo.id.toString()} draggableId={todo.id.toString()} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`group flex items-center justify-between p-3 rounded-lg border transition-colors ${snapshot.isDragging ? 'bg-[#27272a] border-[#3f3f46] shadow-lg' : 'bg-[#1f1f22] border-transparent hover:border-[#3f3f46]'}`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div {...provided.dragHandleProps} className="text-[#52525b] hover:text-[#a1a1aa] transition-colors">
                              <GripVertical className="w-5 h-5" />
                            </div>
                            <span className={`text-sm truncate select-none ${todo.is_completed ? 'line-through text-[#71717a]' : 'text-white'}`}>
                              {todo.content}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => deleteTodo({ id: todo.id, filter })} className="text-[#52525b] hover:text-red-500 transition-colors p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => updateTodo({ id: todo.id, is_completed: !todo.is_completed, filter })} className="text-[#52525b] hover:text-white transition-colors p-1">
                              {todo.is_completed ? <CheckCircle2 className="w-5 h-5 text-white" /> : <Circle className="w-5 h-5" />}
                            </button>
                          </div>
                          {/* Force show checkbox when completed or on touch devices */}
                          <div className={`flex items-center gap-2 shrink-0 ${todo.is_completed ? '' : 'lg:hidden group-hover:hidden'}`}>
                             <button onClick={() => updateTodo({ id: todo.id, is_completed: !todo.is_completed, filter })} className="text-[#52525b] hover:text-white transition-colors p-1">
                              {todo.is_completed ? <CheckCircle2 className="w-5 h-5 text-white" /> : <Circle className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
        
        {/* Add Todo input */}
        <form onSubmit={handleAddTodo} className="mt-4 flex items-center gap-2">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add new task..."
            className="flex-1 bg-[#1f1f22] border border-[#3f3f46] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#52525b]"
          />
          <button type="submit" disabled={isAdding || !newTodo.trim()} className="bg-[#27272a] hover:bg-[#3f3f46] border border-[#3f3f46] text-white p-2.5 rounded-lg transition-colors disabled:opacity-50">
            <Plus className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  )
}
