import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, Building2, ExternalLink } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Informare privind protecția datelor — DEMO | HQS Imobiliare',
  description: 'Informare GDPR demonstrativă folosită exclusiv pentru testarea platformei HQS Imobiliare.',
  robots: {
    index: false,
    follow: false,
  },
}

const sections = [
  {
    title: '1. Operatorul și datele de contact',
    content: (
      <>
        Operatorul demonstrativ este <strong>HQS IMOBILIARE SRL</strong>, CUI 52014343,
        nr. Registrul Comerțului J2025044682007, cu sediul în Str. Sg. Constantin Moise nr. 5D,
        bl. 2, sc. 2, ap. B5, Sector 6, București, România. Pentru acest test, persoana de contact
        este „Reprezentant legal HQS — DEMO”, e-mail{' '}
        <span className="font-medium">demo-juridic@hqsimobiliare.invalid</span> și telefon
        <span className="font-medium"> +40 700 000 000 (DEMO)</span>. Adresa cu extensia
        <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">.invalid</code>
        {' '}nu poate primi mesaje și trebuie înlocuită înainte de lansarea în producție.
      </>
    ),
  },
  {
    title: '2. Date prelucrate și sursa lor',
    content: (
      <>
        Putem prelucra date de identificare și contact, informații despre cererea imobiliară,
        datele programării și vizionării, semnătura aplicată documentelor, comunicările cu agenția
        și date tehnice de securitate. Datele sunt furnizate direct de persoana vizată ori sunt
        generate în timpul folosirii platformei și al colaborării cu agenția.
      </>
    ),
  },
  {
    title: '3. Scopuri și temeiuri juridice',
    content: (
      <>
        Datele sunt folosite pentru preluarea solicitărilor, programarea și dovedirea vizionărilor,
        pregătirea și executarea demersurilor precontractuale sau contractuale, îndeplinirea
        obligațiilor legale, prevenirea fraudelor și apărarea drepturilor. Temeiurile pot fi
        art. 6 alin. (1) lit. b), c) și f) din GDPR, după caz. Comunicările de marketing se fac
        numai pe baza unui consimțământ separat, care poate fi retras oricând.
      </>
    ),
  },
  {
    title: '4. Destinatari și transferuri',
    content: (
      <>
        Datele pot fi comunicate personalului și colaboratorilor autorizați, proprietarilor ori
        clienților implicați în tranzacție, furnizorilor IT și de semnătură, notarilor, avocaților,
        contabililor și autorităților, numai în măsura necesară. Pentru furnizorii aflați în afara
        Spațiului Economic European se vor folosi garanțiile cerute de GDPR; configurația finală
        trebuie verificată înainte de producție.
      </>
    ),
  },
  {
    title: '5. Durata păstrării',
    content: (
      <>
        Datele sunt păstrate pe durata necesară gestionării solicitării și colaborării, apoi conform
        termenelor legale și termenelor de prescripție aplicabile. Datele de test trebuie șterse sau
        anonimizate la finalul verificării. Termenele exacte vor fi stabilite în politica finală a
        agenției și în registrul activităților de prelucrare.
      </>
    ),
  },
  {
    title: '6. Drepturile persoanei vizate',
    content: (
      <>
        În condițiile GDPR, persoana vizată poate solicita accesul, rectificarea, ștergerea,
        restricționarea prelucrării, portabilitatea și se poate opune prelucrării. Consimțământul
        poate fi retras fără a afecta legalitatea prelucrării anterioare. Cererile reale vor putea
        fi trimise numai după înlocuirea adresei demonstrative cu datele oficiale de contact.
      </>
    ),
  },
  {
    title: '7. Reclamații și decizii automate',
    content: (
      <>
        Persoana vizată poate depune o plângere la Autoritatea Națională de Supraveghere a
        Prelucrării Datelor cu Caracter Personal. Platforma nu utilizează, în acest flux
        demonstrativ, decizii exclusiv automate care produc efecte juridice asupra persoanei.
      </>
    ),
  },
]

export default function PrivacyNoticePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="border-b bg-muted/30">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Înapoi la platformă
          </Link>
          <div className="flex items-center gap-2 font-semibold">
            <Building2 className="h-5 w-5 text-primary" />
            HQS Imobiliare
          </div>
        </div>
      </div>

      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 text-amber-950 dark:text-amber-100">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold uppercase tracking-wide">DEMO — NU PENTRU PRODUCȚIE</p>
              <p className="mt-1 text-sm leading-6">
                Această informare există exclusiv pentru verificarea tehnică a programărilor și
                documentelor. Conține date de contact fictive, nu reprezintă consultanță juridică
                și nu trebuie prezentată clienților reali.
              </p>
            </div>
          </div>
        </div>

        <header className="mb-10">
          <p className="text-sm font-medium text-primary">Versiunea DEMO-2026-07-15</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Informare privind prelucrarea datelor cu caracter personal
          </h1>
          <p className="mt-4 text-muted-foreground">
            Model demonstrativ construit pe structura informațiilor prevăzute de articolele 13–14
            din Regulamentul (UE) 2016/679 (GDPR).
          </p>
        </header>

        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <div className="mt-3 leading-7 text-muted-foreground">{section.content}</div>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border bg-muted/30 p-5">
          <h2 className="font-semibold">Surse oficiale utile</h2>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <a
              href="https://eur-lex.europa.eu/eli/reg/2016/679/oj"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-primary hover:underline"
            >
              Regulamentul general privind protecția datelor
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://www.dataprotection.ro/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-primary hover:underline"
            >
              Autoritatea Națională de Supraveghere (ANSPDCP)
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Ultima actualizare demonstrativă: 15 iulie 2026. Înainte de lansare, documentul trebuie
          completat cu datele reale ale agenției și validat nominal de avocatul sau consilierul
          juridic desemnat.
        </p>
      </article>
    </main>
  )
}
