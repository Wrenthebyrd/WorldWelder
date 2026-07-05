import { exportTxt } from './txt'
import { exportDocx } from './docx'
import { exportPdf } from './pdf'
import { exportEpub } from './epub'
import type { ExportChapter, ExportFormat } from './types'

export type { ExportChapter, ExportFormat }

export async function runExport(
  format: ExportFormat,
  projectName: string,
  author: string,
  chapters: ExportChapter[],
): Promise<void> {
  switch (format) {
    case 'txt':
      exportTxt(projectName, chapters)
      return
    case 'docx':
      await exportDocx(projectName, author, chapters)
      return
    case 'pdf':
      await exportPdf(projectName, chapters)
      return
    case 'epub':
      await exportEpub(projectName, author, chapters)
      return
  }
}
