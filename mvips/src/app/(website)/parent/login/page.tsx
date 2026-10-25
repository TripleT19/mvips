"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "admin_token";

export default function ParentLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const justActivated = searchParams.get("activated") === "1";
  const justReset = searchParams.get("reset") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/parent/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          remember,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 422 && data?.errors?.email) {
          throw new Error(data.errors.email[0]);
        }
        throw new Error(data?.message || "Login failed.");
      }

      // Store the token under both keys so the parent portal layout
      // (which reads `admin_token`) recognises the session.
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("parent_token", data.token);
      localStorage.setItem("admin_user", JSON.stringify(data.user));
      localStorage.setItem("parent_user", JSON.stringify(data.user));

      router.replace("/parent");
    } catch (err: any) {
      setError(err?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-[#252B68] via-[#171B4A] to-[#101335]">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Back to website */}
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white"
          >
            <ChevronLeft size={16} />
            Back to school website
          </Link>

          <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* Header */}
            <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white px-8 pb-6 pt-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <Image
                  src="/logo.jpg"
                  alt="Mount View International Primary School"
                  width={64}
                  height={64}
                  className="object-contain p-2"
                  priority
                />
              </div>
              <h1 className="mt-4 text-xl font-black text-[#172033]">
                Parent Portal
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Sign in to view your children&apos;s results
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 p-8">
              {justActivated && !error && (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                  <p>Your account is active. Please sign in below.</p>
                </div>
              )}

              {justReset && !error && (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                  <p>Password reset. Please sign in with your new password.</p>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@mountviewmw.com"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-[#252B68]"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Password
                  </label>
                  <Link
                    href="/parent/forgot-password"
                    className="text-xs font-semibold text-[#F58220] hover:text-[#d96e12]"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm outline-none focus:border-[#252B68]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#252B68] focus:ring-[#252B68]"
                />
                Keep me signed in on this device
              </label>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#252B68] text-sm font-bold text-white shadow-sm transition hover:bg-[#1d2255] disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-white/50">
            &copy; {new Date().getFullYear()} Mount View International Primary
            School
          </p>
        </div>
      </div>
    </main>
  );
}