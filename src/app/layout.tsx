import type { Metadata } from "next";

import { ClerkProvider } from "@clerk/nextjs";

import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Car Scrap Business",
    template: "%s | Car Scrap Business",
  },
  description: "Car purchasing, stock, recovery and finance management.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const clerkConfigured = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.CLERK_SECRET_KEY,
  );
  const content = <AppShell>{children}</AppShell>;

  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        {clerkConfigured ? <ClerkProvider>{content}</ClerkProvider> : content}
        <Toaster richColors />
      </body>
    </html>
  );
}
