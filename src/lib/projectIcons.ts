import {
  BookOpen,
  Rocket,
  Sparkles,
  Compass,
  Globe2,
  Feather,
  Castle,
  Swords,
  Flame,
  Moon,
  Gem,
  Wand2,
  type LucideIcon,
} from 'lucide-react'

export const PROJECT_ICONS: Record<string, LucideIcon> = {
  BookOpen,
  Rocket,
  Sparkles,
  Compass,
  Globe2,
  Feather,
  Castle,
  Swords,
  Flame,
  Moon,
  Gem,
  Wand2,
}

export const PROJECT_ICON_NAMES = Object.keys(PROJECT_ICONS)

export const PROJECT_COLORS = [
  '#7C3AED',
  '#06B6D4',
  '#EC4899',
  '#F59E0B',
  '#10B981',
  '#EF4444',
  '#8B5CF6',
  '#3B82F6',
]

export function getProjectIcon(name: string): LucideIcon {
  return PROJECT_ICONS[name] ?? Sparkles
}
