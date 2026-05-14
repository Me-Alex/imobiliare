"use client"

import Image, { type ImageProps } from "next/image"
import { useEffect, useState } from "react"

type SmartPropertyImageProps = Omit<ImageProps, "src" | "onError" | "unoptimized"> & {
  src: string
  fallbackSrc: string
}

export default function SmartPropertyImage({ src, fallbackSrc, ...props }: SmartPropertyImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src)

  useEffect(() => {
    setCurrentSrc(src)
  }, [src])

  return (
    <Image
      {...props}
      src={currentSrc}
      unoptimized
      onError={() => {
        if (currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc)
      }}
    />
  )
}
