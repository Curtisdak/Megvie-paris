import "server-only"

import { ContentVisibility, EventStatus } from "@/generated/prisma/enums"
import type {
  HomeEventSlide,
  HomeEventSlideAction,
} from "@/lib/home-event-slide-types"
import { prisma } from "@/lib/prisma"

export type { HomeEventSlide, HomeEventSlideAction }

const churchMapUrl =
  "https://www.google.com/maps/search/?api=1&query=4+rue+de+Chanzy,+94170+Le+Perreux-sur-Marne"

function formatDate(value: Date) {
  return value.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  })
}

function formatTimeRange(start: Date, end: Date | null) {
  const startTime = start.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  if (!end) return startTime

  const endTime = end.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return `${startTime} - ${endTime}`
}

function mapUrlFromAddress(address: string | null) {
  if (!address) return null

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address,
  )}`
}

export async function getHomeEventSlides(): Promise<HomeEventSlide[]> {
  const now = new Date()
  const events = await prisma.churchEvent.findMany({
    where: {
      status: EventStatus.PUBLISHED,
      visibility: ContentVisibility.PUBLIC,
      archivedAt: null,
      startsAt: { gte: now },
    },
    orderBy: [{ createdAt: "desc" }, { startsAt: "asc" }],
    take: 4,
    select: {
      id: true,
      title: true,
      shortDescription: true,
      description: true,
      startsAt: true,
      endsAt: true,
      locationName: true,
      address: true,
      mapUrl: true,
      registrationUrl: true,
      coverImageUrl: true,
    },
  })

  const eventSlides = events.map((event, index): HomeEventSlide => {
    const mapUrl = event.mapUrl ?? mapUrlFromAddress(event.address)
    const actions: HomeEventSlideAction[] = []

    if (event.registrationUrl) {
      actions.push({
        label: "S'inscrire",
        href: event.registrationUrl,
        external: true,
        variant: "primary",
      })
    }

    if (mapUrl) {
      actions.push({
        label: "Voir l'itineraire",
        href: mapUrl,
        external: true,
        variant: event.registrationUrl ? "secondary" : "primary",
      })
    }

    return {
      id: `event-${event.id}`,
      eyebrow: index === 0 ? "Dernier evenement" : "Evenement",
      title: event.title,
      description:
        event.shortDescription ||
        event.description ||
        "Retrouvez les informations pratiques de cet evenement MegVie Paris.",
      dateLabel: formatDate(event.startsAt),
      timeLabel: formatTimeRange(event.startsAt, event.endsAt),
      locationLabel: event.locationName ?? "MegVie Paris",
      address: event.address ?? undefined,
      imageUrl: event.coverImageUrl,
      gradient:
        "linear-gradient(135deg, #111827 0%, #7c2d12 48%, #0f766e 100%)",
      actions,
    }
  })

  return [
    ...eventSlides,
    {
      id: "default-welcome",
      eyebrow: "Bienvenue",
      title: "Bienvenue a MegVie Paris",
      description:
        "Une famille de foi ouverte aux visiteurs, aux familles et a toute personne qui cherche un lieu de priere, d'ecoute et d'esperance.",
      dateLabel: "Chaque semaine",
      timeLabel: "Accueil, priere et communaute",
      locationLabel: "MegVie Paris",
      imageUrl: "/Media/Default-event-02.jpg",
      gradient:
        "linear-gradient(135deg, #111827 0%, #92400e 45%, #14532d 100%)",
      actions: [
        {
          label: "Rejoindre un culte",
          href: churchMapUrl,
          external: true,
          variant: "primary",
        },
        {
          label: "Faire un don",
          href: "#don",
          variant: "secondary",
        },
      ],
    },
    {
      id: "default-church-info",
      eyebrow: "Culte et adresse",
      title: "Service du dimanche",
      description:
        "Nous nous retrouvons pour la louange, la parole, la priere et un temps fraternel. Cliquez sur l'adresse pour ouvrir Google Maps.",
      dateLabel: "Dimanche",
      timeLabel: "14:30 - 16:30",
      locationLabel: "MegVie Paris",
      address: "4 rue de Chanzy, 94170 Le Perreux-sur-Marne",
      imageUrl: "/Media/Default-event-04.jpg",
      gradient:
        "linear-gradient(135deg, #0f172a 0%, #0f766e 46%, #ca8a04 100%)",
      actions: [
        {
          label: "Ouvrir Google Maps",
          href: churchMapUrl,
          external: true,
          variant: "primary",
        },
      ],
    },
  ]
}
