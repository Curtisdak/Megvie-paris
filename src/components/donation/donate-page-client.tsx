"use client"

import { Suspense, type FormEvent, useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight,
  BadgeCheck,
  HandCoins,
  HeartHandshake,
  Lock,
  Mail,
  ReceiptText,
  Repeat,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"
import { CheckoutStatusListener } from "@/components/checkout-status-listener"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDonationAmount } from "@/hooks/use-donation-amount"
import { createDonationSession } from "@/lib/donation-client"
import { MAX_DONATION, MIN_DONATION } from "@/lib/donation"
import { cn } from "@/lib/utils"

const frequencyOptions = [
  {
    value: "ONE_TIME" as const,
    label: "Don unique",
    description: "Un soutien ponctuel, simple et securise.",
    icon: HeartHandshake,
  },
  {
    value: "MONTHLY" as const,
    label: "Mensuel",
    description: "Un engagement regulier pour les membres actifs.",
    icon: Repeat,
  },
]

const suggestedAmounts = [20, 50, 100, 200]

const impactItems = [
  "Accueil, priere et accompagnement des familles.",
  "Cultes, enseignements et actions communautaires.",
  "Soutien concret aux projets et besoins de l'eglise.",
]

const trustItems = [
  {
    label: "Paiement Stripe",
    description: "Vos donnees bancaires restent chez Stripe.",
    icon: ShieldCheck,
  },
  {
    label: "Recapitulatif clair",
    description: "Montant, categorie et frequence avant paiement.",
    icon: ReceiptText,
  },
  {
    label: "Suivi finance",
    description: "Le don est ajoute au registre apres confirmation.",
    icon: BadgeCheck,
  },
]

type DonationCategoryOption = {
  id: string
  slug: string
  label: string
  description: string | null
}

export function DonatePageClient({
  categories,
}: {
  categories: DonationCategoryOption[]
}) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [frequency, setFrequency] = useState<"ONE_TIME" | "MONTHLY">("ONE_TIME")
  const [categorySlug, setCategorySlug] = useState(
    categories[0]?.slug ?? "autre",
  )
  const [donorName, setDonorName] = useState("")
  const [donorEmail, setDonorEmail] = useState("")
  const { amount, formattedAmount, updateAmount, handleManualChange } =
    useDonationAmount(50)

  const selectedCategory = useMemo(
    () => categories.find((category) => category.slug === categorySlug),
    [categories, categorySlug],
  )

  const progress = Math.round(
    ((amount - MIN_DONATION) / (MAX_DONATION - MIN_DONATION)) * 100,
  )

  const handleDonationSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsProcessing(true)
    const loadingToast = toast.loading("Creation du paiement Stripe...")

    try {
      const url = await createDonationSession({
        amount,
        categorySlug,
        frequency,
        donorName,
        donorEmail,
      })
      toast.dismiss(loadingToast)
      toast.success("Redirection vers Stripe...")
      window.location.href = url
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Merci de verifier votre connexion et de reessayer."

      toast.dismiss(loadingToast)
      toast.error("Impossible d'ouvrir le paiement Stripe.", {
        description: message,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <Suspense fallback={null}>
        <CheckoutStatusListener />
      </Suspense>

      <section className="overflow-hidden border border-zinc-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-zinc-950 sm:rounded-[2rem]">
        <div className="grid min-h-[calc(100svh-7rem)] lg:grid-cols-[0.9fr_1.1fr]">
          <motion.aside
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="relative isolate flex min-h-[360px] flex-col justify-between overflow-hidden bg-zinc-950 p-5 text-white sm:p-8 lg:min-h-full"
          >
            <div
              aria-hidden
              className="absolute inset-0 -z-20 bg-cover bg-center opacity-55"
              style={{
                backgroundImage: "url('/Media/Default-event-04.jpg')",
              }}
            />
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-[linear-gradient(110deg,rgba(0,0,0,0.9)_0%,rgba(13,13,13,0.76)_42%,rgba(234,88,12,0.58)_100%)]"
            />

            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold uppercase text-amber-100 backdrop-blur">
                <Sparkles className="h-4 w-4" aria-hidden />
                Soutenir MegVie Paris
              </span>
              <h1 className="mt-6 max-w-lg text-4xl font-black leading-[0.96] text-white sm:text-6xl lg:text-7xl">
                Donner avec clarte et confiance.
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-white/78 sm:text-lg">
                Votre generosite aide MegVie Paris a accueillir, accompagner et
                servir la communaute avec fidelite.
              </p>
            </div>

            <div className="mt-8 space-y-3">
              {impactItems.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 + index * 0.08, duration: 0.35 }}
                  className="flex items-start gap-3 rounded-2xl border border-white/12 bg-black/25 p-3 text-sm leading-5 text-white/86 backdrop-blur"
                >
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400 text-zinc-950">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  {item}
                </motion.div>
              ))}
            </div>
          </motion.aside>

          <form
            onSubmit={handleDonationSubmit}
            className="grid gap-5 p-4 sm:p-6 lg:p-8"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-amber-700 dark:text-amber-300">
                  Don securise
                </p>
                <h2 className="mt-1 text-2xl font-bold text-zinc-950 dark:text-white sm:text-3xl">
                  Preparez votre don.
                </h2>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
                <Lock className="h-4 w-4" aria-hidden />
                Aucune carte stockee
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/[0.035] sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Label htmlFor="donation-amount" className="text-sm">
                    Montant
                  </Label>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Choisissez un montant ou saisissez-le librement.
                  </p>
                </div>
                <p className="text-3xl font-black text-zinc-950 dark:text-white">
                  {formattedAmount}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-4 gap-2">
                {suggestedAmounts.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateAmount(value)}
                    className={cn(
                      "h-11 rounded-full border text-sm font-semibold transition",
                      amount === value
                        ? "border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-500/20"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-amber-300 hover:text-amber-700 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200",
                    )}
                  >
                    {value} EUR
                  </button>
                ))}
              </div>

              <input
                id="donation-amount"
                type="range"
                min={MIN_DONATION}
                max={MAX_DONATION}
                value={amount}
                onChange={(event) => updateAmount(Number(event.target.value))}
                className="mt-6 h-2 w-full cursor-pointer appearance-none rounded-full accent-amber-600"
                style={{
                  background: `linear-gradient(90deg, #f59e0b 0%, #f59e0b ${progress}%, rgba(113,113,122,0.25) ${progress}%, rgba(113,113,122,0.25) 100%)`,
                }}
                aria-label="Choisir le montant du don"
              />

              <div className="mt-4 flex items-center gap-3">
                <Input
                  type="number"
                  min={MIN_DONATION}
                  max={MAX_DONATION}
                  value={amount}
                  onChange={handleManualChange}
                  className="h-12 rounded-2xl bg-white text-base font-semibold dark:bg-zinc-950"
                  aria-label="Montant du don en euros"
                />
                <span className="rounded-full bg-zinc-900 px-3 py-2 text-xs font-bold text-white dark:bg-white dark:text-zinc-950">
                  EUR
                </span>
              </div>
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                Entre {MIN_DONATION} EUR et {MAX_DONATION} EUR par transaction.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {frequencyOptions.map((item) => {
                const Icon = item.icon
                const active = frequency === item.value

                return (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFrequency(item.value)}
                    className={cn(
                      "flex min-h-24 items-start gap-3 rounded-[1.25rem] border p-4 text-left transition",
                      active
                        ? "border-zinc-950 bg-zinc-950 text-white shadow-lg shadow-zinc-950/10 dark:border-white dark:bg-white dark:text-zinc-950"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-amber-300 dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-200",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                        active
                          ? "bg-amber-500 text-white"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-100",
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span>
                      <span className="block font-semibold">{item.label}</span>
                      <span className="mt-1 block text-sm leading-5 opacity-75">
                        {item.description}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            {frequency === "MONTHLY" ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100">
                Les dons mensuels necessitent un compte membre actif. Vous
                pourrez les gerer depuis votre espace membre.
              </div>
            ) : null}

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-zinc-950 dark:text-white">
                Sélectionnez le type de don de votre choix
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {categories.map((category) => {
                  const active = category.slug === categorySlug

                  return (
                    <button
                      key={category.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setCategorySlug(category.slug)}
                      className={cn(
                        "rounded-2xl border p-3 text-left transition",
                        active
                          ? "border-amber-500 bg-amber-50 text-amber-950 shadow-sm dark:border-amber-300 dark:bg-amber-400/15 dark:text-amber-50"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-amber-300 dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-200",
                      )}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <HandCoins className="h-4 w-4 text-amber-600" />
                        {category.label}
                      </span>
                      {category.description ? (
                        <span className="mt-1 block text-xs leading-5 opacity-70">
                          {category.description}
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="donor-name">Nom complet</Label>
                <div className="relative mt-2">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    id="donor-name"
                    value={donorName}
                    onChange={(event) => setDonorName(event.target.value)}
                    placeholder="Votre nom"
                    required
                    className="h-12 rounded-2xl bg-white pl-11 dark:bg-zinc-950"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="donor-email">Email pour le recu</Label>
                <div className="relative mt-2">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    id="donor-email"
                    type="email"
                    value={donorEmail}
                    onChange={(event) => setDonorEmail(event.target.value)}
                    placeholder="vous@example.com"
                    required
                    className="h-12 rounded-2xl bg-white pl-11 dark:bg-zinc-950"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_0.8fr]">
              <div className="rounded-[1.35rem] border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.035]">
                <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                  Recapitulatif
                </p>
                <div className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                  <div className="flex items-center justify-between gap-3">
                    <span>Montant</span>
                    <strong className="text-zinc-950 dark:text-white">
                      {formattedAmount}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Frequence</span>
                    <strong className="text-zinc-950 dark:text-white">
                      {frequency === "MONTHLY" ? "Mensuel" : "Unique"}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Categorie</span>
                    <strong className="text-right text-zinc-950 dark:text-white">
                      {selectedCategory?.label ?? "Autre"}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                {trustItems.map((item) => {
                  const Icon = item.icon

                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/[0.035]"
                    >
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-100">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">
                          {item.label}
                        </span>
                        <span className="block text-xs leading-4 text-zinc-500 dark:text-zinc-400">
                          {item.description}
                        </span>
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="sticky bottom-3 z-30 flex flex-col gap-3 rounded-[1.35rem] border border-zinc-200 bg-white/95 p-3 shadow-2xl shadow-zinc-950/10 backdrop-blur dark:border-white/10 dark:bg-zinc-950/95 dark:shadow-black/40 sm:static sm:flex-row sm:border-t sm:bg-transparent sm:p-0 sm:pt-4 sm:shadow-none sm:backdrop-blur-0 dark:sm:bg-transparent">
              <Button
                type="submit"
                size="lg"
                className="h-14 flex-1 rounded-full bg-gradient-to-r from-orange-600 to-amber-500 px-6 text-base font-black text-white shadow-xl shadow-orange-600/25 hover:from-orange-500 hover:to-amber-400 focus-visible:ring-orange-500/40 dark:text-white"
                disabled={isProcessing}
                aria-busy={isProcessing}
              >
                {isProcessing ? (
                  "Ouverture de Stripe..."
                ) : (
                  <>
                    Donner {formattedAmount}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </>
                )}
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-zinc-300 bg-white px-6 text-base dark:border-white/10 dark:bg-zinc-950"
              >
                <Link href="/contact">
                  <Mail className="h-4 w-4" aria-hidden />
                  Question
                </Link>
              </Button>
            </div>
          </form>
        </div>
      </section>
    </>
  )
}
