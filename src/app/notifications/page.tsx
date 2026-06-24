import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { Bell, Cake, Mail, Sparkles, SunMedium } from "lucide-react"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Notifications",
  description:
    "Centre de notifications MegVie Paris pour les versets, messages et annonces.",
}

const notificationCategories = [
  {
    label: "Verset du jour",
    description: "Recevez les encouragements bibliques quotidiens.",
    icon: SunMedium,
  },
  {
    label: "Messages",
    description: "Retrouvez les messages importants de l'eglise.",
    icon: Mail,
  },
  {
    label: "Anniversaires",
    description: "Celebrez les anniversaires de la communaute.",
    icon: Cake,
  },
  {
    label: "Nouvelles",
    description: "Suivez les annonces, cultes et activites a venir.",
    icon: Sparkles,
  },
]

export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const authState = await auth()

  if (authState.userId) {
    redirect("/espace-membre/notifications")
  }

  return (
    <div className="app-edge-to-edge min-h-screen bg-gradient-to-b from-amber-50 via-white to-zinc-50 py-5 text-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 dark:text-zinc-50 sm:py-12">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 sm:gap-8">
        <section className="overflow-hidden rounded-[28px] border border-amber-100 bg-white/95 shadow-xl dark:border-amber-400/25 dark:bg-zinc-900/85 sm:rounded-[32px]">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex min-h-[220px] flex-col justify-between bg-gradient-to-br from-amber-700 via-amber-600 to-amber-400 p-6 text-white sm:min-h-[260px] sm:p-8">
              <div>
                <span className="inline-flex rounded-full bg-white/15 p-3">
                  <Bell className="h-6 w-6" />
                </span>
                <p className="mt-6 text-sm font-semibold uppercase tracking-[0.35em] text-white/80">
                  MegVie Paris
                </p>
                <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
                  Notifications
                </h1>
              </div>
              <p className="mt-8 max-w-sm text-sm leading-6 text-white/85">
                Un espace unique pour suivre les versets, messages,
                anniversaires et nouvelles de la communaute.
              </p>
            </div>

            <div className="p-5 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
                <Sparkles className="h-4 w-4" />
                Bientot disponible
              </div>

              <h2 className="mt-6 text-2xl font-semibold leading-tight text-zinc-900 dark:text-white sm:text-3xl">
                Votre centre personnel de notifications.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
                Cette page prepare l&apos;espace ou chaque utilisateur pourra
                voir ses notifications MegVie Paris au meme endroit.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {notificationCategories.map((item) => {
                  const Icon = item.icon

                  return (
                    <div
                      key={item.label}
                      className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50"
                    >
                      <span className="inline-flex rounded-2xl bg-amber-100 p-3 text-amber-700 dark:bg-amber-400/15 dark:text-amber-100">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                        {item.label}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                        {item.description}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
