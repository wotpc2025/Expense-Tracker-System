"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Avoid hydration mismatch — render only after mount
    useEffect(() => setMounted(true), [])
    if (!mounted) return <div className="h-9 w-9" />

    return (
        <Button
            variant="outline"
            size="icon"
            className=" cursor-pointerh-9 w-9 cursor-pointer border-slate-200 dark:border-slate-700"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
        >
            {resolvedTheme === "dark"
                ? <Sun className="h-4 w-4 text-amber-400" />
                : <Moon className="h-4 w-4 text-slate-600" />}
        </Button>
    )
}
