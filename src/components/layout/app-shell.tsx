import type { LucideIcon } from "lucide-react";
import Link from "next/link";
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

const navItems: Array<{ label: string; icon: LucideIcon; href?: string }> = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Buy Car", icon: PlusCircle, href: "/cars/new" },
  { label: "Stock & Cars", icon: CarFront, href: "/stock" },
  { label: "Sell / Recovery", icon: Wrench },
  { label: "Contacts", icon: ContactRound },
  { label: "Finance", icon: CircleDollarSign },
  { label: "Reports", icon: BarChart3 },
  { label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/35 min-h-screen lg:grid lg:grid-cols-[232px_1fr]">
      <aside className="bg-sidebar hidden border-r lg:flex lg:flex-col">
        <Brand />
        <nav
          aria-label="Primary navigation"
          className="flex-1 space-y-0.5 p-2.5"
        >
          {navItems.map(({ label, icon: Icon, href }) => {
            const content = (
              <>
                <Icon className="size-4" />
                <span className="flex-1">{label}</span>
                {!href && (
                  <Badge variant="outline" className="px-1.5 text-[10px]">
                    Soon
                  </Badge>
                )}
              </>
            );
            const className = `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${href ? "text-sidebar-foreground hover:bg-sidebar-accent" : "text-sidebar-foreground/65"}`;
            return href ? (
              <Link key={label} href={href} className={className}>
                {content}
              </Link>
            ) : (
              <div key={label} className={className}>
                {content}
              </div>
            );
          })}
        </nav>
        <div className="text-muted-foreground border-t p-4 text-xs leading-5">
          V1 · PostgreSQL source of truth
        </div>
      </aside>

      <div className="min-w-0">
        <header className="bg-background/95 sticky top-0 z-20 flex h-14 items-center justify-between border-b px-4 backdrop-blur lg:hidden">
          <Brand compact />
          <button
            type="button"
            aria-label="Navigation will be enabled with the application modules"
            className="text-muted-foreground rounded-md border p-2 lg:hidden"
          >
            <Menu className="size-4" />
          </button>
        </header>
        <main className="mx-auto w-full max-w-[1500px] p-3 sm:p-4 lg:p-5">
          {children}
        </main>
      </div>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 ${compact ? "" : "h-16 border-b px-4"}`}
    >
      <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl shadow-sm">
        <CarFront className="size-5" />
      </div>
      <div>
        <p className="text-sm leading-tight font-semibold">Car Scrap</p>
        <p className="text-muted-foreground text-xs">Business Manager</p>
      </div>
    </div>
  );
}
