"use client"

import { usePathname } from "next/navigation"

export function AdminRouteTransition({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  return (
    <div key={pathname} className="app-route-content">
      {children}
    </div>
  )
}
