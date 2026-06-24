import type { ChurchRole } from "@/generated/prisma/enums"
import {
  isAdminRole as isGeneratedAdminRole,
  isPrivilegedRole as isGeneratedPrivilegedRole,
} from "@/lib/auth/permissions"

export const memberIdPattern = /^Mv[0-9]{5}P$/

export function isValidMemberId(value: string) {
  return memberIdPattern.test(value)
}

function normalizeRole(role: string | null | undefined): ChurchRole | null {
  if (!role) return null
  const upperRole = role.toUpperCase()

  if (
    upperRole === "MEMBER" ||
    upperRole === "RESPO" ||
    upperRole === "FINANCE" ||
    upperRole === "MASTER" ||
    upperRole === "CREATOR"
  ) {
    return upperRole
  }

  return null
}

export function isAdminRole(role: string | null | undefined) {
  return isGeneratedAdminRole(normalizeRole(role))
}

export function isPrivilegedRole(role: string | null | undefined) {
  return isGeneratedPrivilegedRole(normalizeRole(role))
}

export function getDisplayName(profile: {
  first_name?: string | null
  last_name?: string | null
  display_name?: string | null
}) {
  const explicitName = profile.display_name?.trim()

  if (explicitName) return explicitName

  return [profile.first_name, profile.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ")
}
