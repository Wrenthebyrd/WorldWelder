import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { NAV_ITEMS } from '@/lib/navItems'

export function NavSidebar() {
  const { section, setSection, sidebarExpanded, toggleSidebar } = useUIStore()

  return (
    <div
      className={`h-full flex flex-col border-r border-panel-border shrink-0 transition-all duration-300 ${
        sidebarExpanded ? 'w-56' : 'w-16'
      }`}
    >
      <nav className="flex-1 flex flex-col gap-1 p-2.5 mt-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = section === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              title={item.label}
              className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                active ? 'text-ink' : 'text-ink-dim hover:text-ink hover:bg-panel-border/25'
              }`}
              style={active ? { background: 'var(--panel)' } : undefined}
            >
              {active && (
                <span
                  className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full"
                  style={{ background: 'linear-gradient(180deg, var(--accent-a), var(--accent-b))' }}
                />
              )}
              <Icon size={17} className="shrink-0" />
              {sidebarExpanded && <span className="truncate">{item.label}</span>}
            </button>
          )
        })}
      </nav>
      <button
        type="button"
        onClick={toggleSidebar}
        title={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        className="m-2.5 w-8 h-8 rounded-lg flex items-center justify-center text-ink-dim hover:text-ink hover:bg-panel-border/30 transition-colors"
      >
        {sidebarExpanded ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
      </button>
    </div>
  )
}
