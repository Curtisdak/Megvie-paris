import "server-only"

import {
  AnnouncementCategory,
  AnnouncementStatus,
  ContentVisibility,
  ContactMessageStatus,
  EventStatus,
  GalleryAlbumStatus,
  MembershipStatus,
  MessageConfidentiality,
  type ChurchRole,
} from "@/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/auth/permissions"
import {
  requireAdminRole,
  requireCurrentAppUser,
  requirePermission,
} from "@/lib/auth/clerk-user"

export const pageSize = 20

function contains(value: string | null) {
  return value ? { contains: value, mode: "insensitive" as const } : undefined
}

export async function getAdminContext(path = "/admin") {
  return requireAdminRole(path)
}

export async function getAdminDashboardData() {
  const user = await getAdminContext("/admin")
  const canMembers = hasPermission(user.role, "members.read_basic")
  const canApprove = hasPermission(user.role, "members.approve")
  const canEvents = hasPermission(user.role, "events.manage")
  const canGallery = hasPermission(user.role, "gallery.manage")
  const canMessages = hasPermission(user.role, "messages.read_general")
  const canAnnouncements = hasPermission(user.role, "announcements.manage")
  const canAudit = hasPermission(user.role, "audit.read")

  const [
    pendingMembers,
    activeMembers,
    suspendedMembers,
    unreadMessages,
    upcomingEvents,
    draftAnnouncements,
    scheduledAnnouncements,
    recentPhotos,
    recentAudit,
  ] = await Promise.all([
    canApprove
      ? prisma.appUser.count({ where: { membershipStatus: MembershipStatus.PENDING } })
      : Promise.resolve(0),
    canMembers
      ? prisma.appUser.count({ where: { membershipStatus: MembershipStatus.ACTIVE } })
      : Promise.resolve(0),
    canMembers
      ? prisma.appUser.count({ where: { membershipStatus: MembershipStatus.SUSPENDED } })
      : Promise.resolve(0),
    canMessages
      ? prisma.contactMessage.count({
          where: messageAccessWhere(user.role, ContactMessageStatus.NEW),
        })
      : Promise.resolve(0),
    canEvents
      ? prisma.churchEvent.count({
          where: {
            startsAt: { gte: new Date() },
            status: { in: [EventStatus.PUBLISHED, EventStatus.SCHEDULED] },
            archivedAt: null,
          },
        })
      : Promise.resolve(0),
    canAnnouncements
      ? prisma.announcement.count({ where: { status: AnnouncementStatus.DRAFT } })
      : Promise.resolve(0),
    canAnnouncements
      ? prisma.announcement.count({ where: { status: AnnouncementStatus.SCHEDULED } })
      : Promise.resolve(0),
    canGallery
      ? prisma.galleryItem.count({ where: { archivedAt: null } })
      : Promise.resolve(0),
    canAudit
      ? prisma.adminAuditLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 8,
          select: {
            id: true,
            action: true,
            entityType: true,
            summary: true,
            createdAt: true,
            actor: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                profile: { select: { memberId: true, displayName: true } },
              },
            },
          },
        })
      : Promise.resolve([]),
  ])

  return {
    user,
    counts: {
      pendingMembers,
      activeMembers,
      suspendedMembers,
      unreadMessages,
      upcomingEvents,
      draftAnnouncements,
      scheduledAnnouncements,
      recentPhotos,
    },
    recentAudit,
  }
}

export async function listPendingApplications(search?: string) {
  await requirePermission("members.approve", "/admin/demandes-adhesion")
  const query = search?.trim() || null

  return prisma.appUser.findMany({
    where: {
      membershipStatus: MembershipStatus.PENDING,
      OR: query
        ? [
            { firstName: contains(query) },
            { lastName: contains(query) },
            { email: contains(query) },
            { profile: { memberId: contains(query) } },
          ]
        : undefined,
    },
    orderBy: { createdAt: "asc" },
    take: 50,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      imageUrl: true,
      membershipStatus: true,
      createdAt: true,
      profile: { select: { displayName: true, avatarUrl: true } },
      privateDetails: {
        select: { phone: true, city: true, countryCode: true },
      },
    },
  })
}

export async function listMembers(options: {
  search?: string
  status?: string
  role?: string
}) {
  const actor = await requirePermission("members.read_basic", "/admin/membres")
  const query = options.search?.trim() || null
  const canSensitive = hasPermission(actor.role, "members.read_sensitive")
  const canContact = hasPermission(actor.role, "members.read_contact")
  const status = Object.values(MembershipStatus).includes(options.status as MembershipStatus)
    ? (options.status as MembershipStatus)
    : undefined
  const role = ["MEMBER", "RESPO", "FINANCE", "MASTER", "CREATOR"].includes(
    String(options.role),
  )
    ? (options.role as ChurchRole)
    : undefined
  const searchWhere = query
    ? [
        { firstName: contains(query) },
        { lastName: contains(query) },
        ...(canContact ? [{ email: contains(query) }] : []),
        { profile: { memberId: contains(query) } },
      ]
    : undefined
  const where = {
    membershipStatus: status,
    role,
    OR: searchWhere,
  }
  const [members, filteredTotal, totalMembers, statusGroups, roleGroups] =
    await Promise.all([
      prisma.appUser.findMany({
        where,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        take: pageSize,
        select: {
          id: true,
          email: canContact || canSensitive,
          firstName: true,
          lastName: true,
          imageUrl: true,
          role: true,
          membershipStatus: true,
          createdAt: true,
          profile: {
            select: {
              memberId: true,
              displayName: true,
              avatarUrl: true,
              joinedAt: true,
              approvedAt: true,
              suspendedAt: true,
            },
          },
          privateDetails: canSensitive
            ? {
                select: {
                  phone: true,
                  dateOfBirth: true,
                  addressLine1: true,
                  postalCode: true,
                  city: true,
                  countryCode: true,
                },
              }
            : canContact
              ? { select: { phone: true, city: true } }
              : false,
        },
      }),
      prisma.appUser.count({ where }),
      prisma.appUser.count(),
      prisma.appUser.groupBy({
        by: ["membershipStatus"],
        _count: { _all: true },
      }),
      prisma.appUser.groupBy({
        by: ["role"],
        _count: { _all: true },
      }),
    ])
  const statusCounts = Object.fromEntries(
    Object.values(MembershipStatus).map((value) => [value, 0]),
  ) as Record<MembershipStatus, number>
  const roleCounts = Object.fromEntries(
    ["MEMBER", "RESPO", "FINANCE", "MASTER", "CREATOR"].map((value) => [
      value,
      0,
    ]),
  ) as Record<ChurchRole, number>

  for (const item of statusGroups) {
    statusCounts[item.membershipStatus] = item._count._all
  }

  for (const item of roleGroups) {
    roleCounts[item.role] = item._count._all
  }

  return {
    actorId: actor.id,
    actorRole: actor.role,
    canSensitive,
    counts: {
      total: totalMembers,
      filtered: filteredTotal,
      status: statusCounts,
      role: roleCounts,
    },
    members,
  }
}

export async function listEvents(options: {
  search?: string
  status?: string
  page?: string | number
} = {}) {
  await requirePermission("events.manage", "/admin/evenements")
  const eventPageSize = 8
  const requestedPage = Math.max(1, Number(options.page) || 1)
  const query = options.search?.trim() || null
  const searchFilter = contains(query)
  const status = Object.values(EventStatus).includes(options.status as EventStatus)
    ? (options.status as EventStatus)
    : undefined

  const where = {
    status: status ?? { not: EventStatus.ARCHIVED },
    visibility: ContentVisibility.PUBLIC,
    OR: searchFilter
      ? [
          { title: searchFilter },
          { shortDescription: searchFilter },
          { description: searchFilter },
          { locationName: searchFilter },
          { address: searchFilter },
        ]
      : undefined,
  }

  const [filtered, total, draft, scheduled, published, cancelled, archived] =
    await Promise.all([
      prisma.churchEvent.count({ where }),
      prisma.churchEvent.count(),
      prisma.churchEvent.count({ where: { status: EventStatus.DRAFT } }),
      prisma.churchEvent.count({ where: { status: EventStatus.SCHEDULED } }),
      prisma.churchEvent.count({ where: { status: EventStatus.PUBLISHED } }),
      prisma.churchEvent.count({ where: { status: EventStatus.CANCELLED } }),
      prisma.churchEvent.count({ where: { status: EventStatus.ARCHIVED } }),
    ])
  const totalPages = Math.max(1, Math.ceil(filtered / eventPageSize))
  const currentPage = Math.min(requestedPage, totalPages)

  const events = await prisma.churchEvent.findMany({
    where,
    orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
    skip: (currentPage - 1) * eventPageSize,
    take: eventPageSize,
    select: {
      id: true,
      title: true,
      slug: true,
      shortDescription: true,
      status: true,
      visibility: true,
      startsAt: true,
      endsAt: true,
      locationName: true,
      address: true,
      mapUrl: true,
      registrationUrl: true,
      coverImageUrl: true,
      publishedAt: true,
      archivedAt: true,
      updatedAt: true,
    },
  })

  return {
    events,
    counts: {
      total,
      draft,
      scheduled,
      published,
      cancelled,
      archived,
    },
    pagination: {
      page: currentPage,
      pageSize: eventPageSize,
      filtered,
      totalPages,
      hasPreviousPage: currentPage > 1,
      hasNextPage: currentPage < totalPages,
    },
  }
}

export async function getEventForEdit(id: string) {
  await requirePermission("events.manage", `/admin/evenements/${id}`)
  return prisma.churchEvent.findUnique({ where: { id } })
}

export async function listGalleryAlbums() {
  await requirePermission("gallery.manage", "/admin/galerie")

  return prisma.galleryAlbum.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      _count: { select: { items: true } },
      items: {
        where: { archivedAt: null },
        take: 4,
        orderBy: { sortOrder: "asc" },
        select: { id: true, imageUrl: true, altText: true, caption: true },
      },
    },
  })
}

export function messageAccessWhere(
  role: ChurchRole,
  status?: ContactMessageStatus,
) {
  const base = status ? { status } : {}

  if (hasPermission(role, "messages.read_confidential")) {
    return base
  }

  return {
    ...base,
    confidentiality: MessageConfidentiality.GENERAL,
  }
}

export async function listMessages(options: {
  status?: string
  confidentiality?: string
  search?: string
}) {
  const user = await requirePermission("messages.read_general", "/admin/messages")
  const status = Object.values(ContactMessageStatus).includes(
    options.status as ContactMessageStatus,
  )
    ? (options.status as ContactMessageStatus)
    : undefined
  const requestedConfidentiality = Object.values(MessageConfidentiality).includes(
    options.confidentiality as MessageConfidentiality,
  )
    ? (options.confidentiality as MessageConfidentiality)
    : undefined
  const query = options.search?.trim() || null
  const canConfidential = hasPermission(user.role, "messages.read_confidential")

  return prisma.contactMessage.findMany({
    where: {
      ...messageAccessWhere(user.role, status),
      status: status ?? { not: ContactMessageStatus.ARCHIVED },
      confidentiality:
        requestedConfidentiality && canConfidential
          ? requestedConfidentiality
          : undefined,
      OR: query
        ? [
            { senderName: contains(query) },
            { senderEmail: contains(query) },
            { subject: contains(query) },
          ]
        : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: pageSize,
    select: {
      id: true,
      senderName: true,
      senderEmail: true,
      subject: true,
      category: true,
      confidentiality: true,
      status: true,
      createdAt: true,
      firstReadAt: true,
      assignedTo: { select: { firstName: true, lastName: true, email: true } },
    },
  })
}

export async function getMessageDetail(id: string) {
  const user = await requirePermission("messages.read_general", `/admin/messages/${id}`)

  const message = await prisma.contactMessage.findFirst({
    where: { id, ...messageAccessWhere(user.role) },
    include: {
      assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      replies: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { firstName: true, lastName: true, email: true } } },
      },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { firstName: true, lastName: true, email: true } } },
      },
    },
  })

  if (message && !message.firstReadAt) {
    await prisma.contactMessage.update({
      where: { id },
      data: { firstReadAt: new Date() },
    })
  }

  return message
}

export async function listAnnouncements(options: {
  search?: string
  status?: string
  visibility?: string
  category?: string
  page?: string | number
} = {}) {
  await requirePermission("announcements.manage", "/admin/annonces")
  const announcementPageSize = 8
  const requestedPage = Math.max(1, Number(options.page) || 1)
  const query = options.search?.trim() || null
  const searchFilter = contains(query)
  const status = Object.values(AnnouncementStatus).includes(
    options.status as AnnouncementStatus,
  )
    ? (options.status as AnnouncementStatus)
    : undefined
  const visibility = Object.values(ContentVisibility).includes(
    options.visibility as ContentVisibility,
  )
    ? (options.visibility as ContentVisibility)
    : undefined
  const category = Object.values(AnnouncementCategory).includes(
    options.category as AnnouncementCategory,
  )
    ? (options.category as AnnouncementCategory)
    : undefined

  const where = {
    status: status ?? { not: AnnouncementStatus.ARCHIVED },
    visibility,
    category,
    OR: searchFilter
      ? [
          { title: searchFilter },
          { summary: searchFilter },
          { body: searchFilter },
        ]
      : undefined,
  }

  const [filtered, total, draft, scheduled, published, archived] =
    await Promise.all([
      prisma.announcement.count({ where }),
      prisma.announcement.count(),
      prisma.announcement.count({ where: { status: AnnouncementStatus.DRAFT } }),
      prisma.announcement.count({
        where: { status: AnnouncementStatus.SCHEDULED },
      }),
      prisma.announcement.count({
        where: { status: AnnouncementStatus.PUBLISHED },
      }),
      prisma.announcement.count({
        where: { status: AnnouncementStatus.ARCHIVED },
      }),
    ])
  const totalPages = Math.max(1, Math.ceil(filtered / announcementPageSize))
  const currentPage = Math.min(requestedPage, totalPages)

  const announcements = await prisma.announcement.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    skip: (currentPage - 1) * announcementPageSize,
    take: announcementPageSize,
    select: {
      id: true,
      title: true,
      summary: true,
      category: true,
      visibility: true,
      status: true,
      publishAt: true,
      publishedAt: true,
      expiresAt: true,
      coverImageUrl: true,
      externalUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return {
    announcements,
    counts: {
      total,
      draft,
      scheduled,
      published,
      archived,
    },
    pagination: {
      page: currentPage,
      pageSize: announcementPageSize,
      filtered,
      totalPages,
      hasPreviousPage: currentPage > 1,
      hasNextPage: currentPage < totalPages,
    },
  }
}

export async function listAuditLogs(options: {
  action?: string
  entityType?: string
}) {
  await requirePermission("audit.read", "/admin/audit")
  const action = options.action?.trim() || undefined
  const entityType = options.entityType?.trim() || undefined

  return prisma.adminAuditLog.findMany({
    where: { action: contains(action ?? null), entityType: contains(entityType ?? null) },
    orderBy: { createdAt: "desc" },
    take: 80,
    select: {
      id: true,
      actorMemberId: true,
      action: true,
      entityType: true,
      entityId: true,
      summary: true,
      metadata: true,
      createdAt: true,
      actor: {
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

export async function listPublicContent() {
  const now = new Date()

  return Promise.all([
    prisma.churchEvent.findMany({
      where: {
        status: EventStatus.PUBLISHED,
        visibility: "PUBLIC",
        archivedAt: null,
        startsAt: { gte: now },
      },
      orderBy: { startsAt: "asc" },
      take: 3,
    }),
    prisma.announcement.findMany({
      where: {
        status: AnnouncementStatus.PUBLISHED,
        visibility: "PUBLIC",
        archivedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 3,
    }),
    prisma.galleryAlbum.findMany({
      where: { status: GalleryAlbumStatus.PUBLISHED, archivedAt: null },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        items: {
          where: { archivedAt: null },
          orderBy: { sortOrder: "asc" },
          take: 1,
        },
      },
    }),
  ])
}

export async function listMemberDashboardContent() {
  await requireCurrentAppUser("/espace-membre")
  const now = new Date()

  const [events, announcements] = await Promise.all([
    prisma.churchEvent.findMany({
      where: {
        status: EventStatus.PUBLISHED,
        visibility: ContentVisibility.PUBLIC,
        archivedAt: null,
        startsAt: { gte: now },
      },
      orderBy: { startsAt: "asc" },
      take: 3,
      select: {
        id: true,
        title: true,
        shortDescription: true,
        startsAt: true,
        locationName: true,
        visibility: true,
      },
    }),
    prisma.announcement.findMany({
      where: {
        status: AnnouncementStatus.PUBLISHED,
        archivedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 3,
      select: {
        id: true,
        title: true,
        summary: true,
        category: true,
        visibility: true,
        publishedAt: true,
      },
    }),
  ])

  return { events, announcements }
}

function activePublishedAnnouncementWhere(now: Date) {
  return {
    status: AnnouncementStatus.PUBLISHED,
    visibility: {
      in: [ContentVisibility.PUBLIC, ContentVisibility.MEMBERS_ONLY],
    },
    archivedAt: null,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  }
}

export async function listMemberAnnouncements() {
  const user = await requireCurrentAppUser("/espace-membre/annonces")
  const now = new Date()

  const announcements = await prisma.announcement.findMany({
    where: activePublishedAnnouncementWhere(now),
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 50,
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      category: true,
      visibility: true,
      coverImageUrl: true,
      externalUrl: true,
      publishedAt: true,
      reads: {
        where: { userId: user.id },
        select: { readAt: true },
        take: 1,
      },
    },
  })

  return announcements
}

export async function getMemberAnnouncementDetail(id: string) {
  const user = await requireCurrentAppUser(`/espace-membre/annonces/${id}`)
  const now = new Date()

  const announcement = await prisma.announcement.findFirst({
    where: {
      id,
      ...activePublishedAnnouncementWhere(now),
    },
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      body: true,
      category: true,
      visibility: true,
      coverImageUrl: true,
      externalUrl: true,
      publishedAt: true,
      author: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })

  if (!announcement) return null

  await prisma.announcementRead.upsert({
    where: {
      announcementId_userId: {
        announcementId: announcement.id,
        userId: user.id,
      },
    },
    update: { readAt: new Date() },
    create: {
      announcementId: announcement.id,
      userId: user.id,
    },
  })

  return announcement
}
