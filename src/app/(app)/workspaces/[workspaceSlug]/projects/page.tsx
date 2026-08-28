"use client"

import { useState, use } from "react"
import Link from "next/link"
import { Plus, FolderKanban, MoreHorizontal, ArrowRight } from "lucide-react"
import { useProjects } from "@/lib/hooks"
import { CreateProjectModal } from "@/components/projects/create-project-modal"
import { ProjectSettingsModal } from "@/components/projects/project-settings-modal"

export default function ProjectsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>
}) {
  const resolvedParams = use(params);
  const { data: projects, isLoading, error, refetch } = useProjects(resolvedParams.workspaceSlug)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [settingsModalProject, setSettingsModalProject] = useState<any | null>(null)

  const baseUrl = `/workspaces/${resolvedParams.workspaceSlug}/projects`

  if (isLoading) return <div className="p-10 text-center text-[var(--text-muted)] animate-pulse">Loading projects...</div>
  if (error) return <div className="p-10 text-center text-red-500">Failed to load projects.</div>

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-2">Projects</h1>
          <p className="text-[var(--text-secondary)]">Manage your initiatives and modules within this workspace.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects && projects.length > 0 ? projects.map((project: any) => (
          <Link 
            key={project.id} 
            href={`${baseUrl}/${project.id}`}
            className="group flex flex-col bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl p-5 hover:shadow-lg hover:border-brand-500/30 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                {project.icon ? (
                  <span className="text-xl">{project.icon}</span>
                ) : (
                  <FolderKanban className="w-5 h-5" />
                )}
              </div>
              <button 
                onClick={(e) => {
                  e.preventDefault()
                  setSettingsModalProject(project)
                }}
                className="p-1 rounded-md text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            
            <h3 className="font-semibold text-lg text-[var(--text-primary)] mb-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{project.name}</h3>
            <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-6 flex-1">{project.description || "No description provided."}</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)] mt-auto">
              <span className={`text-xs font-medium px-2 py-1 rounded-md capitalize ${
                project.status === 'active' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                project.status === 'done' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                (project.status === 'waiting/hold' || project.status === 'waiting' || project.status === 'hold') ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                'bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-transparent'
              }`}>
                {project.status || 'Active'}
              </span>
              <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-brand-500 transform group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        )) : (
          <div className="col-span-full p-10 border border-dashed border-[var(--border-subtle)] rounded-xl text-center">
            <p className="text-[var(--text-muted)]">No projects found. Create one to get started.</p>
          </div>
        )}
      </div>

      <CreateProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => refetch()}
        workspaceId={resolvedParams.workspaceSlug}
      />

      <ProjectSettingsModal
        isOpen={!!settingsModalProject}
        onClose={() => setSettingsModalProject(null)}
        workspaceId={resolvedParams.workspaceSlug}
        project={settingsModalProject}
      />
    </div>
  )
}
