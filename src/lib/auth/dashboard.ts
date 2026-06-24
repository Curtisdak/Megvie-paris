import "server-only"

import { auth } from "@clerk/nextjs/server"
import { requireCurrentAppUser } from "@/lib/auth/clerk-user"

export type MemberDashboardData = {
  user: {
    id: string
    email: string | null
  }
  profile: {
    user_id: string
    member_id: string | null
    first_name: string
    last_name: string
    display_name: string | null
    avatar_path: string | null
    membership_status: string
    joined_at: string | null
    approved_at: string | null
  } | null
  contact: {
    email: string
    phone: string | null
  } | null
  privateDetails: {
    date_of_birth: string | null
    address_line_1: string | null
    address_line_2: string | null
    postal_code: string | null
    city: string | null
    country_code: string | null
  } | null
  preferences: {
    daily_verse_enabled: boolean
    private_birthday_greeting_enabled: boolean
    community_birthday_visibility_enabled: boolean
    announcements_enabled: boolean
    events_enabled: boolean
    donation_notifications_enabled: boolean
    push_enabled: boolean
    daily_verse_push_enabled: boolean
    birthday_push_enabled: boolean
    announcement_push_enabled: boolean
    event_push_enabled: boolean
    personal_push_enabled: boolean
    staff_message_push_enabled: boolean
    timezone: string
  } | null
  role: string
  aal: string | null
  factors: Array<{
    id: string
    friendly_name?: string
    factor_type: string
    status: string
  }>
}

function toDateString(value: Date | null | undefined) {
  if (!value) return null
  return value.toISOString().slice(0, 10)
}

function toIsoString(value: Date | null | undefined) {
  return value?.toISOString() ?? null
}

export async function getRequiredMemberDashboardData(
  nextPath = "/espace-membre",
) {
  const user = await requireCurrentAppUser(nextPath)
  const authState = await auth()

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    profile: user.profile
      ? {
          user_id: user.id,
          member_id: user.profile.memberId,
          first_name: user.firstName ?? "",
          last_name: user.lastName ?? "",
          display_name: user.profile.displayName,
          avatar_path: user.profile.avatarUrl,
          membership_status: user.membershipStatus.toLowerCase(),
          joined_at: toIsoString(user.profile.joinedAt),
          approved_at: toIsoString(user.profile.approvedAt),
        }
      : null,
    contact: {
      email: user.email,
      phone: user.privateDetails?.phone ?? null,
    },
    privateDetails: user.privateDetails
      ? {
          date_of_birth: toDateString(user.privateDetails.dateOfBirth),
          address_line_1: user.privateDetails.addressLine1,
          address_line_2: user.privateDetails.addressLine2,
          postal_code: user.privateDetails.postalCode,
          city: user.privateDetails.city,
          country_code: user.privateDetails.countryCode,
        }
      : null,
    preferences: user.notificationPreference
      ? {
          daily_verse_enabled: user.notificationPreference.dailyVerseEnabled,
          private_birthday_greeting_enabled:
            user.notificationPreference.privateBirthdayGreetingEnabled,
          community_birthday_visibility_enabled:
            user.notificationPreference.communityBirthdayVisibilityEnabled,
          announcements_enabled:
            user.notificationPreference.announcementsEnabled,
          events_enabled: user.notificationPreference.eventsEnabled,
          donation_notifications_enabled:
            user.notificationPreference.donationNotificationsEnabled,
          push_enabled: user.notificationPreference.pushEnabled,
          daily_verse_push_enabled:
            user.notificationPreference.dailyVersePushEnabled,
          birthday_push_enabled:
            user.notificationPreference.birthdayPushEnabled,
          announcement_push_enabled:
            user.notificationPreference.announcementPushEnabled,
          event_push_enabled: user.notificationPreference.eventPushEnabled,
          personal_push_enabled: user.notificationPreference.personalPushEnabled,
          staff_message_push_enabled:
            user.notificationPreference.staffMessagePushEnabled,
          timezone: user.notificationPreference.timezone,
        }
      : null,
    role: user.role.toLowerCase(),
    aal:
      typeof authState.sessionClaims?.aal === "string"
        ? authState.sessionClaims.aal
        : null,
    factors: [],
  } satisfies MemberDashboardData
}
