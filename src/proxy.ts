import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/bienvenue(.*)",
  "/espace-membre(.*)",
  "/api/admin(.*)",
  "/api/member(.*)",
])

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    const authState = await auth()

    if (!authState.userId && !request.nextUrl.pathname.startsWith("/api/")) {
      const signInUrl = new URL("/connexion", request.url)
      const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`
      signInUrl.searchParams.set("next", nextPath)

      return NextResponse.redirect(signInUrl)
    }

    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/(api|trpc)(.*)",
  ],
}
