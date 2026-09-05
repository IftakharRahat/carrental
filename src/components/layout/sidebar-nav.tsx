"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CarFront,
  CircleDollarSign,
  ContactRound,
  FileSpreadsheet,
  GitFork,
  Layers,
  LayoutDashboard,
  PlusCircle,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
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

export const navGroups: NavGroup[] = [
  {
    items: [{ label: "Dashboard", icon: LayoutDashboard, href: "/" }],
  },
  {
    title: "CARS",
    items: [
      { label: "Buy Car", icon: PlusCircle, href: "/cars/new" },
      { label: "Stock", icon: CarFront, href: "/stock" },
      { label: "All Cars", icon: Layers, href: "/cars" },
    ],
  },
  {
    title: "SALES",
    items: [{ label: "Sell / Recovery", icon: Wrench, href: "/sell" }],
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
      { label: "Expense Details", icon: TrendingUp },
    ],
  },
  {
    title: "REPORTS",
    items: [
      { label: "Monthly Report", icon: FileSpreadsheet },
      { label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    title: "SETTINGS",
    items: [{ label: "Security", icon: ShieldCheck }],
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
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
            const isActive =
              href === "/"
                ? pathname === "/"
                : href
                  ? pathname === href || (href !== "/" && pathname.startsWith(href) && href !== "/cars" && href !== "/stock") || (href === "/cars" && pathname === "/cars")
                  : false;

            const content = (
              <>
                <Icon className={`size-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
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

            const className = `flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
              isActive
                ? "bg-primary/10 text-primary font-medium"
                : href
                  ? "text-sidebar-foreground hover:bg-sidebar-accent"
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
  );
}
