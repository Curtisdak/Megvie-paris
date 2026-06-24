import type { Metadata } from "next"
import { OnboardingForm } from "@/components/auth/auth-forms"
import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { ensureCurrentAppUser } from "@/lib/auth/clerk-user"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Finaliser l'inscription",
}

export default async function OnboardingPage() {
  await ensureCurrentAppUser()

  return (
    <AuthPageShell
      eyebrow="Bienvenue"
      title="Finalisez votre demande d'adhesion."
      description="Votre compte Clerk est cree. Il reste a renseigner les informations utiles a l'equipe MegVie Paris avant validation."
    >
      <OnboardingForm />
    </AuthPageShell>
  )
}
