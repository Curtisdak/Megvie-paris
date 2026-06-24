export type FieldErrors = Record<string, string>

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: FieldErrors }

export type RegistrationInput = {
  firstName: string
  lastName: string
  displayName: string | null
  email: string
  password: string
  phone: string | null
  dateOfBirth: string
  dailyVerseEnabled: boolean
  privateBirthdayGreetingEnabled: boolean
  communityBirthdayVisibilityEnabled: boolean
  announcementsEnabled: boolean
  privacyNoticeAccepted: boolean
}

export type OnboardingInput = Omit<
  RegistrationInput,
  "email" | "password" | "passwordConfirmation"
>

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^[+0-9 ().-]{6,24}$/

function cleanText(value: FormDataEntryValue | null, maxLength = 120) {
  if (typeof value !== "string") return ""
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength)
}

function cleanEmail(value: FormDataEntryValue | null) {
  return cleanText(value, 254).toLowerCase()
}

function hasCheckbox(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1"
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

function isReasonableBirthDate(value: string) {
  if (!isValidDate(value)) return false

  const birthDate = new Date(`${value}T00:00:00.000Z`)
  const today = new Date()
  const oldest = new Date()
  oldest.setFullYear(today.getFullYear() - 120)

  return birthDate <= today && birthDate >= oldest
}

export function validateRegistrationForm(
  formData: FormData,
): ValidationResult<RegistrationInput> {
  const errors: FieldErrors = {}
  const firstName = cleanText(formData.get("firstName"), 80)
  const lastName = cleanText(formData.get("lastName"), 80)
  const displayName = cleanText(formData.get("displayName"), 100)
  const email = cleanEmail(formData.get("email"))
  const password =
    typeof formData.get("password") === "string"
      ? String(formData.get("password"))
      : ""
  const passwordConfirmation =
    typeof formData.get("passwordConfirmation") === "string"
      ? String(formData.get("passwordConfirmation"))
      : ""
  const phone = cleanText(formData.get("phone"), 32)
  const dateOfBirth = cleanText(formData.get("dateOfBirth"), 10)

  if (firstName.length < 2) {
    errors.firstName = "Indiquez un prenom valide."
  }

  if (lastName.length < 2) {
    errors.lastName = "Indiquez un nom valide."
  }

  if (!emailPattern.test(email)) {
    errors.email = "Indiquez une adresse email valide."
  }

  if (password.length < 8) {
    errors.password = "Le mot de passe doit contenir au moins 8 caracteres."
  }

  if (password !== passwordConfirmation) {
    errors.passwordConfirmation = "Les mots de passe ne correspondent pas."
  }

  if (phone && !phonePattern.test(phone)) {
    errors.phone = "Indiquez un numero de telephone valide."
  }

  if (!isReasonableBirthDate(dateOfBirth)) {
    errors.dateOfBirth = "Indiquez une date de naissance valide."
  }

  if (!hasCheckbox(formData.get("privacyNoticeAccepted"))) {
    errors.privacyNoticeAccepted =
      "Vous devez confirmer avoir lu la notice d'inscription."
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    data: {
      firstName,
      lastName,
      displayName: displayName || null,
      email,
      password,
      phone: phone || null,
      dateOfBirth,
      dailyVerseEnabled: hasCheckbox(formData.get("dailyVerseEnabled")),
      privateBirthdayGreetingEnabled: hasCheckbox(
        formData.get("privateBirthdayGreetingEnabled"),
      ),
      communityBirthdayVisibilityEnabled: hasCheckbox(
        formData.get("communityBirthdayVisibilityEnabled"),
      ),
      announcementsEnabled: hasCheckbox(formData.get("announcementsEnabled")),
      privacyNoticeAccepted: true,
    },
  }
}

export function validateOnboardingForm(
  formData: FormData,
): ValidationResult<OnboardingInput> {
  const registrationLike = new FormData()

  for (const [key, value] of formData.entries()) {
    registrationLike.set(key, value)
  }

  registrationLike.set("email", "membre@example.com")
  registrationLike.set("password", "temporary-password")
  registrationLike.set("passwordConfirmation", "temporary-password")

  const parsed = validateRegistrationForm(registrationLike)

  if (!parsed.ok) return parsed

  const { email, password, ...data } = parsed.data
  void email
  void password

  return { ok: true, data }
}

export function validateLoginForm(formData: FormData) {
  const email = cleanEmail(formData.get("email"))
  const password =
    typeof formData.get("password") === "string"
      ? String(formData.get("password"))
      : ""

  if (!emailPattern.test(email) || password.length < 1) {
    return {
      ok: false,
      errors: {
        form: "Email ou mot de passe incorrect.",
      },
    } as const
  }

  return { ok: true, data: { email, password } } as const
}

export function validatePasswordResetRequest(formData: FormData) {
  const email = cleanEmail(formData.get("email"))

  if (!emailPattern.test(email)) {
    return {
      ok: false,
      errors: { email: "Indiquez une adresse email valide." },
    } as const
  }

  return { ok: true, data: { email } } as const
}

export function validateNewPasswordForm(formData: FormData) {
  const password =
    typeof formData.get("password") === "string"
      ? String(formData.get("password"))
      : ""
  const passwordConfirmation =
    typeof formData.get("passwordConfirmation") === "string"
      ? String(formData.get("passwordConfirmation"))
      : ""

  if (password.length < 8) {
    return {
      ok: false,
      errors: {
        password: "Le mot de passe doit contenir au moins 8 caracteres.",
      },
    } as const
  }

  if (password !== passwordConfirmation) {
    return {
      ok: false,
      errors: {
        passwordConfirmation: "Les mots de passe ne correspondent pas.",
      },
    } as const
  }

  return { ok: true, data: { password } } as const
}

export function validateProfileForm(formData: FormData) {
  const firstName = cleanText(formData.get("firstName"), 80)
  const lastName = cleanText(formData.get("lastName"), 80)
  const displayName = cleanText(formData.get("displayName"), 100)
  const phone = cleanText(formData.get("phone"), 32)
  const city = cleanText(formData.get("city"), 80)
  const postalCode = cleanText(formData.get("postalCode"), 16)
  const addressLine1 = cleanText(formData.get("addressLine1"), 160)
  const addressLine2 = cleanText(formData.get("addressLine2"), 160)

  const errors: FieldErrors = {}

  if (firstName.length < 2) errors.firstName = "Indiquez un prenom valide."
  if (lastName.length < 2) errors.lastName = "Indiquez un nom valide."
  if (phone && !phonePattern.test(phone)) {
    errors.phone = "Indiquez un numero de telephone valide."
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors } as const
  }

  return {
    ok: true,
    data: {
      firstName,
      lastName,
      displayName: displayName || null,
      phone: phone || null,
      city: city || null,
      postalCode: postalCode || null,
      addressLine1: addressLine1 || null,
      addressLine2: addressLine2 || null,
    },
  } as const
}

export function validateNotificationPreferencesForm(formData: FormData) {
  const timezone = cleanText(formData.get("timezone"), 64) || "Europe/Paris"

  return {
    dailyVerseEnabled: hasCheckbox(formData.get("dailyVerseEnabled")),
    privateBirthdayGreetingEnabled: hasCheckbox(
      formData.get("privateBirthdayGreetingEnabled"),
    ),
    communityBirthdayVisibilityEnabled: hasCheckbox(
      formData.get("communityBirthdayVisibilityEnabled"),
    ),
    announcementsEnabled: hasCheckbox(formData.get("announcementsEnabled")),
    eventsEnabled: hasCheckbox(formData.get("eventsEnabled")),
    donationNotificationsEnabled: hasCheckbox(
      formData.get("donationNotificationsEnabled"),
    ),
    pushEnabled: hasCheckbox(formData.get("pushEnabled")),
    dailyVersePushEnabled: hasCheckbox(formData.get("dailyVersePushEnabled")),
    birthdayPushEnabled: hasCheckbox(formData.get("birthdayPushEnabled")),
    announcementPushEnabled: hasCheckbox(
      formData.get("announcementPushEnabled"),
    ),
    eventPushEnabled: hasCheckbox(formData.get("eventPushEnabled")),
    personalPushEnabled: hasCheckbox(formData.get("personalPushEnabled")),
    staffMessagePushEnabled: hasCheckbox(
      formData.get("staffMessagePushEnabled"),
    ),
    timezone,
  }
}
