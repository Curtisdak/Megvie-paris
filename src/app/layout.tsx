import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { PwaProvider } from "@/components/pwa/pwa-provider"
import { InstallAppDialog } from "@/components/pwa/install-app-dialog"
import { FloatingInstallButton } from "@/components/pwa/floating-install-button"
import { AppNavigation } from "@/components/navigation/app-navigation"
import { AppHeader } from "@/components/navigation/app-header"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  applicationName: "MegVie Paris",
  title: {
    default: "MegVie Paris",
    template: "%s - MegVie Paris",
  },
  description:
    "Eglise MegVie Paris - cultes, communaute, dons et verset du jour.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MegVie",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    title: "MegVie Paris",
    description:
      "Cultes, communaute, dons et verset du jour avec MegVie Paris.",
    siteName: "MegVie Paris",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff7ed" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <PwaProvider />
          <InstallAppDialog autoOpen />
          <AppHeader />
          {children}
          <AppNavigation />
          <FloatingInstallButton />
          <Toaster position="top-center" expand richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
