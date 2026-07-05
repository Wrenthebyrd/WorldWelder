import { Menu } from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { useUIStore, type Section } from '@/store/uiStore'

const SECTION_LABELS: Record<Section, string> = {
  dashboard: 'Dashboard',
  world: 'World',
  characters: 'Characters',
  chapters: 'Chapters',
  publish: 'Publish',
  settings: 'Settings',
}

export function MobileTopBar({ onOpenDrawer }: { onOpenDrawer: () => void }) {
  const section = useUIStore((s) => s.section)

  return (
    <div className="h-14 shrink-0 flex items-center gap-3 px-3 border-b border-panel-border glass z-20">
      <button
        type="button"
        onClick={onOpenDrawer}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-dim hover:text-ink hover:bg-panel-border/30 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={19} />
      </button>
      <Logo size={22} />
      <span className="font-display text-sm text-ink truncate">{SECTION_LABELS[section]}</span>
    </div>
  )
}
