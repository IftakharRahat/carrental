"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CarFront,
  FileText,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  PlusCircle,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarFooter } from "./sidebar-footer";
import { SidebarNav } from "./sidebar-nav";

type MobileNavProps = {
  userRole?: string | null;
  user?: {
    name: string;
    email: string;
    role?: string;
  } | null;
};

export function MobileNav({ userRole, user }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isViewer = userRole === "VIEWER";

  return (
    <>
      {/* Mobile Top Header (visible on < lg) */}
      <header className="bg-background/95 sticky top-0 z-30 flex h-14 items-center justify-between border-b px-3 sm:px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2.5">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <button
                  type="button"
                  aria-label="Open navigation menu"
                  className="text-foreground hover:bg-muted active:scale-95 flex size-9 items-center justify-center rounded-lg border p-2 transition-all cursor-pointer"
                  data-testid="mobile-menu-trigger"
                >
                  <Menu className="size-5" />
                </button>
              }
            />

            <SheetContent
              side="left"
              showCloseButton={false}
              className="bg-sidebar p-0 w-[280px] sm:w-[320px] flex flex-col h-full border-r shadow-2xl"
            >
              <SheetHeader className="flex flex-row items-center justify-between border-b px-4 py-3 space-y-0">
                <div className="flex items-center gap-2.5">
                  <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-xl shadow-xs">
                    <CarFront className="size-4" />
                  </div>
                  <div>
                    <SheetTitle className="text-sm font-bold leading-tight text-sidebar-foreground">
                      Car Scrap
                    </SheetTitle>
                    <p className="text-[11px] text-muted-foreground">
                      Business Manager
                    </p>
                  </div>
                </div>

                <SheetClose
                  render={
                    <button
                      type="button"
                      aria-label="Close menu"
                      className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors cursor-pointer"
                    >
                      <X className="size-4" />
                    </button>
                  }
                />
              </SheetHeader>

              {/* Navigation Links (Closes sheet on item click) */}
              <div className="flex-1 overflow-y-auto">
                <SidebarNav
                  userRole={userRole}
                  onNavigate={() => setOpen(false)}
                />
              </div>

              {/* User Footer */}
              <SidebarFooter user={user} />
            </SheetContent>
          </Sheet>

          {/* Brand Logo Link */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-xl shadow-xs">
              <CarFront className="size-4" />
            </div>
            <div className="leading-none">
              <span className="text-sm font-bold tracking-tight text-foreground">
                Car Scrap
              </span>
              <span className="block text-[10px] text-muted-foreground font-medium">
                Business
              </span>
            </div>
          </Link>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {!isViewer && (
            <Link
              href="/cars/new"
              className="bg-primary text-primary-foreground hover:brightness-110 active:scale-95 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow-xs transition-all"
            >
              <PlusCircle className="size-3.5" />
              <span className="hidden xs:inline">Buy Car</span>
            </Link>
          )}
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (visible only on mobile screens < sm) */}
      <nav
        aria-label="Mobile quick navigation"
        className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-md border-t sm:hidden px-2 py-1 shadow-lg"
      >
        <div className="flex items-center justify-around">
          {/* 1. Dashboard */}
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center py-1 px-2 min-w-[56px] text-[10px] font-medium transition-colors ${
              pathname === "/" || pathname === "/dashboard"
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutDashboard className="size-4 mb-0.5" />
            <span>Overview</span>
          </Link>

          {/* 2. Stock */}
          <Link
            href="/stock"
            className={`flex flex-col items-center justify-center py-1 px-2 min-w-[56px] text-[10px] font-medium transition-colors ${
              pathname === "/stock"
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CarFront className="size-4 mb-0.5" />
            <span>Stock</span>
          </Link>

          {/* 3. Buy Car (Center Action) */}
          {!isViewer ? (
            <Link
              href="/cars/new"
              className="flex flex-col items-center justify-center -mt-3.5 group"
            >
              <div className="bg-primary text-primary-foreground size-10 rounded-full flex items-center justify-center shadow-md group-active:scale-95 transition-transform">
                <PlusCircle className="size-5" />
              </div>
              <span className="text-[10px] font-semibold text-primary mt-0.5">
                + Buy Car
              </span>
            </Link>
          ) : null}

          {/* 4. Quotations */}
          {!isViewer && (
            <Link
              href="/quotations"
              className={`flex flex-col items-center justify-center py-1 px-2 min-w-[56px] text-[10px] font-medium transition-colors ${
                pathname === "/quotations"
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="size-4 mb-0.5" />
              <span>Quotes</span>
            </Link>
          )}

          {/* 5. More / Menu Drawer Trigger */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-2 min-w-[56px] text-[10px] font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            <MoreHorizontal className="size-4 mb-0.5" />
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
