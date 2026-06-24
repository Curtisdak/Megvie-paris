"use client"

import { useMemo, useOptimistic, useState, useTransition } from "react"
import Link from "next/link"
import {
  Archive,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Inbox,
  MailOpen,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  archiveNotificationAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  markNotificationUnreadAction,
} from "@/lib/notifications/actions"

type NotificationItem = {
  id: string
  readAt: Date | null
  archivedAt: Date | null
  createdAt: Date
  campaign: {
    id: string
    type: string
    title: string
    body: string
    targetUrl: string
  }
}

type Pagination = {
  page: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

type OptimisticMutation =
  | { type: "read"; id: string }
  | { type: "unread"; id: string }
  | { type: "archive"; id: string }
  | { type: "read-all" }

function formatDate(value: Date) {
  return value.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function typeLabel(type: string) {
  const labels: Record<string, string> = {
    DAILY_VERSE: "Verset",
    BIRTHDAY: "Anniversaire",
    ANNOUNCEMENT: "Annonce",
    EVENT_PUBLISHED: "Evenement",
    EVENT_REMINDER: "Rappel",
    EVENT_CANCELLED: "Annulation",
    PERSONAL: "Compte",
    STAFF_NEW_MESSAGE: "Equipe",
    STAFF_CONFIDENTIAL_MESSAGE: "Confidentiel",
    SYSTEM: "Systeme",
    TEST: "Test",
  }

  return labels[type] ?? type
}

function pageHref(page: number) {
  return page > 1
    ? `/espace-membre/notifications?page=${page}`
    : "/espace-membre/notifications"
}

function notificationFormData(id: string) {
  const formData = new FormData()
  formData.set("notificationId", id)
  return formData
}

export function MemberNotificationInbox({
  notifications,
  pagination,
  unread,
}: {
  notifications: NotificationItem[]
  pagination: Pagination
  unread: number
}) {
  const [baseNotifications, setBaseNotifications] = useState(notifications)
  const [baseUnread, setBaseUnread] = useState(unread)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [optimisticState, mutateOptimistic] = useOptimistic(
    { notifications: baseNotifications, unread: baseUnread },
    (current, mutation: OptimisticMutation) => {
      const now = new Date()

      if (mutation.type === "read-all") {
        return {
          unread: 0,
          notifications: current.notifications.map((item) => ({
            ...item,
            readAt: item.readAt ?? now,
          })),
        }
      }

      if (mutation.type === "archive") {
        const item = current.notifications.find(
          (notification) => notification.id === mutation.id,
        )
        const wasUnread = item && !item.readAt

        return {
          unread: Math.max(0, current.unread - (wasUnread ? 1 : 0)),
          notifications: current.notifications.filter(
            (notification) => notification.id !== mutation.id,
          ),
        }
      }

      return {
        unread:
          mutation.type === "read"
            ? Math.max(
                0,
                current.unread -
                  Number(
                    current.notifications.some(
                      (item) => item.id === mutation.id && !item.readAt,
                    ),
                  ),
              )
            : current.unread +
              Number(
                current.notifications.some(
                  (item) => item.id === mutation.id && item.readAt,
                ),
              ),
        notifications: current.notifications.map((item) =>
          item.id === mutation.id
            ? { ...item, readAt: mutation.type === "read" ? now : null }
            : item,
        ),
      }
    },
  )
  const currentUnread = useMemo(
    () =>
      optimisticState.notifications.filter((item) => !item.readAt && !item.archivedAt)
        .length,
    [optimisticState.notifications],
  )

  const runAction = (
    mutation: OptimisticMutation,
    action: () => Promise<{ ok: boolean; message: string }>,
  ) => {
    startTransition(async () => {
      setPendingId("id" in mutation ? mutation.id : "all")
      mutateOptimistic(mutation)
      const result = await action()

      if (!result.ok) {
        toast.error("Action impossible", { description: result.message })
        setBaseNotifications([...baseNotifications])
        setBaseUnread(baseUnread)
        setPendingId(null)
        return
      }

      if (mutation.type === "read-all") {
        const now = new Date()
        setBaseNotifications((items) =>
          items.map((item) => ({ ...item, readAt: item.readAt ?? now })),
        )
        setBaseUnread(0)
      } else if (mutation.type === "archive") {
        setBaseNotifications((items) =>
          items.filter((item) => item.id !== mutation.id),
        )
        setBaseUnread((value) => Math.max(0, value - 1))
      } else {
        setBaseNotifications((items) =>
          items.map((item) =>
            item.id === mutation.id
              ? { ...item, readAt: mutation.type === "read" ? new Date() : null }
              : item,
          ),
        )
        setBaseUnread(currentUnread)
      }

      setPendingId(null)
      toast.success(result.message)
    })
  }

  return (
    <div className="rounded-[1.5rem] border border-zinc-200 bg-white/95 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/85 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-amber-100 p-3 text-amber-700 dark:bg-amber-400/15 dark:text-amber-100">
            <Inbox className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Boite de reception</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {currentUnread} non lue{currentUnread > 1 ? "s" : ""}.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-full sm:w-auto"
          disabled={currentUnread === 0 || isPending}
          onClick={() =>
            runAction({ type: "read-all" }, () =>
              markAllNotificationsReadAction(),
            )
          }
        >
          <Check className="h-4 w-4" aria-hidden />
          Tout marquer comme lu
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {optimisticState.notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-400">
            Aucune nouvelle notification.
          </div>
        ) : (
          optimisticState.notifications.map((item) => {
            const isUnread = !item.readAt
            const isItemPending = pendingId === item.id

            return (
              <article
                key={item.id}
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition dark:border-zinc-800 dark:bg-zinc-950/50"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-1 rounded-2xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-400/15 dark:text-amber-100">
                    <Bell className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {typeLabel(item.campaign.type)}
                      </span>
                      {isUnread ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-400/15 dark:text-amber-100">
                          Non lu
                        </span>
                      ) : null}
                      <span className="text-xs text-zinc-500">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    <h3 className="mt-3 text-base font-semibold">
                      {item.campaign.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                      {item.campaign.body}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button asChild size="sm" className="rounded-full">
                        <Link
                          href={`${item.campaign.targetUrl}${
                            item.campaign.targetUrl.includes("?") ? "&" : "?"
                          }notification=${item.id}`}
                        >
                          Ouvrir
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        disabled={isItemPending}
                        onClick={() =>
                          runAction(
                            { type: isUnread ? "read" : "unread", id: item.id },
                            () =>
                              isUnread
                                ? markNotificationReadAction(
                                    notificationFormData(item.id),
                                  )
                                : markNotificationUnreadAction(
                                    notificationFormData(item.id),
                                  ),
                          )
                        }
                      >
                        {isUnread ? (
                          <Check className="h-4 w-4" aria-hidden />
                        ) : (
                          <MailOpen className="h-4 w-4" aria-hidden />
                        )}
                        {isUnread ? "Marquer lu" : "Non lu"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="rounded-full"
                        disabled={isItemPending}
                        onClick={() =>
                          runAction({ type: "archive", id: item.id }, () =>
                            archiveNotificationAction(
                              notificationFormData(item.id),
                            ),
                          )
                        }
                      >
                        <Archive className="h-4 w-4" aria-hidden />
                        Archiver
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>

      <nav className="mt-4 flex items-center justify-between gap-3">
        <Button
          asChild={pagination.hasPreviousPage}
          variant="outline"
          className="rounded-full"
          disabled={!pagination.hasPreviousPage}
        >
          {pagination.hasPreviousPage ? (
            <Link href={pageHref(pagination.page - 1)}>
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Precedent
            </Link>
          ) : (
            <span>
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Precedent
            </span>
          )}
        </Button>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Page {pagination.page} sur {pagination.totalPages}
        </p>
        <Button
          asChild={pagination.hasNextPage}
          variant="outline"
          className="rounded-full"
          disabled={!pagination.hasNextPage}
        >
          {pagination.hasNextPage ? (
            <Link href={pageHref(pagination.page + 1)}>
              Suivant
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : (
            <span>
              Suivant
              <ChevronRight className="h-4 w-4" aria-hidden />
            </span>
          )}
        </Button>
      </nav>
    </div>
  )
}
