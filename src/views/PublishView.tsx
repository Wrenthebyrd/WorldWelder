import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import { UploadCloud, FileText, FileType, FileCode, BookOpenCheck, Loader2, CheckCircle2 } from 'lucide-react'
import { db, getSettings, type Project, type Chapter } from '@/db'
import { docToBlocks } from '@/lib/richtext'
import type { ExportFormat } from '@/lib/export/types'
import { EmptyState } from '@/components/common/EmptyState'

type Version = 'draft' | 'official'

const FORMATS: { id: ExportFormat; label: string; icon: typeof FileText; hint: string }[] = [
  { id: 'pdf', label: 'PDF', icon: FileType, hint: 'Typeset, ready to print or share' },
  { id: 'docx', label: 'Word', icon: FileText, hint: '.docx, editable in Word/Docs' },
  { id: 'txt', label: 'Plain Text', icon: FileCode, hint: 'Simple .txt, no formatting' },
  { id: 'epub', label: 'EPUB', icon: BookOpenCheck, hint: 'E-reader ready book file' },
]

export function PublishView({ project }: { project: Project | null }) {
  const chapters =
    useLiveQuery(
      () => (project ? db.chapters.where('projectId').equals(project.id!).sortBy('order') : Promise.resolve<Chapter[]>([])),
      [project?.id],
    ) ?? []

  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [version, setVersion] = useState<Version>('official')
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [author, setAuthor] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    getSettings().then((s) => setAuthor(s.authorName))
  }, [])

  if (!project) {
    return (
      <div className="p-8">
        <EmptyState icon={UploadCloud} title="No project selected" description="Choose a project to publish its chapters." />
      </div>
    )
  }

  const allSelected = chapters.length > 0 && selected.size === chapters.length

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(chapters.map((c) => c.id!)))
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleExport() {
    const chosen = chapters.filter((c) => selected.has(c.id!))
    if (chosen.length === 0) return
    setBusy(true)
    setDone(false)
    try {
      const exportChapters = chosen.map((c) => ({
        title: c.title || 'Untitled',
        subtitle: c.subtitle,
        blocks: docToBlocks(version === 'draft' ? c.draftContent : c.officialContent),
      }))
      const { runExport } = await import('@/lib/export')
      await runExport(format, project!.name, author, exportChapters)
      setDone(true)
      setTimeout(() => setDone(false), 2500)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-6">
      <div className="flex items-center gap-3 mb-8">
        <span className="w-11 h-11 rounded-2xl flex items-center justify-center bg-accent-a/15 text-accent-a">
          <UploadCloud size={20} />
        </span>
        <div>
          <h1 className="font-display text-2xl text-ink">Publish</h1>
          <p className="text-sm text-ink-dim">Export {project.name} — the whole document or select chapters</p>
        </div>
      </div>

      {chapters.length === 0 ? (
        <EmptyState icon={FileText} title="Nothing to publish yet" description="Add chapters before exporting." />
      ) : (
        <>
          <div className="glass rounded-2xl p-5 mb-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-ink">Chapters</h2>
              <button onClick={toggleAll} className="text-xs text-accent-a hover:opacity-80">
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <div className="flex flex-col gap-1 max-h-64 overflow-y-auto rune-scrollbar">
              {chapters.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-panel-border/25 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(c.id!)}
                    onChange={() => toggleOne(c.id!)}
                    className="accent-[var(--accent-a)]"
                  />
                  <span className="text-sm text-ink truncate">{c.title || 'Untitled chapter'}</span>
                  {c.subtitle && <span className="text-xs text-ink-dim truncate">— {c.subtitle}</span>}
                </label>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-5 mb-5">
            <h2 className="text-sm font-medium text-ink mb-3">Version</h2>
            <div className="flex rounded-xl bg-bg-elevated p-1 text-xs w-fit">
              {(['draft', 'official'] as Version[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setVersion(v)}
                  className={`px-4 py-1.5 rounded-lg capitalize transition-colors ${
                    version === v ? 'bg-accent-a text-white' : 'text-ink-dim hover:text-ink'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-5 mb-5">
            <h2 className="text-sm font-medium text-ink mb-3">Author name (for cover metadata)</h2>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              onBlur={() => getSettings().then((s) => db.settings.put({ ...s, authorName: author }))}
              placeholder="Your name or pen name"
              className="w-full bg-bg-elevated border border-panel-border rounded-xl px-3 py-2 text-sm outline-none focus:border-accent-a transition-colors"
            />
          </div>

          <div className="glass rounded-2xl p-5 mb-6">
            <h2 className="text-sm font-medium text-ink mb-3">Format</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {FORMATS.map((f) => {
                const Icon = f.icon
                const active = format === f.id
                return (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={`rounded-xl p-3 flex flex-col items-center gap-1.5 text-center border transition-colors ${
                      active ? 'border-accent-a bg-accent-a/10 text-accent-a' : 'border-panel-border text-ink-dim hover:text-ink'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-xs font-medium">{f.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <motion.button
            onClick={handleExport}
            disabled={busy || selected.size === 0}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-xl bg-accent-a text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Forging {format.toUpperCase()}…
              </>
            ) : done ? (
              <>
                <CheckCircle2 size={16} /> Downloaded
              </>
            ) : (
              <>Export {selected.size > 0 ? `${selected.size} chapter${selected.size > 1 ? 's' : ''}` : ''}</>
            )}
          </motion.button>
        </>
      )}
    </div>
  )
}
