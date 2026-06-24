import type { Metadata, Viewport } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { frFR } from "@clerk/localizations"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { PwaProvider } from "@/components/pwa/pwa-provider"
import { AppChrome } from "@/components/navigation/app-chrome"

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

const clerkAppearance = {
  variables: {
    colorPrimary: "#d97706",
    colorBackground: "#ffffff",
    colorText: "#18181b",
    colorTextSecondary: "#52525b",
    colorInputBackground: "#ffffff",
    colorInputText: "#18181b",
    borderRadius: "1rem",
    fontFamily: "var(--font-geist-sans)",
  },
  elements: {
    cardBox:
      "rounded-[1.75rem] border border-zinc-200 bg-white shadow-xl shadow-zinc-950/10 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/30",
    card: "bg-transparent shadow-none",
    headerTitle: "text-zinc-950 dark:text-white",
    headerSubtitle: "text-zinc-600 dark:text-zinc-300",
    socialButtonsBlockButton:
      "rounded-2xl border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800",
    formFieldInput:
      "rounded-2xl border-zinc-200 bg-white text-zinc-950 focus:border-amber-500 focus:ring-amber-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white",
    formButtonPrimary:
      "rounded-full bg-amber-600 text-white shadow-lg shadow-amber-700/20 hover:bg-amber-500",
    footerActionLink: "text-amber-700 hover:text-amber-600 dark:text-amber-300",
    identityPreviewEditButton: "text-amber-700 dark:text-amber-300",
    userProfileSectionPrimaryButton:
      "rounded-full bg-amber-600 text-white hover:bg-amber-500",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider localization={frFR} appearance={clerkAppearance}>
          <ThemeProvider defaultTheme="system">
            <PwaProvider />
            <AppChrome />
            {children}
            <Toaster position="top-center" expand richColors />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
