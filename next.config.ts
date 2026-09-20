import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  serverExternalPackages: [
    "@neondatabase/serverless",
    "@prisma/adapter-neon",
    "@prisma/client",
    "prisma",
    "ws",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.imagekit.io",
      },
    ],
  },
  outputFileTracingIncludes: {
    "/api/bible/assistant": [
      "./bible/books.json",
      "./bible/translation.json",
      "./bible/verses.search-index.json",
      "./bible/verses.chapter-index.json",
      "./bible/verses.ndjson",
    ],
    "/api/bible/chapter": ["./bible/*.json"],
    "/api/bible/assistant/audio": [
      "./bible/books.json",
      "./bible/translation.json",
      "./bible/verses.search-index.json",
      "./bible/verses.chapter-index.json",
      "./bible/verses.ndjson",
    ],
    "/api/bible/search": ["./bible/*.json"],
    "/bible": [
      "./bible/books.json",
      "./bible/chapters.json",
      "./bible/translation.json",
    ],
  },
}

export default nextConfig
