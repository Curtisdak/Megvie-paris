"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function NotificationCountBadge({ className }: { className?: string }) {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const response = await fetch("/api/member/notifications/unread", {
          cache: "no-store",
        })

        if (!response.ok) return

        const data = (await response.json()) as { unread?: unknown }
        const nextUnread = Number(data.unread)

        if (active && Number.isFinite(nextUnread)) {
          setUnread(Math.max(0, nextUnread))
        }
      } catch {
        if (active) setUnread(0)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  if (unread <= 0) return null

  return (
    <span
      className={cn(
        "absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-amber-500 px-1 text-[0.65rem] font-black leading-none text-white dark:border-zinc-950",
        className,
      )}
      aria-label={`${unread} notification${unread > 1 ? "s" : ""} non lue${unread > 1 ? "s" : ""}`}
    >
      {unread > 9 ? "9+" : unread}
    </span>
  )
}
