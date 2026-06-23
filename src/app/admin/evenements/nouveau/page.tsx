import { EventForm } from "../event-form"

export default function NewEventPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700 dark:text-amber-200">
          Evenements
        </p>
        <h2 className="mt-2 text-2xl font-semibold">Nouvel evenement</h2>
      </div>
      <EventForm />
    </div>
  )
}
