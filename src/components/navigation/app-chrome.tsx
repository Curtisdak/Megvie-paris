"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { InstallAppDialog } from "@/components/pwa/install-app-dialog"
import { FloatingInstallButton } from "@/components/pwa/floating-install-button"
import { AppHeader } from "@/components/navigation/app-header"
import { AppNavigation } from "@/components/navigation/app-navigation"

export function AppChrome() {
  const pathname = usePathname()
  const isAdminRoute = pathname.startsWith("/admin")

  useEffect(() => {
    document.documentElement.classList.toggle("admin-route", isAdminRoute)

    return () => {
      document.documentElement.classList.remove("admin-route")
    }
  }, [isAdminRoute])

  if (isAdminRoute) return null

  return (
    <>
      <InstallAppDialog autoOpen />
      <AppHeader />
      <AppNavigation />
      <FloatingInstallButton />
    </>
  )
}
