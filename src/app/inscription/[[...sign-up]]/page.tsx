import type { Metadata } from "next"
import { SignUp } from "@clerk/nextjs"
import { AuthPageShell } from "@/components/auth/auth-page-shell"

export const metadata: Metadata = {
  title: "Inscription",
}

export default function SignupPage() {
  return (
    <AuthPageShell
      eyebrow="Inscription"
      title="Votre espace membre MegVie commence ici."
      description="Creez votre compte, confirmez votre email, puis completez les informations d'adhesion demandees par MegVie Paris."
    >
      <div className="flex justify-center">
        <SignUp
          routing="path"
          path="/inscription"
          signInUrl="/connexion"
          fallbackRedirectUrl="/bienvenue"
          forceRedirectUrl="/bienvenue"
        />
      </div>
    </AuthPageShell>
  )
}
