import Header from '@/components/Header'
import Hero from '@/components/Hero'
import ProprietatiSection from '@/components/ProprietatiSection'
import PropertyHighlights from '@/components/PropertyHighlights'
import Benefits from '@/components/Benefits'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <PropertyHighlights />
      <ProprietatiSection />
      <Benefits />
      <Contact />
      <Footer />
    </main>
  )
}
