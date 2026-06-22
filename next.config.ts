import type { NextConfig } from "next"

const nextConfig: NextConfig = {
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
    ],
  },
  outputFileTracingIncludes: {
    "/api/bible/chapter": ["./bible/*.json"],
    "/api/bible/search": ["./bible/*.json"],
    "/bible": [
      "./bible/books.json",
      "./bible/chapters.json",
      "./bible/translation.json",
    ],
  },
}

export default nextConfig
