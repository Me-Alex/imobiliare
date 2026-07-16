'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'

const contactSchema = z.object({
  name: z.string().min(2, 'Numele trebuie să aibă cel puțin 2 caractere.'),
  email: z.string().email('Adresa de email nu este validă.'),
  phone: z.string().min(10, 'Numărul de telefon trebuie să aibă cel puțin 10 caractere.'),
  message: z.string().min(10, 'Mesajul trebuie să aibă cel puțin 10 caractere.'),
  privacyAccepted: z.boolean().refine((value) => value, {
    message: 'Trebuie să confirmi informarea privind prelucrarea datelor.',
  }),
})

type ContactFormValues = z.infer<typeof contactSchema>

interface ContactFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  propertyTitle?: string
  propertyId?: string
  initialName?: string
  initialEmail?: string
  initialPhone?: string
  initialMessage?: string
}

function ContactFormDialog({
  open,
  onOpenChange,
  propertyTitle,
  propertyId,
  initialName = '',
  initialEmail = '',
  initialPhone = '',
  initialMessage,
}: ContactFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: initialName,
      email: initialEmail,
      phone: initialPhone,
      message: initialMessage || (propertyTitle
        ? `Bună ziua, sunt interesat de proprietatea "${propertyTitle}". Aș dori mai multe detalii.`
        : ''),
      privacyAccepted: false,
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      name: initialName,
      email: initialEmail,
      phone: initialPhone,
      message: initialMessage || (propertyTitle
        ? `Bună ziua, sunt interesat(ă) de proprietatea "${propertyTitle}" și doresc mai multe detalii.`
        : ''),
      privacyAccepted: false,
    })
  }, [form, initialEmail, initialMessage, initialName, initialPhone, open, propertyTitle])

  const handleOpenChange = (v: boolean) => {
    if (!v) setIsSuccess(false)
    onOpenChange(v)
  }

  async function onSubmit(data: ContactFormValues) {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, propertyTitle, propertyId }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'A apărut o eroare.')
      }

      setIsSuccess(true)
      toast.success('Mesaj trimis cu succes!', {
        description: 'Vă vom contacta în cel mai scurt timp posibil.',
      })
    } catch (error) {
      toast.error('Eroare la trimitere', {
        description: error instanceof Error ? error.message : 'Vă rugăm încercați din nou.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-12 text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Mesaj trimis!</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Mulțumim pentru interes. Vă vom răspunde în cel mai scurt timp.
              </p>
              <Button onClick={() => handleOpenChange(false)} variant="outline">
                Închide
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader>
                <DialogTitle>Trimite un mesaj</DialogTitle>
                <DialogDescription>
                  Completează formularul de mai jos și te vom contacta cât mai curând.
                  {propertyTitle && (
                    <span className="block mt-1 font-medium text-foreground">
                      Referitor la: {propertyTitle}
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nume *</FormLabel>
                        <FormControl>
                          <Input placeholder="Numele complet" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@exemplu.ro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefon *</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="0712 345 678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mesaj *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Scrie mesajul tău aici..."
                            rows={4}
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="privacyAccepted"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={(event) => field.onChange(event.target.checked)}
                              className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                              aria-describedby="contact-privacy-description"
                            />
                          </FormControl>
                          <div>
                            <p id="contact-privacy-description" className="text-xs leading-relaxed text-muted-foreground">
                              Confirm că am citit{' '}
                              <a href="/confidentialitate" target="_blank" rel="noreferrer" className="font-medium text-primary underline-offset-4 hover:underline">
                                informarea privind protecția datelor
                              </a>{' '}
                              și accept să fiu contactat(ă) pentru această solicitare.
                            </p>
                            <FormMessage />
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={isSubmitting} className="gap-2 min-w-[140px]">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Se trimite...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Trimite mesajul
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

export { ContactFormDialog }
