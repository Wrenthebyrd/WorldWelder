import type { EntrySection } from '@/db'
import { RichTextView } from './RichTextView'

export function SectionListView({ sections }: { sections: EntrySection[] }) {
  if (sections.length === 0) {
    return <p className="text-ink-dim italic text-sm text-center">Nothing written yet.</p>
  }

  return (
    <div className="flex flex-col gap-8">
      {sections.map((section) => (
        <div key={section.id}>
          <h2 className="font-display text-xl mb-3 pb-2 border-b border-panel-border text-ink">{section.title}</h2>
          <RichTextView content={section.content} />
        </div>
      ))}
    </div>
  )
}
