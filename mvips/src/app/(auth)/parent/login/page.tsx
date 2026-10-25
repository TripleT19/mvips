"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ArrowLeft,
  ShieldCheck,
  Users,
  GraduationCap,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const ADMIN_TOKEN_KEY = "admin_token";
const ADMIN_USER_KEY = "admin_user";
const PARENT_TOKEN_KEY = "parent_token";
const PARENT_USER_KEY = "parent_user";

type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

function isParentRole(role?: string | null) {
  const r = (role ?? "").toLowerCase().trim();
  return r === "parent" || r === "guardian";
}

export default function ParentLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  /* ---------- Session check ---------- */
  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const token = localStorage.getItem(ADMIN_TOKEN_KEY);

      if (!token) {
        if (!cancelled) setCheckingSession(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/admin/user`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (response.ok) {
          const data = await response.json();
          const user: SessionUser | undefined = data?.user ?? data?.data;

          if (user && isParentRole(user.role)) {
            router.replace("/parent");
            return;
          }

          localStorage.removeItem(ADMIN_TOKEN_KEY);
          localStorage.removeItem(ADMIN_USER_KEY);
          localStorage.removeItem(PARENT_TOKEN_KEY);
          localStorage.removeItem(PARENT_USER_KEY);
        } else if (response.status === 401 || response.status === 403) {
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          localStorage.removeItem(ADMIN_USER_KEY);
          localStorage.removeItem(PARENT_TOKEN_KEY);
          localStorage.removeItem(PARENT_USER_KEY);
        }

        if (!cancelled) setCheckingSession(false);
      } catch {
        if (!cancelled) {
          setError("Unable to verify your session. Please try again.");
          setCheckingSession(false);
        }
      }
    }

    checkSession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  /* ---------- Submit ---------- */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");

    try {
      const response = await fetch(`${API_URL}/api/parent/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password, remember: rememberMe }),
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response. Please try again."
        );
      }

      if (!response.ok) {
        const message =
          data?.errors?.email?.[0] ||
          data?.message ||
          "The email or password is incorrect.";
        throw new Error(message);
      }

      if (!data?.token) {
        throw new Error(
          "Login succeeded but no token was returned. Please try again."
        );
      }

      if (data.user && !isParentRole(data.user.role)) {
        throw new Error(
          "This account is not a parent account. Please contact the school office."
        );
      }

      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      localStorage.setItem(PARENT_TOKEN_KEY, data.token);
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.user ?? {}));
      localStorage.setItem(PARENT_USER_KEY, JSON.stringify(data.user ?? {}));

      router.replace("/parent");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  /* ---------- Loading ---------- */
  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6F7FB]">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#252B68]" />
          Checking session…
        </div>
      </main>
    );
  }

  /* ---------- Page ---------- */
  return (
    <main className="min-h-screen overflow-hidden bg-[#F6F7FB]">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* ================= LEFT BRANDING PANEL (desktop) ================= */}
        <section className="relative hidden overflow-hidden bg-[#252B68] lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#FFE900]/10" />
          <div className="pointer-events-none absolute -bottom-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-[#F58220]/10" />

          <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
            <div>
              <Image
                src="/logo.jpg"
                alt="Mount View International Primary School"
                width={170}
                height={170}
                className="h-auto w-[125px] rounded-2xl object-contain shadow-xl xl:w-[145px]"
                priority
              />
            </div>

            <div className="max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                <ShieldCheck className="h-4 w-4 text-[#FFE900]" />
                Secure Parent Portal
              </div>

              <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
                Welcome to the
                <span className="block text-[#FFE900]">Mount View</span>
                Parent Portal
              </h1>

              <p className="mt-5 max-w-lg text-base leading-7 text-white/75 xl:text-lg">
                Sign in to view your child&apos;s term reports, grades,
                attendance and teacher observations — all in one secure place.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm text-white/85 backdrop-blur-sm">
                  <GraduationCap className="h-4 w-4 text-[#FFE900]" />
                  Term reports
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm text-white/85 backdrop-blur-sm">
                  <Users className="h-4 w-4 text-[#FFE900]" />
                  Multiple children
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-6 text-sm text-white/55">
              <p>Mount View International Primary School</p>
              <p>Fostering growth, excellence and empathy</p>
            </div>
          </div>
        </section>

        {/* ================= RIGHT LOGIN PANEL ================= */}
        <section className="flex items-center justify-center px-4 py-8 sm:px-8 lg:px-12 xl:px-16">
          <div className="w-full max-w-md">
            {/* Mobile brand block */}
            <div className="mb-4 flex flex-col items-center text-center lg:hidden">
              <Image
                src="/logo.jpg"
                alt="Mount View International Primary School"
                width={90}
                height={90}
                className="h-16 w-16 rounded-xl object-contain shadow-md"
                priority
              />
              <h1 className="mt-2 text-base font-bold text-[#252B68]">
                Mount View International
              </h1>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xl sm:p-8">
              <div className="mb-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#252B68]/10">
                  <LockKeyhole className="h-5 w-5 text-[#252B68]" />
                </div>

                <h2 className="text-xl font-bold tracking-tight text-[#172033] sm:text-2xl">
                  Parent Login
                </h2>

                <p className="mt-1 text-sm leading-5 text-gray-500">
                  Sign in to view your children&apos;s academic progress.
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-semibold text-[#172033]"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@mountviewmw.com"
                      required
                      className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-[#172033] outline-none transition placeholder:text-gray-400 focus:border-[#252B68] focus:bg-white focus:ring-4 focus:ring-[#252B68]/10"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-[#172033]"
                    >
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
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      required
                      className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-11 text-sm text-[#172033] outline-none transition placeholder:text-gray-400 focus:border-[#252B68] focus:bg-white focus:ring-4 focus:ring-[#252B68]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((c) => !c)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-[#252B68]"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#252B68] focus:ring-[#252B68]"
                  />
                  <span className="text-sm text-gray-600">
                    Keep me signed in
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex h-11 w-full items-center justify-center rounded-xl bg-[#252B68] px-5 text-sm font-semibold text-white shadow-md transition hover:bg-[#1d2257] hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#252B68]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Signing in...
                    </span>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </form>

              <div className="mt-4 flex gap-2.5 rounded-xl bg-[#F6F7FB] p-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#252B68]" />
                <p className="text-[11px] leading-5 text-gray-500">
                  For parents and guardians of Mount View students. Login
                  details are issued by the school office.
                </p>
              </div>

              <div className="mt-4 border-t border-gray-100 pt-4 text-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#252B68] transition hover:text-[#F58220]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to school website
                </Link>
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-gray-400">
              © {new Date().getFullYear()} Mount View International Primary
              School &amp; Early Years Centre
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}