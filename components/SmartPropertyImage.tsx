"use client"

import Image, { type ImageProps } from "next/image"
import { useEffect, useState } from "react"

type SmartPropertyImageProps = Omit<ImageProps, "src" | "onError"> & {
  src: string
  fallbackSrc: string
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

  const inlineAsset = currentSrc.startsWith("data:") || currentSrc.endsWith(".svg")

  return (
    <Image
      {...props}
      src={currentSrc}
      fill={fill}
      priority={priority}
      loading={priority ? undefined : loading || "lazy"}
      decoding={decoding || "async"}
      className={`${fill ? "absolute inset-0 h-full w-full " : ""}${className || ""}`}
      unoptimized={props.unoptimized || inlineAsset}
      onError={() => {
        if (currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc)
      }}
    />
  )
}
