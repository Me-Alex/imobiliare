'use client'

import { motion, type Variants } from 'framer-motion'
import { HelpCircle } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqItems = [
  {
    question: 'Care sunt documentele necesare pentru cumpararea unei proprietati?',
    answer:
      'Pentru a cumpara o proprietate in Romania, veti avea nevoie de actul de identitate, certificatul fiscal eliberat de ANAF si extrasul de carte funciara. In cazul creditului ipotecar, banca va solicita si adeverinta de venit, fluturasul de salariu si o cerere tip. Este recomandat sa solicitati si extrasul de carte funciara pentru informare pentru a verifica istoricul juridic al imobilului.',
  },
  {
    question: 'Cum se calculeaza taxa de notar?',
    answer:
      'Taxa de notar se calculeaza in functie de valoarea tranzactiei si variaza intre 0.5% si 1% din pretul de cumparare, conform tarifelor notariale aprobate de Uniunea Nationala a Notarilor Publici. La aceasta se adauga onorariul pentru intocmirea actelor si taxele extrajudiciare de timbru. Notarul va emite o nota de taxa inainte de semnarea finala a contractului.',
  },
  {
    question: 'Ce inseamna pretul pe metru patrat si de ce este important?',
    answer:
      'Pretul pe metru patrat este indicatorul principal pentru evaluarea proprietatilor imobiliare, obtinut prin impartirea pretului total la suprafata utila. Acesta permite compararea obiectiva a proprietatilor cu dimensiuni diferite si urmarirea evolutiei preturilor pe o anumita zona. Pe HQS Imobiliare, afisam pretul/mp actualizat zilnic pentru fiecare proprietate si zona.',
  },
  {
    question: 'Care sunt cele mai cautate zone din Bucuresti in 2024?',
    answer:
      'In 2024, zonele nordice ale Bucurestiului raman cele mai cautate, cu Aviatiei, Pipera si Baneasa in topul preferintelor, urmate de zonele centrale precum Dorobanti si Victoriei. Sectorul 6 inregistreaza o crestere a cererii datorita preturilor mai accesibile si a noilor proiecte rezidentiale. Zonele cu acces la metrou, precum Militari sau Drumul Taberei, continua sa fie foarte apreciate de familii.',
  },
  {
    question: 'Cat dureaza in medie o tranzactie imobiliara?',
    answer:
      'O tranzactie imobiliara standard dureaza in medie 4-6 saptamani de la semnarea precontractului pana la predarea cheilor. Daca este implicat un credit ipotecar, procesul se poate prelungi la 8-12 saptamani din cauza aprobarii bancare si a evaluarii proprietatii. Factori precum obtinarea extraselor de carte funciara sau verificarile juridice pot adauga inca 1-2 saptamani.',
  },
  {
    question: 'Ce avantaje ofera creditele ipotecare in prezent?',
    answer:
      'In prezent, creditele ipotecare beneficiaza de dobanzi mai scazute comparativ cu anii trecuti, cu IRCC la niveluri istorice. Multi banci ofera perioade de gratie de pana la 24 de luni si avansuri incepand de la 5% pentru primele locuinte. Prin programul Noua Casa, cumparatorii pot accesa finantare garantata de stat cu dobanda subventionata partial.',
  },
  {
    question: 'Cum pot verifica istoricul unui imobil?',
    answer:
      'Istoricul unui imobil poate fi verificat prin intermediul extrasului de carte funciara, care poate fi obtinut online de pe site-ul Agentiei Nationale de Cadastru si Publicitate Imobiliara. Acest document arata detinatorii anteriori, sarcinile si eventualele litigii. Recomandam si o vizita la primaria de sector pentru a verifica autorizatiile de constructie si eventualele retrocedari.',
  },
  {
    question: 'Care sunt costurile suplimentare la cumpararea unui apartament?',
    answer:
      'Pe langa pretul de cumparare, trebuie sa aveti in vedere taxa de notar (0.5-1%), comisionul agentiei imobiliare (1-3%), taxele de intabulare si cadastru (aprox. 100-300 RON). Daca achizitionati printr-un credit, adaugati costul evaluarii proprietatii (300-600 RON), comisionul de analiza dosar si asigurarea obligatorie a imobilului. In total, bugetati inca 3-5% din pretul proprietatii pentru cheltuieli auxiliare.',
  },
]

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

export function FaqSection() {
  return (
    <section id="intrebari" className="scroll-mt-20 py-16 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <HelpCircle className="h-4 w-4" />
            Suport &amp; Informatii
          </div>
          <h2 className="section-title-accent text-3xl font-bold tracking-tight sm:text-4xl">
            Intrebari Frecvente
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Raspunsuri la cele mai comune intrebari despre piata imobiliara din Bucuresti.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          className="mx-auto max-w-3xl"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <motion.div key={index} variants={itemVariants}>
                <AccordionItem
                  value={`item-${index}`}
                  className="border-border/60 bg-card rounded-xl px-6 mb-3 last:mb-0 border shadow-sm transition-all duration-200 hover:shadow-md data-[state=open]:shadow-md data-[state=open]:ring-1 data-[state=open]:ring-emerald-500/20"
                >
                  <AccordionTrigger className="text-base font-semibold leading-relaxed hover:no-underline py-5">
                    <span className="text-left pr-2">{item.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
