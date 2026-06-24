import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { donationsToCsv } from "@/lib/finance/csv"
import {
  getDonationsForExport,
  requireFinancePermission,
} from "@/lib/finance/data"

export async function GET(request: NextRequest) {
  const actor = await requireFinancePermission(
    "donations.export",
    "/admin/finance",
  )
  const donations = await getDonationsForExport({
    q: request.nextUrl.searchParams.get("q") ?? undefined,
    source: request.nextUrl.searchParams.get("source") ?? undefined,
    status: request.nextUrl.searchParams.get("status") ?? undefined,
    frequency: request.nextUrl.searchParams.get("frequency") ?? undefined,
    directStatus: request.nextUrl.searchParams.get("directStatus") ?? undefined,
    directKind: request.nextUrl.searchParams.get("directKind") ?? undefined,
    category: request.nextUrl.searchParams.get("category") ?? undefined,
    from: request.nextUrl.searchParams.get("from") ?? undefined,
    to: request.nextUrl.searchParams.get("to") ?? undefined,
  })
  const csv = donationsToCsv(donations)

  await prisma.adminAuditLog.create({
    data: {
      actorUserId: actor.id,
      actorMemberId: actor.profile?.memberId ?? null,
      action: "donation.export_created",
      entityType: "donation",
      summary: `${donations.length} ligne(s) exportee(s).`,
      metadata: { count: donations.length },
    },
  })

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dons-megvie-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  })
}
