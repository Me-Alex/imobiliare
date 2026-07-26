'use client'

import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  Images,
  Loader2,
  Plus,
  Star,
  Trash2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ImageGalleryUploaderProps {
  urls: string[]
  onChange: (urls: string[]) => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB raw input
const MAX_IMAGES = 15
const MAX_DIMENSION = 1280 // maximum width/height in pixels
const JPEG_QUALITY = 0.75
const REMOTE_IMAGE_TIMEOUT = 10_000

function verifyRemoteImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const timeout = window.setTimeout(() => {
      image.onload = null
      image.onerror = null
      reject(new Error('Imaginea nu a răspuns în timp util. Verifică linkul și încearcă din nou.'))
    }, REMOTE_IMAGE_TIMEOUT)

    const cleanup = () => {
      window.clearTimeout(timeout)
      image.onload = null
      image.onerror = null
    }

    image.onload = () => {
      const isValidImage = image.naturalWidth > 0 && image.naturalHeight > 0
      cleanup()
      if (isValidImage) {
        resolve()
      } else {
        reject(new Error('Linkul nu conține o imagine validă.'))
      }
    }
    image.onerror = () => {
      cleanup()
      reject(new Error('Imaginea nu poate fi încărcată de la acest link.'))
    }
    image.src = url
  })
}

export function ImageGalleryUploader({ urls, onChange }: ImageGalleryUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isReading, setIsReading] = useState(false)
  const [isCheckingUrl, setIsCheckingUrl] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [urlError, setUrlError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const busyRef = useRef(false)
  const urlsRef = useRef(urls)
  urlsRef.current = urls

  const atLimit = urls.length >= MAX_IMAGES
  const isBusy = isReading || isCheckingUrl

  const commitUrls = useCallback((nextUrls: string[]) => {
    urlsRef.current = nextUrls
    onChange(nextUrls)
  }, [onChange])

  const compressImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const image = new Image()
        image.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = image

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
          const context = canvas.getContext('2d')
          if (!context) {
            reject(new Error('Canvas indisponibil'))
            return
          }

          context.drawImage(image, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
        }
        image.onerror = () => reject(new Error('Imaginea nu a putut fi încărcată'))
        image.src = event.target?.result as string
      }
      reader.onerror = () => reject(new Error('Fișierul nu a putut fi citit'))
      reader.readAsDataURL(file)
    })
  }, [])

  const readFilesAsDataUrls = useCallback(async (files: FileList | File[]) => {
    if (busyRef.current) return

    const fileArray = Array.from(files)
    const currentUrls = urlsRef.current

    if (currentUrls.length + fileArray.length > MAX_IMAGES) {
      toast.error(`Poți încărca maximum ${MAX_IMAGES} fotografii`)
      return
    }

    for (const file of fileArray) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`„${file.name}” depășește limita de 10 MB`)
        return
      }
    }

    busyRef.current = true
    setIsReading(true)
    setIsDragging(false)
    try {
      const results = await Promise.all(
        fileArray.map(async (file) => {
          try {
            return await compressImage(file)
          } catch {
            toast.error(`Fotografia „${file.name}” nu a putut fi procesată`)
            return null
          }
        }),
      )
      const validResults = results.filter((result): result is string => result !== null)
      if (validResults.length > 0) {
        commitUrls([...urlsRef.current, ...validResults])
      }
    } finally {
      busyRef.current = false
      setIsReading(false)
    }
  }, [commitUrls, compressImage])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (busyRef.current || urlsRef.current.length >= MAX_IMAGES) return
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
    if (busyRef.current || urlsRef.current.length >= MAX_IMAGES) return
    const files = event.dataTransfer.files
    if (files.length > 0) {
      void readFilesAsDataUrls(files)
    }
  }, [readFilesAsDataUrls])

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      void readFilesAsDataUrls(files)
    }
    event.target.value = ''
  }, [readFilesAsDataUrls])

  const addUrl = async () => {
    if (busyRef.current) return

    const trimmed = urlInput.trim()
    if (!trimmed) return

    if (urlsRef.current.length >= MAX_IMAGES) {
      toast.error(`Poți încărca maximum ${MAX_IMAGES} fotografii`)
      return
    }

    let normalizedUrl: string
    try {
      const parsedUrl = new URL(trimmed)
      if (parsedUrl.protocol !== 'https:') {
        throw new Error('Folosește un link HTTPS pentru a proteja încărcarea fotografiei.')
      }
      normalizedUrl = parsedUrl.toString()
    } catch (error) {
      const message = error instanceof Error && error.message.includes('HTTPS')
        ? error.message
        : 'Introdu un link HTTPS valid către fotografie.'
      setUrlError(message)
      toast.error('Linkul nu poate fi folosit', { description: message })
      return
    }

    if (urlsRef.current.includes(normalizedUrl)) {
      const message = 'Fotografia de la acest link este deja în galerie.'
      setUrlError(message)
      toast.info(message)
      return
    }

    busyRef.current = true
    setIsCheckingUrl(true)
    setUrlError('')
    try {
      await verifyRemoteImage(normalizedUrl)
      if (urlsRef.current.length >= MAX_IMAGES) {
        throw new Error(`Poți încărca maximum ${MAX_IMAGES} fotografii.`)
      }
      commitUrls([...urlsRef.current, normalizedUrl])
      setUrlInput('')
      toast.success('Fotografia a fost adăugată în galerie.')
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Imaginea nu poate fi încărcată de la acest link.'
      setUrlError(message)
      toast.error('Fotografia nu a putut fi verificată', { description: message })
    } finally {
      busyRef.current = false
      setIsCheckingUrl(false)
    }
  }

  const removeUrl = (index: number) => {
    if (busyRef.current) return
    commitUrls(urlsRef.current.filter((_, currentIndex) => currentIndex !== index))
  }

  const setCover = (index: number) => {
    if (busyRef.current || index === 0) return
    const currentUrls = urlsRef.current
    commitUrls([currentUrls[index], ...currentUrls.filter((_, currentIndex) => currentIndex !== index)])
  }

  const openFilePicker = () => {
    if (atLimit || busyRef.current) return
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.07] via-card to-card">
        <div className="flex flex-col gap-3 border-b border-border/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Images className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">Construiește galeria proprietății</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Folosește fotografii luminoase, în format landscape, pentru o prezentare cât mai convingătoare.
              </p>
            </div>
          </div>
          <Badge variant={atLimit ? 'default' : 'secondary'} className="w-fit shrink-0 tabular-nums">
            {urls.length} / {MAX_IMAGES} fotografii
          </Badge>
        </div>

        <div className="p-3 sm:p-4">
          <div
            role="button"
            tabIndex={atLimit || isBusy ? -1 : 0}
            aria-disabled={atLimit || isBusy}
            aria-label={atLimit
              ? 'Ai atins numărul maxim de fotografii'
              : isBusy
                ? 'Galeria procesează o fotografie'
                : 'Încarcă fotografii pentru proprietate'}
            aria-busy={isBusy}
            onClick={openFilePicker}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                openFilePicker()
              }
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative flex min-h-44 select-none flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border-2 border-dashed px-5 py-7 text-center outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
              ${isDragging
                ? 'scale-[1.01] border-primary bg-primary/10 shadow-sm'
                : 'border-border/80 bg-background/70 hover:border-primary/50 hover:bg-background'
              }
              ${atLimit || isBusy ? 'cursor-default opacity-75' : 'cursor-pointer'}
            `}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
            {isReading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative flex flex-col items-center gap-2"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
                <span className="text-sm font-medium">Se procesează fotografiile…</span>
                <span className="text-xs text-muted-foreground">Optimizăm imaginile pentru încărcare rapidă.</span>
              </motion.div>
            ) : isCheckingUrl ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative flex flex-col items-center gap-2"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
                <span className="text-sm font-medium">Verificăm fotografia din link…</span>
                <span className="text-xs text-muted-foreground">Confirmăm că linkul este sigur și imaginea poate fi afișată.</span>
              </motion.div>
            ) : atLimit ? (
              <div className="relative flex flex-col items-center gap-2">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold">Galeria este completă</p>
                <p className="text-xs text-muted-foreground">Elimină o fotografie dacă vrei să încarci alta.</p>
              </div>
            ) : (
              <>
                <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border bg-card text-primary shadow-sm">
                  <Camera className="h-6 w-6" aria-hidden="true" />
                </span>
                <div className="relative">
                  <p className="text-sm font-semibold sm:text-base">Trage fotografiile aici</p>
                  <p className="mt-1 text-xs text-muted-foreground">sau selectează-le de pe dispozitiv</p>
                </div>
                <span className="relative inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm">
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  Alege fotografii
                </span>
                <p className="relative max-w-lg text-[11px] leading-relaxed text-muted-foreground">
                  JPG, PNG sau WebP · maximum 10 MB per fișier · imaginile sunt redimensionate automat
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        disabled={atLimit || isBusy}
      />

      <AnimatePresence>
        {urls.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Galeria anunțului</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Prima fotografie este coperta afișată în listări.</p>
              </div>
              <Badge variant="outline" className="tabular-nums">
                {urls.length} {urls.length === 1 ? 'fotografie' : 'fotografii'}
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <motion.figure
                key={`cover-${urls[0].slice(0, 60)}`}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="group relative min-h-64 overflow-hidden rounded-2xl border bg-muted shadow-sm sm:col-span-2 sm:min-h-80 lg:row-span-2"
              >
                <img
                  src={urls[0]}
                  alt="Fotografia de copertă a proprietății"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
                <div className="absolute left-3 top-3">
                  <Badge className="gap-1.5 border-0 bg-background/90 text-foreground shadow-sm backdrop-blur">
                    <Star className="h-3 w-3 fill-current text-amber-500" aria-hidden="true" />
                    Copertă
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={() => removeUrl(0)}
                  disabled={isBusy}
                  className="absolute right-3 top-3 h-9 w-9 bg-background/90 text-destructive shadow-sm backdrop-blur hover:bg-destructive hover:text-destructive-foreground"
                  aria-label="Șterge fotografia de copertă"
                  title="Șterge fotografia de copertă"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
                <figcaption className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <p className="text-sm font-semibold">Imagine principală</p>
                  <p className="mt-0.5 text-xs text-white/75">Aceasta va apărea prima în anunț.</p>
                </figcaption>
              </motion.figure>

              {urls.slice(1).map((url, offset) => {
                const index = offset + 1
                return (
                  <motion.figure
                    layout
                    key={`${url.slice(0, 60)}-${index}`}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="overflow-hidden rounded-xl border bg-card shadow-sm"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-muted">
                      <img
                        src={url}
                        alt={`Fotografia ${index + 1} a proprietății`}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                      />
                    </div>
                    <figcaption className="flex items-center justify-between gap-2 p-2.5">
                      <span className="truncate text-xs font-medium text-muted-foreground">Fotografia {index + 1}</span>
                      <span className="flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setCover(index)}
                          disabled={isBusy}
                          className="h-8 w-8 text-muted-foreground hover:text-amber-600"
                          aria-label={`Setează fotografia ${index + 1} drept copertă`}
                          title="Setează drept copertă"
                        >
                          <Star className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeUrl(index)}
                          disabled={isBusy}
                          className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Șterge fotografia ${index + 1}`}
                          title="Șterge fotografia"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </span>
                    </figcaption>
                  </motion.figure>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setShowUrlInput((visible) => !visible)}
          disabled={isBusy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50"
        >
          <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
          {showUrlInput ? 'Ascunde câmpul pentru link' : 'Adaugă o fotografie prin link'}
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
            <div
              className="rounded-xl border bg-muted/20 p-3"
              aria-busy={isCheckingUrl}
            >
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <ImagePlus className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="url"
                    inputMode="url"
                    aria-label="Link HTTPS către fotografie"
                    aria-invalid={Boolean(urlError)}
                    aria-describedby={urlError || isCheckingUrl ? 'property-image-url-feedback' : undefined}
                    placeholder="https://exemplu.ro/imagine.jpg"
                    value={urlInput}
                    disabled={isBusy}
                    onChange={(event) => {
                      setUrlInput(event.target.value)
                      if (urlError) setUrlError('')
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        void addUrl()
                      }
                    }}
                    className="h-10 pl-10"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { void addUrl() }}
                  disabled={!urlInput.trim() || atLimit || isBusy}
                  className="gap-2 sm:self-center"
                  aria-busy={isCheckingUrl}
                >
                  {isCheckingUrl
                    ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    : <Plus className="h-4 w-4" aria-hidden="true" />}
                  {isCheckingUrl ? 'Verificăm…' : 'Adaugă'}
                </Button>
              </div>

              {isCheckingUrl || urlError ? (
                <p
                  id="property-image-url-feedback"
                  role={urlError ? 'alert' : 'status'}
                  aria-live="polite"
                  className={urlError
                    ? 'mt-2 text-xs leading-relaxed text-destructive'
                    : 'mt-2 flex items-center gap-1.5 text-xs text-muted-foreground'}
                >
                  {isCheckingUrl ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      Verificăm dacă linkul HTTPS poate afișa fotografia.
                    </>
                  ) : urlError}
                </p>
              ) : (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Sunt acceptate numai linkuri HTTPS care deschid direct o imagine publică.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
