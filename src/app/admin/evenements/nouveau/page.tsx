import { EventForm } from "../event-form"
import { AdminPageHero } from "@/components/admin/admin-page-hero"

export default function NewEventPage() {
  return (
    <div className="space-y-5">
      <AdminPageHero
        eyebrow="Événements"
        title="Nouvel événement"
        description="Ajoutez les informations essentielles, l'image et les liens utiles pour la communauté."
      />
      <EventForm />
    </div>
  )
}
