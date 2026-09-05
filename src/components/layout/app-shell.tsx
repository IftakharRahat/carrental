import {
  CarFront,
  LogOut,
  Menu,
  User,
} from "lucide-react";

import { SidebarNav } from "./sidebar-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/35 min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="bg-sidebar hidden border-r lg:flex lg:flex-col">
        <Brand />
        <SidebarNav />

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
