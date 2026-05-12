import Header from '@/components/Header'
import Hero from '@/components/Hero'
import ProprietatiSection from '@/components/ProprietatiSection'
import PropertyHighlights from '@/components/PropertyHighlights'
import ProcessSection from '@/components/ProcessSection'
import Benefits from '@/components/Benefits'
import RecommendationStudio from '@/components/RecommendationStudio'
import ExperienceCommandCenter from '@/components/ExperienceCommandCenter'
import CmsContentBand from '@/components/CmsContentBand'
import Contact from '@/components/Contact'
import FAQ from '@/components/FAQ'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'

export default async function Home() {
  const [{ data: properties }, { data: cmsEntry }] = await Promise.all([
    supabase.from('properties').select('*').eq('status', 'PUBLISHED').limit(12),
    supabase.from('cms_entries').select('*').eq('key', 'home.hero').maybeSingle(),
  ])

  return (
    <main id="continut">
      <Header />
      <Hero />
      <CmsContentBand entry={cmsEntry} />
      <PropertyHighlights />
      <ProprietatiSection />
      <RecommendationStudio properties={properties || []} />
      <ExperienceCommandCenter properties={properties || []} />
      <ProcessSection />
      <Benefits />
      <FAQ />
      <Contact />
      <Footer />
    </main>
  )
}
