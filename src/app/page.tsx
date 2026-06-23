import { HomePageClient } from "@/components/landing/home-page-client"
import { PublicContentSection } from "@/components/landing/public-content-section"

export const dynamic = "force-dynamic"

export default function Home() {
  return (
    <HomePageClient>
      <PublicContentSection />
    </HomePageClient>
  )
}
