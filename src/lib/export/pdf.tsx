import { Document, Page, View, Text, StyleSheet, pdf } from '@react-pdf/renderer'
import type { Style } from '@react-pdf/types'
import { saveAs } from 'file-saver'
import type { Block } from '@/lib/richtext'
import { slugify } from './utils'
import type { ExportChapter } from './types'

const styles = StyleSheet.create({
  page: { paddingTop: 64, paddingBottom: 56, paddingHorizontal: 60, fontFamily: 'Times-Roman', fontSize: 11.5 },
  title: { fontSize: 22, textAlign: 'center', marginBottom: 4, fontFamily: 'Times-Bold' },
  subtitle: { fontSize: 12, textAlign: 'center', marginBottom: 28, fontFamily: 'Times-Italic', color: '#555555' },
  h1: { fontSize: 16, marginTop: 16, marginBottom: 8, fontFamily: 'Times-Bold' },
  h2: { fontSize: 13.5, marginTop: 14, marginBottom: 6, fontFamily: 'Times-Bold' },
  h3: { fontSize: 12, marginTop: 12, marginBottom: 5, fontFamily: 'Times-Bold' },
  p: { marginBottom: 10, lineHeight: 1.5, textAlign: 'justify' },
  li: { marginBottom: 6, marginLeft: 16, lineHeight: 1.5 },
  blockquote: { marginBottom: 10, marginLeft: 16, fontFamily: 'Times-Italic', color: '#444444', lineHeight: 1.5 },
  hr: { borderBottomWidth: 1, borderBottomColor: '#cccccc', marginVertical: 16 },
})

function fontFor(bold?: boolean, italic?: boolean): string {
  if (bold && italic) return 'Times-BoldItalic'
  if (bold) return 'Times-Bold'
  if (italic) return 'Times-Italic'
  return 'Times-Roman'
}

function BlockText({ block, style }: { block: Block; style: Style }) {
  return (
    <Text style={style}>
      {block.runs.map((r, i) => (
        <Text key={i} style={{ fontFamily: fontFor(r.bold, r.italic) }}>
          {r.text}
        </Text>
      ))}
    </Text>
  )
}

function ChapterPage({ chapter }: { chapter: ExportChapter }) {
  return (
    <Page size="A4" style={styles.page} wrap>
      <Text style={styles.title}>{chapter.title}</Text>
      {chapter.subtitle ? <Text style={styles.subtitle}>{chapter.subtitle}</Text> : null}
      {chapter.blocks.map((b, i) => {
        switch (b.kind) {
          case 'h1':
            return <BlockText key={i} block={b} style={styles.h1} />
          case 'h2':
            return <BlockText key={i} block={b} style={styles.h2} />
          case 'h3':
            return <BlockText key={i} block={b} style={styles.h3} />
          case 'li':
            return <BlockText key={i} block={b} style={styles.li} />
          case 'oli':
            return <BlockText key={i} block={b} style={styles.li} />
          case 'blockquote':
            return <BlockText key={i} block={b} style={styles.blockquote} />
          case 'hr':
            return <View key={i} style={styles.hr} />
          default:
            return <BlockText key={i} block={b} style={styles.p} />
        }
      })}
    </Page>
  )
}

function ManuscriptDocument({ chapters }: { chapters: ExportChapter[] }) {
  return (
    <Document>
      {chapters.map((ch, idx) => (
        <ChapterPage key={idx} chapter={ch} />
      ))}
    </Document>
  )
}

export async function exportPdf(projectName: string, chapters: ExportChapter[]): Promise<void> {
  const blob = await pdf(<ManuscriptDocument chapters={chapters} />).toBlob()
  saveAs(blob, `${slugify(projectName)}.pdf`)
}
