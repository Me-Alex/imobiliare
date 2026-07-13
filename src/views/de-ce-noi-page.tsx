'use client'

import { motion } from 'framer-motion'
import { Shield, Users, Award, CheckCircle2 } from 'lucide-react'
import { TrustSection } from '@/components/marketing/trust-section'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { TestimonialsSection } from '@/components/marketing/testimonials-section'
import { AboutUsSection } from '@/components/marketing/about-us-section'
import { FaqSection } from '@/components/marketing/faq-section'
import { PartnersSection } from '@/components/marketing/partners-section'
import { PageHero } from '@/components/layout/page-hero'

export function DeCeNoiPage() {
  return (
    <>
      <PageHero
        icon={Shield}
        title="De Ce HQS Imobiliare?"
        description="Incredere, transparenta si rezultate pentru clientii nostri"
        breadcrumb={[{ label: 'Acasa', page: 'acasa' }, { label: 'De Ce Noi' }]}
      >
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
      </PageHero>

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