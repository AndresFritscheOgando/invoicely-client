"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium transition-colors",
        "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        className
      )}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
