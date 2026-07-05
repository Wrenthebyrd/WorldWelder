import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import { Plus, ChevronsLeftRight, Pencil, Trash2 } from 'lucide-react'
import { db, createProject, deleteProjectCascade, type Project } from '@/db'
import { useUIStore } from '@/store/uiStore'
import { getProjectIcon } from '@/lib/projectIcons'
import { Logo } from '@/components/common/Logo'
import { ProjectModal } from './ProjectModal'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'

export function ProjectRail() {
  const projects = useLiveQuery(() => db.projects.orderBy('order').toArray(), []) ?? []
  const { activeProjectId, setActiveProject, railExpanded, toggleRail } = useUIStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState<Project | null>(null)
  const [dragId, setDragId] = useState<number | null>(null)

  async function handleCreate(data: Pick<Project, 'name' | 'description' | 'icon' | 'color'>) {
    const id = await createProject(data)
    setActiveProject(id)
    setModalOpen(false)
  }

  async function handleUpdate(data: Pick<Project, 'name' | 'description' | 'icon' | 'color'>) {
    if (!editing) return
    await db.projects.update(editing.id!, { ...data, updatedAt: Date.now() })
    setEditing(null)
  }

  async function handleDelete() {
    if (!deleting) return
    const wasActive = activeProjectId === deleting.id
    await deleteProjectCascade(deleting.id!)
    if (wasActive) setActiveProject(null)
    setDeleting(null)
  }

  async function reorder(overId: number) {
    if (dragId === null || dragId === overId) return
    const items = [...projects]
    const fromIdx = items.findIndex((p) => p.id === dragId)
    const toIdx = items.findIndex((p) => p.id === overId)
    if (fromIdx === -1 || toIdx === -1) return
    const [moved] = items.splice(fromIdx, 1)
    items.splice(toIdx, 0, moved)
    await db.transaction('rw', db.projects, async () => {
      await Promise.all(items.map((p, idx) => db.projects.update(p.id!, { order: idx })))
    })
  }

  return (
    <div
      className={`h-full flex flex-col items-center py-4 gap-2 border-r border-panel-border shrink-0 transition-all duration-300 ${
        railExpanded ? 'w-52' : 'w-16'
      }`}
    >
      <div className={`flex items-center gap-2 mb-3 px-2 ${railExpanded ? 'self-start' : ''}`}>
        <Logo size={30} />
        {railExpanded && <span className="font-display text-sm glow-text whitespace-nowrap">WorldWelder</span>}
      </div>

      <div className="flex-1 w-full overflow-y-auto rune-scrollbar flex flex-col gap-1.5 px-2">
        {projects.map((p) => {
          const Icon = getProjectIcon(p.icon)
          const active = p.id === activeProjectId
          return (
            <motion.div
              key={p.id}
              draggable
              onDragStart={() => setDragId(p.id!)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => reorder(p.id!)}
              className="group relative"
            >
              <button
                type="button"
                onClick={() => setActiveProject(p.id!)}
                title={p.name}
                className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 transition-colors ${
                  active ? 'glass' : 'hover:bg-panel-border/30'
                }`}
                style={active ? { boxShadow: `0 0 0 1px ${p.color}40, 0 0 24px -6px ${p.color}80` } : undefined}
              >
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${p.color}22`, color: p.color }}
                >
                  <Icon size={16} />
                </span>
                {railExpanded && (
                  <span className="text-sm truncate text-ink" title={p.name}>
                    {p.name}
                  </span>
                )}
              </button>
              {railExpanded && (
                <div className="absolute right-1.5 top-1.5 hidden group-hover:flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditing(p)
                    }}
                    className="w-6 h-6 rounded-md flex items-center justify-center bg-bg-elevated/80 text-ink-dim hover:text-accent-a"
                  >
                    <Pencil size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleting(p)
                    }}
                    className="w-6 h-6 rounded-md flex items-center justify-center bg-bg-elevated/80 text-ink-dim hover:text-red-400"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              )}
            </motion.div>
          )
        })}

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          title="New project"
          className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-ink-dim hover:text-accent-a hover:bg-panel-border/30 transition-colors border border-dashed border-panel-border mt-1"
        >
          <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
            <Plus size={16} />
          </span>
          {railExpanded && <span className="text-sm">New project</span>}
        </button>
      </div>

      <button
        type="button"
        onClick={toggleRail}
        title={railExpanded ? 'Collapse' : 'Expand'}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-dim hover:text-ink hover:bg-panel-border/30 transition-colors"
      >
        <ChevronsLeftRight size={15} />
      </button>

      <ProjectModal open={modalOpen} title="New Project" onSave={handleCreate} onClose={() => setModalOpen(false)} />
      <ProjectModal
        open={!!editing}
        title="Edit Project"
        initial={editing ?? undefined}
        onSave={handleUpdate}
        onClose={() => setEditing(null)}
      />
      <ConfirmDialog
        open={!!deleting}
        title={`Delete "${deleting?.name}"?`}
        description="This permanently deletes the project along with all its chapters, characters, world entries, and images. This cannot be undone."
        confirmLabel="Delete project"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
