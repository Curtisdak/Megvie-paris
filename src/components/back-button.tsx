"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function BackButton() {
  const router = useRouter()

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push("/")
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-full"
      onClick={handleBack}
    >
      <ArrowLeft className="mr-1 h-4 w-4" />
      Retour
    </Button>
  )
}
