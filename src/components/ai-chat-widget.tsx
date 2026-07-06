'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Bot, MessageCircle, Send, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'

interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  content: string
}

function getFallbackResponse(msg: string): string {
  const lower = msg.toLowerCase()
  if (lower.includes('pret') || lower.includes('cat costa') || lower.includes('preturi')) {
    return 'Preturile in Bucuresti variaza intre 1.400 si 5.200 EUR/m² in functie de zona. Zonele premium precum Herastrau si Primaverii au cele mai mari preturi, in timp ce zone precum Militari si Drumul Taberei ofera optiuni mai accesibile.'
  }
  if (lower.includes('inchiriere') || lower.includes('inchiriez')) {
    return 'Preturile de inchiriere in Bucuresti variaza intre 400 si 3.500 EUR/luna in functie de zona si suprafata. Zonele centrale precum Universitate si Unirii sunt cele mai solicitate.'
  }
  if (lower.includes('zona') || lower.includes('secto')) {
    return 'Principalele zone din Bucuresti sunt: Dorobanti, Floreasca, Herastrau, Primaverii (premium), Pipera, Baneasa, Barbu Vacarescu (business), Militari, Drumul Taberei (accesibile). Fiecare zona are caracteristicile ei unice.'
  }
  if (lower.includes('vila') || lower.includes('casa')) {
    return 'Vilele si casele in Bucuresti se gasesc in principal in zonele Herastrau, Primaverii, Baneasa si nordul orasului. Preturile variaza intre 200.000 si 1.000.000+ EUR in functie de suprafata si locatie.'
  }
  if (lower.includes('investit') || lower.includes('randament')) {
    return 'Randamentele de inchiriere in Bucuresti variaza intre 3.5% si 6% anual. Zonele cu cele mai bune randamente sunt Pipera si Militari datorita cererii ridicate de inchiriere.'
  }
  if (lower.includes('contact') || lower.includes('telefon') || lower.includes('ajutor')) {
    return 'Ne poti contacta la: Telefon: +40 21 123 4567, Email: contact@hqsimobiliare.ro. Suntem disponibili de luni pana vineri, 9:00 - 18:00.'
  }
  return 'Multumesc pentru intrebare! Poti cauta proprietati folosind filtrele din sectiunea "Proprietati" sau explora zonele din Bucuresti in sectiunea "Zone". Daca ai nevoie de asistenta personalizata, foloseste formularul de contact.'
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'ai',
  content:
    'Salut! Sunt asistentul tau HQS Imobiliare. Poti sa ma intrebi despre proprietati, zone, preturi sau orice altceva legat de piata imobiliara din Bucuresti.',
}

interface AIChatWidgetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
      <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
      <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
    </div>
  )
}

export function AIChatWidget({ open, onOpenChange }: AIChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading, scrollToBottom])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open])

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      })
      const data = await res.json()
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: data.reply || 'Nu am putut genera un răspuns.',
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      // Fallback: generate a simple response without AI backend
      const fallback = getFallbackResponse(trimmed)
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: fallback,
      }
      setMessages((prev) => [...prev, aiMsg])
    } finally {
      setLoading(false)
    }
  }, [input, loading])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    },
    [sendMessage]
  )

  return (
    <div className="fixed bottom-6 right-6 z-35 flex flex-col items-end gap-3" style={{ zIndex: 35 }}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-[calc(100vw-2rem)] sm:w-[380px] rounded-xl border border-border/50 bg-background shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: 'min(520px, calc(100vh - 6rem))' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-primary/5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold leading-tight">Asistent HQS Imobiliare</h3>
                  <p className="text-[11px] text-muted-foreground">Online • Răspunde rapid</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onOpenChange(false)}
                aria-label="Închide chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '400px' }}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted text-muted-foreground rounded-bl-md'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-muted rounded-2xl rounded-bl-md">
                    <TypingIndicator />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border/50 p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  sendMessage()
                }}
                className="flex items-center gap-2"
              >
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Scrie un mesaj..."
                  disabled={loading}
                  className="flex-1 h-10 rounded-full px-4 text-sm"
                  aria-label="Mesaj chat"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={loading || !input.trim()}
                  className="h-10 w-10 rounded-full shrink-0"
                  aria-label="Trimite mesaj"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              size="icon"
              className="h-14 w-14 rounded-full shadow-lg transition-shadow hover:shadow-xl focus-visible:ring-2 focus-visible:ring-emerald-500"
              onClick={() => onOpenChange(true)}
              aria-label="Deschide chat asistent"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}