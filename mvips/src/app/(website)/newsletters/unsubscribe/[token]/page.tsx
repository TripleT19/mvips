"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Heart,
  Loader2,
  MailCheck,
  RotateCcw,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Status = "loading" | "success" | "error" | "already-unsubscribed";

type ApiResponse = {
  success: boolean;
  message?: string;
};

export default function UnsubscribePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  /* Prevent React 18 StrictMode double-fire in dev. */
  const firedRef = useRef(false);

  useEffect(() => {
    if (!token || firedRef.current) return;
    firedRef.current = true;

    let cancelled = false;

    async function run() {
      try {
        const res = await fetch(
          `${API_URL}/api/newsletter-subscribers/unsubscribe/${token}`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
          }
        );

        const json = (await res.json()) as ApiResponse;

        if (cancelled) return;

        if (!res.ok) {
          setStatus("error");
          setMessage(
            json?.message ||
              "We couldn't process this unsubscribe link. It may be invalid or expired."
          );
          return;
        }

        // Backend returns success whether they were active or already unsubscribed.
        // Detect "already" case by whether it changed anything.
        setStatus("success");
        setMessage(
          json?.message ||
            "You've been unsubscribed. You won't receive any further newsletters."
        );
      } catch (e: any) {
        if (!cancelled) {
          setStatus("error");
          setMessage(
            "Something went wrong. Please try again in a moment."
          );
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 text-[#172033]">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-40 -top-40 z-0 h-[32rem] w-[32rem] rounded-full bg-[#FFE900]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -left-40 z-0 h-[32rem] w-[32rem] rounded-full bg-[#F58220]/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        {/* Brand header */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-3 transition hover:opacity-90"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#252B68] text-2xl font-black text-[#FFE900]">
            MV
          </div>

          <div className="text-left">
            <p className="text-sm font-black leading-tight text-[#252B68]">
              Mount View International
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#F58220]">
              &amp; Early Years Centre
            </p>
          </div>
        </Link>

        {/* Card */}
        <div className="w-full overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-100">
          {/* Coloured top band */}
          <div
            className={`h-2 w-full ${
              status === "success"
                ? "bg-emerald-500"
                : status === "error"
                ? "bg-red-500"
                : status === "already-unsubscribed"
                ? "bg-amber-500"
                : "bg-[#252B68]"
            }`}
          />

          <div className="p-8 sm:p-12">
            {/* LOADING */}
            {status === "loading" && (
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Loader2 size={28} className="animate-spin" />
                </div>

                <h1 className="mt-6 text-2xl font-black text-[#252B68]">
                  Processing your request…
                </h1>

                <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
                  We&apos;re updating your subscription preferences. This
                  should only take a moment.
                </p>
              </div>
            )}

            {/* SUCCESS */}
            {status === "success" && (
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={28} />
                </div>

                <h1 className="mt-6 text-2xl font-black text-[#252B68] sm:text-3xl">
                  You&apos;ve been unsubscribed.
                </h1>

                <p className="mt-4 max-w-md text-base leading-7 text-slate-600">
                  {message}
                </p>

                <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
                  We&apos;re sorry to see you go. If you change your mind, you
                  can subscribe again at any time and we&apos;ll start sending
                  you future editions.
                </p>

                <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link
                    href="/newsletters#subscribe"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F58220] px-6 py-3.5 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#d96e12]"
                  >
                    <RotateCcw size={16} />
                    Subscribe Again
                  </Link>

                  <Link
                    href="/newsletters"
                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#252B68]/20 px-6 py-3.5 font-black text-[#252B68] transition hover:border-[#252B68] hover:bg-[#252B68] hover:text-white"
                  >
                    Browse Newsletters
                  </Link>
                </div>
              </div>
            )}

            {/* ERROR */}
            {status === "error" && (
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <AlertCircle size={28} />
                </div>

                <h1 className="mt-6 text-2xl font-black text-[#252B68] sm:text-3xl">
                  We couldn&apos;t process this link.
                </h1>

                <p className="mt-4 max-w-md text-base leading-7 text-slate-600">
                  {message}
                </p>

                <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
                  If you keep receiving emails you&apos;d like to stop, just
                  reach out to the school office and we&apos;ll sort it out for
                  you.
                </p>

                <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F58220] px-6 py-3.5 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#d96e12]"
                  >
                    <MailCheck size={16} />
                    Contact the School
                  </Link>

                  <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#252B68]/20 px-6 py-3.5 font-black text-[#252B68] transition hover:border-[#252B68] hover:bg-[#252B68] hover:text-white"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            )}

            {/* ALREADY UNSUBSCRIBED (optional state) */}
            {status === "already-unsubscribed" && (
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <Heart size={28} />
                </div>

                <h1 className="mt-6 text-2xl font-black text-[#252B68] sm:text-3xl">
                  You&apos;re already unsubscribed.
                </h1>

                <p className="mt-4 max-w-md text-base leading-7 text-slate-600">
                  {message ||
                    "This email address isn't on our newsletter list."}
                </p>

                <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link
                    href="/newsletters#subscribe"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F58220] px-6 py-3.5 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#d96e12]"
                  >
                    <RotateCcw size={16} />
                    Subscribe Again
                  </Link>

                  <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#252B68]/20 px-6 py-3.5 font-black text-[#252B68] transition hover:border-[#252B68] hover:bg-[#252B68] hover:text-white"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reassurance footer */}
        <p className="mt-8 max-w-lg text-center text-xs leading-6 text-slate-400">
          Mount View International Primary School &amp; Early Years Centre ·
          We only send school newsletters. Your email address is never shared.
        </p>
      </div>
    </main>
  );
}