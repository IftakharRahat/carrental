"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  AlertCircle,
  CarFront,
  Eye,
  EyeOff,
  KeyRound,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export function LoginView() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("from") || "/";

  const [email, setEmail] = useState("admin@carscrap.ae");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setErrorMessage(data.error || "Invalid email or password.");
        setIsLoading(false);
        return;
      }

      // Hard redirect to ensure all server layout cookies & session headers reload cleanly
      window.location.replace(redirectTo);
    } catch (err) {
      console.error("Sign in failed:", err);
      setErrorMessage("Network error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleQuickFill = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("admin123");
    setErrorMessage(null);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[oklch(0.225_0.035_235)] via-[oklch(0.18_0.04_210)] to-[oklch(0.15_0.03_190)] px-4 py-12">
      {/* Animated background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 animate-pulse rounded-full bg-[oklch(0.42_0.105_166/0.12)] blur-3xl" />
        <div className="absolute -bottom-48 -right-48 h-[32rem] w-[32rem] animate-pulse rounded-full bg-[oklch(0.54_0.12_166/0.08)] blur-3xl [animation-delay:1s]" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 animate-pulse rounded-full bg-[oklch(0.55_0.09_166/0.06)] blur-2xl [animation-delay:2s]" />
      </div>

      {/* Subtle grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Main card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          {/* Brand header */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.42_0.105_166)] to-[oklch(0.54_0.12_166)] shadow-lg shadow-[oklch(0.42_0.105_166/0.3)] ring-1 ring-white/20">
              <CarFront className="h-8 w-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Car Scrap Business
              </h1>
              <p className="mt-1 text-sm text-white/60">
                JWT Authentication &middot; Secure Sign In
              </p>
            </div>
          </div>

          {/* Security badge */}
          <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-2.5">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[oklch(0.54_0.12_166)]" />
            <p className="text-xs text-white/50">
              Encrypted JWT session with role-based access control
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p className="text-xs leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-medium text-white/70"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@carscrap.ae"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-white/30 transition-colors focus:border-[oklch(0.54_0.12_166)] focus:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-[oklch(0.54_0.12_166)]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-medium text-white/70"
              >
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-10 text-sm text-white placeholder-white/30 transition-colors focus:border-[oklch(0.54_0.12_166)] focus:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-[oklch(0.54_0.12_166)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Sign in submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[oklch(0.42_0.105_166)] to-[oklch(0.50_0.12_166)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[oklch(0.42_0.105_166/0.25)] transition-all duration-200 hover:shadow-xl hover:shadow-[oklch(0.42_0.105_166/0.35)] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <LogIn className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              )}
              <span>{isLoading ? "Authenticating…" : "Sign In to Account"}</span>
            </button>
          </form>

          {/* Quick preset credentials helper */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] uppercase tracking-widest text-white/30">
              Quick Sign In Preset
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill("admin@carscrap.ae")}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/[0.09] hover:text-white cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-[oklch(0.54_0.12_166)]" />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill("admin@local.car-scrap.test")}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/[0.09] hover:text-white cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-[oklch(0.54_0.12_166)]" />
              <span>Local Admin</span>
            </button>
          </div>

          <p className="mt-3 text-center text-[11px] text-white/40">
            Default credentials: <code className="text-white/70">admin@carscrap.ae</code> / <code className="text-white/70">admin123</code>
          </p>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-[11px] text-white/30">
          Car Scrap Business Manager &middot; Standalone JWT Session V1
        </p>
      </div>
    </div>
  );
}
