import Dexie, { type Table } from 'dexie'

export interface Project {
  id?: number
  name: string
  description: string
  icon: string
  color: string
  order: number
  createdAt: number
  updatedAt: number
}

export interface Chapter {
  id?: number
  projectId: number
  title: string
  subtitle: string
  order: number
  draftContent: string
  officialContent: string
  updatedAt: number
}

export interface Ability {
  name: string
  description: string
}

export interface EntrySection {
  id: string
  title: string
  content: string
}

export interface Character {
  id?: number
  projectId: number
  name: string
  aliases: string
  role: string
  sections: EntrySection[]
  abilities: Ability[]
  traits: string[]
  imageIds: number[]
  updatedAt: number
}

export interface WorldEntry {
  id?: number
  projectId: number
  category: string
  title: string
  sections: EntrySection[]
  imageIds: number[]
  updatedAt: number
}

export interface ImageAsset {
  id?: number
  projectId: number
  name: string
  mimeType: string
  blob: Blob
}

export interface Settings {
  id?: number
  theme: 'light' | 'dark'
  authorName: string
  passcodeHash: string | null
  lockEnabled: boolean
  rememberDevice: boolean
  lastBackupAt: number | null
}

class WorldWelderDB extends Dexie {
  projects!: Table<Project, number>
  chapters!: Table<Chapter, number>
  characters!: Table<Character, number>
  worldEntries!: Table<WorldEntry, number>
  images!: Table<ImageAsset, number>
  settings!: Table<Settings, number>

  constructor() {
    super('worldwelder')
    this.version(1).stores({
      projects: '++id, order',
      chapters: '++id, projectId, order',
      characters: '++id, projectId',
      worldEntries: '++id, projectId, category',
      images: '++id, projectId',
      settings: '++id',
    })

    this.version(2)
      .stores({
        projects: '++id, order',
        chapters: '++id, projectId, order',
        characters: '++id, projectId',
        worldEntries: '++id, projectId, category',
        images: '++id, projectId',
        settings: '++id',
      })
      .upgrade(async (tx) => {
        await tx
          .table('worldEntries')
          .toCollection()
          .modify((entry: WorldEntry & { content?: string }) => {
            if (!entry.sections) {
              entry.sections = entry.content
                ? [{ id: crypto.randomUUID(), title: 'Overview', content: entry.content }]
                : []
            }
            delete entry.content
          })
        await tx
          .table('characters')
          .toCollection()
          .modify((char: Character & { background?: string }) => {
            if (!char.sections) {
              char.sections = char.background
                ? [{ id: crypto.randomUUID(), title: 'Background', content: char.background }]
                : []
            }
            delete char.background
          })
      })
  }
}

export const db = new WorldWelderDB()

export const WORLD_CATEGORIES = [
  'Locations',
  'Factions',
  'Races',
  'Creatures',
  'Concepts',
  'Lore & History',
  'Magic & Technology',
  'Timeline',
  'Items & Artifacts',
] as const

export async function getSettings(): Promise<Settings> {
  const existing = await db.settings.get(1)
  if (existing) return existing
  const defaults: Settings = {
    id: 1,
    theme: 'dark',
    authorName: '',
    passcodeHash: null,
    lockEnabled: false,
    rememberDevice: false,
    lastBackupAt: null,
  }
  await db.settings.put(defaults)
  return defaults
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const current = await getSettings()
  await db.settings.put({ ...current, ...patch, id: 1 })
}

export async function createProject(data: Pick<Project, 'name' | 'description' | 'icon' | 'color'>): Promise<number> {
  const count = await db.projects.count()
  const now = Date.now()
  return db.projects.add({ ...data, order: count, createdAt: now, updatedAt: now })
}

export async function deleteProjectCascade(projectId: number): Promise<void> {
  await db.transaction('rw', db.projects, db.chapters, db.characters, db.worldEntries, db.images, async () => {
    await db.chapters.where('projectId').equals(projectId).delete()
    await db.characters.where('projectId').equals(projectId).delete()
    await db.worldEntries.where('projectId').equals(projectId).delete()
    await db.images.where('projectId').equals(projectId).delete()
    await db.projects.delete(projectId)
  })
}

export function emptyDoc(): string {
  return JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] })
}

export function newSection(title = 'New section'): EntrySection {
  return { id: crypto.randomUUID(), title, content: emptyDoc() }
}
