"use client";

import { LogOut, User } from "lucide-react";
import { useState } from "react";

type SidebarFooterProps = {
  user?: {
    name: string;
    email: string;
    role?: string;
  } | null;
};

export function SidebarFooter({ user }: SidebarFooterProps) {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      // Force navigation to login page
      window.location.replace("/login");
    }
  };

  const displayName = user?.name || "Administrator";
  const displayEmail = user?.email || "admin@carscrap.ae";

  return (
    <div className="border-t p-3">
      <div className="flex items-center justify-between rounded-lg p-1.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
            <User className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-sidebar-foreground">
              {displayName}
            </p>
            <p className="text-muted-foreground truncate text-[11px]">
              {displayEmail}
            </p>
          </div>
        </div>
        <button
          type="button"
          title="Sign out of account"
          aria-label="Sign out of account"
          disabled={loggingOut}
          onClick={handleLogout}
          className="text-muted-foreground hover:text-destructive disabled:opacity-50 rounded-md p-1.5 transition-colors cursor-pointer"
        >
          <LogOut className={`size-4 ${loggingOut ? "animate-spin" : ""}`} />
        </button>
      </div>
    </div>
  );
}
