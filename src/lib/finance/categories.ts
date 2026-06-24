import "server-only"

import { prisma } from "@/lib/prisma"

export const defaultDonationCategories = [
  {
    id: "doncat_dime",
    slug: "dime",
    label: "Dîme",
    description: "Soutenir fidelement la vie et les missions de l'eglise.",
    sortOrder: 10,
  },
  {
    id: "doncat_offrande",
    slug: "offrande",
    label: "Offrande",
    description: "Participer librement aux besoins et projets MegVie Paris.",
    sortOrder: 20,
  },
  {
    id: "doncat_remerciement",
    slug: "remerciement",
    label: "Remerciement",
    description: "Exprimer une reconnaissance particuliere.",
    sortOrder: 30,
  },
  {
    id: "doncat_rachat",
    slug: "rachat",
    label: "Rachat",
    description: "Contribuer a une intention ou un engagement personnel.",
    sortOrder: 40,
  },
  {
    id: "doncat_autre",
    slug: "autre",
    label: "Autre",
    description: "Autre forme de soutien.",
    sortOrder: 50,
  },
] as const

export async function ensureDefaultDonationCategories() {
  await Promise.all(
    defaultDonationCategories.map((category) =>
      prisma.donationCategory.upsert({
        where: { slug: category.slug },
        update: {
          label: category.label,
          description: category.description,
          sortOrder: category.sortOrder,
        },
        create: {
          id: category.id,
          slug: category.slug,
          label: category.label,
          description: category.description,
          sortOrder: category.sortOrder,
        },
      }),
    ),
  )
}

export async function listActiveDonationCategories() {
  await ensureDefaultDonationCategories()

  return prisma.donationCategory.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    select: {
      id: true,
      slug: true,
      label: true,
      description: true,
      isActive: true,
      sortOrder: true,
    },
  })
}

export async function getActiveDonationCategory(categoryIdOrSlug: string) {
  await ensureDefaultDonationCategories()

  return prisma.donationCategory.findFirst({
    where: {
      isActive: true,
      OR: [{ id: categoryIdOrSlug }, { slug: categoryIdOrSlug }],
    },
  })
}
