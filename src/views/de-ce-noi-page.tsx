'use client'

import { motion } from 'framer-motion'
import { Shield, Home, ChevronRight, Users, Award, CheckCircle2 } from 'lucide-react'
import { TrustSection } from '@/components/marketing/trust-section'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { TestimonialsSection } from '@/components/marketing/testimonials-section'
import { AboutUsSection } from '@/components/marketing/about-us-section'
import { FaqSection } from '@/components/marketing/faq-section'
import { PartnersSection } from '@/components/marketing/partners-section'

export function DeCeNoiPage() {
  return (
    <>
      {/* Page Hero */}
      <section className="relative py-16 lg:py-20 bg-gradient-to-b from-primary/5 via-transparent to-transparent overflow-hidden">
        <div className="absolute inset-0 dots-pattern opacity-30" />
        <div className="floating-blob w-[400px] h-[400px] -top-32 -right-32" style={{ background: 'radial-gradient(circle, oklch(0.527 0.14 160 / 10%) 0%, transparent 70%)' }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
              <Home className="h-4 w-4" />
              <span>Acasa</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium">De Ce Noi</span>
            </nav>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">De Ce HQS Imobiliare?</h1>
                <p className="text-muted-foreground mt-1">Incredere, transparenta si rezultate pentru clientii nostri</p>
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
              {[
                { icon: CheckCircle2, label: 'Date Verificate', value: '100% acuratețe' },
                { icon: Users, label: 'Clienti Multumiti', value: '1,450+' },
                { icon: Award, label: 'Experienta', value: '5+ ani' },
                { icon: Shield, label: 'Tranzactii Sigure', value: 'Securizate' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i, duration: 0.4 }}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* About Us */}
      <AboutUsSection />

      <hr className="section-divider" />

      {/* Trust Section */}
      <TrustSection />

      <hr className="section-divider" />

      {/* How It Works */}
      <HowItWorks />

      <hr className="section-divider" />

      {/* Testimonials */}
      <TestimonialsSection />

      <hr className="section-divider" />

      {/* Partners */}
      <PartnersSection />

      <hr className="section-divider" />

      {/* FAQ */}
      <FaqSection />
    </>
  )
}