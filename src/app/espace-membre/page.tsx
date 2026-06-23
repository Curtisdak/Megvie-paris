import type { Metadata } from "next"
import { MemberHome } from "@/components/auth/member-dashboard"
import { listMemberDashboardContent } from "@/lib/admin/data"
import { getRequiredMemberDashboardData } from "@/lib/auth/dashboard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Espace membre",
}

export default async function MemberDashboardPage() {
  const data = await getRequiredMemberDashboardData()
  const content = await listMemberDashboardContent()

  return <MemberHome data={data} content={content} />
}
