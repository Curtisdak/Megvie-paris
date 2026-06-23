import { notFound } from "next/navigation"
import { EventForm } from "../event-form"
import { getEventForEdit } from "@/lib/admin/data"

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await getEventForEdit(id)

  if (!event) notFound()

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700 dark:text-amber-200">
          Evenements
        </p>
        <h2 className="mt-2 text-2xl font-semibold">Modifier l&apos;evenement</h2>
      </div>
      <EventForm event={event} />
    </div>
  )
}
