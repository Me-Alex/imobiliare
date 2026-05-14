"use client"

import type { ImgHTMLAttributes } from "react"
import { useEffect, useState } from "react"

type SmartPropertyImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "onError"> & {
  src: string
  fallbackSrc: string
  fill?: boolean
  priority?: boolean
}

export default function SmartPropertyImage({
  src,
  fallbackSrc,
  fill,
  priority,
  className,
  loading,
  decoding,
  ...props
}: SmartPropertyImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src)

  useEffect(() => {
    setCurrentSrc(src)
  }, [src])

  return (
    <img
      {...props}
      src={currentSrc}
      loading={priority ? "eager" : loading || "lazy"}
      decoding={decoding || "async"}
      className={`${fill ? "absolute inset-0 h-full w-full " : ""}${className || ""}`}
      onError={() => {
        if (currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc)
      }}
    />
  )
}
