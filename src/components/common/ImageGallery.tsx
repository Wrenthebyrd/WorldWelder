import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ImagePlus, X } from 'lucide-react'
import { db, type ImageAsset } from '@/db'
import { prepareImageForStorage } from '@/lib/imageProcessing'

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

interface DragState {
  startX: number
  startY: number
  origX: number
  origY: number
  width: number
  height: number
  moved: boolean
  currentX: number
  currentY: number
}

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
  const [pos, setPos] = useState({ x: image.posX ?? 50, y: image.posY ?? 50 })
  const [dragging, setDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)

  useEffect(() => {
    setPos({ x: image.posX ?? 50, y: image.posY ?? 50 })
  }, [image.posX, image.posY])

  useEffect(() => {
    const objectUrl = URL.createObjectURL(image.blob)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [image.blob])

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (readOnly) return
    if ((e.target as HTMLElement).closest('button')) return
    const rect = containerRef.current!.getBoundingClientRect()
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
      width: rect.width,
      height: rect.height,
      moved: false,
      currentX: pos.x,
      currentY: pos.y,
    }
    containerRef.current!.setPointerCapture(e.pointerId)
    setDragging(true)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag) return
    const dxPct = ((e.clientX - drag.startX) / drag.width) * 100
    const dyPct = ((e.clientY - drag.startY) / drag.height) * 100
    if (Math.abs(dxPct) > 1 || Math.abs(dyPct) > 1) drag.moved = true
    const nextX = clamp(drag.origX - dxPct, 0, 100)
    const nextY = clamp(drag.origY - dyPct, 0, 100)
    drag.currentX = nextX
    drag.currentY = nextY
    setPos({ x: nextX, y: nextY })
  }

  async function handlePointerUp() {
    const drag = dragRef.current
    dragRef.current = null
    setDragging(false)
    if (!drag || !drag.moved) return
    await db.images.update(image.id!, { posX: drag.currentX, posY: drag.currentY })
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative group rounded-xl overflow-hidden glass shrink-0 ${
        readOnly ? 'w-36 h-36' : 'w-24 h-24'
      } ${!readOnly ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
      style={{ touchAction: readOnly ? undefined : 'none' }}
      title={readOnly ? undefined : 'Drag to reposition'}
    >
      {url && (
        <img
          src={url}
          alt={image.name}
          draggable={false}
          className="w-full h-full object-cover select-none pointer-events-none"
          style={{ objectPosition: `${pos.x}% ${pos.y}%` }}
        />
      )}
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
      const blob = await prepareImageForStorage(file)
      const id = await db.images.add({ projectId, name: file.name, mimeType: blob.type || file.type, blob })
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
