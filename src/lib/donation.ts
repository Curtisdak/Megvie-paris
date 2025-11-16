export type Leader = {
  name: string
  role: string
  image: string
}

export const MIN_DONATION = 5
export const MAX_DONATION = 5000

export const donationHighlights = [
  "Chaque don soutient des repas solidaires et des actions sociales.",
  "Un recu officiel vous est envoye pour vos declarations fiscales.",
  "Votre generosite fait rayonner l&apos;eglise MegVie Paris dans la ville.",
]

export const heroStats = [
  { label: "Familles accompagnees", value: "250+" },
  { label: "Benevoles engages", value: "120" },
  { label: "Ans de ministere", value: "18" },
]

export const leaders: Leader[] = [
  {
    name: "Pasteur David M.",
    role: "Pasteur principal",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Sarah L.",
    role: "Responsable louange",
    image:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Joel A.",
    role: "Directeur jeunesse",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
  },
]
