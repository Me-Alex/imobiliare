"use client"

import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface BackButtonProps {
  defaultHref: string
  label: string
  className?: string
}

// Incearca router.back() daca provenim din aceeasi aplicatie, altfel fallback la href
export default function BackButton({ defaultHref, label, className = "" }: BackButtonProps) {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    // Daca exista o pagina anterioara in history (nu direct access sau refresh), foloseste back()
    if (typeof window !== "undefined" && window.history.length > 1) {
      e.preventDefault()
      router.back()
    }
    // Altfel, Link-ul normal va naviga la defaultHref
  }

  return (
    <Link
      href={defaultHref}
      onClick={handleClick}
      className={`inline-flex items-center gap-2 text-sm font-bold text-text-muted transition-colors hover:text-accent ${className}`}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {label}
    </Link>
  )
}
