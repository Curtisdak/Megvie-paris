import { EventImageSlider } from "@/components/landing/event-image-slider"
import { HomePageClient } from "@/components/landing/home-page-client"

export const dynamic = "force-dynamic"

export default function Home() {
  return <HomePageClient featuredContent={<EventImageSlider />} />
}
