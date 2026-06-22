import "dotenv/config"

import { neonConfig } from "@neondatabase/serverless"
import { PrismaNeon } from "@prisma/adapter-neon"
import { PrismaClient } from "../src/generated/prisma/client"
import WebSocket from "ws"

neonConfig.webSocketConstructor = WebSocket

const databaseUrl = process.env.DATABASE_URL?.trim()

if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL.")
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: databaseUrl }),
})

const seedVerses = [
  {
    dayOfYear: 1,
    reference: "Psaume 118:24",
    text: "C'est ici la journee que l'Eternel a faite: qu'elle soit pour nous un sujet d'allegresse et de joie.",
    translation: "Louis Segond 1910",
    theme: "Joie",
  },
  {
    dayOfYear: 2,
    reference: "Jean 14:27",
    text: "Je vous laisse la paix, je vous donne ma paix.",
    translation: "Louis Segond 1910",
    theme: "Paix",
  },
  {
    dayOfYear: 3,
    reference: "Philippiens 4:13",
    text: "Je puis tout par celui qui me fortifie.",
    translation: "Louis Segond 1910",
    theme: "Force",
  },
  {
    dayOfYear: 4,
    reference: "Psaume 23:1",
    text: "L'Eternel est mon berger: je ne manquerai de rien.",
    translation: "Louis Segond 1910",
    theme: "Confiance",
  },
  {
    dayOfYear: 5,
    reference: "Romains 8:31",
    text: "Si Dieu est pour nous, qui sera contre nous?",
    translation: "Louis Segond 1910",
    theme: "Assurance",
  },
  {
    dayOfYear: 6,
    reference: "Esaie 41:10",
    text: "Ne crains rien, car je suis avec toi.",
    translation: "Louis Segond 1910",
    theme: "Courage",
  },
  {
    dayOfYear: 7,
    reference: "Matthieu 5:14",
    text: "Vous etes la lumiere du monde.",
    translation: "Louis Segond 1910",
    theme: "Temoignage",
  },
]

async function main() {
  await prisma.churchSetting.upsert({
    where: { id: "default" },
    update: {
      churchName: "MegVie Paris",
      shortName: "MVP",
      timezone: "Europe/Paris",
      memberIdPrefix: "Mv",
      memberIdSuffix: "P",
    },
    create: {
      id: "default",
      churchName: "MegVie Paris",
      shortName: "MVP",
      timezone: "Europe/Paris",
      memberIdPrefix: "Mv",
      memberIdSuffix: "P",
    },
  })

  for (const verse of seedVerses) {
    await prisma.dailyBibleVerse.upsert({
      where: { dayOfYear: verse.dayOfYear },
      update: verse,
      create: verse,
    })
  }
}

main()
  .catch((error) => {
    console.error("Seed failed", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
