export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  threshold?: number
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  threshold: 10 * 1024 * 1024, // 10MB
}

export async function compressImage(file: File, options: CompressionOptions = {}): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  if (file.size <= (opts.threshold || 0)) {
    return file
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target?.result as string
    }

    reader.onerror = (e) => reject(e)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      // Resize logic
      const maxWidth = opts.maxWidth || width
      const maxHeight = opts.maxHeight || height

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      ctx.fillStyle = 'white' // Handle transparent backgrounds for JPEGs
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Compression failed'))
            return
          }
          
          // Create new file with same name but likely different type/size
          const newFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })

          resolve(newFile)
        },
        'image/jpeg',
        opts.quality
      )
    }

    img.onerror = (e) => reject(e)

    reader.readAsDataURL(file)
  })
}
