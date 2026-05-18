"use client"

import { useState, useCallback } from "react"
import { Camera } from "lucide-react"
import SmartPropertyImage from "./SmartPropertyImage"
import PropertyLightbox from "./PropertyLightbox"

interface PropertyGalleryProps {
  cover: string
  fallbackCover: string
  gallery: string[]
  title: string
  totalCount?: number
}

export default function PropertyGallery({ cover, fallbackCover, gallery, title, totalCount }: PropertyGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  // toate imaginile: cover + gallery (deduplicat)
  const allImages = [cover, ...gallery.filter((img) => img !== cover)].filter(Boolean)
  const thumbnails = gallery.slice(0, 3)
  const extraCount = (totalCount ?? allImages.length) - 1 - thumbnails.length

  const openLightbox = useCallback((index: number) => setLightboxIndex(index), [])
  const closeLightbox = useCallback(() => setLightboxIndex(null), [])
  const goPrev = useCallback(() => setLightboxIndex((i) => (i === null ? 0 : (i - 1 + allImages.length) % allImages.length)), [allImages.length])
  const goNext = useCallback(() => setLightboxIndex((i) => (i === null ? 0 : (i + 1) % allImages.length)), [allImages.length])

  return (
    <>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px]">
        {/* Cover — click deschide lightbox la index 0 */}
        <button
          type="button"
          onClick={() => openLightbox(0)}
          className="group relative aspect-[16/10] overflow-hidden rounded-3xl border border-bg-surface bg-bg-card shadow-[var(--shadow-card)] focus-visible:outline-2 focus-visible:outline-accent"
          aria-label={`Deschide galeria foto pentru ${title}`}
        >
          <SmartPropertyImage
            src={cover}
            fallbackSrc={fallbackCover}
            alt={title}
            fill
            sizes="(min-width: 1024px) 760px, 100vw"
            className="object-cover transition duration-500 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
          {/* Badge numar total poze */}
          <div className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
            <Camera className="h-3.5 w-3.5" aria-hidden />
            {allImages.length} foto
          </div>
        </button>

        {/* Thumbnails — click deschide lightbox la indexul corespunzator */}
        <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
          {thumbnails.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => openLightbox(i + 1)}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-bg-surface bg-bg-card focus-visible:outline-2 focus-visible:outline-accent"
              aria-label={`Foto ${i + 2} din ${allImages.length}`}
            >
              <SmartPropertyImage
                src={img}
                fallbackSrc={fallbackCover}
                alt=""
                fill
                sizes="180px"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              {/* Ultimul thumbnail: overlay cu "+N" daca exista mai multe */}
              {i === thumbnails.length - 1 && extraCount > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-black text-white">
                  +{extraCount}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox — randat doar cand e deschis */}
      {lightboxIndex !== null && (
        <PropertyLightbox
          images={allImages}
          currentIndex={lightboxIndex}
          title={title}
          onClose={closeLightbox}
          onPrev={goPrev}
          onNext={goNext}
        />
      )}
    </>
  )
}
