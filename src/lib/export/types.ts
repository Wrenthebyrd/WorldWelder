import type { Block } from '@/lib/richtext'

export interface ExportChapter {
  title: string
  subtitle: string
  blocks: Block[]
}

export type ExportFormat = 'pdf' | 'docx' | 'txt' | 'epub'
