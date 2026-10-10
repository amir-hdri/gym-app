"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

/**
 * Theme switch with no hydration guard: which icon shows is decided in CSS by
 * the `dark` class that next-themes' inline script writes before first paint,
 * so the server and client render identical markup and nothing flashes.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="تغییر حالت نمایش"
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-xl border border-border/60 bg-secondary/70 text-foreground/90 backdrop-blur-md transition-colors hover:bg-accent active:bg-secondary ring-focus",
        className
      )}
    >
      <Moon aria-hidden className="h-5 w-5 dark:hidden" strokeWidth={1.75} />
      <Sun aria-hidden className="hidden h-5 w-5 dark:block" strokeWidth={1.75} />
    </button>
  );
}
