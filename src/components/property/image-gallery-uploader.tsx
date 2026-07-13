'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, X, ImagePlus, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface ImageGalleryUploaderProps {
  urls: string[]
  onChange: (urls: string[]) => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB raw input
const MAX_IMAGES = 15
const MAX_DIMENSION = 1280 // max width/height in px
const JPEG_QUALITY = 0.75

export function ImageGalleryUploader({ urls, onChange }: ImageGalleryUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isReading, setIsReading] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const compressImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = Math.round((height * MAX_DIMENSION) / width)
              width = MAX_DIMENSION
            } else {
              width = Math.round((width * MAX_DIMENSION) / height)
              height = MAX_DIMENSION
            }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) { reject(new Error('Canvas not supported')); return }
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }, [])

  const readFilesAsDataUrls = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    if (urls.length + fileArray.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} imagini permise`)
      return
    }
    for (const file of fileArray) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" depaseste 10MB`)
        return
      }
    }
    setIsReading(true)
    try {
      const results = await Promise.all(
        fileArray.map(async (file) => {
          try {
            return await compressImage(file)
          } catch {
            toast.error(`Eroare la procesarea "${file.name}"`)
            return null
          }
        })
      )
      const validResults = results.filter((r): r is string => r !== null)
      if (validResults.length > 0) {
        onChange([...urls, ...validResults])
      }
    } finally {
      setIsReading(false)
    }
  }, [urls, onChange, compressImage])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      readFilesAsDataUrls(files)
    }
  }, [readFilesAsDataUrls])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      readFilesAsDataUrls(files)
    }
    e.target.value = ''
  }, [readFilesAsDataUrls])

  const addUrl = () => {
    const trimmed = urlInput.trim()
    if (trimmed && !urls.includes(trimmed)) {
      if (urls.length >= MAX_IMAGES) {
        toast.error(`Maximum ${MAX_IMAGES} imagini permise`)
        return
      }
      onChange([...urls, trimmed])
      setUrlInput('')
    }
  }

  const removeUrl = (index: number) => {
    onChange(urls.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef?.click() }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 transition-all cursor-pointer select-none
          ${isDragging
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
          }
          ${isReading ? 'pointer-events-none opacity-70' : ''}
        `}
      >
        {isReading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-2"
          >
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Se proceseaza...</span>
          </motion.div>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Camera className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Trage fotografii aici</p>
              <p className="text-xs text-muted-foreground mt-0.5">sau</p>
            </div>
            <Button type="button" variant="outline" size="sm" className="pointer-events-none">
              <Upload className="h-4 w-4 mr-2" />
              Alege Fotografii
            </Button>
            <p className="text-[11px] text-muted-foreground">PNG, JPG, WebP — max 10MB/fisier, {MAX_IMAGES} imagini. Imaginile sunt redimensionate automat.</p>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Thumbnail grid */}
      <AnimatePresence>
        {urls.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex flex-wrap gap-2">
              {urls.map((url, i) => (
                <motion.div
                  key={`${url.slice(0, 60)}-${i}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative group"
                >
                  <div className="h-20 w-20 rounded-lg overflow-hidden border border-border">
                    <img
                      src={url}
                      alt={`Poza ${i + 1}`}
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeUrl(i)}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Sterge poza ${i + 1}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {i === 0 && (
                    <Badge className="absolute bottom-0.5 left-0.5 text-[8px] px-1 h-3.5 bg-primary">Cover</Badge>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* URL fallback */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => setShowUrlInput((v) => !v)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          <ImagePlus className="h-3 w-3" />
          {showUrlInput ? 'Ascunde' : 'sau adauga prin link'}
        </button>
      </div>

      <AnimatePresence>
        {showUrlInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ImagePlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="https://exemplu.ro/imagine.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl() } }}
                  className="pl-10 h-10"
                />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addUrl} disabled={!urlInput.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-xs text-muted-foreground">Prima imagine va fi folosita ca coperta.</p>
    </div>
  )
}