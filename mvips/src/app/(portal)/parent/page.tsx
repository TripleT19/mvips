"use client";

import {
  AlertCircle, ChevronRight, Loader2, TrendingUp, Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "admin_token";

type Child = {
  id: number;
  slug: string;
  full_name: string;
  student_number: string;
  photo_url: string | null;
  class_name?: string | null;
  stream_name?: string | null;
  stream_colour?: string | null;
  relationship?: string | null;
};

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

export default function ParentDashboardPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("admin_user");
      if (raw) {
        const u = JSON.parse(raw);
        setUserName(u?.name ?? "");
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/parent/children`, {
          headers: authHeaders(),
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load children");
        setChildren(data.data ?? []);
      } catch (e: any) {
        setError(e?.message || "Failed to load.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={22} className="animate-spin text-[#F58220]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#252B68] via-[#3A4087] to-[#F58220] p-6 text-white shadow-md sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FFE900]">
              Welcome back
            </p>
            <h1 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">
              {userName || "Parent"}
            </h1>
            <p className="mt-2 max-w-md text-sm text-white/80">
              {children.length === 0
                ? "Your account is not linked to any students yet. Please contact the school office."
                : `You have ${children.length} ${children.length === 1 ? "child" : "children"} enrolled at Mount View.`}
            </p>
          </div>

          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <Users size={28} />
          </div>
        </div>
      </div>

      {children.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 p-10 text-center">
          <AlertCircle size={32} className="text-amber-600" />
          <p className="mt-3 text-sm font-bold text-amber-900">
            No students linked yet
          </p>
          <p className="mt-1 max-w-sm text-xs text-amber-800">
            Your account is active but the school has not yet linked any
            children to it. Please contact the school office.
          </p>
        </div>
      ) : (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              My Children
            </h2>
            <p className="text-xs text-slate-400">Tap a card to view results</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/parent/children/${child.slug}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#252B68]/40 hover:shadow-md"
              >
                <div className="flex items-center gap-3 p-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#252B68] to-[#4A5496] text-sm font-bold text-white shadow-sm ring-2 ring-white">
                    {child.photo_url ? (
                      <img
                        src={child.photo_url}
                        alt={child.full_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitials(child.full_name)
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#172033]">
                      {child.full_name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {child.student_number}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                      {child.class_name || "—"}
                      {child.stream_name ? ` · ${child.stream_name}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-2.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#252B68]">
                    <TrendingUp size={12} />
                    View Results
                  </span>
                  <ChevronRight
                    size={14}
                    className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#252B68]"
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}