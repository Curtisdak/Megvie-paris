"use client"

import { usePathname } from "next/navigation"

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Keep viewport-level admin navigation outside any animated ancestor.
  if (pathname.startsWith("/admin")) return children
  return (
    <div
      id="app-content"
      tabIndex={-1}
      key={pathname}
      className="app-route-content outline-none"
    >
      {children}
    </div>
  )
}
