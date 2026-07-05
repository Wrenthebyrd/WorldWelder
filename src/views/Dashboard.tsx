import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import { Globe2, Users, BookText, ArrowRight, Sparkles } from 'lucide-react'
import { db, createProject, type Project } from '@/db'
import { useUIStore } from '@/store/uiStore'
import { getProjectIcon } from '@/lib/projectIcons'
import { ProjectModal } from '@/components/shell/ProjectModal'
import { EmptyState } from '@/components/common/EmptyState'
import { Logo } from '@/components/common/Logo'

function StatCard({ icon: Icon, label, count, onClick }: { icon: typeof Globe2; label: string; count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass rounded-2xl p-5 flex flex-col items-start gap-3 text-left hover:-translate-y-0.5 transition-transform"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent-a/15 text-accent-a">
        <Icon size={18} />
      </div>
      <div>
        <div className="font-display text-2xl text-ink">{count}</div>
        <div className="text-xs text-ink-dim">{label}</div>
      </div>
    </button>
  )
}

export function Dashboard({ project }: { project: Project | null }) {
  const [modalOpen, setModalOpen] = useState(false)
  const { setActiveProject, setSection } = useUIStore()
  const allProjects = useLiveQuery(() => db.projects.orderBy('order').toArray(), []) ?? []

  const chapterCount = useLiveQuery(
    () => (project ? db.chapters.where('projectId').equals(project.id!).count() : Promise.resolve(0)),
    [project?.id],
  ) ?? 0
  const characterCount = useLiveQuery(
    () => (project ? db.characters.where('projectId').equals(project.id!).count() : Promise.resolve(0)),
    [project?.id],
  ) ?? 0
  const worldCount = useLiveQuery(
    () => (project ? db.worldEntries.where('projectId').equals(project.id!).count() : Promise.resolve(0)),
    [project?.id],
  ) ?? 0

  async function handleCreate(data: Pick<Project, 'name' | 'description' | 'icon' | 'color'>) {
    const id = await createProject(data)
    setActiveProject(id)
    setModalOpen(false)
  }

  if (!project) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-6">
        <div className="flex flex-col items-center text-center mb-10">
          <Logo size={64} spin />
          <h1 className="font-display text-3xl mt-4 glow-text">Welcome to WorldWelder</h1>
          <p className="text-ink-dim mt-2 max-w-md">
            Your forge for worlds, characters, and stories. Create a project to begin.
          </p>
        </div>

        {allProjects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {allProjects.map((p) => {
              const Icon = getProjectIcon(p.icon)
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveProject(p.id!)}
                  className="glass rounded-2xl p-4 flex items-center gap-3 text-left hover:-translate-y-0.5 transition-transform"
                >
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${p.color}22`, color: p.color }}
                  >
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate text-ink">{p.name}</div>
                    <div className="text-xs text-ink-dim truncate">{p.description || 'No description'}</div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        <button
          onClick={() => setModalOpen(true)}
          className="w-full py-3 rounded-xl bg-accent-a text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <Sparkles size={16} /> Forge a new project
        </button>

        <ProjectModal open={modalOpen} title="New Project" onSave={handleCreate} onClose={() => setModalOpen(false)} />
      </div>
    )
  }

  const Icon = getProjectIcon(project.icon)

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
        <span
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: `${project.color}22`, color: project.color }}
        >
          <Icon size={26} />
        </span>
        <div>
          <h1 className="font-display text-2xl text-ink">{project.name}</h1>
          <p className="text-sm text-ink-dim">{project.description || 'No description yet'}</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Globe2} label="World entries" count={worldCount} onClick={() => setSection('world')} />
        <StatCard icon={Users} label="Characters" count={characterCount} onClick={() => setSection('characters')} />
        <StatCard icon={BookText} label="Chapters" count={chapterCount} onClick={() => setSection('chapters')} />
      </div>

      {chapterCount === 0 && characterCount === 0 && worldCount === 0 && (
        <EmptyState
          icon={Sparkles}
          title="A blank world awaits"
          description="Start by sketching a location or faction in World, profiling your first character, or drafting a chapter."
          action={
            <div className="flex gap-2">
              <button
                onClick={() => setSection('world')}
                className="px-4 py-2 rounded-xl bg-accent-a/15 text-accent-a text-sm hover:bg-accent-a/25 transition-colors flex items-center gap-1.5"
              >
                Build the world <ArrowRight size={14} />
              </button>
              <button
                onClick={() => setSection('chapters')}
                className="px-4 py-2 rounded-xl bg-panel-border/30 text-ink text-sm hover:bg-panel-border/50 transition-colors flex items-center gap-1.5"
              >
                Start writing <ArrowRight size={14} />
              </button>
            </div>
          }
        />
      )}
    </div>
  )
}
