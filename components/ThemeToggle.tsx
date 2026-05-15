"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "./ThemeProvider"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Activeaza tema deschisa" : "Activeaza tema inchisa"}
      title={isDark ? "Tema deschisa" : "Tema inchisa"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-bg-surface bg-bg-card text-text-primary transition-colors hover:border-accent hover:text-accent"
    >
      {isDark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
    </button>
  )
}

export default ThemeToggle
