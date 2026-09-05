import type { Metadata } from "next";

import { ClerkProvider } from "@clerk/nextjs";

import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { isClerkConfigured } from "@/lib/config-state";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Car Scrap Business",
    template: "%s | Car Scrap Business",
  },
  description: "Car purchasing, stock, recovery and finance management.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const content = <AppShell>{children}</AppShell>;

  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        {isClerkConfigured() ? (
          <ClerkProvider>{content}</ClerkProvider>
        ) : (
          content
        )}
        <Toaster richColors />
      </body>
    </html>
  );
}
