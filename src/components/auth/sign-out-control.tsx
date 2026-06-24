"use client"

import { SignOutButton } from "@clerk/nextjs"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SignOutControl() {
  return (
    <SignOutButton redirectUrl="/connexion">
      <Button variant="outline" className="rounded-full border-zinc-300">
        <LogOut className="h-4 w-4" />
        Deconnexion
      </Button>
    </SignOutButton>
  )
}
