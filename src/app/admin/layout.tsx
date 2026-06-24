import type { Metadata } from "next"
import { AdminShell } from "@/components/admin/admin-shell"
import { getAdminContext } from "@/lib/admin/data"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Administration MegVie Paris",
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAdminContext("/admin")
  const displayName =
    user.profile?.displayName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email

  return (
    <AdminShell role={user.role} displayName={displayName} email={user.email}>
      {children}
    </AdminShell>
  )
}
