import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://megvieparis.com/sitemap.xml",
    host: "https://megvieparis.com",
  }
}
