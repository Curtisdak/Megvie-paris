import type { Metadata } from "next"
import { MemberHome } from "@/components/auth/member-dashboard"
import { getRequiredMemberDashboardData } from "@/lib/auth/dashboard"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Espace membre",
}

export default async function MemberDashboardPage() {
  const data = await getRequiredMemberDashboardData()

  return <MemberHome data={data} />
}
