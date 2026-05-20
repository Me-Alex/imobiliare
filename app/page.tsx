import Header from '@/components/Header'
import Hero from '@/components/Hero'
import ProprietatiSection from '@/components/ProprietatiSection'
import HomeRedesignSections from '@/components/HomeRedesignSections'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'
import { supabase, type Property } from '@/lib/supabase'

export const revalidate = 60

export default async function Home() {
  const [{ data: properties }, { data: cmsEntries }] = await Promise.all([
    supabase.from('properties').select('*').eq('status', 'PUBLISHED').limit(12),
    supabase.from('cms_entries').select('*').eq('key', 'home.hero').eq('status', 'PUBLISHED'),
  ])
  const cms = Object.fromEntries((cmsEntries || []).map((entry) => [entry.key, entry]))
  const publishedProperties = (properties || []) as Property[]

  return (
    <main id="continut">
      <Header />
      <Hero entry={cms['home.hero']} properties={publishedProperties} />
      <ProprietatiSection initialProperties={publishedProperties} />
      <HomeRedesignSections properties={publishedProperties} />
      <Contact headingLevel="h2" />
      <Footer />
    </main>
  )
}
