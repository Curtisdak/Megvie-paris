"use client"

import { useActionState, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  ArrowUpRight,
  Facebook,
  Mail,
  MessageCircle,
  PhoneCall,
  Youtube,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createContactMessageAction } from "@/lib/admin/actions"

const contactChannels = [
  {
    label: "WhatsApp",
    description: "Ecrivez-nous directement sur WhatsApp.",
    detail: "+33 6 26 96 92 65",
    url: "https://wa.me/33626969265",
    icon: MessageCircle,
  },
  {
    label: "YouTube",
    description: "Regardez les cultes et les enseignements.",
    detail: "youtube.com/@megviepariscs",
    url: "https://youtube.com/@megviepariscs?si=LS0xiQMo0DJ6aaf0",
    icon: Youtube,
  },
  {
    label: "Facebook",
    description: "Suivez la communaute MegVie Paris.",
    detail: "facebook.com/share/18SHZxpsW4",
    url: "https://www.facebook.com/share/18SHZxpsW4/?mibextid=wwXIfr",
    icon: Facebook,
  },
  {
    label: "Email",
    description: "Envoyez-nous un message detaille.",
    detail: "megvieparis2024@gmail.com",
    url: "mailto:megvieparis2024@gmail.com",
    icon: Mail,
  },
]

const contactHighlights = [
  {
    label: "WhatsApp",
    value: "Reponse rapide",
  },
  {
    label: "Email",
    value: "Message detaille",
  },
  {
    label: "Dimanche",
    value: "14:30-16:30",
  },
]

const initialFormState = {
  name: "",
  email: "",
  phone: "",
  message: "",
}

export default function ContactPage() {
  const [formData, setFormData] = useState(initialFormState)
  const [state, formAction, isSending] = useActionState(
    createContactMessageAction,
    { ok: false, message: "" },
  )

  useEffect(() => {
    if (!state.message) return

    if (state.ok) {
      toast.success("Message enregistre", {
        description: state.message,
      })
    } else {
      toast.error("Message non envoye", {
        description: state.message,
      })
    }
  }, [state])

  const handleChannelClick = (url: string) => {
    if (typeof window === "undefined") return
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const handleChange = (
    field: keyof typeof initialFormState,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="app-edge-to-edge min-h-screen bg-gradient-to-b from-amber-50 via-white to-zinc-50 py-5 text-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 dark:text-zinc-50 sm:py-12">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-10">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-[28px] border border-amber-100 bg-gradient-to-br from-amber-100 via-white to-amber-50 p-5 text-zinc-900 shadow-xl dark:border-amber-400/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 dark:text-zinc-50 sm:rounded-[32px] sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-amber-700 dark:text-amber-200">
            Contact
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
            Parlons ensemble de ce que Dieu prepare pour MegVie Paris.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300 sm:text-lg">
            Besoin de priere, d&apos;informations ou envie de vous impliquer ?
            Notre equipe pastorale et nos benevoles sont disponibles pour vous
            orienter.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <Button
              className="rounded-full bg-amber-600 px-8 text-white hover:bg-amber-500"
              onClick={() => handleChannelClick("https://wa.me/33626969265")}
            >
              Prendre rendez-vous
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-zinc-300"
              onClick={() =>
                handleChannelClick(
                  "https://youtube.com/@megviepariscs?si=LS0xiQMo0DJ6aaf0",
                )
              }
            >
              Voir les cultes
            </Button>
          </div>
        </motion.section>

        <div className="grid gap-8 md:grid-cols-[1.1fr,0.9fr]">
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-5 rounded-[28px] border border-amber-100 bg-white/90 p-5 shadow-lg dark:border-amber-400/30 dark:bg-zinc-900/80 sm:space-y-6 sm:rounded-[32px] sm:p-6"
          >
            <div
              id="reseaux"
              className="rounded-[24px] border border-amber-100 bg-amber-50/70 p-4 dark:border-amber-400/20 dark:bg-amber-400/10 sm:rounded-[28px] sm:p-6"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-amber-700 dark:text-amber-200">
                    Reseaux & messageries
                  </p>
                  <h2 className="mt-3 text-xl font-semibold text-zinc-900 dark:text-white sm:text-2xl">
                    Choisissez le moyen le plus simple pour nous joindre.
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    Contactez-nous rapidement sur WhatsApp, suivez les cultes
                    en ligne ou envoyez-nous un message detaille.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[320px]">
                  {contactHighlights.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-sm shadow-sm dark:border-white/10 dark:bg-zinc-950/40"
                    >
                      <p className="font-semibold text-zinc-900 dark:text-white">
                        {item.label}
                      </p>
                      <p className="mt-1 text-zinc-600 dark:text-zinc-300">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {contactChannels.map((channel) => {
                const Icon = channel.icon
                return (
                  <motion.button
                    key={channel.label}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleChannelClick(channel.url)}
                    className="flex h-full flex-col items-start justify-between gap-4 rounded-3xl border border-amber-100/70 bg-white/80 px-5 py-5 text-left shadow-sm transition hover:border-amber-200 hover:shadow-md dark:border-amber-400/40 dark:bg-zinc-950/40"
                  >
                    <div className="flex w-full items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-lg font-semibold text-amber-800 dark:text-amber-100">
                          {channel.label}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-amber-900/80 dark:text-amber-100/80">
                          {channel.description}
                        </p>
                        <p className="mt-2 break-words text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          {channel.detail}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-amber-100 p-2 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200">
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-200">
                      Ouvrir
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </motion.button>
                )
              })}
            </div>
            <div className="rounded-3xl border border-zinc-200/60 bg-white/90 p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-300">
              <p className="font-semibold text-zinc-900 dark:text-white">
                Adresse du campus
              </p>
              <p>4 rue de Chanzy, 94170 Le Perreux-sur-Marne</p>
              <p>Dimanche - 14:30-16:30</p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4 rounded-[28px] border border-zinc-200/70 bg-white/90 p-5 shadow-lg dark:border-zinc-800/70 dark:bg-zinc-900/85 sm:rounded-[32px] sm:p-6"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-amber-100/60 bg-amber-50/60 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
              <PhoneCall className="h-5 w-5 text-amber-600 dark:text-amber-200" />
              <span>
                Laissez-nous vos coordonnees et notre equipe vous recontactera
                tres prochainement.
              </span>
            </div>
            <form className="space-y-4" action={formAction}>
              <input type="hidden" name="subject" value="Message depuis la page contact" />
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Nom complet</Label>
                  <Input
                    id="contact-name"
                    name="name"
                    value={formData.name}
                    onChange={(event) =>
                      handleChange("name", event.target.value)
                    }
                    placeholder="Votre nom"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email</Label>
                  <Input
                    id="contact-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(event) =>
                      handleChange("email", event.target.value)
                    }
                    placeholder="nom@email.com"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Numero</Label>
                <Input
                  id="contact-phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(event) =>
                    handleChange("phone", event.target.value)
                  }
                  placeholder="+33 6 12 34 56 78"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-confidentiality">Type de message</Label>
                <select
                  id="contact-confidentiality"
                  name="confidentiality"
                  className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  defaultValue="GENERAL"
                >
                  <option value="GENERAL">Question generale</option>
                  <option value="PASTORAL_CONFIDENTIAL">
                    Message pastoral confidentiel
                  </option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-message">Message</Label>
                <Textarea
                  id="contact-message"
                  name="message"
                  value={formData.message}
                  onChange={(event) =>
                    handleChange("message", event.target.value)
                  }
                  placeholder="Partagez votre besoin de priere ou votre question..."
                  required
                  rows={5}
                />
              </div>
              <Button
                type="submit"
                className="w-full rounded-full bg-amber-600 px-8 text-white shadow-md transition hover:bg-amber-500"
                disabled={isSending}
                aria-busy={isSending}
              >
                {isSending ? "Envoi..." : "Envoyer le message"}
              </Button>
            </form>
          </motion.section>
        </div>
      </main>
    </div>
  )
}
