import { saveAs } from 'file-saver'
import { blocksToPlainText } from '@/lib/richtext'
import { slugify } from './utils'
import type { ExportChapter } from './types'

export function exportTxt(projectName: string, chapters: ExportChapter[]): void {
  const parts = chapters.map((ch) => {
    const header = ch.subtitle ? `${ch.title}\n${ch.subtitle}` : ch.title
    return `${header}\n${'-'.repeat(Math.min(header.length, 40))}\n\n${blocksToPlainText(ch.blocks)}`
  })
  const text = `${projectName}\n${'='.repeat(projectName.length)}\n\n${parts.join('\n\n\n')}\n`
  saveAs(new Blob([text], { type: 'text/plain;charset=utf-8' }), `${slugify(projectName)}.txt`)
}
