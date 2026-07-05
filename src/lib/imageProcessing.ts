const MAX_DIMENSION = 900
const JPEG_QUALITY = 0.85
// Anything already smaller than this is left completely untouched.
const SKIP_PROCESSING_BYTES = 400 * 1024

export async function prepareImageForStorage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) return file
  if (file.size <= SKIP_PROCESSING_BYTES) return file

  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await loadImage(objectUrl)
    const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight, MAX_DIMENSION)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file

    // White backdrop so any transparent PNGs don't turn black once flattened to JPEG.
    // Note: this also flattens animated GIFs/WebPs to a single static frame (canvas
    // drawImage always captures frame 1, browsers don't expose later frames) —
    // intentional, since rendering several large animated GIFs at once is what causes
    // the app to lag. If a source GIF opens on a blank fade-in frame, the captured
    // thumbnail will look blank; re-export a better frame as a still image in that case.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
    if (!blob || blob.size >= file.size) return file
    return blob
  } catch {
    return file
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  if (width <= max && height <= max) return { width, height }
  const scale = width > height ? max / width : max / height
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}
