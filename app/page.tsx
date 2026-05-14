import Header from '@/components/Header'
import Hero from '@/components/Hero'
import ProprietatiSection from '@/components/ProprietatiSection'
import PropertyHighlights from '@/components/PropertyHighlights'
import ProcessSection from '@/components/ProcessSection'
import Benefits from '@/components/Benefits'
import RecommendationStudio from '@/components/RecommendationStudio'
import ExperienceCommandCenter from '@/components/ExperienceCommandCenter'
import MarketPulseSection from '@/components/MarketPulseSection'
import ScenarioLab from '@/components/ScenarioLab'
import CmsContentBand from '@/components/CmsContentBand'
import Contact from '@/components/Contact'
import FAQ from '@/components/FAQ'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

export const revalidate = 60

export default async function Home() {
  const [{ data: properties }, { data: cmsEntries }] = await Promise.all([
    supabase.from('properties').select('*').eq('status', 'PUBLISHED').limit(12),
    supabase.from('cms_entries').select('*').in('key', ['home.hero', 'home.benefits', 'home.faq']).eq('status', 'PUBLISHED'),
  ])
  const cms = Object.fromEntries((cmsEntries || []).map((entry) => [entry.key, entry]))

  return (
    <main id="continut">
      <Header />
      <Hero entry={cms['home.hero']} />
      <CmsContentBand entry={cms['home.hero']} />
      <PropertyHighlights />
      <ProprietatiSection initialProperties={properties || []} />
      <RecommendationStudio properties={properties || []} />
      <MarketPulseSection properties={properties || []} />
      <ScenarioLab />
      <ExperienceCommandCenter properties={properties || []} />
      <ProcessSection />
      <Benefits entry={cms['home.benefits']} />
      <FAQ entry={cms['home.faq']} />
      <Contact />
      <Footer />
    </main>
  )
}
