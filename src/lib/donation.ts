import type { StaticImageData } from "next/image"
import pictureBlay from "../../public/Media/Blé.jpeg"
import pictureReverend from "../../public/Media/Christian Kodja.jpeg"
import picturePrisca from "../../public/Media/Prisca Kodja.jpeg"
import pictureYao from "../../public/Media/yao.jpg"

export type Leader = {
  name: string
  role: string
  image: StaticImageData
}

export const MIN_DONATION = 5
export const MAX_DONATION = 5000

export const donationHighlights = [
  "Chaque don soutient des repas solidaires et des actions sociales.",
  "Un recu officiel vous est envoye pour vos declarations fiscales.",
  "Votre generosite fait rayonner l'eglise MegVie Paris dans la ville.",
]

export const heroStats = [
  { label: "Familles accompagnees", value: "8+" },
  { label: "Benevoles engages", value: "10" },
  { label: "Ans de ministere", value: "20" },
]

export const leaders: Leader[] = [
  {
    name: "Christian Kodja",
    role: "Reverend",
    image: pictureReverend,
  },
  {
    name: "Adrien Yao",
    role: "Pasteur principal",
    image: pictureYao,
  },
  {
    name: "Blay",
    role: "Prophete",
    image: pictureBlay,
  },
  {
    name: "Prisca Kodja",
    role: "Pasteur",
    image: picturePrisca,
  },
]
