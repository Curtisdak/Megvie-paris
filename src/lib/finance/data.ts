import "server-only"

import { redirect } from "next/navigation"
import {
  ChurchRole,
  DirectDonationKind,
  DirectDonationStatus,
  DonationFrequency,
  DonationSource,
  DonationStatus,
  MembershipStatus,
  RecurringDonationStatus,
  StripeWebhookProcessingStatus,
} from "@/generated/prisma/enums"
import type { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { requireCurrentAppUser, requirePermission } from "@/lib/auth/clerk-user"
import { hasPermission, type AppPermission } from "@/lib/auth/permissions"
import { formatCurrencyFromCents } from "@/lib/finance/config"

const financePageSize = 12
const memberDonationPageSize = 10

type FinanceFilters = {
  q?: string
  source?: string
  status?: string
  frequency?: string
  directStatus?: string
  directKind?: string
  category?: string
  from?: string
  to?: string
  page?: string | number
}

function contains(value: string | null) {
  return value ? { contains: value, mode: "insensitive" as const } : undefined
}

function parseDate(value: string | null | undefined, endOfDay = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const date = new Date(`${value}T00:00:00.000`)
  if (Number.isNaN(date.getTime())) return undefined
  if (endOfDay) date.setHours(23, 59, 59, 999)
  return date
}

function enumValue<T extends Record<string, string>>(
  enumObject: T,
  value: string | null | undefined,
) {
  const raw = String(value ?? "").toUpperCase()
  const values = new Set(Object.values(enumObject))

  return values.has(raw as T[keyof T]) ? (raw as T[keyof T]) : undefined
}

function getDateRange(from?: string, to?: string) {
  const gte = parseDate(from)
  const lte = parseDate(to, true)

  return gte || lte ? { gte, lte } : undefined
}

function startOfLocalDay(date = new Date()) {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

function startOfLocalMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfLocalYear(date = new Date()) {
  return new Date(date.getFullYear(), 0, 1)
}

export async function requireFinancePermission(
  permission: AppPermission,
  path = "/admin/finance",
) {
  const user = await requirePermission(permission, path)

  if (user.membershipStatus !== MembershipStatus.ACTIVE) {
    redirect("/espace-membre")
  }

  return user
}

export function canAccessFinance(role: ChurchRole) {
  return hasPermission(role, "donations.read_all")
}

export async function getMemberDonationHistory(options: {
  page?: string | number
} = {}) {
  const user = await requireCurrentAppUser("/espace-membre/dons")
  const requestedPage = Math.max(1, Number(options.page) || 1)
  const where = { userId: user.id }
  const [total, donations, recurringDonations] = await Promise.all([
    prisma.donation.count({ where }),
    prisma.donation.findMany({
      where,
      orderBy: [{ donatedAt: "desc" }, { receivedAt: "desc" }, { createdAt: "desc" }],
      skip: (requestedPage - 1) * memberDonationPageSize,
      take: memberDonationPageSize,
      include: {
        category: {
          select: { label: true, slug: true },
        },
      },
    }),
    prisma.recurringDonation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        category: {
          select: { label: true, slug: true },
        },
      },
    }),
  ])
  const totalPages = Math.max(1, Math.ceil(total / memberDonationPageSize))
  const page = Math.min(requestedPage, totalPages)

  return {
    user,
    donations,
    recurringDonations,
    pagination: {
      page,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    },
  }
}

export function buildDonationWhere(filters: FinanceFilters) {
  const query = filters.q?.trim() || null
  const source = enumValue(DonationSource, filters.source)
  const status = enumValue(DonationStatus, filters.status)
  const frequency = enumValue(DonationFrequency, filters.frequency)
  const directStatus = enumValue(DirectDonationStatus, filters.directStatus)
  const directKind = enumValue(DirectDonationKind, filters.directKind)
  const dateRange = getDateRange(filters.from, filters.to)
  const conditions: Prisma.DonationWhereInput[] = []

  if (dateRange) {
    if (source === DonationSource.DIRECT) {
      conditions.push({ receivedAt: dateRange })
    } else if (source === DonationSource.ONLINE) {
      conditions.push({ donatedAt: dateRange })
    } else {
      conditions.push({
        OR: [{ donatedAt: dateRange }, { receivedAt: dateRange }],
      })
    }
  }

  if (query) {
    conditions.push({
      OR: [
        { donorNameSnapshot: contains(query) },
        { donorEmailSnapshot: contains(query) },
        { memberIdSnapshot: contains(query) },
        { stripePaymentIntentId: contains(query) },
        { stripeInvoiceId: contains(query) },
        { collectionLabel: contains(query) },
        { manualReference: contains(query) },
        { event: { title: contains(query) } },
        { user: { email: contains(query) } },
        { user: { firstName: contains(query) } },
        { user: { lastName: contains(query) } },
      ],
    })
  }

  return {
    source,
    status,
    frequency,
    directStatus,
    directKind,
    categoryId: filters.category || undefined,
    AND: conditions.length ? conditions : undefined,
  }
}

async function getSuccessfulAggregate(where: {
  donatedAt?: { gte?: Date; lte?: Date }
}) {
  const [gross, refunded, count, donors] = await Promise.all([
    prisma.donation.aggregate({
      where: {
        ...where,
        source: DonationSource.ONLINE,
        status: {
          in: [
            DonationStatus.SUCCEEDED,
            DonationStatus.PARTIALLY_REFUNDED,
            DonationStatus.REFUNDED,
          ],
        },
      },
      _sum: { amountCents: true },
      _count: { _all: true },
    }),
    prisma.donation.aggregate({
      where: {
        ...where,
        source: DonationSource.ONLINE,
        status: {
          in: [DonationStatus.PARTIALLY_REFUNDED, DonationStatus.REFUNDED],
        },
      },
      _sum: { refundedAmountCents: true },
    }),
    prisma.donation.count({
      where: {
        ...where,
        source: DonationSource.ONLINE,
        status: {
          in: [
            DonationStatus.SUCCEEDED,
            DonationStatus.PARTIALLY_REFUNDED,
            DonationStatus.REFUNDED,
          ],
        },
      },
    }),
    prisma.donation.findMany({
      where: {
        ...where,
        source: DonationSource.ONLINE,
        status: {
          in: [
            DonationStatus.SUCCEEDED,
            DonationStatus.PARTIALLY_REFUNDED,
            DonationStatus.REFUNDED,
          ],
        },
      },
      distinct: ["donorEmailSnapshot", "userId"],
      select: { id: true },
    }),
  ])

  const grossCents = gross._sum.amountCents ?? 0
  const refundedCents = refunded._sum.refundedAmountCents ?? 0

  return {
    grossCents,
    refundedCents,
    netCents: grossCents - refundedCents,
    count,
    uniqueDonors: donors.length,
    averageCents: count > 0 ? Math.round(grossCents / count) : 0,
  }
}

async function getDirectVerifiedAggregate(where: {
  receivedAt?: { gte?: Date; lte?: Date }
} = {}) {
  const directWhere = {
    ...where,
    source: DonationSource.DIRECT,
    directStatus: DirectDonationStatus.VERIFIED,
  }
  const [gross, count, donors] = await Promise.all([
    prisma.donation.aggregate({
      where: directWhere,
      _sum: { amountCents: true },
    }),
    prisma.donation.count({ where: directWhere }),
    prisma.donation.findMany({
      where: {
        ...directWhere,
        userId: { not: null },
      },
      distinct: ["userId", "memberIdSnapshot"],
      select: { id: true },
    }),
  ])
  const grossCents = gross._sum.amountCents ?? 0

  return {
    grossCents,
    refundedCents: 0,
    netCents: grossCents,
    count,
    uniqueDonors: donors.length,
    averageCents: count > 0 ? Math.round(grossCents / count) : 0,
  }
}

async function getDirectRecordedAggregate() {
  const where = {
    source: DonationSource.DIRECT,
    directStatus: DirectDonationStatus.RECORDED,
  }
  const [gross, count] = await Promise.all([
    prisma.donation.aggregate({ where, _sum: { amountCents: true } }),
    prisma.donation.count({ where }),
  ])

  return {
    grossCents: gross._sum.amountCents ?? 0,
    count,
  }
}

function combineOfficialTotals(
  online: Awaited<ReturnType<typeof getSuccessfulAggregate>>,
  direct: Awaited<ReturnType<typeof getDirectVerifiedAggregate>>,
) {
  const grossCents = online.grossCents + direct.grossCents
  const refundedCents = online.refundedCents
  const count = online.count + direct.count

  return {
    grossCents,
    refundedCents,
    netCents: grossCents - refundedCents,
    count,
    uniqueDonors: online.uniqueDonors + direct.uniqueDonors,
    averageCents: count > 0 ? Math.round(grossCents / count) : 0,
  }
}

export async function getFinanceDashboardData(filters: FinanceFilters = {}) {
  const user = await requireFinancePermission(
    "donations.read_all",
    "/admin/finance",
  )
  const requestedPage = Math.max(1, Number(filters.page) || 1)
  const where = buildDonationWhere(filters)
  const [
    categories,
    filtered,
    donations,
    onlineToday,
    onlineMonth,
    onlineYear,
    onlineTotals,
    directToday,
    directMonth,
    directYear,
    directVerifiedTotals,
    directRecorded,
    statusCounts,
    recurringCounts,
  ] =
    await Promise.all([
      prisma.donationCategory.findMany({
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      }),
      prisma.donation.count({ where }),
      prisma.donation.findMany({
        where,
        orderBy: [{ donatedAt: "desc" }, { receivedAt: "desc" }, { createdAt: "desc" }],
        skip: (requestedPage - 1) * financePageSize,
        take: financePageSize,
        include: {
          category: { select: { label: true, slug: true } },
          event: { select: { title: true, startsAt: true } },
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              profile: { select: { memberId: true, displayName: true } },
            },
          },
        },
      }),
      getSuccessfulAggregate({ donatedAt: { gte: startOfLocalDay() } }),
      getSuccessfulAggregate({ donatedAt: { gte: startOfLocalMonth() } }),
      getSuccessfulAggregate({ donatedAt: { gte: startOfLocalYear() } }),
      getSuccessfulAggregate({}),
      getDirectVerifiedAggregate({ receivedAt: { gte: startOfLocalDay() } }),
      getDirectVerifiedAggregate({ receivedAt: { gte: startOfLocalMonth() } }),
      getDirectVerifiedAggregate({ receivedAt: { gte: startOfLocalYear() } }),
      getDirectVerifiedAggregate({}),
      getDirectRecordedAggregate(),
      prisma.donation.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.recurringDonation.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ])
  const totalPages = Math.max(1, Math.ceil(filtered / financePageSize))
  const page = Math.min(requestedPage, totalPages)
  const byStatus = Object.fromEntries(
    Object.values(DonationStatus).map((status) => [status, 0]),
  ) as Record<DonationStatus, number>
  const recurringByStatus = Object.fromEntries(
    Object.values(RecurringDonationStatus).map((status) => [status, 0]),
  ) as Record<RecurringDonationStatus, number>

  for (const item of statusCounts) byStatus[item.status] = item._count._all
  for (const item of recurringCounts) {
    recurringByStatus[item.status] = item._count._all
  }

  return {
    user,
    categories,
    donations,
    stats: {
      today: combineOfficialTotals(onlineToday, directToday),
      month: combineOfficialTotals(onlineMonth, directMonth),
      year: combineOfficialTotals(onlineYear, directYear),
      totals: combineOfficialTotals(onlineTotals, directVerifiedTotals),
      onlineTotals,
      directVerifiedTotals,
      directRecorded,
      byStatus,
      recurringByStatus,
      activeMonthlyDonors: recurringByStatus.ACTIVE,
      pastDueMonthlyDonors: recurringByStatus.PAST_DUE,
      failedPayments: byStatus.FAILED,
      refundedDonations:
        byStatus.REFUNDED + byStatus.PARTIALLY_REFUNDED,
      format: formatCurrencyFromCents,
    },
    pagination: {
      page,
      pageSize: financePageSize,
      filtered,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    },
  }
}

export async function getRecurringDonationAdminData(filters: FinanceFilters = {}) {
  await requireFinancePermission("donations.read_all", "/admin/finance")
  const status = enumValue(RecurringDonationStatus, filters.status)
  const query = filters.q?.trim() || null

  return prisma.recurringDonation.findMany({
    where: {
      status,
      OR: query
        ? [
            { memberIdSnapshot: contains(query) },
            { user: { email: contains(query) } },
            { user: { firstName: contains(query) } },
            { user: { lastName: contains(query) } },
            { stripeSubscriptionId: contains(query) },
          ]
        : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      category: { select: { label: true, slug: true } },
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          profile: { select: { memberId: true, displayName: true } },
        },
      },
      donations: {
        orderBy: [{ donatedAt: "desc" }, { createdAt: "desc" }],
        take: 2,
        select: {
          status: true,
          donatedAt: true,
          failedAt: true,
          amountCents: true,
        },
      },
    },
  })
}

export async function listStripeWebhookEvents(filters: {
  status?: string
  type?: string
} = {}) {
  const user = await requireFinancePermission(
    "settings.manage",
    "/admin/webhooks-stripe",
  )

  if (user.role !== ChurchRole.CREATOR) {
    redirect("/admin/finance")
  }

  const status = enumValue(StripeWebhookProcessingStatus, filters.status)
  const type = filters.type?.trim() || undefined

  return prisma.stripeWebhookEvent.findMany({
    where: {
      processingStatus: status,
      eventType: contains(type ?? null),
    },
    orderBy: { receivedAt: "desc" },
    take: 100,
  })
}

export async function getDonationsForExport(filters: FinanceFilters = {}) {
  await requireFinancePermission("donations.export", "/admin/finance")

  return prisma.donation.findMany({
    where: buildDonationWhere(filters),
    orderBy: [{ donatedAt: "desc" }, { receivedAt: "desc" }, { createdAt: "desc" }],
    take: 2000,
    include: {
      category: { select: { label: true } },
      event: { select: { title: true, startsAt: true } },
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          profile: { select: { memberId: true, displayName: true } },
        },
      },
      enteredBy: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          profile: { select: { memberId: true, displayName: true } },
        },
      },
      verifiedBy: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          profile: { select: { memberId: true, displayName: true } },
        },
      },
      cancelledBy: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          profile: { select: { memberId: true, displayName: true } },
        },
      },
    },
  })
}
