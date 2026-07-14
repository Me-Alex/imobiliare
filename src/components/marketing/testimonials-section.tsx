'use client';

import { motion, type Variants } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const testimonials = [
  {
    name: 'Ana Maria Popescu',
    role: 'Cumpărător apartament Sector 1',
    rating: 5,
    text: 'Am găsit apartamentul ideal în mai puțin de 2 săptămâni. Echipa HQS Imobiliare a fost extrem de profesionistă și m-a ajutat să iau cea mai bună decizie. Recomand cu încredere!',
    initials: 'AP',
    color: 'bg-emerald-500',
  },
  {
    name: 'Mihai Ionescu',
    role: 'Investitor imobiliar',
    rating: 5,
    text: 'Platforma oferă cele mai bune analize de piață din București. Dashboard-ul mi-a permis să identific oportunități excelente de investiție. Un instrument indispensabil.',
    initials: 'MI',
    color: 'bg-amber-500',
  },
  {
    name: 'Elena Dragomir',
    role: 'Vânzător apartament',
    rating: 4,
    text: 'Procesul de vânzare a fost simplu și eficient. Am primit oferte relevante și am vândut proprietatea la un preț peste așteptări. Mulțumesc, HQS Imobiliare!',
    initials: 'ED',
    color: 'bg-rose-500',
  },
  {
    name: 'Alexandru Radu',
    role: 'Familie tânără',
    rating: 5,
    text: 'Căutam o casă potrivită pentru familia noastră și HQS Imobiliare ne-a oferit exact ce aveam nevoie. Filtrele avansate și compararea proprietăților ne-au salvat mult timp.',
    initials: 'AR',
    color: 'bg-sky-500',
  },
  {
    name: 'Cristina Matei',
    role: 'Închiriere apartament',
    rating: 4,
    text: 'Am închiriat un apartament superb în Dorobanti prin HQS Imobiliare. Transparența prețurilor și pozele reale m-au convins instant. Experiență excelentă!',
    initials: 'CM',
    color: 'bg-violet-500',
  },
  {
    name: 'Dan Stoica',
    role: 'Consultant imobiliar',
    rating: 5,
    text: 'Ca profesionist în domeniu, folosesc HQS Imobiliare zilnic pentru a monitoriza piața. Datele sunt precise și actualizate, iar interfața este intuitivă. Cel mai bun tool din România.',
    initials: 'DS',
    color: 'bg-orange-500',
  },
];

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export function TestimonialsSection() {
  return (
    <section id="testimoniale" className="scroll-mt-20 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="gradient-text text-3xl font-bold tracking-tight sm:text-4xl">
            Ce Spun Clienții Noștri
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Peste 1.000 de clienți mulțumiți ne recomandă.
          </p>
        </div>

        {/* Testimonials Grid */}
        <motion.div
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {testimonials.map((testimonial) => (
            <motion.div key={testimonial.name} variants={cardVariants}>
              <Card className="rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                <CardContent className="flex h-full flex-col gap-4 p-6">
                  {/* Quote icon + Stars */}
                  <div className="flex items-start justify-between">
                    <Quote className="h-6 w-6 text-primary" />
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < testimonial.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-muted text-muted'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Review Text */}
                  <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                    &ldquo;{testimonial.text}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 border-t pt-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${testimonial.color} text-sm font-semibold text-white`}
                    >
                      {testimonial.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {testimonial.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
