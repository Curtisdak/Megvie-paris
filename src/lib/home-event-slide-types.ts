export type HomeEventSlideAction = {
  label: string
  href: string
  external?: boolean
  variant?: "primary" | "secondary"
}

export type HomeEventSlide = {
  id: string
  eyebrow: string
  title: string
  description: string
  dateLabel?: string
  timeLabel?: string
  locationLabel?: string
  address?: string
  imageUrl?: string | null
  gradient: string
  actions: HomeEventSlideAction[]
}
