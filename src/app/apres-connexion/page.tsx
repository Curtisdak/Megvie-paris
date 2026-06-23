import { redirect } from "next/navigation"
import { ensureCurrentAppUser } from "@/lib/auth/clerk-user"
import { isAdminRole } from "@/lib/auth/permissions"

export const dynamic = "force-dynamic"

export default async function AfterLoginPage() {
  const user = await ensureCurrentAppUser()

  if (!user.onboardingComplete) {
    redirect("/bienvenue?next=/espace-membre")
  }

  if (isAdminRole(user.role)) {
    redirect("/admin")
  }

  redirect("/espace-membre")
}
