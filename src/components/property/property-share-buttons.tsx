'use client'

import { useState } from 'react'
import {
  Share2,
  MessageCircle,
  Link,
  Check,
  Send,
  Mail,
  Facebook,
  Smartphone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Property } from '@/lib/types'
import { formatPrice } from '@/lib/utils'

interface PropertyShareButtonsProps {
  property: Property
}

export function PropertyShareButtons({ property }: PropertyShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/proprietati/${encodeURIComponent(property.slug)}`
  const shareText = `🏠 ${property.title}\n💰 ${formatPrice(property.price)}\n📍 ${property.address}, ${property.zone}\n\nVezi detalii: ${shareUrl}`
  const shareTitle = `${property.title} — ${formatPrice(property.price)}`

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText.replace(/\n/g, ' '),
          url: shareUrl,
        })
        return
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }
    // Fallback: copy to clipboard
    handleCopyLink()
  }

  const handleCopyLink = () => {
    if (typeof navigator === 'undefined') return
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      queueMicrotask(() => {
        toast.success('Link copiat!', { description: 'Link-ul a fost copiat în clipboard.' })
      })
      setTimeout(() => setCopied(false), 2500)
    }).catch(() => {
      queueMicrotask(() => {
        toast.error('Eroare', { description: 'Nu am putut copia link-ul.' })
      })
    })
  }

  const openWindow = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500')
  }

  const handleWhatsApp = () => {
    openWindow(`https://wa.me/?text=${encodeURIComponent(shareText)}`)
  }

  const handleTelegram = () => {
    openWindow(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`)
  }

  const handleFacebook = () => {
    openWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`)
  }

  const handleEmail = () => {
    const subject = encodeURIComponent(`Proprietate interesantă: ${property.title}`)
    const body = encodeURIComponent(shareText)
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self')
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <Share2 className="h-4 w-4" />
        Distribuie
      </span>

      <div className="flex flex-wrap items-center gap-2">
        {/* Native Share — primary on mobile */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-8 text-xs"
          onClick={handleNativeShare}
        >
          <Smartphone className="h-3.5 w-3.5" />
          Distribuie
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-8 text-xs"
          onClick={handleWhatsApp}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-8 text-xs"
          onClick={handleTelegram}
        >
          <Send className="h-3.5 w-3.5" />
          Telegram
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-8 text-xs"
          onClick={handleFacebook}
        >
          <Facebook className="h-3.5 w-3.5" />
          Facebook
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-8 text-xs"
          onClick={handleEmail}
        >
          <Mail className="h-3.5 w-3.5" />
          Email
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-8 text-xs"
          onClick={handleCopyLink}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Link className="h-3.5 w-3.5" />
          )}
          {copied ? 'Copiat' : 'Copiază link'}
        </Button>
      </div>
    </div>
  )
}
