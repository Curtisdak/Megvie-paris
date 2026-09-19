import type { Metadata } from "next"
import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { ArrowRight, Inbox } from "lucide-react"
import { redirect } from "next/navigation"
import { PageHeading } from "@/components/ui/page-heading"
import { Button } from "@/components/ui/button"
import { PushNotificationCard } from "@/components/pwa/push-notification-card"

export const metadata: Metadata = {
  title: "Notifications",
  description: "Les versets, messages et annonces de MegVie Paris.",
}
export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const authState = await auth()
  if (authState.userId) redirect("/espace-membre/notifications")
  return (
    <div className="app-page">
      <main className="mx-auto max-w-4xl space-y-8">
        <PageHeading
          eyebrow="Restons en lien"
          title="Notifications"
          description="Les nouvelles de la communauté et une parole pour chaque jour."
        />
        <div className="grid gap-8 md:grid-cols-2">
          <PushNotificationCard />
          <section className="flex flex-col items-start justify-center border-t border-border py-6 md:border-l md:border-t-0 md:pl-8">
            <Inbox
              className="size-7 text-teal-700 dark:text-teal-300"
              aria-hidden
            />
            <h2 className="mt-4 text-xl font-semibold">
              Votre boîte de réception
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Connectez-vous pour retrouver vos messages et les annonces de
              votre espace membre.
            </p>
            <Button asChild className="mt-5">
              <Link href="/connexion?next=%2Fespace-membre%2Fnotifications">
                Se connecter
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </section>
        </div>
      </main>
    </div>
  )
}
