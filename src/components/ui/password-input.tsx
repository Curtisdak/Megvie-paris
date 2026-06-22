"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

function PasswordInput({
  className,
  id,
  ...props
}: React.ComponentProps<"input">) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        id={id}
        type={isVisible ? "text" : "password"}
        className={cn("pr-12", className)}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={
          isVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"
        }
        aria-controls={id}
        aria-pressed={isVisible}
        className="absolute right-1.5 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
        onClick={() => setIsVisible((current) => !current)}
      >
        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  )
}

export { PasswordInput }
