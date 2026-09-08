import type { Metadata } from "next";

import { LoginView } from "@/features/auth/components/login-view";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Car Scrap Business Manager account.",
};

export default function LoginPage() {
  return <LoginView />;
}
