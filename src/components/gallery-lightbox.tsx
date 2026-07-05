'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

interface GalleryLightboxProps {
  images: string[]
  initialIndex?: number
  open: boolean
  onClose: () => void
}

export function GalleryLightbox({ images, initialIndex = 0, open, onClose }: GalleryLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [zoomed, setZoomed] = useState(false)
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 })
  const [swipeStart, setSwipeStart] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const thumbnailStripRef = useRef<HTMLDivElement>(null)

  const goToNext = useCallback(() => {
    setZoomed(false)
    setImageLoaded(false)
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }, [images.length])

  const goToPrev = useCallback(() => {
    setZoomed(false)
    setImageLoaded(false)
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }, [images.length])

  const goToIndex = useCallback((index: number) => {
    setZoomed(false)
    setImageLoaded(false)
    setCurrentIndex(index)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (zoomed) {
          setZoomed(false)
        } else {
          onClose()
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, currentIndex, images.length, zoomed, onClose, goToNext, goToPrev])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Scroll active thumbnail into view
  useEffect(() => {
    if (thumbnailStripRef.current) {
      const activeThumb = thumbnailStripRef.current.children[currentIndex] as HTMLElement | undefined
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [currentIndex])

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    e.stopPropagation()
    if (zoomed) {
      setZoomed(false)
    } else {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      setZoomOrigin({ x, y })
      setZoomed(true)
    }
  }, [zoomed])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !zoomed) {
      onClose()
    }
  }, [onClose, zoomed])

  // Touch / mouse swipe support
  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    setSwipeStart({ x: clientX, y: clientY })
  }, [])

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Just tracking — no-op during move
  }, [])

  const handlePointerUp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!swipeStart) return
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX
    const diff = clientX - swipeStart.x
    const absDiff = Math.abs(diff)

    if (absDiff > 60) {
      if (diff > 0) {
        goToPrev()
      } else {
        goToNext()
      }
    }
    setSwipeStart(null)
  }, [swipeStart, goToNext, goToPrev])

  // Preload adjacent images
  useEffect(() => {
    const preload = (url: string) => {
      const img = new Image()
      img.src = url
    }
    if (images.length > 1) {
      const nextIdx = (currentIndex + 1) % images.length
      const prevIdx = (currentIndex - 1 + images.length) % images.length
      preload(images[nextIdx])
      preload(images[prevIdx])
    }
  }, [currentIndex, images])

  if (images.length === 0) return null

  const currentImage = images[currentIndex]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={containerRef}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          onClick={handleBackdropClick}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        >
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (zoomed) {
                setZoomed(false)
              } else {
                onClose()
              }
            }}
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-black hover:bg-white transition-colors shadow-lg"
            aria-label="Inchide galeria"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Image counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/15 text-white text-sm font-medium px-3 py-1 rounded-full backdrop-blur-sm">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Main image area */}
          <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden px-14 py-4">
            {/* Previous button */}
            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goToPrev() }}
                className="absolute left-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-black hover:bg-white transition-colors shadow-lg"
                aria-label="Imaginea anterioara"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Image container */}
            <motion.div
              className="relative max-w-full max-h-full flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{ cursor: zoomed ? 'zoom-out' : 'zoom-in' }}
            >
              {/* Loading spinner */}
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-white/60" />
                </div>
              )}
              <img
                key={currentImage}
                src={currentImage}
                alt={`Imaginea ${currentIndex + 1}`}
                className={`max-h-[calc(100vh-160px)] max-w-full object-contain rounded-sm select-none transition-transform duration-200 ${
                  zoomed ? 'scale-150' : ''
                }`}
                style={zoomed ? { transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%` } : undefined}
                onLoad={() => setImageLoaded(true)}
                onDoubleClick={handleDoubleClick}
                onClick={(e) => {
                  e.stopPropagation()
                }}
                draggable={false}
              />
            </motion.div>

            {/* Next button */}
            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goToNext() }}
                className="absolute right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-black hover:bg-white transition-colors shadow-lg"
                aria-label="Imaginea urmatoare"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="w-full px-4 pb-4 pt-2">
              <div
                ref={thumbnailStripRef}
                className="flex items-center justify-center gap-2 overflow-x-auto mx-auto max-w-3xl py-1 px-1 scroll-horizontal"
              >
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation()
                      goToIndex(i)
                    }}
                    className={`shrink-0 w-16 h-12 rounded-md overflow-hidden transition-all duration-200 ${
                      i === currentIndex
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-black/90 opacity-100'
                        : 'opacity-50 hover:opacity-80'
                    }`}
                    aria-label={`Imaginea ${i + 1}`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}