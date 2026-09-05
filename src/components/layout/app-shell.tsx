import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CarFront,
  CircleDollarSign,
  ContactRound,
  LayoutDashboard,
  Menu,
  PlusCircle,
  Settings,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

const navItems: Array<{ label: string; icon: LucideIcon; ready?: boolean }> = [
  { label: "Dashboard", icon: LayoutDashboard, ready: true },
  { label: "Buy Car", icon: PlusCircle },
  { label: "Stock & Cars", icon: CarFront },
  { label: "Sell / Recovery", icon: Wrench },
  { label: "Contacts", icon: ContactRound },
  { label: "Finance", icon: CircleDollarSign },
  { label: "Reports", icon: BarChart3 },
  { label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/35 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r bg-sidebar lg:flex lg:flex-col">
        <Brand />
        <nav aria-label="Primary navigation" className="flex-1 space-y-1 p-3">
          {navItems.map(({ label, icon: Icon, ready }) => (
            <div
              key={label}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                ready
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/65"
              }`}
            >
              <Icon className="size-4" />
              <span className="flex-1">{label}</span>
              {!ready && (
                <Badge variant="outline" className="px-1.5 text-[10px]">
                  Soon
                </Badge>
              )}
            </div>
          ))}
        </nav>
        <div className="border-t p-4 text-xs leading-5 text-muted-foreground">
          V1 · PostgreSQL source of truth
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur lg:px-8">
          <div className="lg:hidden">
            <Brand compact />
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium">Dashboard</p>
            <p className="text-xs text-muted-foreground">September 2026</p>
          </div>
          <button
            type="button"
            aria-label="Navigation will be enabled with the application modules"
            className="rounded-md border p-2 text-muted-foreground lg:hidden"
          >
            <Menu className="size-4" />
          </button>
        </header>
        <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${compact ? "" : "h-20 border-b px-5"}`}>
      <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <CarFront className="size-5" />
      </div>
      <div>
        <p className="text-sm font-semibold leading-tight">Car Scrap</p>
        <p className="text-xs text-muted-foreground">Business Manager</p>
      </div>
    </div>
  );
}
