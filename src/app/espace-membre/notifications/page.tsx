import type { Metadata } from "next"
import {
  ChevronRight,
  Settings2,
} from "lucide-react"
import { NotificationPreferencesForm } from "@/components/auth/auth-forms"
import { MemberNotificationInbox } from "@/components/notifications/member-notification-inbox"
import { MemberPushManager } from "@/components/pwa/member-push-manager"
import { getMemberNotificationCenterData } from "@/lib/notifications/member"
import { getRequiredMemberDashboardData } from "@/lib/auth/dashboard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Notifications membre",
}

export default async function MemberNotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; notification?: string }>
}) {
  const params = await searchParams
  const [dashboardData, notificationData] = await Promise.all([
    getRequiredMemberDashboardData("/espace-membre/notifications"),
    getMemberNotificationCenterData({
      page: params?.page,
      markReadId: params?.notification,
    }),
  ])

  return (
    <main className="app-page">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:gap-5">
        <section className="overflow-hidden rounded-lg bg-[linear-gradient(110deg,#18181b,#193d38)] p-5 text-white shadow-none sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-normal text-amber-100">
                Espace membre
              </p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-3xl">
                Notifications
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">
                Activez les alertes, ajustez vos preferences et retrouvez les
                messages importants de MegVie Paris.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:min-w-64">
              <div className="rounded-lg bg-white/10 p-3">
                <p className="text-xs text-white/70">Non lues</p>
                <p className="mt-1 text-3xl font-semibold">
                  {notificationData.unread}
                </p>
              </div>
              <div className="rounded-lg bg-white/10 p-3">
                <p className="text-xs text-white/70">Total</p>
                <p className="mt-1 text-3xl font-semibold">
                  {notificationData.total}
                </p>
              </div>
            </div>
          </div>
        </section>

        <MemberPushManager activeDevices={notificationData.activeDevices} />

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <MemberNotificationInbox
            notifications={notificationData.notifications}
            pagination={notificationData.pagination}
            unread={notificationData.unread}
          />

          <aside>
            <details className="group rounded-lg border border-zinc-200 bg-white/95 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/85">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:hidden sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="rounded-lg bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-400/15 dark:text-amber-100">
                    <Settings2 className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold">Preferences</h2>
                    <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                      Alertes, versets et annonces.
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className="h-5 w-5 shrink-0 text-zinc-400 transition group-open:rotate-90"
                  aria-hidden
                />
              </summary>
              <div className="border-t border-zinc-200 p-4 dark:border-zinc-800 sm:p-5">
                <NotificationPreferencesForm data={dashboardData} />
              </div>
            </details>
          </aside>
        </section>
      </div>
    </main>
  )
}
