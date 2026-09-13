import { headers } from "next/headers";
import { CarFront } from "lucide-react";

import { getSessionActor } from "@/lib/auth/actor";
import { MobileNav } from "./mobile-nav";
import { SidebarFooter } from "./sidebar-footer";
import { SidebarNav } from "./sidebar-nav";

type AppShellProps = {
  children: React.ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  // Detect if we're on a fullscreen page (e.g. login)
  const headersList = await headers();
  const pathname = headersList.get("x-next-pathname") ?? "";
  const isFullscreenPage = pathname === "/login";

  if (isFullscreenPage) {
    return <>{children}</>;
  }

  const actor = await getSessionActor();

  return (
    <div className="bg-muted/35 min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="bg-sidebar sticky top-0 hidden h-screen border-r lg:flex lg:flex-col">
        <Brand />
        <SidebarNav userRole={actor?.role} />
        <SidebarFooter user={actor} />
      </aside>

      <div className="min-w-0 overflow-y-auto">
        <MobileNav userRole={actor?.role} user={actor} />
        <main className="mx-auto w-full max-w-[1500px] p-3 sm:p-4 lg:p-5 pb-20 sm:pb-5">
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
