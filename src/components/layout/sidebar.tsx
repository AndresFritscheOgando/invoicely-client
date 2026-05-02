"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Building2,
  BarChart3,
  Settings,
  LogOut,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/vendors", label: "Vendors", icon: Building2 },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } finally {
      logout();
      window.location.href = "/login";
    }
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <aside className="flex flex-col w-64 bg-sidebar text-sidebar-foreground min-h-screen">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-sidebar-primary/20 p-1.5">
            <Receipt className="h-5 w-5 text-sidebar-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground">Invoicely</h1>
            <p className="text-xs text-sidebar-foreground/40 leading-none">Invoice Management</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-sidebar-primary text-sidebar-primary-foreground border-l-2 border-sidebar-primary-foreground/50"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-1">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-sidebar-primary">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-xs text-sidebar-foreground/40 truncate">{user.role}</p>
            </div>
          </div>
        )}
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
