import type { Metadata } from "next"
import { SignIn } from "@clerk/nextjs"
import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { getSafeRedirectPath } from "@/lib/auth/redirects"

export const metadata: Metadata = {
  title: "Connexion",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>
}) {
  const params = await searchParams
  const redirectPath = getSafeRedirectPath(params?.next ?? "/apres-connexion")

  return (
    <AuthPageShell
      eyebrow="Connexion"
      title="Retrouvez votre espace membre."
      description="Connectez-vous avec Clerk pour suivre votre adhesion, gerer votre profil, vos notifications et vos reglages de securite."
    >
      <div className="flex justify-center">
        <SignIn
          routing="path"
          path="/connexion"
          signUpUrl="/inscription"
          fallbackRedirectUrl={redirectPath}
          forceRedirectUrl={redirectPath}
        />
      </div>
    </AuthPageShell>
  )
}
