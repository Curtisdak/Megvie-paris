"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
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
import { BackButton } from "@/components/back-button"
import { Footer } from "@/components/footer"

const contactChannels = [
  {
    label: "WhatsApp",
    description: "Discuter rapidement avec l'equipe.",
    url: "https://wa.me/33123456789",
    icon: MessageCircle,
  },
  {
    label: "YouTube",
    description: "Regarder les cultes et enseignements.",
    url: "https://youtube.com",
    icon: Youtube,
  },
  {
    label: "Facebook",
    description: "Rejoindre la communaute en ligne.",
    url: "https://facebook.com",
    icon: Facebook,
  },
  {
    label: "Email",
    description: "Envoyer un message detaille.",
    url: "mailto:contact@megvieparis.org",
    icon: Mail,
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
  const [isSending, setIsSending] = useState(false)

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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSending(true)

    setTimeout(() => {
      toast.success("Message envoye !", {
        description:
          "Merci de nous avoir contacte. Nous revenons vers vous tres vite.",
      })
      setIsSending(false)
      setFormData(initialFormState)
    }, 900)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-zinc-50 px-4 py-12 text-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <div className="flex justify-start">
          <BackButton />
        </div>
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-[32px] border border-amber-100 bg-gradient-to-br from-amber-100 via-white to-amber-50 p-8 text-zinc-900 shadow-xl dark:border-amber-400/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 dark:text-zinc-50"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-amber-700 dark:text-amber-200">
            Contact
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">
            Parlons ensemble de ce que Dieu prepare pour MegVie Paris.
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-zinc-600 dark:text-zinc-300">
            Besoin de priere, d&apos;informations ou envie de vous impliquer ?
            Notre equipe pastorale et nos benevoles sont disponibles pour vous
            orienter.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Button className="rounded-full bg-amber-600 px-8 text-white hover:bg-amber-500">
              Prendre rendez-vous
            </Button>
            <Button variant="outline" className="rounded-full border-zinc-300">
              Voir les prochains cultes
            </Button>
          </div>
        </motion.section>

        <div className="grid gap-8 md:grid-cols-[1.1fr,0.9fr]">
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 rounded-[32px] border border-amber-100 bg-white/90 p-6 shadow-lg dark:border-amber-400/30 dark:bg-zinc-900/80"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-amber-700 dark:text-amber-200">
                Reseaux & messageries
              </p>
              <h2 className="mt-3 text-2xl font-semibold">
                Choisissez votre canal prefere.
              </h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                Rejoignez-nous pour discuter instantanement, suivre les cultes
                ou nous ecrire en detail.
              </p>
            </div>
            <div className="space-y-4">
              {contactChannels.map((channel) => {
                const Icon = channel.icon
                return (
                  <motion.button
                    key={channel.label}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleChannelClick(channel.url)}
                    className="flex items-center justify-between rounded-3xl border border-amber-100/70 bg-white/80 px-5 py-4 text-left shadow-sm transition hover:border-amber-200 dark:border-amber-400/40 dark:bg-zinc-950/40"
                  >
                    <div>
                      <p className="text-lg font-semibold text-amber-800 dark:text-amber-100">
                        {channel.label}
                      </p>
                      <p className="text-sm text-amber-900/80 dark:text-amber-100/80">
                        {channel.description}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-100 p-2 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200">
                      <Icon className="h-5 w-5" />
                    </span>
                  </motion.button>
                )
              })}
            </div>
            <div className="rounded-3xl border border-zinc-200/60 bg-white/90 p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-300">
              <p className="font-semibold text-zinc-900 dark:text-white">
                Adresse du campus
              </p>
              <p>21 Rue de la Paix, 75002 Paris</p>
              <p>Dimanche · 10h30 & 14h00</p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4 rounded-[32px] border border-zinc-200/70 bg-white/90 p-6 shadow-lg dark:border-zinc-800/70 dark:bg-zinc-900/85"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-amber-100/60 bg-amber-50/60 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
              <PhoneCall className="h-5 w-5 text-amber-600 dark:text-amber-200" />
              <span>
                Laissez-nous vos coordonnees et notre equipe vous recontactera
                tres prochainement.
              </span>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Nom complet</Label>
                  <Input
                    id="contact-name"
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
                <Label htmlFor="contact-message">Message</Label>
                <Textarea
                  id="contact-message"
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
        <Footer />
      </main>
    </div>
  )
}
