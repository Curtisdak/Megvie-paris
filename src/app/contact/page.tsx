"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import {
  ArrowUpRight,
  Clock3,
  Facebook,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Send,
  Youtube,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PageHeading } from "@/components/ui/page-heading"
import { createContactMessageAction } from "@/lib/admin/actions"

const channels = [
  {
    label: "WhatsApp",
    detail: "+33 6 26 96 92 65",
    href: "https://wa.me/33626969265",
    icon: MessageCircle,
  },
  {
    label: "Email",
    detail: "megvieparis2024@gmail.com",
    href: "mailto:megvieparis2024@gmail.com",
    icon: Mail,
  },
  {
    label: "YouTube",
    detail: "Cultes et enseignements",
    href: "https://youtube.com/@megviepariscs?si=LS0xiQMo0DJ6aaf0",
    icon: Youtube,
  },
  {
    label: "Facebook",
    detail: "La vie de notre communauté",
    href: "https://www.facebook.com/share/18SHZxpsW4/?mibextid=wwXIfr",
    icon: Facebook,
  },
]

export default function ContactPage() {
  const [fields, setFields] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  })
  const updateField = (name: keyof typeof fields, value: string) =>
    setFields((current) => ({ ...current, [name]: value }))
  const [state, formAction, isSending] = useActionState(
    createContactMessageAction,
    { ok: false, message: "" },
  )
  useEffect(() => {
    if (state.message) (state.ok ? toast.success : toast.error)(state.message)
  }, [state])

  return (
    <div className="app-page">
      <main className="mx-auto max-w-5xl space-y-8">
        <PageHeading
          eyebrow="MegVie Paris"
          title="Parlons ensemble"
          description="Une question, un besoin de prière ou simplement envie de nous rencontrer ? Nous sommes à votre écoute."
        />
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-12">
          <section className="min-w-0">
            <h2 className="text-lg font-semibold">Envoyer un message</h2>
            <form action={formAction} className="mt-5 space-y-4">
              <input
                type="hidden"
                name="subject"
                value="Message depuis la page contact"
              />
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
              />
              <fieldset disabled={isSending} className="space-y-4">
                <legend className="sr-only">
                  Vos coordonnées et votre message
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Nom complet</Label>
                    <Input
                      id="contact-name"
                      name="name"
                      autoComplete="name"
                      value={fields.name}
                      onChange={(event) =>
                        updateField("name", event.target.value)
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
                      autoComplete="email"
                      value={fields.email}
                      onChange={(event) =>
                        updateField("email", event.target.value)
                      }
                      placeholder="vous@exemple.fr"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">Téléphone</Label>
                    <Input
                      id="contact-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={fields.phone}
                      onChange={(event) =>
                        updateField("phone", event.target.value)
                      }
                      placeholder="+33 6 12 34 56 78"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-confidentiality">
                      Type de message
                    </Label>
                    <select
                      id="contact-confidentiality"
                      name="confidentiality"
                      className="h-11 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-base min-[1025px]:text-sm"
                      defaultValue="GENERAL"
                    >
                      <option value="GENERAL">Question générale</option>
                      <option value="PASTORAL_CONFIDENTIAL">
                        Pastoral confidentiel
                      </option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-message">Votre message</Label>
                  <Textarea
                    id="contact-message"
                    name="message"
                    value={fields.message}
                    onChange={(event) =>
                      updateField("message", event.target.value)
                    }
                    placeholder="Votre question ou votre demande de prière..."
                    required
                    rows={6}
                  />
                </div>
                {state.message && (
                  <p
                    role={state.ok ? "status" : "alert"}
                    className={
                      state.ok
                        ? "text-sm text-teal-700 dark:text-teal-300"
                        : "text-sm text-red-600 dark:text-red-400"
                    }
                  >
                    {state.message}
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full bg-teal-700 text-white hover:bg-teal-800 sm:w-auto"
                  disabled={isSending}
                  aria-busy={isSending}
                >
                  {isSending ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : (
                    <Send aria-hidden />
                  )}
                  {isSending ? "Envoi en cours..." : "Envoyer le message"}
                </Button>
              </fieldset>
            </form>
          </section>
          <aside className="min-w-0 space-y-7 border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <section>
              <h2 className="text-lg font-semibold">Nous retrouver</h2>
              <a
                href="https://www.google.com/maps/search/?api=1&query=4+rue+de+Chanzy+94170+Le+Perreux-sur-Marne"
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-start gap-3 rounded-lg py-2 text-sm text-muted-foreground hover:text-teal-700"
              >
                <MapPin
                  className="mt-0.5 size-5 shrink-0 text-teal-600"
                  aria-hidden
                />
                <span>
                  4 rue de Chanzy
                  <br />
                  94170 Le Perreux-sur-Marne
                </span>
                <ArrowUpRight className="ml-auto size-4 shrink-0" aria-hidden />
              </a>
              <p className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                <Clock3 className="size-5 text-teal-600" aria-hidden />
                Dimanche · 14:30 à 16:30
              </p>
            </section>
            <section>
              <h2 className="mb-3 text-sm font-semibold">Restons en contact</h2>
              <div className="divide-y divide-border">
                {channels.map(({ label, detail, href, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith("https:") ? "_blank" : undefined}
                    rel={href.startsWith("https:") ? "noreferrer" : undefined}
                    className="group flex items-center gap-3 py-4"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground transition group-hover:bg-teal-50 group-hover:text-teal-700 dark:group-hover:bg-teal-400/10 dark:group-hover:text-teal-300">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{label}</span>
                      <span className="mt-1 block break-words text-xs text-muted-foreground">
                        {detail}
                      </span>
                    </span>
                    <ArrowUpRight
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  </a>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}
