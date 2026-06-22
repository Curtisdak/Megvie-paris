"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { ChurchRole, MembershipStatus } from "@/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import {
  ensureCurrentAppUser,
  requireCurrentAppUser,
  requirePermission,
} from "@/lib/auth/clerk-user"
import {
  validateNotificationPreferencesForm,
  validateOnboardingForm,
  validateProfileForm,
  type FieldErrors,
} from "@/lib/auth/validation"

export type ActionState = {
  ok: boolean
  message: string
  errors?: FieldErrors
}

const roleValues = new Set(Object.values(ChurchRole))

function getRole(value: FormDataEntryValue | null) {
  const role = String(value ?? "").toUpperCase()

  if (roleValues.has(role as ChurchRole)) {
    return role as ChurchRole
  }

  return null
}

function toDate(value: string | null | undefined) {
  if (!value) return null
  return new Date(`${value}T00:00:00.000Z`)
}

function formatMemberId(memberNumber: number) {
  return `Mv${String(memberNumber).padStart(5, "0")}P`
}

export async function completeOnboardingAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await ensureCurrentAppUser()
  const parsed = validateOnboardingForm(formData)

  if (!parsed.ok) {
    return {
      ok: false,
      message: "Corrigez les champs indiques.",
      errors: parsed.errors,
    }
  }

  await prisma.$transaction([
    prisma.appUser.update({
      where: { id: user.id },
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        onboardingComplete: true,
      },
    }),
    prisma.memberProfile.upsert({
      where: { userId: user.id },
      update: {
        displayName: parsed.data.displayName,
        avatarUrl: user.imageUrl,
      },
      create: {
        userId: user.id,
        displayName: parsed.data.displayName,
        avatarUrl: user.imageUrl,
      },
    }),
    prisma.memberPrivateDetails.upsert({
      where: { userId: user.id },
      update: {
        phone: parsed.data.phone,
        dateOfBirth: toDate(parsed.data.dateOfBirth),
      },
      create: {
        userId: user.id,
        phone: parsed.data.phone,
        dateOfBirth: toDate(parsed.data.dateOfBirth),
      },
    }),
    prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {
        dailyVerseEnabled: parsed.data.dailyVerseEnabled,
        privateBirthdayGreetingEnabled:
          parsed.data.privateBirthdayGreetingEnabled,
        communityBirthdayVisibilityEnabled:
          parsed.data.communityBirthdayVisibilityEnabled,
        announcementsEnabled: parsed.data.announcementsEnabled,
        timezone: "Europe/Paris",
      },
      create: {
        userId: user.id,
        dailyVerseEnabled: parsed.data.dailyVerseEnabled,
        privateBirthdayGreetingEnabled:
          parsed.data.privateBirthdayGreetingEnabled,
        communityBirthdayVisibilityEnabled:
          parsed.data.communityBirthdayVisibilityEnabled,
        announcementsEnabled: parsed.data.announcementsEnabled,
        timezone: "Europe/Paris",
      },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorUserId: user.id,
        action: "member.onboarding_completed",
        entityType: "app_user",
        entityId: user.id,
      },
    }),
  ])

  revalidatePath("/espace-membre")
  redirect("/espace-membre")
}

export async function updateProfileAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireCurrentAppUser("/espace-membre/profil")
  const parsed = validateProfileForm(formData)

  if (!parsed.ok) {
    return {
      ok: false,
      message: "Corrigez les champs indiques.",
      errors: parsed.errors as FieldErrors,
    }
  }

  const avatar = formData.get("avatar")
  let avatarUrl: string | undefined

  if (avatar instanceof File && avatar.size > 0) {
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"])

    if (!allowedTypes.has(avatar.type) || avatar.size > 2 * 1024 * 1024) {
      return {
        ok: false,
        message:
          "La photo doit etre une image JPG, PNG ou WebP de 2 Mo maximum.",
      }
    }

    return {
      ok: false,
      message:
        "L'upload d'avatar sera branche sur un stockage prive Clerk/Neon dans la prochaine etape.",
    }
  }

  await prisma.$transaction([
    prisma.appUser.update({
      where: { id: user.id },
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
      },
    }),
    prisma.memberProfile.upsert({
      where: { userId: user.id },
      update: {
        displayName: parsed.data.displayName,
        ...(avatarUrl ? { avatarUrl } : {}),
      },
      create: {
        userId: user.id,
        displayName: parsed.data.displayName,
        ...(avatarUrl ? { avatarUrl } : {}),
      },
    }),
    prisma.memberPrivateDetails.upsert({
      where: { userId: user.id },
      update: {
        phone: parsed.data.phone,
        addressLine1: parsed.data.addressLine1,
        addressLine2: parsed.data.addressLine2,
        postalCode: parsed.data.postalCode,
        city: parsed.data.city,
      },
      create: {
        userId: user.id,
        phone: parsed.data.phone,
        addressLine1: parsed.data.addressLine1,
        addressLine2: parsed.data.addressLine2,
        postalCode: parsed.data.postalCode,
        city: parsed.data.city,
      },
    }),
  ])

  revalidatePath("/espace-membre")
  revalidatePath("/espace-membre/profil")

  return { ok: true, message: "Profil mis a jour." }
}

export async function updateNotificationPreferencesAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireCurrentAppUser("/espace-membre/notifications")
  const preferences = validateNotificationPreferencesForm(formData)

  await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    update: preferences,
    create: {
      userId: user.id,
      ...preferences,
    },
  })

  revalidatePath("/espace-membre")
  revalidatePath("/espace-membre/notifications")

  return { ok: true, message: "Preferences mises a jour." }
}

export async function approveMemberAction(formData: FormData) {
  const actor = await requirePermission("members.approve", "/admin")
  const targetUserId = String(formData.get("userId") ?? "")

  if (!targetUserId) {
    return { ok: false, message: "Membre introuvable." }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const target = await tx.appUser.findUnique({
        where: { id: targetUserId },
        include: { profile: true },
      })

      if (!target) throw new Error("Membre introuvable.")

      if (target.membershipStatus === MembershipStatus.ACTIVE && target.profile?.memberId) {
        return
      }

      let memberNumber = target.profile?.memberNumber ?? null
      let memberId = target.profile?.memberId ?? null

      if (!memberNumber || !memberId) {
        const rows = await tx.$queryRaw<Array<{ nextval: number | bigint }>>`
          SELECT nextval('member_number_seq') AS nextval
        `
        memberNumber = Number(rows[0]?.nextval)

        if (!memberNumber || memberNumber > 99999) {
          throw new Error("La plage des identifiants membre est epuisee.")
        }

        memberId = formatMemberId(memberNumber)
      }

      await tx.appUser.update({
        where: { id: target.id },
        data: { membershipStatus: MembershipStatus.ACTIVE },
      })

      await tx.memberProfile.upsert({
        where: { userId: target.id },
        update: {
          memberNumber,
          memberId,
          joinedAt: target.profile?.joinedAt ?? new Date(),
          approvedAt: new Date(),
          approvedById: actor.id,
          suspendedAt: null,
          rejectedAt: null,
        },
        create: {
          userId: target.id,
          memberNumber,
          memberId,
          joinedAt: new Date(),
          approvedAt: new Date(),
          approvedById: actor.id,
        },
      })

      await tx.adminAuditLog.create({
        data: {
          actorUserId: actor.id,
          action: "member.approved",
          entityType: "app_user",
          entityId: target.id,
          metadata: { memberId },
        },
      })
    })
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible d'approuver ce membre.",
    }
  }

  revalidatePath("/admin")
  return { ok: true, message: "Membre approuve." }
}

export async function suspendMemberAction(formData: FormData) {
  const actor = await requirePermission("members.suspend", "/admin")
  const targetUserId = String(formData.get("userId") ?? "")

  if (!targetUserId) {
    return { ok: false, message: "Membre introuvable." }
  }

  await prisma.$transaction([
    prisma.appUser.update({
      where: { id: targetUserId },
      data: { membershipStatus: MembershipStatus.SUSPENDED },
    }),
    prisma.memberProfile.update({
      where: { userId: targetUserId },
      data: { suspendedAt: new Date() },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorUserId: actor.id,
        action: "member.suspended",
        entityType: "app_user",
        entityId: targetUserId,
      },
    }),
  ])

  revalidatePath("/admin")
  return { ok: true, message: "Membre suspendu." }
}

export async function assignRoleAction(formData: FormData) {
  const actor = await requirePermission("roles.manage", "/admin")
  const targetUserId = String(formData.get("userId") ?? "")
  const role = getRole(formData.get("role"))

  if (!targetUserId || !role) {
    return { ok: false, message: "Role invalide." }
  }

  const target = await prisma.appUser.findUnique({
    where: { id: targetUserId },
    select: { id: true, role: true },
  })

  if (!target) {
    return { ok: false, message: "Membre introuvable." }
  }

  if (target.role === ChurchRole.CREATOR && role !== ChurchRole.CREATOR) {
    const creatorCount = await prisma.appUser.count({
      where: { role: ChurchRole.CREATOR, archivedAt: null },
    })

    if (creatorCount <= 1) {
      return {
        ok: false,
        message: "Impossible de retirer le dernier compte Creator.",
      }
    }
  }

  await prisma.$transaction([
    prisma.appUser.update({
      where: { id: target.id },
      data: { role },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorUserId: actor.id,
        action: "member.role_assigned",
        entityType: "app_user",
        entityId: target.id,
        metadata: { role },
      },
    }),
  ])

  revalidatePath("/admin")
  return { ok: true, message: "Role mis a jour." }
}
