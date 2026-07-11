import { notFound } from "next/navigation"
import { EventForm } from "../event-form"
import { AdminPageHero } from "@/components/admin/admin-page-hero"
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
      <AdminPageHero
        eyebrow="Événements"
        title="Modifier l'événement"
        description="Mettez à jour les informations publiques et le statut de publication."
      />
      <EventForm event={event} />
    </div>
  )
}
