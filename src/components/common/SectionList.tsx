import { useState } from 'react'
import { ChevronDown, GripVertical, Plus, Trash2 } from 'lucide-react'
import { newSection, type EntrySection } from '@/db'
import { InlineEditable } from './InlineEditable'
import { RichTextEditor } from './RichTextEditor'
import { ConfirmDialog } from './ConfirmDialog'

interface SectionListProps {
  sections: EntrySection[]
  onChange: (sections: EntrySection[]) => void
  addLabel?: string
}

export function SectionList({ sections, onChange, addLabel = 'Add section' }: SectionListProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [dragId, setDragId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<EntrySection | null>(null)

  function toggleCollapsed(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function addNewSection() {
    onChange([...sections, newSection()])
  }

  function updateSection(id: string, patch: Partial<EntrySection>) {
    onChange(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  function reorder(overId: string) {
    if (dragId === null || dragId === overId) return
    const items = [...sections]
    const fromIdx = items.findIndex((s) => s.id === dragId)
    const toIdx = items.findIndex((s) => s.id === overId)
    if (fromIdx === -1 || toIdx === -1) return
    const [moved] = items.splice(fromIdx, 1)
    items.splice(toIdx, 0, moved)
    onChange(items)
  }

  function confirmDelete() {
    if (!deleting) return
    onChange(sections.filter((s) => s.id !== deleting.id))
    setDeleting(null)
  }

  return (
    <div className="flex flex-col gap-3">
      {sections.map((section) => {
        const isCollapsed = collapsed.has(section.id)
        return (
          <div
            key={section.id}
            draggable
            onDragStart={() => setDragId(section.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => reorder(section.id)}
            className="glass rounded-2xl overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2.5">
              <GripVertical size={14} className="text-ink-dim cursor-grab shrink-0" />
              <button
                type="button"
                onClick={() => toggleCollapsed(section.id)}
                className="text-ink-dim hover:text-ink shrink-0"
                aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
              >
                <ChevronDown
                  size={15}
                  className="transition-transform"
                  style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                />
              </button>
              <InlineEditable
                value={section.title}
                onSave={(v) => updateSection(section.id, { title: v || 'Untitled section' })}
                className="flex-1 font-display text-base text-ink"
                placeholder="Section title"
              />
              <button
                type="button"
                onClick={() => setDeleting(section)}
                className="text-ink-dim hover:text-red-400 transition-colors p-1 shrink-0"
                title="Delete section"
              >
                <Trash2 size={14} />
              </button>
            </div>
            {!isCollapsed && (
              <div className="px-3 pb-3" style={{ minHeight: 160 }}>
                <RichTextEditor
                  content={section.content}
                  onChange={(json) => updateSection(section.id, { content: json })}
                  placeholder="Write this section…"
                />
              </div>
            )}
          </div>
        )
      })}

      <button
        type="button"
        onClick={addNewSection}
        className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-ink-dim hover:text-accent-a border border-dashed border-panel-border transition-colors"
      >
        <Plus size={14} /> {addLabel}
      </button>

      <ConfirmDialog
        open={!!deleting}
        title={`Delete "${deleting?.title}"?`}
        description="This section and its content will be permanently removed."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
