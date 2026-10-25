"use client";

import {
  AlertCircle, CheckCircle2, ChevronLeft, Loader2, Mail,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed.");
      setSent(true);
    } catch (e: any) {
      setError(e?.message || "Failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-[#252B68] via-[#171B4A] to-[#101335]">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link
            href="/parent/login"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white"
          >
            <ChevronLeft size={16} />
            Back to login
          </Link>

          <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white px-8 pb-6 pt-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <Image
                  src="/logo.jpg"
                  alt="Mount View"
                  width={64}
                  height={64}
                  className="object-contain p-2"
                  priority
                />
              </div>
              <h1 className="mt-4 text-xl font-black text-[#172033]">
                Forgot your password?
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Enter your email and we&apos;ll send a reset link
              </p>
            </div>

            {sent ? (
              <div className="space-y-4 p-8">
                <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                  <p>
                    If that email matches a parent account, we&apos;ve sent a
                    password reset link. Check your inbox and spam folder.
                  </p>
                </div>
                <Link
                  href="/parent/login"
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#252B68] text-sm font-bold text-white hover:bg-[#1d2255]"
                >
                  Back to login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 p-8">
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
                    <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#252B68] text-sm font-bold text-white hover:bg-[#1d2255] disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}