"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Briefcase,
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
    items: [{ label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" }],
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
      { label: "Sources", icon: GitFork, href: "/sources" },
      { label: "Sellers", icon: ContactRound, href: "/sellers" },
      { label: "Buyers", icon: ShoppingBag, href: "/buyers" },
      { label: "Business Contacts", icon: Briefcase, href: "/business-contacts" },
    ],
  },
  {
    title: "FINANCE",
    items: [
      { label: "Cash Flow", icon: CircleDollarSign, href: "/finance" },
      { label: "Business Expenses", icon: Receipt, href: "/expenses/business" },
      { label: "Expense Details", icon: TrendingUp, href: "/expenses/details" },
    ],
  },
  {
    title: "REPORTS",
    items: [
      { label: "Monthly Report", icon: FileSpreadsheet, href: "/reports/monthly" },
      { label: "Analytics", icon: BarChart3, href: "/analytics" },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      {
        label: "Security & Backup",
        icon: ShieldCheck,
        href: "/settings/security",
      },
    ],
  },
];

export function SidebarNav({ userRole }: { userRole?: string | null }) {
  const pathname = usePathname();

  const isViewer = userRole === "VIEWER";
  const isAdmin = userRole === "ADMIN";

  const visibleGroups = navGroups
    .map((group) => {
      const filteredItems = group.items.filter((item) => {
        // Viewers cannot access Buy Car, Sell, Sources, or Buyers
        if (isViewer) {
          if (item.href === "/cars/new") return false;
          if (item.href === "/sell") return false;
          if (item.href === "/sources") return false;
          if (item.href === "/buyers") return false;
          if (item.href === "/business-contacts") return false;
        }
        // Only Admin can access Security & Backup
        if (item.href === "/settings/security" && !isAdmin) {
          return false;
        }
        return true;
      });

      return {
        ...group,
        items: filteredItems,
      };
    })
    .filter((group) => group.items.length > 0);

  return (
    <nav
      aria-label="Primary navigation"
      className="flex-1 space-y-4 overflow-y-auto p-3"
    >
      {visibleGroups.map((group, groupIdx) => (
        <div key={groupIdx} className="space-y-1">
          {group.title && (
            <p className="text-muted-foreground/80 px-2.5 pt-1 text-[11px] font-semibold tracking-wider uppercase">
              {group.title}
            </p>
          )}
          {group.items.map(({ label, icon: Icon, href, badge }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/" || pathname === "/dashboard"
                : href === "/"
                  ? pathname === "/" || pathname === "/dashboard"
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
