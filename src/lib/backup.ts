import { saveAs } from 'file-saver'
import { db, getSettings, type Project, type Chapter, type Character, type WorldEntry, type Settings } from '@/db'

interface BackupImage {
  id: number
  projectId: number
  name: string
  mimeType: string
  base64: string
}

interface BackupData {
  version: 1
  exportedAt: number
  projects: Project[]
  chapters: Chapter[]
  characters: Character[]
  worldEntries: WorldEntry[]
  images: BackupImage[]
  settings: Settings
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mimeType })
}

export async function exportBackup(): Promise<void> {
  const [projects, chapters, characters, worldEntries, images, settings] = await Promise.all([
    db.projects.toArray(),
    db.chapters.toArray(),
    db.characters.toArray(),
    db.worldEntries.toArray(),
    db.images.toArray(),
    getSettings(),
  ])

  const backupImages: BackupImage[] = await Promise.all(
    images.map(async (img) => ({
      id: img.id!,
      projectId: img.projectId,
      name: img.name,
      mimeType: img.mimeType,
      base64: await blobToBase64(img.blob),
    })),
  )

  const backup: BackupData = {
    version: 1,
    exportedAt: Date.now(),
    projects,
    chapters,
    characters,
    worldEntries,
    images: backupImages,
    settings,
  }

  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' })
  saveAs(blob, `worldwelder-backup-${new Date().toISOString().slice(0, 10)}.json`)
  await db.settings.put({ ...settings, lastBackupAt: Date.now(), id: 1 })
}

export async function importBackup(file: File): Promise<void> {
  const text = await file.text()
  const backup = JSON.parse(text) as BackupData

  await db.transaction(
    'rw',
    [db.projects, db.chapters, db.characters, db.worldEntries, db.images, db.settings],
    async () => {
      await Promise.all([
        db.projects.clear(),
        db.chapters.clear(),
        db.characters.clear(),
        db.worldEntries.clear(),
        db.images.clear(),
      ])
      if (backup.projects?.length) await db.projects.bulkAdd(backup.projects)
      if (backup.chapters?.length) await db.chapters.bulkAdd(backup.chapters)
      if (backup.characters?.length) await db.characters.bulkAdd(backup.characters)
      if (backup.worldEntries?.length) await db.worldEntries.bulkAdd(backup.worldEntries)
      if (backup.images?.length) {
        await db.images.bulkAdd(
          backup.images.map((img) => ({
            id: img.id,
            projectId: img.projectId,
            name: img.name,
            mimeType: img.mimeType,
            blob: base64ToBlob(img.base64, img.mimeType),
          })),
        )
      }
      if (backup.settings) {
        await db.settings.put({ ...backup.settings, id: 1 })
      }
    },
  )
}
