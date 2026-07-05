import { useEffect, useRef, useState } from 'react'
import { Pencil } from 'lucide-react'

interface InlineEditableProps {
  value: string
  onSave: (value: string) => void
  placeholder?: string
  className?: string
  as?: 'input' | 'textarea'
}

export function InlineEditable({
  value,
  onSave,
  placeholder = 'Untitled',
  className = '',
  as = 'input',
}: InlineEditableProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  useEffect(() => setDraft(value), [value])

  useEffect(() => {
    if (editing) {
      ref.current?.focus()
      ref.current?.select()
    }
  }, [editing])

  function commit() {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed !== value) onSave(trimmed)
  }

  if (editing) {
    const Tag = as
    return (
      <Tag
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && as === 'input') commit()
          if (e.key === 'Escape') {
            setDraft(value)
            setEditing(false)
          }
        }}
        placeholder={placeholder}
        className={`bg-transparent outline-none border-b border-accent-a/50 ${className}`}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={`group inline-flex items-center gap-1.5 text-left ${className}`}
    >
      <span className={value ? '' : 'text-ink-dim italic'}>{value || placeholder}</span>
      <Pencil size={12} className="opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
    </button>
  )
}
