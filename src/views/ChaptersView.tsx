import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, BookText, Plus, Trash2, GripVertical, Pencil, Eye } from 'lucide-react'
import { db, emptyDoc, type Chapter } from '@/db'
import { InlineEditable } from '@/components/common/InlineEditable'
import { RichTextEditor } from '@/components/common/RichTextEditor'
import { RichTextView } from '@/components/common/RichTextView'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'

type Version = 'draft' | 'official'
type Layout = 'edit' | 'final'

export function ChaptersView({ projectId }: { projectId: number }) {
  const chapters = useLiveQuery(() => db.chapters.where('projectId').equals(projectId).sortBy('order'), [projectId]) ?? []
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<Chapter | null>(null)
  const [version, setVersion] = useState<Version>('draft')
  const [layout, setLayout] = useState<Layout>('edit')
  const [dragId, setDragId] = useState<number | null>(null)

  const selected = chapters.find((c) => c.id === selectedId) ?? null

  async function addChapter() {
    const id = await db.chapters.add({
      projectId,
      title: `Chapter ${chapters.length + 1}`,
      subtitle: '',
      order: chapters.length,
      draftContent: emptyDoc(),
      officialContent: emptyDoc(),
      updatedAt: Date.now(),
    })
    setSelectedId(id)
  }

  async function reorder(overId: number) {
    if (dragId === null || dragId === overId) return
    const items = [...chapters]
    const fromIdx = items.findIndex((c) => c.id === dragId)
    const toIdx = items.findIndex((c) => c.id === overId)
    if (fromIdx === -1 || toIdx === -1) return
    const [moved] = items.splice(fromIdx, 1)
    items.splice(toIdx, 0, moved)
    await db.transaction('rw', db.chapters, async () => {
      await Promise.all(items.map((c, idx) => db.chapters.update(c.id!, { order: idx })))
    })
  }

  async function handleDelete() {
    if (!deleting) return
    await db.chapters.delete(deleting.id!)
    if (selectedId === deleting.id) setSelectedId(null)
    setDeleting(null)
  }

  const contentField = version === 'draft' ? 'draftContent' : 'officialContent'

  return (
    <div className="h-full flex">
      <div
        className={`w-full md:w-72 border-r border-panel-border overflow-y-auto rune-scrollbar p-3 shrink-0 flex-col gap-1 ${
          selected ? 'hidden md:flex' : 'flex'
        }`}
      >
        {chapters.map((c) => (
          <div
            key={c.id}
            draggable
            onDragStart={() => setDragId(c.id!)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => reorder(c.id!)}
            className="group"
          >
            <button
              onClick={() => setSelectedId(c.id!)}
              className={`w-full flex items-center gap-2 text-left px-2.5 py-2 rounded-xl transition-colors ${
                selectedId === c.id ? 'glass' : 'hover:bg-panel-border/25'
              }`}
            >
              <GripVertical size={13} className="text-ink-dim opacity-0 group-hover:opacity-60 cursor-grab shrink-0" />
              <span className="min-w-0">
                <span className="block text-sm truncate text-ink">{c.title || 'Untitled chapter'}</span>
                {c.subtitle && <span className="block text-xs truncate text-ink-dim">{c.subtitle}</span>}
              </span>
            </button>
          </div>
        ))}
        <button
          onClick={addChapter}
          className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-sm text-ink-dim hover:text-accent-a border border-dashed border-panel-border mt-1"
        >
          <Plus size={14} /> New chapter
        </button>
      </div>

      <div className={`flex-1 overflow-y-auto rune-scrollbar p-5 md:p-8 ${selected ? 'block' : 'hidden md:block'}`}>
        {!selected ? (
          <EmptyState
            icon={BookText}
            title="No chapters yet"
            description="Add a chapter to begin drafting your story. Each chapter has its own draft and official version."
          />
        ) : (
          <div className="max-w-3xl mx-auto flex flex-col" style={{ minHeight: '100%' }}>
            <button
              onClick={() => setSelectedId(null)}
              className="md:hidden flex items-center gap-1.5 text-xs text-ink-dim hover:text-ink mb-4"
            >
              <ArrowLeft size={13} /> Back to chapters
            </button>
            <div className="flex items-start justify-between mb-1 gap-4">
              <div className="min-w-0 flex-1">
                <InlineEditable
                  value={selected.title}
                  onSave={(v) => db.chapters.update(selected.id!, { title: v, updatedAt: Date.now() })}
                  className="font-display text-2xl text-ink"
                  placeholder="Chapter title"
                />
                <InlineEditable
                  value={selected.subtitle}
                  onSave={(v) => db.chapters.update(selected.id!, { subtitle: v, updatedAt: Date.now() })}
                  className="text-sm text-ink-dim mt-1"
                  placeholder="Add a subtitle…"
                />
              </div>
              <button
                type="button"
                onClick={() => setDeleting(selected)}
                className="text-ink-dim hover:text-red-400 transition-colors p-1.5 shrink-0"
                title="Delete chapter"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-6 mt-4">
              <div className="flex rounded-xl glass p-1 text-xs">
                {(['draft', 'official'] as Version[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setVersion(v)}
                    className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                      version === v ? 'bg-accent-a text-white' : 'text-ink-dim hover:text-ink'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <div className="flex rounded-xl glass p-1 text-xs">
                <button
                  onClick={() => setLayout('edit')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                    layout === 'edit' ? 'bg-accent-b text-white' : 'text-ink-dim hover:text-ink'
                  }`}
                >
                  <Pencil size={11} /> Edit
                </button>
                <button
                  onClick={() => setLayout('final')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                    layout === 'final' ? 'bg-accent-b text-white' : 'text-ink-dim hover:text-ink'
                  }`}
                >
                  <Eye size={11} /> Final
                </button>
              </div>
            </div>

            <div className="flex-1" style={{ minHeight: 400 }}>
              {layout === 'edit' ? (
                <RichTextEditor
                  key={`${selected.id}-${version}`}
                  content={selected[contentField]}
                  onChange={(json) => db.chapters.update(selected.id!, { [contentField]: json, updatedAt: Date.now() })}
                  placeholder={version === 'draft' ? 'Draft your chapter…' : 'Write the official version…'}
                />
              ) : (
                <div className="glass rounded-2xl p-10">
                  {selected.subtitle && (
                    <p className="text-center text-sm italic text-ink-dim mb-1">{selected.subtitle}</p>
                  )}
                  <h1 className="font-display text-3xl text-center mb-8 glow-text">{selected.title}</h1>
                  <RichTextView content={selected[contentField]} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleting}
        title={`Delete "${deleting?.title}"?`}
        description="This chapter, including its draft and official content, will be permanently removed."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
