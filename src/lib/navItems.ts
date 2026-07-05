import { LayoutDashboard, Globe2, Users, BookText, UploadCloud, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Section } from '@/store/uiStore'

export const NAV_ITEMS: { id: Section; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'world', label: 'World', icon: Globe2 },
  { id: 'characters', label: 'Characters', icon: Users },
  { id: 'chapters', label: 'Chapters', icon: BookText },
  { id: 'publish', label: 'Publish', icon: UploadCloud },
  { id: 'settings', label: 'Settings', icon: Settings },
]
