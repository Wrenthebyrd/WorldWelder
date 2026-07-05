import { Document, Packer, Paragraph, TextRun as DocxRun, HeadingLevel, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'
import type { Block } from '@/lib/richtext'
import { slugify } from './utils'
import type { ExportChapter } from './types'

function runsFor(b: Block, forceItalic = false): DocxRun[] {
  if (b.runs.length === 0) return [new DocxRun('')]
  return b.runs.map((r) => new DocxRun({ text: r.text, bold: r.bold, italics: forceItalic || r.italic }))
}

function blockToParagraph(b: Block): Paragraph {
  switch (b.kind) {
    case 'h1':
      return new Paragraph({ heading: HeadingLevel.HEADING_1, children: runsFor(b), spacing: { before: 240, after: 120 } })
    case 'h2':
      return new Paragraph({ heading: HeadingLevel.HEADING_2, children: runsFor(b), spacing: { before: 200, after: 100 } })
    case 'h3':
      return new Paragraph({ heading: HeadingLevel.HEADING_3, children: runsFor(b), spacing: { before: 160, after: 80 } })
    case 'li':
      return new Paragraph({ children: runsFor(b), bullet: { level: 0 }, spacing: { after: 60 } })
    case 'oli':
      return new Paragraph({ children: [new DocxRun('• '), ...runsFor(b)], spacing: { after: 60 } })
    case 'blockquote':
      return new Paragraph({ children: runsFor(b, true), indent: { left: 720 }, spacing: { after: 120 } })
    case 'hr':
      return new Paragraph({
        children: [new DocxRun('─────────────')],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 200 },
      })
    default:
      return new Paragraph({ children: runsFor(b), spacing: { after: 200 } })
  }
}

export async function exportDocx(projectName: string, author: string, chapters: ExportChapter[]): Promise<void> {
  const children: Paragraph[] = []

  chapters.forEach((ch, idx) => {
    if (idx > 0) {
      children.push(new Paragraph({ children: [], pageBreakBefore: true }))
    }
    children.push(new Paragraph({ text: ch.title, heading: HeadingLevel.TITLE, spacing: { after: 80 } }))
    if (ch.subtitle) {
      children.push(
        new Paragraph({
          children: [new DocxRun({ text: ch.subtitle, italics: true })],
          spacing: { after: 300 },
        }),
      )
    }
    for (const b of ch.blocks) children.push(blockToParagraph(b))
  })

  const doc = new Document({
    creator: author || 'WorldWelder',
    title: projectName,
    sections: [{ children }],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${slugify(projectName)}.docx`)
}
