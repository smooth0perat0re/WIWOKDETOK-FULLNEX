"use client"

import { useState, use, useEffect } from 'react'
import { Plus, SignalHigh, SignalMedium, SignalLow, GripVertical, Search } from 'lucide-react'
import { useTasks, useUpdateTaskStatus, useProjects } from '@/lib/hooks'
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core'
import { 
  SortableContext, 
  arrayMove, 
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'
import { CreateTaskModal } from '@/components/tasks/create-task-modal'
import { TaskSidePanel } from '@/components/tasks/task-side-panel'
import { ReviewerModal } from '@/components/tasks/reviewer-modal'
import { ProjectSettingsModal } from '@/components/projects/project-settings-modal'
import { Settings } from 'lucide-react'
import { ProjectNotesWidget } from '@/components/projects/project-notes-widget'
import { WeeklyActivityChart } from '@/components/dashboard/weekly-activity-chart'
import { LoadingSection } from '@/components/ui/loading-section'
import { ErrorSection } from '@/components/ui/error-section'
const COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: 'bg-neutral-500' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'ready_to_test', title: 'Ready to Test', color: 'bg-yellow-500' },
  { id: 'in_review', title: 'In Review', color: 'bg-purple-500' },
  { id: 'not_passed', title: 'Not Passed', color: 'bg-red-500' },
  { id: 'done', title: 'Done', color: 'bg-green-500' },
]

const PriorityBadge = ({ level }: { level: string }) => {
  if (level === 'high') return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-500 border border-red-500/20 uppercase tracking-wider">High</span>
  if (level === 'medium') return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-orange-500/10 text-orange-500 border border-orange-500/20 uppercase tracking-wider">Medium</span>
  return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-wider">Low</span>
}

// --- Sortable Task Component ---
function SortableTask({ task, onClick }: { task: any, onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: { type: 'Task', task } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (isDragging) {
    return <div ref={setNodeRef} style={style} className="h-12 bg-[var(--bg-tertiary)] border-2 border-dashed border-brand-500 rounded-lg opacity-50" />
  }

  const icon = task.icon || '•'
  const progress = task.progress || 0

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      onClick={onClick}
      className="group bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg p-2.5 hover:shadow-sm hover:border-brand-500/40 transition-all cursor-grab active:cursor-grabbing relative flex items-center gap-3 ml-2"
    >
      <div className="absolute -left-4 opacity-0 group-hover:opacity-100 text-[var(--text-muted)] transition-opacity">
        <GripVertical className="w-4 h-4" />
      </div>
      
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-[var(--text-muted)] text-sm shrink-0">{icon}</span>
        <h4 className="font-medium text-[var(--text-primary)] text-sm truncate" title={task.title}>{task.title}</h4>
        
        {task.ticket_reference && (
          <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-1 rounded shrink-0 hidden sm:inline-block">
            {task.ticket_reference}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <PriorityBadge level={task.priority || 'low'} />
        <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] w-12 justify-end">
          <span className="text-[var(--text-muted)] scale-75">•</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  )
}

// --- Main Board Component ---
export default function TaskBoard({ params }: { params: Promise<{ workspaceSlug: string, projectId: string }> }) {
  const resolvedParams = use(params)
  const { data: fetchedTasks, isLoading, isError, refetch } = useTasks(resolvedParams.workspaceSlug, resolvedParams.projectId)
  const { data: projects } = useProjects(resolvedParams.workspaceSlug)
  const updateTaskMutation = useUpdateTaskStatus(resolvedParams.projectId)
  
  const [tasks, setTasks] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTask, setActiveTask] = useState<any | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any | null>(null)
  
  const [isReviewerModalOpen, setIsReviewerModalOpen] = useState(false)
  const [pendingReviewTask, setPendingReviewTask] = useState<any | null>(null)

  const currentProject = projects?.find((p: any) => p.id.toString() === resolvedParams.projectId)

  useEffect(() => {
    if (fetchedTasks) {
      setTasks(fetchedTasks)
    }
  }, [fetchedTasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find(t => t.id === active.id)
    if (task) setActiveTask(task)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const isActiveTask = active.data.current?.type === 'Task'
    const isOverTask = over.data.current?.type === 'Task'
    const isOverColumn = over.data.current?.type === 'Column'

    if (!isActiveTask) return

    setTasks((tasks) => {
      const activeIndex = tasks.findIndex((t) => t.id === activeId)
      
      if (isOverTask) {
        const overIndex = tasks.findIndex((t) => t.id === overId)
        if (tasks[activeIndex].status !== tasks[overIndex].status) {
          const newTasks = [...tasks]
          newTasks[activeIndex] = { ...newTasks[activeIndex], status: tasks[overIndex].status }
          return arrayMove(newTasks, activeIndex, overIndex)
        }
        return arrayMove(tasks, activeIndex, overIndex)
      }

      if (isOverColumn) {
        const newTasks = [...tasks]
        newTasks[activeIndex] = { ...newTasks[activeIndex], status: overId }
        return arrayMove(newTasks, activeIndex, activeIndex)
      }

      return tasks
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const activeTaskData = tasks.find(t => t.id === active.id)
    if (!activeTaskData) return

    const originalTask = fetchedTasks?.find((t: any) => t.id === active.id)
    if (originalTask && originalTask.status !== activeTaskData.status) {
      // Validate 'Done' rules locally (Backend also validates)
      if (activeTaskData.status === 'done') {
        toast.error("Review Required: Cannot move directly to Done. Needs approval.", { id: 'drag-error' })
        setTasks(fetchedTasks || [])
        return
      }

      if (activeTaskData.status === 'ready_to_test' || activeTaskData.status === 'in_review') {
        // Intercept and open reviewer modal
        setPendingReviewTask({ ...activeTaskData, targetStatus: activeTaskData.status })
        setIsReviewerModalOpen(true)
        // We revert visually for now until modal succeeds
        setTasks(fetchedTasks || [])
        return
      }

      try {
        await updateTaskMutation.mutateAsync({
          taskId: activeTaskData.id,
          status: activeTaskData.status,
        })
        toast.success("Status updated")
      } catch (error: any) {
        toast.error("Failed to update status")
        setTasks(fetchedTasks || []) // Revert
      }
    }
  }

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (task.ticket_reference && task.ticket_reference.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Project Board {currentProject ? `- ${currentProject.name}` : ''}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Manage and track development tasks</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)]" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all w-64 placeholder:text-[var(--text-muted)] text-[var(--text-primary)]"
            />
          </div>
          <button 
            onClick={() => setIsSettingsModalOpen(true)}
            className="bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-[var(--text-primary)] p-2 rounded-lg transition-colors flex items-center justify-center shadow-sm"
            title="Project Settings"
          >
            <Settings className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Create Task
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSection text="Loading project board..." className="flex-1" />
      ) : isError ? (
        <ErrorSection message="Failed to load project board" onRetry={refetch} className="flex-1" />
      ) : (
        <div className="flex-1 flex gap-6 overflow-hidden pb-4">
          <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCorners} 
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-6 h-full min-w-max px-1">
                {COLUMNS.map(col => {
                  const colTasks = filteredTasks.filter(t => t.status === col.id)
                  return (
                    <BoardColumn 
                      key={col.id} 
                      column={col} 
                      tasks={colTasks} 
                      onAddTask={() => setIsCreateModalOpen(true)}
                      onTaskClick={(task) => setSelectedTask(task)}
                    />
                  )
                })}
              </div>
              
              {/* Drag Overlay for smooth animations while dragging */}
              <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
                {activeTask ? <SortableTask task={activeTask} /> : null}
              </DragOverlay>
            </DndContext>
          </div>
          
          <div className="w-[320px] shrink-0 h-full hidden xl:flex flex-col bg-[var(--bg-secondary)]/50 rounded-xl border border-[var(--border-subtle)] animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent pointer-events-none"></div>
            
            <div className="flex-1 overflow-hidden p-3 pb-1 border-b border-[var(--border-subtle)]/50">
              <WeeklyActivityChart 
                type="project" 
                workspaceId={resolvedParams.workspaceSlug} 
                projectId={resolvedParams.projectId} 
                className="flex flex-col h-full relative"
              />
            </div>
            
            <div className="flex-1 overflow-hidden p-3 pt-2">
              <ProjectNotesWidget 
                workspaceId={resolvedParams.workspaceSlug} 
                projectId={resolvedParams.projectId} 
                className="flex flex-col h-full relative"
              />
            </div>
          </div>
        </div>
      )}

      <CreateTaskModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        workspaceId={resolvedParams.workspaceSlug}
        projectId={resolvedParams.projectId}
      />

      <TaskSidePanel 
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        workspaceId={resolvedParams.workspaceSlug}
        projectId={resolvedParams.projectId}
      />

      <ReviewerModal 
        isOpen={isReviewerModalOpen}
        onClose={() => {
          setIsReviewerModalOpen(false)
          setPendingReviewTask(null)
        }}
        task={pendingReviewTask}
        projectId={resolvedParams.projectId}
        workspaceSlug={resolvedParams.workspaceSlug}
        onSuccess={() => {
          setPendingReviewTask(null)
        }}
      />

      <ProjectSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        workspaceId={resolvedParams.workspaceSlug}
        project={currentProject}
      />
    </div>
  )
}

function BoardColumn({ column, tasks, onAddTask, onTaskClick }: { column: any, tasks: any[], onAddTask: () => void, onTaskClick: (task: any) => void }) {
  const { setNodeRef } = useSortable({ id: column.id, data: { type: 'Column', column } })

  return (
    <div ref={setNodeRef} className="w-[320px] flex flex-col h-full bg-[var(--bg-secondary)]/50 rounded-xl p-3 border border-[var(--border-subtle)]">
      <div className="flex items-center justify-between mb-3 px-1 shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${column.color}`} />
          <h3 className="font-semibold text-[var(--text-primary)] text-sm flex items-center gap-2">
            {column.title} <span className="bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-xs px-2 py-0.5 rounded-full">{tasks.length}</span>
          </h3>
        </div>
        <button className="p-1 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 px-1 custom-scrollbar">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableTask key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>
        
        <button 
          onClick={onAddTask}
          className="w-full py-2 flex items-center justify-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors border border-transparent border-dashed hover:border-[var(--border-subtle)] mt-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>
    </div>
  )
}
