import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ImageOff } from 'lucide-react'
import { db } from '@/db'

interface StoredImageProps {
  imageId: number | undefined
  className?: string
}

export function StoredImage({ imageId, className = '' }: StoredImageProps) {
  const image = useLiveQuery(() => (imageId ? db.images.get(imageId) : undefined), [imageId])
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!image) {
      setUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(image.blob)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [image])

  if (!imageId) return null

  if (!url) {
    return (
      <div className={`flex items-center justify-center rounded-xl glass py-8 text-ink-dim ${className}`}>
        <ImageOff size={20} />
      </div>
    )
  }

  return <img src={url} alt="" className={`rounded-xl max-w-full ${className}`} />
}
