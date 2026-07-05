import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ImagePlus, X } from 'lucide-react'
import { db, type ImageAsset } from '@/db'

function Thumb({
  image,
  onRemove,
  readOnly,
}: {
  image: ImageAsset
  onRemove: () => void
  readOnly?: boolean
}) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    const objectUrl = URL.createObjectURL(image.blob)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [image.blob])

  return (
    <div
      className={`relative group rounded-xl overflow-hidden glass shrink-0 ${
        readOnly ? 'w-36 h-36' : 'w-24 h-24'
      }`}
    >
      {url && <img src={url} alt={image.name} className="w-full h-full object-cover" />}
      {!readOnly && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={`Remove ${image.name}`}
        >
          <X size={13} />
        </button>
      )}
    </div>
  )
}

interface ImageGalleryProps {
  projectId: number
  imageIds: number[]
  onChange?: (ids: number[]) => void
  readOnly?: boolean
}

export function ImageGallery({ projectId, imageIds, onChange, readOnly = false }: ImageGalleryProps) {
  const images = useLiveQuery(async () => {
    if (imageIds.length === 0) return []
    const results = await db.images.bulkGet(imageIds)
    return results.filter((r): r is ImageAsset => !!r)
  }, [imageIds])

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0 || !onChange) return
    const newIds: number[] = []
    for (const file of Array.from(files)) {
      const id = await db.images.add({ projectId, name: file.name, mimeType: file.type, blob: file })
      newIds.push(id)
    }
    onChange([...imageIds, ...newIds])
  }

  async function handleRemove(id: number) {
    onChange?.(imageIds.filter((i) => i !== id))
    await db.images.delete(id)
  }

  if (readOnly && (images ?? []).length === 0) return null

  return (
    <div className="flex flex-wrap gap-3">
      {(images ?? []).map((img) => (
        <Thumb key={img.id} image={img} onRemove={() => handleRemove(img.id!)} readOnly={readOnly} />
      ))}
      {!readOnly && (
        <label className="w-24 h-24 rounded-xl border-2 border-dashed border-panel-border flex flex-col items-center justify-center gap-1 cursor-pointer text-ink-dim hover:text-accent-a hover:border-accent-a/50 transition-colors shrink-0">
          <ImagePlus size={20} />
          <span className="text-[10px]">Add image</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      )}
    </div>
  )
}
