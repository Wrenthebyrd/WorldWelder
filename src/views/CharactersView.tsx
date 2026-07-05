import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Users, Plus, Trash2, X, Sparkle } from 'lucide-react'
import { db, emptyDoc, type Character, type Ability } from '@/db'
import { InlineEditable } from '@/components/common/InlineEditable'
import { RichTextEditor } from '@/components/common/RichTextEditor'
import { ImageGallery } from '@/components/common/ImageGallery'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'

function CharacterThumb({ character, active, onClick }: { character: Character; active: boolean; onClick: () => void }) {
  const cover = useLiveQuery(async () => {
    const id = character.imageIds[0]
    return id ? db.images.get(id) : undefined
  }, [character.imageIds[0]])
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!cover) {
      setUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(cover.blob)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [cover])

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 w-full text-left px-2.5 py-2 rounded-xl transition-colors ${
        active ? 'glass' : 'hover:bg-panel-border/25'
      }`}
    >
      <span className="w-9 h-9 rounded-full overflow-hidden bg-accent-a/15 flex items-center justify-center shrink-0 text-accent-a">
        {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : <Users size={15} />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm truncate text-ink">{character.name || 'Unnamed'}</span>
        <span className="block text-xs truncate text-ink-dim">{character.role || 'No role set'}</span>
      </span>
    </button>
  )
}

export function CharactersView({ projectId }: { projectId: number }) {
  const characters = useLiveQuery(() => db.characters.where('projectId').equals(projectId).toArray(), [projectId]) ?? []
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<Character | null>(null)
  const [traitDraft, setTraitDraft] = useState('')

  const selected = characters.find((c) => c.id === selectedId) ?? null

  async function addCharacter() {
    const id = await db.characters.add({
      projectId,
      name: 'New character',
      aliases: '',
      role: '',
      background: emptyDoc(),
      abilities: [],
      traits: [],
      imageIds: [],
      updatedAt: Date.now(),
    })
    setSelectedId(id)
  }

  async function patch(patch: Partial<Character>) {
    if (!selected) return
    await db.characters.update(selected.id!, { ...patch, updatedAt: Date.now() })
  }

  function updateAbility(index: number, ability: Ability) {
    if (!selected) return
    const abilities = [...selected.abilities]
    abilities[index] = ability
    patch({ abilities })
  }

  function removeAbility(index: number) {
    if (!selected) return
    patch({ abilities: selected.abilities.filter((_, i) => i !== index) })
  }

  function addTrait() {
    if (!selected || !traitDraft.trim()) return
    patch({ traits: [...selected.traits, traitDraft.trim()] })
    setTraitDraft('')
  }

  function removeTrait(index: number) {
    if (!selected) return
    patch({ traits: selected.traits.filter((_, i) => i !== index) })
  }

  async function handleDelete() {
    if (!deleting) return
    await db.characters.delete(deleting.id!)
    if (selectedId === deleting.id) setSelectedId(null)
    setDeleting(null)
  }

  return (
    <div className="h-full flex">
      <div
        className={`w-full md:w-72 border-r border-panel-border overflow-y-auto rune-scrollbar p-3 shrink-0 flex-col gap-1 ${
          selected ? 'hidden md:flex' : 'flex'
        }`}
      >
        {characters.map((c) => (
          <CharacterThumb key={c.id} character={c} active={c.id === selectedId} onClick={() => setSelectedId(c.id!)} />
        ))}
        <button
          onClick={addCharacter}
          className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-sm text-ink-dim hover:text-accent-a border border-dashed border-panel-border mt-1"
        >
          <Plus size={14} /> New character
        </button>
      </div>

      <div className={`flex-1 overflow-y-auto rune-scrollbar p-5 md:p-8 ${selected ? 'block' : 'hidden md:block'}`}>
        {!selected ? (
          <EmptyState
            icon={Users}
            title="No one here yet"
            description="Create a character to profile their background, abilities, and portrait."
          />
        ) : (
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => setSelectedId(null)}
              className="md:hidden flex items-center gap-1.5 text-xs text-ink-dim hover:text-ink mb-4"
            >
              <ArrowLeft size={13} /> Back to characters
            </button>
            <div className="flex items-start justify-between mb-4">
              <div>
                <InlineEditable
                  value={selected.name}
                  onSave={(v) => patch({ name: v })}
                  className="font-display text-2xl text-ink"
                  placeholder="Unnamed character"
                />
                <InlineEditable
                  value={selected.role}
                  onSave={(v) => patch({ role: v })}
                  className="text-sm text-ink-dim mt-1"
                  placeholder="Role — e.g. Protagonist, Mentor, Antagonist"
                />
              </div>
              <button
                type="button"
                onClick={() => setDeleting(selected)}
                className="text-ink-dim hover:text-red-400 transition-colors p-1.5"
                title="Delete character"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <label className="block text-xs text-ink-dim mb-1.5">Aliases</label>
            <input
              value={selected.aliases}
              onChange={(e) => patch({ aliases: e.target.value })}
              placeholder="Also known as…"
              className="w-full mb-5 bg-bg-elevated border border-panel-border rounded-xl px-3 py-2 text-sm outline-none focus:border-accent-a transition-colors"
            />

            <label className="block text-xs text-ink-dim mb-1.5">Portraits</label>
            <div className="mb-6">
              <ImageGallery
                projectId={projectId}
                imageIds={selected.imageIds}
                onChange={(ids) => patch({ imageIds: ids })}
              />
            </div>

            <label className="block text-xs text-ink-dim mb-1.5">Traits</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selected.traits.map((t, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-accent-b/15 text-accent-b"
                >
                  {t}
                  <button onClick={() => removeTrait(i)} className="hover:text-red-400">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 mb-6">
              <input
                value={traitDraft}
                onChange={(e) => setTraitDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTrait())}
                placeholder="Add a trait and press Enter"
                className="flex-1 bg-bg-elevated border border-panel-border rounded-xl px-3 py-1.5 text-xs outline-none focus:border-accent-a transition-colors"
              />
            </div>

            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs text-ink-dim">Abilities</label>
              <button
                onClick={() => patch({ abilities: [...selected.abilities, { name: '', description: '' }] })}
                className="text-xs text-accent-a flex items-center gap-1 hover:opacity-80"
              >
                <Plus size={12} /> Add ability
              </button>
            </div>
            <div className="flex flex-col gap-2 mb-6">
              {selected.abilities.length === 0 && (
                <p className="text-xs text-ink-dim italic">No abilities recorded.</p>
              )}
              {selected.abilities.map((a, i) => (
                <div key={i} className="glass rounded-xl p-3 flex gap-2 items-start">
                  <Sparkle size={14} className="text-accent-c mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <input
                      value={a.name}
                      onChange={(e) => updateAbility(i, { ...a, name: e.target.value })}
                      placeholder="Ability name"
                      className="w-full bg-transparent text-sm font-medium outline-none mb-1 text-ink"
                    />
                    <textarea
                      value={a.description}
                      onChange={(e) => updateAbility(i, { ...a, description: e.target.value })}
                      placeholder="What can they do?"
                      rows={2}
                      className="w-full bg-transparent text-xs outline-none resize-none text-ink-dim"
                    />
                  </div>
                  <button onClick={() => removeAbility(i)} className="text-ink-dim hover:text-red-400 shrink-0">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            <label className="block text-xs text-ink-dim mb-1.5">Background</label>
            <div style={{ minHeight: 260 }}>
              <RichTextEditor
                content={selected.background}
                onChange={(json) => patch({ background: json })}
                placeholder="Their history, motivations, secrets…"
              />
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleting}
        title={`Delete "${deleting?.name}"?`}
        description="This character profile and its images will be permanently removed."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
