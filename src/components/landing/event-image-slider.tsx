import { EventImageSliderClient } from "@/components/landing/event-image-slider-client"
import { getHomeEventSlides } from "@/lib/home-event-slides"

export async function EventImageSlider() {
  const slides = await getHomeEventSlides()

  return <EventImageSliderClient slides={slides} />
}
