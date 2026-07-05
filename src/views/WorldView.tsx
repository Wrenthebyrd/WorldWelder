import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, ChevronDown, Globe2, Plus, Trash2 } from 'lucide-react'
import { db, WORLD_CATEGORIES, type WorldEntry } from '@/db'
import { InlineEditable } from '@/components/common/InlineEditable'
import { SectionList } from '@/components/common/SectionList'
import { SectionListView } from '@/components/common/SectionListView'
import { ImageGallery } from '@/components/common/ImageGallery'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ModeToggle, type ViewMode } from '@/components/common/ModeToggle'

export function WorldView({ projectId }: { projectId: number }) {
  const entries = useLiveQuery(() => db.worldEntries.where('projectId').equals(projectId).toArray(), [projectId]) ?? []
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState<WorldEntry | null>(null)
  const [mode, setMode] = useState<ViewMode>('edit')

  const grouped = useMemo(() => {
    const map = new Map<string, WorldEntry[]>()
    for (const cat of WORLD_CATEGORIES) map.set(cat, [])
    for (const e of entries) {
      if (!map.has(e.category)) map.set(e.category, [])
      map.get(e.category)!.push(e)
    }
    return map
  }, [entries])

  const selected = entries.find((e) => e.id === selectedId) ?? null

  async function addEntry(category: string) {
    const id = await db.worldEntries.add({
      projectId,
      category,
      title: 'New entry',
      sections: [],
      imageIds: [],
      updatedAt: Date.now(),
    })
    setSelectedId(id)
  }

  function toggleCategory(cat: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  async function handleDelete() {
    if (!deleting) return
    await db.worldEntries.delete(deleting.id!)
    if (selectedId === deleting.id) setSelectedId(null)
    setDeleting(null)
  }

  return (
    <div className="h-full flex">
      <div
        className={`w-full md:w-72 border-r border-panel-border overflow-y-auto rune-scrollbar p-3 shrink-0 ${
          selected ? 'hidden md:block' : 'block'
        }`}
      >
        {Array.from(grouped.entries()).map(([category, items]) => (
          <div key={category} className="mb-2">
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wide text-ink-dim hover:text-ink transition-colors"
            >
              <span>
                {category} <span className="opacity-50">({items.length})</span>
              </span>
              <ChevronDown
                size={13}
                className="transition-transform"
                style={{ transform: collapsed.has(category) ? 'rotate(-90deg)' : 'rotate(0deg)' }}
              />
            </button>
            {!collapsed.has(category) && (
              <div className="flex flex-col gap-0.5 mt-0.5">
                {items.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setSelectedId(e.id!)}
                    className={`text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${
                      selectedId === e.id ? 'glass text-ink' : 'text-ink-dim hover:text-ink hover:bg-panel-border/25'
                    }`}
                  >
                    {e.title || 'Untitled'}
                  </button>
                ))}
                <button
                  onClick={() => addEntry(category)}
                  className="text-left px-3 py-1.5 rounded-lg text-xs text-ink-dim hover:text-accent-a flex items-center gap-1.5"
                >
                  <Plus size={12} /> Add entry
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={`flex-1 overflow-y-auto rune-scrollbar p-5 md:p-8 ${selected ? 'block' : 'hidden md:block'}`}>
        {!selected ? (
          <EmptyState
            icon={Globe2}
            title="Your world, unwritten"
            description="Select an entry from the left, or add a new one to any category to start building your world's lore."
          />
        ) : (
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => setSelectedId(null)}
              className="md:hidden flex items-center gap-1.5 text-xs text-ink-dim hover:text-ink mb-4"
            >
              <ArrowLeft size={13} /> Back to entries
            </button>
            {mode === 'edit' ? (
              <>
                <div className="flex items-start justify-between mb-1">
                  <InlineEditable
                    value={selected.title}
                    onSave={(v) => db.worldEntries.update(selected.id!, { title: v, updatedAt: Date.now() })}
                    className="font-display text-2xl text-ink"
                    placeholder="Untitled entry"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <ModeToggle mode={mode} setMode={setMode} />
                    <button
                      type="button"
                      onClick={() => setDeleting(selected)}
                      className="text-ink-dim hover:text-red-400 transition-colors p-1.5"
                      title="Delete entry"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <select
                  value={selected.category}
                  onChange={(e) =>
                    db.worldEntries.update(selected.id!, { category: e.target.value, updatedAt: Date.now() })
                  }
                  className="mb-6 bg-bg-elevated border border-panel-border rounded-lg px-2.5 py-1 text-xs text-ink-dim outline-none"
                >
                  {WORLD_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <div className="mb-6">
                  <ImageGallery
                    projectId={projectId}
                    imageIds={selected.imageIds}
                    onChange={(ids) => db.worldEntries.update(selected.id!, { imageIds: ids, updatedAt: Date.now() })}
                  />
                </div>

                <SectionList
                  sections={selected.sections}
                  onChange={(sections) => db.worldEntries.update(selected.id!, { sections, updatedAt: Date.now() })}
                  addLabel="Add section"
                />
              </>
            ) : (
              <div className="glass rounded-2xl p-6 md:p-10">
                <div className="flex justify-end mb-2">
                  <ModeToggle mode={mode} setMode={setMode} />
                </div>
                <p className="text-center text-xs uppercase tracking-wide text-ink-dim mb-1">{selected.category}</p>
                <h1 className="font-display text-3xl text-center mb-6 glow-text">{selected.title}</h1>
                {selected.imageIds.length > 0 && (
                  <div className="flex justify-center mb-8">
                    <ImageGallery projectId={projectId} imageIds={selected.imageIds} readOnly />
                  </div>
                )}
                <SectionListView sections={selected.sections} />
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleting}
        title={`Delete "${deleting?.title}"?`}
        description="This entry and its images will be permanently removed."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
