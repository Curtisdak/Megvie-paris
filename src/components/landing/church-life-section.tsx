"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Bell,
  CalendarDays,
  MapPin,
  Play,
  Smartphone,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { fadeInUp } from "@/lib/motion"

const eventItems = [
  {
    label: "Culte du dimanche",
    value: "14:30 - 16:30",
    detail: "Louange, parole, priere et accueil fraternel.",
    icon: CalendarDays,
  },
  {
    label: "Adresse",
    value: "Le Perreux-sur-Marne",
    detail: "4 rue de Chanzy, 94170.",
    icon: MapPin,
  },
  {
    label: "Accompagnement",
    value: "Priere et ecoute",
    detail: "Une equipe disponible pour vous orienter.",
    icon: Users,
  },
]

export function ChurchLifeSection() {
  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={fadeInUp}
      transition={{ duration: 0.6 }}
      className="rounded-3xl border border-zinc-200 bg-white/95 p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900/85 sm:p-8"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.82fr)]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
            Vie de l&apos;eglise
          </p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight text-zinc-900 dark:text-white sm:text-3xl">
            Retrouvez les cultes, les nouvelles et la communaute MegVie Paris.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
            La page d&apos;accueil devient un point de repere pour les visiteurs
            et les membres: horaires, informations pratiques, videos,
            notifications et acces rapide a l&apos;application.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {eventItems.map((item) => {
              const Icon = item.icon

              return (
                <article
                  key={item.label}
                  className="rounded-3xl border border-amber-100 bg-amber-50/70 p-4 dark:border-amber-400/20 dark:bg-amber-400/10"
                >
                  <span className="inline-flex rounded-2xl bg-white p-3 text-amber-700 shadow-sm dark:bg-zinc-950/40 dark:text-amber-100">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-amber-800 dark:text-amber-100">
                    {item.label}
                  </h3>
                  <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    {item.detail}
                  </p>
                </article>
              )
            })}
          </div>

          <div className="mt-6 overflow-hidden rounded-[28px] border border-zinc-200 bg-zinc-950 shadow-xl dark:border-zinc-800">
            <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
              <div className="relative min-h-[260px] bg-zinc-900">
                <Image
                  src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1200&auto=format&fit=crop"
                  alt="Evenement communautaire"
                  fill
                  sizes="(min-width: 1024px) 38vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/25 to-transparent" />
                <p className="absolute bottom-4 left-4 right-4 text-sm font-medium text-white">
                  Les evenements MegVie rassemblent la foi, la famille et le
                  service.
                </p>
              </div>

              <div className="p-5 text-white sm:p-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-zinc-100">
                  <Play className="h-4 w-4 text-amber-200" />
                  Video YouTube
                </div>
                <h3 className="mt-5 text-2xl font-semibold">
                  Regardez les cultes et enseignements.
                </h3>
                <p className="mt-3 text-sm leading-6 text-zinc-300">
                  Integrez ici une video precise de la chaine MegVie Paris
                  quand vous aurez l&apos;identifiant YouTube de la video. Le
                  bouton ouvre deja la chaine officielle.
                </p>
                <div className="mt-5 aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
                  <iframe
                    className="h-full w-full"
                    src="https://www.youtube.com/embed?listType=user_uploads&list=megviepariscs"
                    title="Videos MegVie Paris"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                <Button
                  asChild
                  className="mt-5 rounded-full bg-amber-600 px-6 text-white hover:bg-amber-500"
                >
                  <Link
                    href="https://youtube.com/@megviepariscs?si=LS0xiQMo0DJ6aaf0"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ouvrir YouTube
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-zinc-200 bg-gradient-to-b from-zinc-950 to-zinc-900 p-5 text-white shadow-xl dark:border-zinc-800 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-200">
                App MegVie
              </p>
              <h3 className="mt-2 text-2xl font-semibold">
                Une experience mobile pour rester connecte.
              </h3>
            </div>
            <span className="rounded-2xl bg-white/10 p-3 text-amber-100">
              <Smartphone className="h-6 w-6" />
            </span>
          </div>

          <div className="mx-auto mt-7 max-w-[270px] rounded-[2rem] border border-white/10 bg-black p-3 shadow-2xl">
            <div className="overflow-hidden rounded-[1.55rem] bg-white text-zinc-900">
              <div className="bg-amber-600 px-4 py-5 text-white">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-xs font-black">
                    MVP
                  </span>
                  <Bell className="h-5 w-5" />
                </div>
                <p className="mt-5 text-xs uppercase tracking-[0.2em] text-white/75">
                  Aujourd&apos;hui
                </p>
                <p className="mt-1 text-lg font-semibold">
                  Verset, culte et messages
                </p>
              </div>

              <div className="space-y-3 p-4">
                {["Bible", "Notifications", "Faire un don"].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-6 text-sm leading-6 text-zinc-300">
            L&apos;application peut regrouper les notifications, la Bible, les
            dons, les annonces et les ressources utiles pour la communaute.
          </p>
        </div>
      </div>
    </motion.section>
  )
}
