import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useRef } from 'react'
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  ImagePlus,
  Undo2,
  Redo2,
} from 'lucide-react'
import { db } from '@/db'
import { prepareImageForStorage } from '@/lib/imageProcessing'
import { StoredImageExtension } from '@/lib/storedImageExtension'

interface RichTextEditorProps {
  content: string
  onChange: (json: string) => void
  placeholder?: string
  projectId: number
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        active ? 'bg-accent-a/20 text-accent-a' : 'text-ink-dim hover:bg-panel-border/40 hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({ content, onChange, placeholder, projectId }: RichTextEditorProps) {
  const debounceRef = useRef<number | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? 'Begin writing…' }),
      StoredImageExtension,
    ],
    content: safeParse(content),
    onUpdate: ({ editor }) => {
      window.clearTimeout(debounceRef.current)
      debounceRef.current = window.setTimeout(() => {
        onChange(JSON.stringify(editor.getJSON()))
      }, 400)
    },
  })

  useEffect(() => {
    return () => window.clearTimeout(debounceRef.current)
  }, [])

  async function handleInsertImage(file: File | undefined) {
    if (!file || !editor) return
    const blob = await prepareImageForStorage(file)
    const imageId = await db.images.add({ projectId, name: file.name, mimeType: blob.type || file.type, blob })
    editor.chain().focus().insertStoredImage(imageId).run()
  }

  if (!editor) return null

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 flex-wrap px-2 py-1.5 mb-3 rounded-xl glass sticky top-0 z-10">
        <ToolbarButton
          label="Bold"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={15} />
        </ToolbarButton>
        <div className="w-px h-5 bg-panel-border mx-1" />
        <ToolbarButton
          label="Heading 1"
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={15} />
        </ToolbarButton>
        <div className="w-px h-5 bg-panel-border mx-1" />
        <ToolbarButton
          label="Bullet list"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={15} />
        </ToolbarButton>
        <ToolbarButton
          label="Quote"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={15} />
        </ToolbarButton>
        <div className="w-px h-5 bg-panel-border mx-1" />
        <ToolbarButton label="Insert image" onClick={() => fileInputRef.current?.click()}>
          <ImagePlus size={15} />
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handleInsertImage(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <div className="w-px h-5 bg-panel-border mx-1" />
        <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 size={15} />
        </ToolbarButton>
        <ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 size={15} />
        </ToolbarButton>
      </div>
      <div className="flex-1 overflow-y-auto rune-scrollbar px-1">
        <EditorContent editor={editor} className="prose-area h-full" />
      </div>
    </div>
  )
}

function safeParse(json: string) {
  try {
    return JSON.parse(json)
  } catch {
    return { type: 'doc', content: [{ type: 'paragraph' }] }
  }
}
