"use client";

import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ParentForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/parent/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed.");
      setSent(true);
    } catch (err: any) {
      setError(err?.message || "Failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#F6F7FB]">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* ============== LEFT BRANDING ============== */}
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
                We&apos;ve got you
              </div>

              <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
                Forgot your
                <span className="block text-[#FFE900]">password?</span>
              </h1>

              <p className="mt-5 max-w-lg text-base leading-7 text-white/75 xl:text-lg">
                No problem. Enter the email address on your Parent Portal
                account and we&apos;ll send you a link to reset it.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm text-white/85 backdrop-blur-sm">
                  <KeyRound className="h-4 w-4 text-[#FFE900]" />
                  Secure reset link
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm text-white/85 backdrop-blur-sm">
                  <ShieldCheck className="h-4 w-4 text-[#FFE900]" />
                  Expires in 60 minutes
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-6 text-sm text-white/55">
              <p>Mount View International Primary School</p>
              <p>Fostering growth, excellence and empathy</p>
            </div>
          </div>
        </section>

        {/* ============== RIGHT FORM ============== */}
        <section className="flex items-center justify-center px-4 py-8 sm:px-8 lg:px-12 xl:px-16">
          <div className="w-full max-w-md">
            {/* Mobile brand */}
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
                  <KeyRound className="h-5 w-5 text-[#252B68]" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-[#172033] sm:text-2xl">
                  Forgot your password?
                </h2>
                <p className="mt-1 text-sm leading-5 text-gray-500">
                  Enter your email and we&apos;ll send a reset link.
                </p>
              </div>

              {sent ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                    <p>
                      If that email matches a parent account, we&apos;ve sent a
                      password reset link. Check your inbox and spam folder.
                    </p>
                  </div>
                  <Link
                    href="/parent/login"
                    className="flex h-11 w-full items-center justify-center rounded-xl bg-[#252B68] text-sm font-semibold text-white shadow-md transition hover:bg-[#1d2257]"
                  >
                    Back to login
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {error && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <p>{error}</p>
                    </div>
                  )}

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
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@mountviewmw.com"
                        className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-[#172033] outline-none transition placeholder:text-gray-400 focus:border-[#252B68] focus:bg-white focus:ring-4 focus:ring-[#252B68]/10"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#252B68] text-sm font-semibold text-white shadow-md transition hover:bg-[#1d2257] hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#252B68]/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : null}
                    {loading ? "Sending…" : "Send reset link"}
                  </button>
                </form>
              )}

              <div className="mt-5 border-t border-gray-100 pt-4 text-center text-sm text-gray-500">
                Remember your password?{" "}
                <Link
                  href="/parent/login"
                  className="font-semibold text-[#252B68] hover:underline"
                >
                  Sign in
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