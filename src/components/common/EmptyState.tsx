import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      <div className="relative mb-6">
        <svg viewBox="0 0 160 160" width="140" height="140" className="opacity-70">
          <defs>
            <linearGradient id="es-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--accent-a)" />
              <stop offset="100%" stopColor="var(--accent-b)" />
            </linearGradient>
          </defs>
          <circle cx="80" cy="80" r="70" fill="none" stroke="url(#es-g)" strokeWidth="1" opacity="0.35" />
          <circle
            cx="80"
            cy="80"
            r="55"
            fill="none"
            stroke="url(#es-g)"
            strokeWidth="1"
            opacity="0.25"
            strokeDasharray="6 6"
          />
          <circle cx="80" cy="80" r="40" fill="none" stroke="url(#es-g)" strokeWidth="1.5" opacity="0.4" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon size={40} strokeWidth={1.5} style={{ color: 'var(--accent-a)' }} />
        </div>
      </div>
      <h3 className="font-display text-xl mb-2 text-ink">{title}</h3>
      <p className="max-w-sm text-sm mb-6 text-ink-dim">{description}</p>
      {action}
    </div>
  )
}
