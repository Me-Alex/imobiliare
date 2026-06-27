"use client"

import { useEffect, useRef, useCallback } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import SmartPropertyImage from "./SmartPropertyImage"

interface PropertyLightboxProps {
  images: string[]
  currentIndex: number
  title: string
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export default function PropertyLightbox({
  images,
  currentIndex,
  title,
  onClose,
  onPrev,
  onNext,
}: PropertyLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [])

  // Inchide la click pe backdrop (zona din afara imaginii)
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose()
  }, [onClose])

  // Navigare cu tastatura
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") onPrev()
      if (e.key === "ArrowRight") onNext()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose, onPrev, onNext])

  // Swipe touch
  const touchStartX = useRef<number | null>(null)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) diff > 0 ? onNext() : onPrev()
    touchStartX.current = null
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 m-0 h-full w-full max-h-full max-w-full bg-black/92 p-0 backdrop:bg-transparent"
      aria-label={`Galerie foto: ${title}`}
      style={{ border: "none" }}
    >
      <div
        className="relative flex h-full w-full flex-col items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Buton inchidere */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          aria-label="Inchide galeria"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>

        {/* Counter */}
        <p className="absolute left-4 top-4 z-10 rounded-full bg-black/50 px-3 py-1 text-xs font-bold text-white">
          {currentIndex + 1} / {images.length}
        </p>

        {/* Imagine principala */}
        <div className="relative h-[80vh] w-full max-w-5xl px-16">
          <SmartPropertyImage
            src={images[currentIndex]}
            alt={`${title} — foto ${currentIndex + 1}`}
            fill
            sizes="(min-width: 1024px) 80vw, 100vw"
            className="object-contain"
            priority
          />
        </div>

        {/* Navigare stanga */}
        {images.length > 1 && (
          <button
            onClick={onPrev}
            className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            aria-label="Poza anterioara"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden />
          </button>
        )}

        {/* Navigare dreapta */}
        {images.length > 1 && (
          <button
            onClick={onNext}
            className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            aria-label="Poza urmatoare"
          >
            <ChevronRight className="h-6 w-6" aria-hidden />
          </button>
        )}

        {/* Thumbnails strip */}
        {images.length > 1 && (
          <div className="absolute bottom-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => {
                  // navigheaza direct la thumbnailul selectat
                  const diff = i - currentIndex
                  if (diff > 0) for (let j = 0; j < diff; j++) onNext()
                  else if (diff < 0) for (let j = 0; j < -diff; j++) onPrev()
                }}
                className={`relative h-14 w-20 shrink-0 overflow-hidden rounded border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${i === currentIndex ? "border-white" : "border-transparent opacity-60 hover:opacity-100"}`}
                aria-label={`Mergi la foto ${i + 1}`}
                aria-current={i === currentIndex ? "true" : undefined}
              >
                <SmartPropertyImage
                  src={img}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </dialog>
  )
}
