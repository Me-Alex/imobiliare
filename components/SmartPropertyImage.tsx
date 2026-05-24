"use client"

import Image, { type ImageLoaderProps, type ImageProps } from "next/image"
import { useEffect, useState } from "react"

type SmartPropertyImageProps = Omit<ImageProps, "src" | "loader"> & {
  src: string
  fallbackSrc?: string // optional - default la string gol (nu mai face loop de erori)
}

function isSupabaseStorageObject(url: URL) {
  return url.hostname.endsWith(".supabase.co") && url.pathname.startsWith("/storage/v1/object/public/")
}

function isSupabaseStorageRender(url: URL) {
  return url.hostname.endsWith(".supabase.co") && url.pathname.startsWith("/storage/v1/render/image/public/")
}

function hqsImageLoader({ src, width, quality }: ImageLoaderProps) {
  const trimmed = String(src || "").trim()
  if (!trimmed) return trimmed
  if (trimmed.startsWith("data:")) return trimmed

  try {
    const url = new URL(trimmed)

    if (url.hostname === "images.unsplash.com") {
      url.searchParams.set("w", String(width))
      url.searchParams.set("q", String(quality || 80))
      if (!url.searchParams.get("auto")) url.searchParams.set("auto", "format")
      return url.toString()
    }

    if (isSupabaseStorageObject(url)) {
      url.pathname = url.pathname.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/")
    }

    if (isSupabaseStorageRender(url)) {
      url.searchParams.set("width", String(width))
      url.searchParams.set("quality", String(quality || 80))
      return url.toString()
    }

    return url.toString()
  } catch {
    return trimmed
  }
}

function shouldUseCustomLoader(src: string) {
  const trimmed = String(src || "").trim()
  if (!trimmed || trimmed.startsWith("/") || trimmed.startsWith("data:")) return false
  try {
    const url = new URL(trimmed)
    return url.hostname === "images.unsplash.com" || url.hostname.endsWith(".supabase.co")
  } catch {
    return false
  }
}

export default function SmartPropertyImage({ src, fallbackSrc = "", ...props }: SmartPropertyImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src)

  useEffect(() => {
    setCurrentSrc(src)
  }, [src])

  return (
    <Image
      {...props}
      loader={shouldUseCustomLoader(currentSrc) ? hqsImageLoader : undefined}
      src={currentSrc}
      onError={() => {
        if (fallbackSrc && currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc)
      }}
    />
  )
}
