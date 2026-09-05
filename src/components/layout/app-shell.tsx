import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  BarChart3,
  CarFront,
  CircleDollarSign,
  ContactRound,
  FileSpreadsheet,
  GitFork,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  User,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

type NavItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
  badge?: string;
};

type NavGroup = {
  title?: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    items: [{ label: "Dashboard", icon: LayoutDashboard, href: "/" }],
  },
  {
    title: "CARS",
    items: [
      { label: "Buy Car", icon: PlusCircle, href: "/cars/new" },
      { label: "Stock", icon: CarFront, href: "/stock" },
      { label: "All Cars", icon: Layers, href: "/stock?includeCompleted=true" },
    ],
  },
  {
    title: "SALES",
    items: [{ label: "Sell / Recovery", icon: Wrench, href: "/sales/new" }],
  },
  {
    title: "CONTACTS",
    items: [
      { label: "Sources", icon: GitFork },
      { label: "Sellers", icon: ContactRound },
      { label: "Buyers", icon: ShoppingBag },
    ],
  },
  {
    title: "FINANCE",
    items: [
      { label: "Cash Flow", icon: CircleDollarSign },
      { label: "Business Expenses", icon: Receipt },
      { label: "Expense Details", icon: FileSpreadsheet },
    ],
  },
  {
    title: "REPORTS",
    items: [
      { label: "Monthly Report", icon: BarChart3 },
      { label: "Analytics", icon: TrendingUp },
    ],
  },
  {
    title: "SETTINGS",
    items: [{ label: "Security", icon: ShieldCheck }],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/35 min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="bg-sidebar hidden border-r lg:flex lg:flex-col">
        <Brand />
        <nav
          aria-label="Primary navigation"
          className="flex-1 space-y-4 overflow-y-auto p-3"
        >
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {group.title && (
                <p className="text-muted-foreground/80 px-2.5 pt-1 text-[11px] font-semibold tracking-wider uppercase">
                  {group.title}
                </p>
              )}
              {group.items.map(({ label, icon: Icon, href, badge }) => {
                const content = (
                  <>
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1 truncate">{label}</span>
                    {!href && (
                      <Badge variant="outline" className="px-1.5 text-[10px]">
                        Soon
                      </Badge>
                    )}
                    {badge && (
                      <Badge variant="secondary" className="px-1.5 text-[10px]">
                        {badge}
                      </Badge>
                    )}
                  </>
                );
                const className = `flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm ${
                  href
                    ? "text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                    : "text-sidebar-foreground/60"
                }`;
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
            </div>
          ))}
        </nav>

        {/* User profile and logout footer matching spec screenshot */}
        <div className="border-t p-3">
          <div className="flex items-center justify-between rounded-lg p-1.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                <User className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-sidebar-foreground">
                  Logged-in User
                </p>
                <p className="text-muted-foreground truncate text-[11px]">
                  admin@carscrap.local
                </p>
              </div>
            </div>
            <button
              type="button"
              title="Logout"
              aria-label="Logout"
              className="text-muted-foreground hover:text-sidebar-foreground rounded-md p-1.5 transition-colors"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="bg-background/95 sticky top-0 z-20 flex h-14 items-center justify-between border-b px-4 backdrop-blur lg:hidden">
          <Brand compact />
          <button
            type="button"
            aria-label="Navigation menu"
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
