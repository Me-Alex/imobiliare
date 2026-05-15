import { HomePageFresh } from "@/components/fresh/Public"
import { getPublishedProperties } from "@/lib/fresh-server"

export const revalidate = 60

export default async function Home() {
  const properties = await getPublishedProperties()
  return <HomePageFresh properties={properties} />
}
