"use client"

import {
  useActionState,
  useId,
  type ReactNode,
} from "react"
import { UserProfile } from "@clerk/nextjs"
import Link from "next/link"
import {
  Bell,
  CalendarDays,
  Gift,
  Megaphone,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react"
import {
  completeOnboardingAction,
  updateNotificationPreferencesAction,
  updateProfileAction,
  type ActionState,
} from "@/lib/auth/actions"
import type { MemberDashboardData } from "@/lib/auth/dashboard"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const initialState: ActionState = {
  ok: false,
  message: "",
}

const inputClassName =
  "h-12 rounded-2xl border-zinc-200 bg-white/[0.85] px-4 shadow-none transition focus-visible:border-amber-500 focus-visible:ring-amber-500/20 dark:border-zinc-800 dark:bg-zinc-950/50"

function FieldLabel({
  htmlFor,
  icon: Icon,
  children,
}: {
  htmlFor: string
  icon: LucideIcon
  children: ReactNode
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className="text-sm font-semibold text-zinc-800 dark:text-zinc-100"
    >
      <Icon className="h-4 w-4 text-amber-600" />
      {children}
    </Label>
  )
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="space-y-4 border-t border-zinc-100 pt-5 first:border-t-0 first:pt-0 dark:border-zinc-800">
      <div>
        <h3 className="text-base font-semibold text-zinc-950 dark:text-white">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      </div>
      {children}
    </section>
  )
}

function FormMessage({ state }: { state: ActionState }) {
  if (!state.message) return null

  return (
    <p
      className={
        state.ok
          ? "rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100"
          : "rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-100"
      }
    >
      {state.message}
    </p>
  )
}

function FieldError({
  errors,
  name,
}: {
  errors?: Record<string, string>
  name: string
}) {
  const error = errors?.[name]

  if (!error) return null

  return <p className="text-xs font-medium text-red-600">{error}</p>
}

function CheckboxField({
  name,
  label,
  description,
  icon: Icon,
  defaultChecked = false,
}: {
  name: string
  label: string
  description?: string
  icon: LucideIcon
  defaultChecked?: boolean
}) {
  const id = useId()

  return (
    <div className="group flex items-start gap-3 rounded-3xl border border-zinc-200 bg-white/80 px-4 py-3.5 text-sm leading-6 text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50/80 dark:border-zinc-800 dark:bg-zinc-950/[0.45] dark:text-zinc-200 dark:hover:border-amber-400/30 dark:hover:bg-amber-400/10">
      <Checkbox
        id={id}
        name={name}
        defaultChecked={defaultChecked}
        className="mt-3 size-5 rounded-md"
      />
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-zinc-100 text-zinc-600 transition group-hover:bg-white group-hover:text-amber-600 dark:bg-zinc-900 dark:text-zinc-300 dark:group-hover:bg-zinc-900">
        <Icon className="h-5 w-5" />
      </span>
      <Label htmlFor={id} className="block min-w-0 flex-1 cursor-pointer">
        <span className="block font-semibold text-zinc-900 dark:text-zinc-100">
          {label}
        </span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            {description}
          </span>
        ) : null}
      </Label>
    </div>
  )
}

export function OnboardingForm() {
  const [state, formAction, isPending] = useActionState(
    completeOnboardingAction,
    initialState,
  )

  return (
    <form action={formAction} className="space-y-7">
      <FormMessage state={state} />

      <FormSection
        title="Identite"
        description="Ces informations serviront a preparer votre demande d'adhesion."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel htmlFor="firstName" icon={UserRound}>
              Prenom
            </FieldLabel>
            <Input
              id="firstName"
              name="firstName"
              required
              autoComplete="given-name"
              className={inputClassName}
            />
            <FieldError errors={state.errors} name="firstName" />
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor="lastName" icon={UserRound}>
              Nom
            </FieldLabel>
            <Input
              id="lastName"
              name="lastName"
              required
              autoComplete="family-name"
              className={inputClassName}
            />
            <FieldError errors={state.errors} name="lastName" />
          </div>
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="displayName" icon={Sparkles}>
            Nom d&apos;affichage
          </FieldLabel>
          <Input
            id="displayName"
            name="displayName"
            autoComplete="nickname"
            placeholder="Optionnel"
            className={inputClassName}
          />
        </div>
      </FormSection>

      <FormSection
        title="Contact"
        description="Votre email est gere par Clerk. Vous pouvez ajouter un telephone."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel htmlFor="phone" icon={Phone}>
              Telephone
            </FieldLabel>
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              className={inputClassName}
            />
            <FieldError errors={state.errors} name="phone" />
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor="dateOfBirth" icon={CalendarDays}>
              Date de naissance
            </FieldLabel>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              required
              autoComplete="bday"
              className={inputClassName}
            />
            <FieldError errors={state.errors} name="dateOfBirth" />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Preferences"
        description="Vous pourrez modifier ces choix depuis votre espace membre."
      >
        <div className="grid gap-3">
          <CheckboxField
            name="dailyVerseEnabled"
            label="Recevoir le verset du jour"
            description="Un rappel spirituel quotidien dans l'application."
            icon={Sparkles}
            defaultChecked
          />
          <CheckboxField
            name="privateBirthdayGreetingEnabled"
            label="Message prive pour mon anniversaire"
            description="Un message personnel le jour de votre anniversaire."
            icon={Gift}
            defaultChecked
          />
          <CheckboxField
            name="communityBirthdayVisibilityEnabled"
            label="Annonce a la communaute"
            description="Seuls le jour et le mois seront visibles."
            icon={Bell}
            defaultChecked
          />
          <CheckboxField
            name="announcementsEnabled"
            label="Recevoir les annonces de l'eglise"
            description="Cultes, nouvelles importantes et informations utiles."
            icon={Megaphone}
            defaultChecked
          />
        </div>
      </FormSection>

      <div className="space-y-3 rounded-3xl border border-amber-100 bg-amber-50/75 p-4 dark:border-amber-400/20 dark:bg-amber-400/10">
        <CheckboxField
          name="privacyNoticeAccepted"
          label="J'accepte la notice d'inscription"
          description="Mes informations seront utilisees pour gerer mon adhesion et mon espace membre."
          icon={ShieldCheck}
        />
        <FieldError errors={state.errors} name="privacyNoticeAccepted" />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="h-14 w-full rounded-full bg-gradient-to-r from-amber-600 to-orange-600 px-6 text-base font-semibold text-white shadow-lg shadow-amber-600/25 transition hover:-translate-y-0.5 hover:from-amber-500 hover:to-orange-500"
      >
        {isPending ? "Enregistrement..." : "Terminer mon inscription"}
      </Button>
    </form>
  )
}

export function ProfileForm({ data }: { data: MemberDashboardData }) {
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    initialState,
  )

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">Prenom</Label>
          <Input
            id="firstName"
            name="firstName"
            defaultValue={data.profile?.first_name ?? ""}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Nom</Label>
          <Input
            id="lastName"
            name="lastName"
            defaultValue={data.profile?.last_name ?? ""}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="displayName">Nom d&apos;affichage</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={data.profile?.display_name ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="avatar">Photo de profil</Label>
        <Input
          id="avatar"
          name="avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp"
        />
        <p className="text-xs text-zinc-500">
          JPG, PNG ou WebP. Taille maximale: 2 Mo.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telephone</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={data.contact?.phone ?? ""}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="addressLine1">Adresse</Label>
          <Input
            id="addressLine1"
            name="addressLine1"
            defaultValue={data.privateDetails?.address_line_1 ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="addressLine2">Complement</Label>
          <Input
            id="addressLine2"
            name="addressLine2"
            defaultValue={data.privateDetails?.address_line_2 ?? ""}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="postalCode">Code postal</Label>
          <Input
            id="postalCode"
            name="postalCode"
            defaultValue={data.privateDetails?.postal_code ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Ville</Label>
          <Input
            id="city"
            name="city"
            defaultValue={data.privateDetails?.city ?? ""}
          />
        </div>
      </div>
      <Button
        type="submit"
        disabled={isPending}
        className="h-12 rounded-full bg-amber-600 px-7 text-white hover:bg-amber-500"
      >
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  )
}

export function NotificationPreferencesForm({
  data,
}: {
  data: MemberDashboardData
}) {
  const [state, formAction, isPending] = useActionState(
    updateNotificationPreferencesAction,
    initialState,
  )
  const preferences = data.preferences

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />
      <CheckboxField
        name="dailyVerseEnabled"
        label="Recevoir le verset du jour"
        icon={Sparkles}
        defaultChecked={preferences?.daily_verse_enabled ?? true}
      />
      <CheckboxField
        name="privateBirthdayGreetingEnabled"
        label="Recevoir un message prive pour mon anniversaire"
        icon={Gift}
        defaultChecked={
          preferences?.private_birthday_greeting_enabled ?? true
        }
      />
      <CheckboxField
        name="communityBirthdayVisibilityEnabled"
        label="Autoriser l'annonce de mon anniversaire a la communaute"
        icon={Bell}
        defaultChecked={
          preferences?.community_birthday_visibility_enabled ?? true
        }
      />
      <CheckboxField
        name="announcementsEnabled"
        label="Recevoir les annonces de l'eglise"
        icon={Megaphone}
        defaultChecked={preferences?.announcements_enabled ?? true}
      />
      <CheckboxField
        name="eventsEnabled"
        label="Recevoir les informations sur les evenements"
        icon={CalendarDays}
        defaultChecked={preferences?.events_enabled ?? true}
      />
      <CheckboxField
        name="donationNotificationsEnabled"
        label="Recevoir les confirmations liees aux dons"
        icon={ShieldCheck}
        defaultChecked={preferences?.donation_notifications_enabled ?? true}
      />
      <input
        type="hidden"
        name="timezone"
        value={preferences?.timezone ?? "Europe/Paris"}
      />
      <Button
        type="submit"
        disabled={isPending}
        className="h-12 rounded-full bg-amber-600 px-7 text-white hover:bg-amber-500"
      >
        {isPending ? "Enregistrement..." : "Enregistrer mes preferences"}
      </Button>
    </form>
  )
}

export function ClerkSecurityPanel() {
  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-zinc-200 bg-white/90 p-5 dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex items-start gap-3">
          <span className="rounded-2xl bg-amber-100 p-3 text-amber-700 dark:bg-amber-400/15 dark:text-amber-100">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-zinc-900 dark:text-white">
              Securite du compte
            </p>
            <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              Clerk gere le mot de passe, les sessions et les reglages de
              securite du compte.
            </p>
          </div>
        </div>
      </div>
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <UserProfile routing="hash" />
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Besoin de revenir a l&apos;espace membre ?{" "}
        <Link href="/espace-membre" className="font-semibold text-amber-700">
          Retour
        </Link>
      </p>
    </div>
  )
}
