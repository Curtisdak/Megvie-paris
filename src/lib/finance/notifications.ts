import "server-only"

import { createPersonalNotification } from "@/lib/notifications/service"

export async function createDonationSuccessNotification(input: {
  userId: string | null
  donationId: string
}) {
  if (!input.userId) return null

  return createPersonalNotification({
    userId: input.userId,
    title: "Merci pour votre generosite",
    body: "Votre confirmation de don est disponible dans votre espace membre.",
    targetUrl: "/espace-membre/dons",
    sourceType: "donation",
    sourceId: input.donationId,
    dedupeKey: `donation-success:${input.donationId}`,
  })
}

export async function createDonationFailureNotification(input: {
  userId: string | null
  donationId: string
}) {
  if (!input.userId) return null

  return createPersonalNotification({
    userId: input.userId,
    title: "Paiement mensuel non confirme",
    body: "Stripe n'a pas pu confirmer un paiement mensuel. Vous pouvez verifier votre don mensuel depuis votre espace membre.",
    targetUrl: "/espace-membre/dons",
    sourceType: "donation",
    sourceId: input.donationId,
    dedupeKey: `donation-failed:${input.donationId}`,
  })
}

export async function createDirectDonationRecordedNotification(input: {
  userId: string | null
  donationId: string
}) {
  if (!input.userId) return null

  return createPersonalNotification({
    userId: input.userId,
    title: "Don direct enregistre",
    body: "Un don direct a ete ajoute a votre historique MegVie Paris.",
    targetUrl: "/espace-membre/dons",
    sourceType: "donation",
    sourceId: input.donationId,
    dedupeKey: `direct-donation-recorded:${input.donationId}`,
  })
}

export async function createDirectDonationVerifiedNotification(input: {
  userId: string | null
  donationId: string
}) {
  if (!input.userId) return null

  return createPersonalNotification({
    userId: input.userId,
    title: "Don direct verifie",
    body: "Votre don direct est maintenant verifie dans votre historique.",
    targetUrl: "/espace-membre/dons",
    sourceType: "donation",
    sourceId: input.donationId,
    dedupeKey: `direct-donation-verified:${input.donationId}`,
  })
}

export async function createDirectDonationCorrectionNotification(input: {
  userId: string | null
  donationId: string
}) {
  if (!input.userId) return null

  return createPersonalNotification({
    userId: input.userId,
    title: "Historique de don mis a jour",
    body: "Une correction est disponible dans votre historique de dons.",
    targetUrl: "/espace-membre/dons",
    sourceType: "donation",
    sourceId: input.donationId,
    dedupeKey: `direct-donation-correction:${input.donationId}`,
  })
}
