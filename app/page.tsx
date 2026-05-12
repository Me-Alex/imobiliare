import Header from '@/components/Header'
import Hero from '@/components/Hero'
import ProprietatiSection from '@/components/ProprietatiSection'
import PropertyHighlights from '@/components/PropertyHighlights'
import ProcessSection from '@/components/ProcessSection'
import Benefits from '@/components/Benefits'
import Contact from '@/components/Contact'
import FAQ from '@/components/FAQ'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main id="continut">
      <Header />
      <Hero />
      <PropertyHighlights />
      <ProprietatiSection />
      <ProcessSection />
      <Benefits />
      <FAQ />
      <Contact />
      <Footer />
    </main>
  )
}
