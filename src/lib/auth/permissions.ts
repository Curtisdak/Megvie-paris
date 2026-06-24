import type { ChurchRole } from "@/generated/prisma/enums"

export type AppPermission =
  | "profile.read_own"
  | "profile.update_own"
  | "members.read_basic"
  | "members.read_contact"
  | "members.read_sensitive"
  | "members.read_finance_identity"
  | "members.approve"
  | "members.suspend"
  | "events.manage"
  | "gallery.manage"
  | "messages.read_general"
  | "messages.read_confidential"
  | "announcements.manage"
  | "donations.read_all"
  | "donations.stats"
  | "donations.export"
  | "roles.manage"
  | "audit.read"
  | "settings.manage"

const memberPermissions = [
  "profile.read_own",
  "profile.update_own",
] satisfies AppPermission[]

const respoPermissions = [
  ...memberPermissions,
  "members.read_basic",
  "members.read_contact",
  "events.manage",
  "gallery.manage",
  "messages.read_general",
  "announcements.manage",
] satisfies AppPermission[]

const financePermissions = [
  ...memberPermissions,
  "members.read_finance_identity",
  "donations.read_all",
  "donations.stats",
  "donations.export",
] satisfies AppPermission[]

const masterPermissions = [
  ...respoPermissions,
  "members.read_sensitive",
  "members.approve",
  "members.suspend",
  "messages.read_confidential",
  "donations.read_all",
  "donations.stats",
  "donations.export",
  "audit.read",
] satisfies AppPermission[]

const allPermissions = [
  ...new Set<AppPermission>([
    ...memberPermissions,
    ...respoPermissions,
    ...financePermissions,
    ...masterPermissions,
    "roles.manage",
    "settings.manage",
  ]),
] satisfies AppPermission[]

export const rolePermissions: Record<ChurchRole, AppPermission[]> = {
  MEMBER: memberPermissions,
  RESPO: respoPermissions,
  FINANCE: financePermissions,
  MASTER: masterPermissions,
  CREATOR: allPermissions,
}

export function hasPermission(
  role: ChurchRole | null | undefined,
  permission: AppPermission,
) {
  if (!role) return false
  return rolePermissions[role]?.includes(permission) ?? false
}

export function isAdminRole(role: ChurchRole | null | undefined) {
  return role === "RESPO" || role === "FINANCE" || role === "MASTER" || role === "CREATOR"
}

export function isPrivilegedRole(role: ChurchRole | null | undefined) {
  return role === "MASTER" || role === "CREATOR"
}
