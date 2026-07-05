import { Eye, Pencil } from 'lucide-react'

export type ViewMode = 'edit' | 'view'

interface ModeToggleProps {
  mode: ViewMode
  setMode: (mode: ViewMode) => void
}

export function ModeToggle({ mode, setMode }: ModeToggleProps) {
  return (
    <div className="flex rounded-xl glass p-1 text-xs">
      <button
        type="button"
        onClick={() => setMode('edit')}
        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
          mode === 'edit' ? 'bg-accent-b text-white' : 'text-ink-dim hover:text-ink'
        }`}
      >
        <Pencil size={11} /> Edit
      </button>
      <button
        type="button"
        onClick={() => setMode('view')}
        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
          mode === 'view' ? 'bg-accent-b text-white' : 'text-ink-dim hover:text-ink'
        }`}
      >
        <Eye size={11} /> View
      </button>
    </div>
  )
}
