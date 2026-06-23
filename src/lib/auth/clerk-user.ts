import "server-only"

import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { ChurchRole, MembershipStatus } from "@/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import {
  hasPermission,
  isAdminRole,
  type AppPermission,
} from "@/lib/auth/permissions"

type ClerkUserSnapshot = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  imageUrl: string | null
}

function getPrimaryEmail(user: Awaited<ReturnType<typeof currentUser>>) {
  return (
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    null
  )
}

async function getClerkSnapshot(): Promise<ClerkUserSnapshot> {
  const authState = await auth()

  if (!authState.userId) {
    authState.redirectToSignIn({ returnBackUrl: "/espace-membre" })
  }

  const clerkUser = await currentUser()
  const email = getPrimaryEmail(clerkUser)

  if (!clerkUser || !email) {
    redirect("/connexion")
  }

  return {
    id: clerkUser.id,
    email: email.toLowerCase(),
    firstName: clerkUser.firstName ?? null,
    lastName: clerkUser.lastName ?? null,
    imageUrl: clerkUser.imageUrl ?? null,
  }
}

export async function ensureCurrentAppUser() {
  const clerkUser = await getClerkSnapshot()

  return prisma.appUser.upsert({
    where: { clerkUserId: clerkUser.id },
    update: {
      email: clerkUser.email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
    },
    create: {
      clerkUserId: clerkUser.id,
      email: clerkUser.email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
      role: ChurchRole.MEMBER,
      membershipStatus: MembershipStatus.PENDING,
      profile: {
        create: {
          displayName: [clerkUser.firstName, clerkUser.lastName]
            .filter(Boolean)
            .join(" ") || null,
          avatarUrl: clerkUser.imageUrl,
        },
      },
      notificationPreference: {
        create: {},
      },
    },
    include: {
      profile: true,
      privateDetails: true,
      notificationPreference: true,
    },
  })
}

export async function requireCurrentAppUser(nextPath = "/espace-membre") {
  const user = await ensureCurrentAppUser()

  if (!user.onboardingComplete && !nextPath.startsWith("/bienvenue")) {
    redirect(`/bienvenue?next=${encodeURIComponent(nextPath)}`)
  }

  return user
}

export async function requirePermission(
  permission: AppPermission,
  nextPath = "/admin",
) {
  const user = await requireCurrentAppUser(nextPath)

  if (!hasPermission(user.role, permission)) {
    redirect("/espace-membre")
  }

  return user
}

export async function requireAdminRole(nextPath = "/admin") {
  const user = await requireCurrentAppUser(nextPath)

  if (!isAdminRole(user.role)) {
    redirect("/espace-membre")
  }

  return user
}
