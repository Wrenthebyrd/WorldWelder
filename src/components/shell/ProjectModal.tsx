import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { PROJECT_ICON_NAMES, PROJECT_COLORS, getProjectIcon } from '@/lib/projectIcons'
import type { Project } from '@/db'

interface ProjectModalProps {
  open: boolean
  initial?: Pick<Project, 'name' | 'description' | 'icon' | 'color'>
  title: string
  onSave: (data: Pick<Project, 'name' | 'description' | 'icon' | 'color'>) => void
  onClose: () => void
}

export function ProjectModal({ open, initial, title, onSave, onClose }: ProjectModalProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? PROJECT_ICON_NAMES[0])
  const [color, setColor] = useState(initial?.color ?? PROJECT_COLORS[0])

  function reset() {
    setName(initial?.name ?? '')
    setDescription(initial?.description ?? '')
    setIcon(initial?.icon ?? PROJECT_ICON_NAMES[0])
    setColor(initial?.color ?? PROJECT_COLORS[0])
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), description: description.trim(), icon, color })
    reset()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="glass rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg text-ink">{title}</h2>
              <button type="button" onClick={handleClose} className="text-ink-dim hover:text-ink">
                <X size={18} />
              </button>
            </div>

            <label className="block text-xs text-ink-dim mb-1.5">Project name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="The Shattered Codex"
              className="w-full mb-4 bg-bg-elevated border border-panel-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-accent-a transition-colors"
            />

            <label className="block text-xs text-ink-dim mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A one-line pitch for this world…"
              rows={2}
              className="w-full mb-4 bg-bg-elevated border border-panel-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-accent-a transition-colors resize-none"
            />

            <label className="block text-xs text-ink-dim mb-1.5">Emblem</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {PROJECT_ICON_NAMES.map((name) => {
                const Icon = getProjectIcon(name)
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setIcon(name)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${
                      icon === name
                        ? 'border-accent-a bg-accent-a/15 text-accent-a'
                        : 'border-panel-border text-ink-dim hover:text-ink'
                    }`}
                  >
                    <Icon size={16} />
                  </button>
                )
              })}
            </div>

            <label className="block text-xs text-ink-dim mb-1.5">Color</label>
            <div className="flex flex-wrap gap-2 mb-6">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-transform"
                  style={{
                    background: c,
                    borderColor: color === c ? 'var(--text)' : 'transparent',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-accent-a text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {title}
            </button>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
