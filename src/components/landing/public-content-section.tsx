import Link from "next/link"
import { ArrowUpRight, CalendarDays, FileText, Images } from "lucide-react"
import { Button } from "@/components/ui/button"
import { listPublicContent } from "@/lib/admin/data"

export async function PublicContentSection() {
  const [events, announcements, albums] = await listPublicContent()

  if (events.length === 0 && announcements.length === 0 && albums.length === 0) {
    return null
  }

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white/95 p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900/85 sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
            Actualites
          </p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight text-zinc-900 dark:text-white sm:text-3xl">
            Les contenus publies par MegVie Paris.
          </h2>
        </div>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/notifications">
            Centre de notifications
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <PublicColumn
          title="Evenements"
          icon={<CalendarDays className="h-5 w-5" aria-hidden />}
          empty="Aucun evenement public publie."
          items={events.map((event) => ({
            id: event.id,
            label: event.title,
            meta: event.startsAt.toLocaleString("fr-FR"),
            description: event.shortDescription ?? event.locationName ?? null,
            imageUrl: event.coverImageUrl,
          }))}
        />
        <PublicColumn
          title="Annonces"
          icon={<FileText className="h-5 w-5" aria-hidden />}
          empty="Aucune annonce publique publiee."
          items={announcements.map((announcement) => ({
            id: announcement.id,
            label: announcement.title,
            meta: announcement.category.toLowerCase().replace(/_/g, " "),
            description: announcement.summary,
            imageUrl: announcement.coverImageUrl,
          }))}
        />
        <PublicColumn
          title="Galerie"
          icon={<Images className="h-5 w-5" aria-hidden />}
          empty="Aucun album public publie."
          items={albums.map((album) => ({
            id: album.id,
            label: album.title,
            meta: album.eventDate?.toLocaleDateString("fr-FR") ?? "Album",
            description: album.description,
            imageUrl: album.coverImageUrl ?? album.items[0]?.imageUrl ?? null,
          }))}
        />
      </div>
    </section>
  )
}

function PublicColumn({
  title,
  icon,
  empty,
  items,
}: {
  title: string
  icon: React.ReactNode
  empty: string
  items: Array<{
    id: string
    label: string
    meta: string
    description: string | null
    imageUrl: string | null
  }>
}) {
  return (
    <div className="rounded-[1.4rem] border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="flex items-center gap-2 px-1 py-2">
        <span className="rounded-2xl bg-amber-100 p-2 text-amber-700 dark:bg-amber-400/15 dark:text-amber-100">
          {icon}
        </span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="mt-2 space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-2xl border border-white bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              {item.imageUrl ? (
                <div className="aspect-[16/9] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : null}
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-200">
                  {item.meta}
                </p>
                <h4 className="mt-2 font-semibold">{item.label}</h4>
                {item.description ? (
                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    {item.description}
                  </p>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <p className="rounded-2xl bg-white p-4 text-sm text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            {empty}
          </p>
        )}
      </div>
    </div>
  )
}
