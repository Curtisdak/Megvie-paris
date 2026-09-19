"use client"

import { Check, Laptop, Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const themeOptions = [
  {
    value: "light",
    label: "Clair",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Sombre",
    icon: Moon,
  },
  {
    value: "system",
    label: "Systeme",
    icon: Laptop,
  },
] as const

export function ThemeToggle() {
  const { resolvedTheme, setTheme, theme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-11 overflow-hidden rounded-lg text-muted-foreground hover:bg-muted"
          title="Changer de thème"
        >
          <Sun
            className={cn(
              "relative h-4 w-4 text-amber-600 transition-all",
              isDark ? "-rotate-90 scale-0" : "rotate-0 scale-100",
            )}
          />
          <Moon
            className={cn(
              "absolute h-4 w-4 text-amber-200 transition-all",
              isDark ? "rotate-0 scale-100" : "rotate-90 scale-0",
            )}
          />
          <span className="sr-only">Changer de theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44 rounded-lg border-border p-1 shadow-lg"
      >
        {themeOptions.map((option) => {
          const Icon = option.icon
          const isActive = (theme ?? "system") === option.value

          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className="flex min-h-11 cursor-pointer items-center justify-between rounded-md px-3 py-2"
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {option.label}
              </span>
              {isActive ? <Check className="h-4 w-4 text-amber-600" /> : null}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
