"use client"

import { Suspense, type FormEvent, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  ChevronDown,
  HeartHandshake,
  Loader2,
  Lock,
  Repeat,
} from "lucide-react"
import { toast } from "sonner"
import { CheckoutStatusListener } from "@/components/checkout-status-listener"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeading } from "@/components/ui/page-heading"
import { useDonationAmount } from "@/hooks/use-donation-amount"
import { createDonationSession } from "@/lib/donation-client"
import { MAX_DONATION, MIN_DONATION } from "@/lib/donation"
import { cn } from "@/lib/utils"

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
  const selectedCategory = categories.find(
    (category) => category.slug === categorySlug,
  )

  async function handleDonationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isProcessing) return
    setIsProcessing(true)
    const loadingToast = toast.loading("Création du paiement sécurisé...")
    try {
      const url = await createDonationSession({
        amount,
        categorySlug,
        frequency,
        donorName,
        donorEmail,
      })
      toast.dismiss(loadingToast)
      window.location.href = url
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error("Impossible d'ouvrir le paiement Stripe.", {
        description:
          error instanceof Error
            ? error.message
            : "Merci de vérifier votre connexion et de réessayer.",
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
      <PageHeading
        eyebrow="Soutenir MegVie Paris"
        title="Faire un don"
        description="Votre générosité fait grandir l'accueil, l'entraide et la vie de notre communauté."
      />
      <form
        onSubmit={handleDonationSubmit}
        aria-busy={isProcessing}
        className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)] lg:gap-12"
      >
        <fieldset disabled={isProcessing} className="min-w-0 space-y-7">
          <legend className="sr-only">Préparer votre don</legend>
          <div
            role="group"
            aria-label="Fréquence du don"
            className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
          >
            {[
              {
                value: "ONE_TIME" as const,
                label: "Don unique",
                icon: HeartHandshake,
              },
              { value: "MONTHLY" as const, label: "Mensuel", icon: Repeat },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-pressed={frequency === value}
                onClick={() => setFrequency(value)}
                className={cn(
                  "flex min-h-11 items-center justify-center gap-2 rounded-md text-sm font-semibold transition",
                  frequency === value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </button>
            ))}
          </div>
          {frequency === "MONTHLY" && (
            <p className="border-l-2 border-teal-500 pl-3 text-sm leading-6 text-muted-foreground">
              Les dons mensuels nécessitent un compte membre actif.{" "}
              <Link
                href="/connexion?next=%2Fdonate"
                className="font-medium text-teal-700 underline dark:text-teal-300"
              >
                Se connecter
              </Link>
            </p>
          )}
          <div className="space-y-4">
            <Label htmlFor="donation-amount">Montant du don</Label>
            <div className="grid grid-cols-4 gap-2">
              {[20, 50, 100, 200].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={amount === value}
                  onClick={() => updateAmount(value)}
                  className={cn(
                    "min-h-12 rounded-lg border text-sm font-semibold transition",
                    amount === value
                      ? "border-teal-700 bg-teal-700 text-white dark:border-teal-600 dark:bg-teal-600"
                      : "border-border bg-card hover:border-teal-500",
                  )}
                >
                  {value} €
                </button>
              ))}
            </div>
            <div className="relative">
              <Input
                id="donation-amount"
                type="number"
                inputMode="decimal"
                min={MIN_DONATION}
                max={MAX_DONATION}
                step="1"
                value={amount}
                onChange={handleManualChange}
                className="h-14 pr-14 text-xl font-semibold"
                required
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                EUR
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              De {MIN_DONATION} à {MAX_DONATION} EUR.
            </p>
          </div>
          <div className="space-y-3">
            <Label htmlFor="donation-category">
              Sélectionnez le type de don de votre choix
            </Label>
            <select
              id="donation-category"
              value={categorySlug}
              onChange={(event) => setCategorySlug(event.target.value)}
              className="h-12 w-full rounded-lg border border-input bg-card px-3 text-base min-[1025px]:text-sm"
            >
              {categories.length ? (
                categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.label}
                  </option>
                ))
              ) : (
                <option value="autre">Autre</option>
              )}
            </select>
            {selectedCategory?.description && (
              <p className="text-sm leading-6 text-muted-foreground">
                {selectedCategory.description}
              </p>
            )}
          </div>
          <details className="group border-y border-border py-4">
            <summary className="flex min-h-11 list-none items-center justify-between gap-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
              Vos coordonnées{" "}
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                Facultatif
              </span>
              <ChevronDown
                className="size-4 transition group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <div className="mt-4 grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="donor-name">Nom complet</Label>
                <Input
                  id="donor-name"
                  name="donorName"
                  autoComplete="name"
                  value={donorName}
                  onChange={(event) => setDonorName(event.target.value)}
                  placeholder="Votre nom"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="donor-email">Email pour le reçu</Label>
                <Input
                  id="donor-email"
                  name="donorEmail"
                  type="email"
                  autoComplete="email"
                  onInvalid={(event) => {
                    const details = event.currentTarget.closest("details")
                    if (details) details.open = true
                  }}
                  value={donorEmail}
                  onChange={(event) => setDonorEmail(event.target.value)}
                  placeholder="vous@exemple.fr"
                />
              </div>
            </div>
          </details>
          <p className="text-xs leading-5 text-muted-foreground">
            Vous pouvez faire un don unique sans compte et sans email.
          </p>
        </fieldset>
        <aside className="min-w-0 lg:sticky lg:top-24">
          <div className="relative mb-5 aspect-[2.6/1] overflow-hidden rounded-lg">
            <Image
              src="/Media/Default-event-04.jpg"
              alt="La communauté réunie pour un culte"
              fill
              sizes="(min-width: 1025px) 400px, 100vw"
              className="object-cover"
            />
          </div>
          <h2 className="text-lg font-semibold">Votre contribution</h2>
          <dl className="mt-4 space-y-3 border-b border-border pb-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Type de don</dt>
              <dd className="text-right font-medium">
                {selectedCategory?.label ?? "Autre"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Fréquence</dt>
              <dd className="font-medium">
                {frequency === "MONTHLY" ? "Mensuel" : "Unique"}
              </dd>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-3 pt-3">
              <dt className="font-medium">Total</dt>
              <dd className="text-3xl font-semibold tabular-nums">
                {formattedAmount}
              </dd>
            </div>
          </dl>
          <Button
            type="submit"
            size="lg"
            className="mt-5 min-h-14 w-full bg-teal-700 text-base text-white hover:bg-teal-800"
            disabled={isProcessing}
            aria-busy={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Ouverture de Stripe...
              </>
            ) : (
              <>
                Donner {formattedAmount}
                <ArrowRight aria-hidden />
              </>
            )}
          </Button>
          <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="size-3.5 shrink-0" aria-hidden />
            Paiement sécurisé par Stripe
          </p>
          <Link
            href="/contact"
            className="mt-5 block py-3 text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Une question sur votre don ?
          </Link>
        </aside>
      </form>
    </>
  )
}
