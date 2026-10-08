"use client";

import { AlertCircle, CheckCircle2, Loader2, Mail, Send } from "lucide-react";
import { FormEvent, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Status = "idle" | "submitting" | "success" | "error";

export default function NewsletterSubscribeForm({
  variant = "light",
}: {
  /** "light" for use on the yellow panel; "dark" for use on navy hero. */
  variant?: "light" | "dark";
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const isLight = variant === "light";

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;

    const trimmed = email.trim();
    if (!trimmed) {
      setStatus("error");
      setMessage("Please enter your email address.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/api/newsletter-subscribers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: trimmed,
          name: name.trim() || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json?.errors?.email?.[0] ||
            json?.message ||
            "Unable to subscribe right now. Please try again."
        );
      }

      setStatus("success");
      setMessage(
        json?.message || "You are now subscribed. Watch your inbox!"
      );
      setEmail("");
      setName("");
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message || "Something went wrong. Please try again.");
    }
  }

  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 ${
        isLight
          ? "border-[#252B68]/15 bg-white/60 backdrop-blur-sm"
          : "border-white/15 bg-white/10 backdrop-blur-sm"
      }`}
    >
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isLight
              ? "bg-[#252B68] text-[#FFE900]"
              : "bg-[#FFE900] text-[#252B68]"
          }`}
        >
          <Mail size={18} />
        </div>

        <div>
          <p
            className={`text-sm font-black uppercase tracking-wider ${
              isLight ? "text-[#252B68]" : "text-[#FFE900]"
            }`}
          >
            Subscribe
          </p>
          <p
            className={`text-xs ${
              isLight ? "text-[#252B68]/70" : "text-blue-100"
            }`}
          >
            Get each new newsletter by email.
          </p>
        </div>
      </div>

      {status === "success" ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <p className="font-medium">{message}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              autoComplete="name"
              className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition focus:ring-4 ${
                isLight
                  ? "border-[#252B68]/15 bg-white text-slate-800 focus:border-[#252B68] focus:ring-[#252B68]/10"
                  : "border-white/20 bg-white/10 text-white placeholder:text-white/60 focus:border-[#FFE900] focus:ring-[#FFE900]/20"
              }`}
            />

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition focus:ring-4 ${
                isLight
                  ? "border-[#252B68]/15 bg-white text-slate-800 focus:border-[#252B68] focus:ring-[#252B68]/10"
                  : "border-white/20 bg-white/10 text-white placeholder:text-white/60 focus:border-[#FFE900] focus:ring-[#FFE900]/20"
              }`}
            />
          </div>

          {status === "error" && (
            <p
              className={`flex items-center gap-1.5 text-xs font-medium ${
                isLight ? "text-red-600" : "text-red-300"
              }`}
            >
              <AlertCircle size={13} />
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition sm:w-auto ${
              isLight
                ? "bg-[#252B68] text-white hover:bg-[#171B4A]"
                : "bg-[#F58220] text-white hover:bg-[#d96e12]"
            } disabled:opacity-60`}
          >
            {status === "submitting" ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Subscribing…
              </>
            ) : (
              <>
                <Send size={16} />
                Subscribe
              </>
            )}
          </button>

          <p
            className={`text-[11px] leading-5 ${
              isLight ? "text-[#252B68]/60" : "text-blue-100/70"
            }`}
          >
            We only send newsletters. Unsubscribe any time with one click.
          </p>
        </form>
      )}
    </div>
  );
}