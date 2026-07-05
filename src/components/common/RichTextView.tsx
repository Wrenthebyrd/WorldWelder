import { Fragment } from 'react'
import { docToBlocks, type Block, type TextRun } from '@/lib/richtext'
import { StoredImage } from './StoredImage'

function Runs({ runs }: { runs: TextRun[] }) {
  return (
    <>
      {runs.map((r, i) => {
        let node: React.ReactNode = r.text
        if (r.bold) node = <strong key={i}>{node}</strong>
        if (r.italic) node = <em key={i}>{node}</em>
        return <Fragment key={i}>{node}</Fragment>
      })}
    </>
  )
}

function groupBlocks(blocks: Block[]) {
  const groups: (Block | { kind: 'ul' | 'ol'; items: Block[] })[] = []
  for (const b of blocks) {
    if (b.kind === 'li' || b.kind === 'oli') {
      const listKind = b.kind === 'li' ? 'ul' : 'ol'
      const last = groups[groups.length - 1]
      if (last && 'items' in last && last.kind === listKind) {
        last.items.push(b)
      } else {
        groups.push({ kind: listKind, items: [b] })
      }
    } else {
      groups.push(b)
    }
  }
  return groups
}

export function RichTextView({ content, className = '' }: { content: string; className?: string }) {
  const blocks = docToBlocks(content)
  const groups = groupBlocks(blocks)

  const hasContent = blocks.some((b) => b.runs.length > 0 || b.imageId)
  if (!hasContent) {
    return <p className="text-ink-dim italic text-sm">Nothing written yet.</p>
  }

  return (
    <div className={`final-layout ${className}`}>
      {groups.map((g, i) => {
        if ('items' in g) {
          const Tag = g.kind
          return (
            <Tag key={i}>
              {g.items.map((item, j) => (
                <li key={j}>
                  <Runs runs={item.runs} />
                </li>
              ))}
            </Tag>
          )
        }
        switch (g.kind) {
          case 'h1':
            return (
              <h1 key={i}>
                <Runs runs={g.runs} />
              </h1>
            )
          case 'h2':
            return (
              <h2 key={i}>
                <Runs runs={g.runs} />
              </h2>
            )
          case 'h3':
            return (
              <h3 key={i}>
                <Runs runs={g.runs} />
              </h3>
            )
          case 'blockquote':
            return (
              <blockquote key={i}>
                <Runs runs={g.runs} />
              </blockquote>
            )
          case 'hr':
            return <hr key={i} />
          case 'image':
            return <StoredImage key={i} imageId={g.imageId} className="my-4 mx-auto block" />
          default:
            return (
              <p key={i}>
                <Runs runs={g.runs} />
              </p>
            )
        }
      })}
    </div>
  )
}
