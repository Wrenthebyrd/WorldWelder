export interface TextRun {
  text: string
  bold?: boolean
  italic?: boolean
}

export type BlockKind = 'h1' | 'h2' | 'h3' | 'p' | 'li' | 'oli' | 'blockquote' | 'hr'

export interface Block {
  kind: BlockKind
  runs: TextRun[]
}

interface TTNode {
  type: string
  attrs?: Record<string, unknown>
  content?: TTNode[]
  text?: string
  marks?: { type: string }[]
}

function extractRuns(node: TTNode): TextRun[] {
  const runs: TextRun[] = []
  for (const child of node.content ?? []) {
    if (child.type === 'text' && child.text) {
      const marks = child.marks ?? []
      runs.push({
        text: child.text,
        bold: marks.some((m) => m.type === 'bold'),
        italic: marks.some((m) => m.type === 'italic'),
      })
    } else if (child.type === 'hardBreak') {
      runs.push({ text: '\n' })
    }
  }
  return runs
}

function headingKind(level: unknown): BlockKind {
  const n = typeof level === 'number' ? level : 1
  if (n <= 1) return 'h1'
  if (n === 2) return 'h2'
  return 'h3'
}

export function docToBlocks(jsonString: string): Block[] {
  let parsed: TTNode
  try {
    parsed = JSON.parse(jsonString) as TTNode
  } catch {
    return []
  }
  const blocks: Block[] = []

  const walk = (node: TTNode) => {
    switch (node.type) {
      case 'doc':
        for (const child of node.content ?? []) walk(child)
        break
      case 'paragraph':
        blocks.push({ kind: 'p', runs: extractRuns(node) })
        break
      case 'heading':
        blocks.push({ kind: headingKind(node.attrs?.level), runs: extractRuns(node) })
        break
      case 'bulletList':
        for (const item of node.content ?? []) {
          for (const inner of item.content ?? []) {
            blocks.push({ kind: 'li', runs: extractRuns(inner) })
          }
        }
        break
      case 'orderedList':
        for (const item of node.content ?? []) {
          for (const inner of item.content ?? []) {
            blocks.push({ kind: 'oli', runs: extractRuns(inner) })
          }
        }
        break
      case 'blockquote':
        for (const inner of node.content ?? []) {
          blocks.push({ kind: 'blockquote', runs: extractRuns(inner) })
        }
        break
      case 'codeBlock':
        blocks.push({ kind: 'p', runs: extractRuns(node) })
        break
      case 'horizontalRule':
        blocks.push({ kind: 'hr', runs: [] })
        break
      default:
        break
    }
  }

  walk(parsed)
  return blocks
}

export function blocksToPlainText(blocks: Block[]): string {
  return blocks
    .map((b) => {
      const text = b.runs.map((r) => r.text).join('')
      if (b.kind === 'li') return `  • ${text}`
      if (b.kind === 'oli') return `  - ${text}`
      if (b.kind === 'hr') return '―――――'
      return text
    })
    .join('\n\n')
}

export function docToPlainText(jsonString: string): string {
  return blocksToPlainText(docToBlocks(jsonString))
}
