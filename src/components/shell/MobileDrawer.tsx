import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { db, createProject, type Project } from '@/db'
import { useUIStore } from '@/store/uiStore'
import { getProjectIcon } from '@/lib/projectIcons'
import { NAV_ITEMS } from '@/lib/navItems'
import { Logo } from '@/components/common/Logo'
import { ProjectModal } from './ProjectModal'

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const projects = useLiveQuery(() => db.projects.orderBy('order').toArray(), []) ?? []
  const { activeProjectId, setActiveProject, section, setSection } = useUIStore()
  const [modalOpen, setModalOpen] = useState(false)

  async function handleCreate(data: Pick<Project, 'name' | 'description' | 'icon' | 'color'>) {
    const id = await createProject(data)
    setActiveProject(id)
    setModalOpen(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-y-0 left-0 z-50 w-72 glass flex flex-col rune-scrollbar overflow-y-auto"
            initial={{ x: -288 }}
            animate={{ x: 0 }}
            exit={{ x: -288 }}
            transition={{ type: 'tween', duration: 0.22 }}
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Logo size={26} />
                <span className="font-display text-sm glow-text">WorldWelder</span>
              </div>
              <button onClick={onClose} className="text-ink-dim hover:text-ink p-1">
                <X size={18} />
              </button>
            </div>

            <div className="px-3 mb-3">
              <p className="text-[10px] uppercase tracking-wide text-ink-dim px-2 mb-1.5">Projects</p>
              <div className="flex flex-col gap-1">
                {projects.map((p) => {
                  const Icon = getProjectIcon(p.icon)
                  const active = p.id === activeProjectId
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActiveProject(p.id!)
                        onClose()
                      }}
                      className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors ${
                        active ? 'bg-panel-border/40' : 'hover:bg-panel-border/25'
                      }`}
                    >
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${p.color}22`, color: p.color }}
                      >
                        <Icon size={15} />
                      </span>
                      <span className="text-sm truncate text-ink">{p.name}</span>
                    </button>
                  )
                })}
                <button
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-ink-dim hover:text-accent-a border border-dashed border-panel-border"
                >
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                    <Plus size={15} />
                  </span>
                  <span className="text-sm">New project</span>
                </button>
              </div>
            </div>

            <div className="h-px bg-panel-border mx-3 mb-3" />

            <nav className="flex flex-col gap-1 px-3 pb-4">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const active = section === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSection(item.id)
                      onClose()
                    }}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                      active ? 'text-ink bg-panel-border/40' : 'text-ink-dim hover:text-ink hover:bg-panel-border/25'
                    }`}
                  >
                    <Icon size={17} className="shrink-0" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </motion.div>

          <ProjectModal open={modalOpen} title="New Project" onSave={handleCreate} onClose={() => setModalOpen(false)} />
        </>
      )}
    </AnimatePresence>
  )
}
