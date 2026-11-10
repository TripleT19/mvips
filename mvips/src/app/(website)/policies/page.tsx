"use client";

import {
  AlertCircle,
  BookMarked,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Filter,
  GraduationCap,
  Heart,
  Landmark,
  Loader2,
  Search,
  Shield,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "") ||
  "http://127.0.0.1:8000";

const MAX_DESCRIPTION_WORDS = 100;

/* =========================================================
   RIBBON ITEMS — policy themed
========================================================= */

const ribbonItems = [
  "Safeguarding",
  "Child Protection",
  "Health & Safety",
  "Behaviour & Discipline",
  "Academic Standards",
  "Admissions",
  "Finance & Fees",
  "Data Protection",
  "Equality & Inclusion",
  "Anti-Bullying",
  "Attendance",
  "Learning Support",
  "Digital Safety",
  "Complaints Procedure",
];

/* =========================================================
   TYPES
========================================================= */

type Policy = {
  id: number;
  title: string;
  category: string;
  description: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  version: string | null;
  effective_date: string | null;
  updated_at: string | null;
};

/* =========================================================
   CATEGORIES (mirror admin)
========================================================= */

type CategoryConfig = {
  id: string;
  label: string;
  short: string;
  icon: React.ElementType;
  accent: string;
};

const CATEGORIES: CategoryConfig[] = [
  { id: "academic",      label: "Academic",                          short: "Academic",       icon: GraduationCap, accent: "#252B68" },
  { id: "behaviour",     label: "Behaviour & Discipline",            short: "Behaviour",      icon: Users,         accent: "#F58220" },
  { id: "safeguarding",  label: "Safeguarding & Child Protection",   short: "Safeguarding",   icon: ShieldCheck,   accent: "#DC2626" },
  { id: "health_safety", label: "Health & Safety",                   short: "Health & Safety",icon: Heart,         accent: "#16A34A" },
  { id: "admissions",    label: "Admissions",                        short: "Admissions",     icon: UserPlus,      accent: "#7C3AED" },
  { id: "finance",       label: "Finance",                           short: "Finance",        icon: Landmark,      accent: "#0891B2" },
  { id: "it_data",       label: "IT & Data Protection",              short: "IT & Data",      icon: Shield,        accent: "#4F46E5" },
  { id: "general",       label: "General",                           short: "General",        icon: FileText,      accent: "#64748B" },
];

const CATEGORY_MAP: Record<string, CategoryConfig> = CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.id]: c }),
  {}
);

function categoryConfig(id: string): CategoryConfig {
  return (
    CATEGORY_MAP[id] ?? {
      id: "general",
      label: id
        ? id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "General",
      short: id || "General",
      icon: FileText,
      accent: "#64748B",
    }
  );
}

/* =========================================================
   HELPERS
========================================================= */

function fmtFileSize(bytes: number | null | undefined) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso as string;
  }
}

function truncateWords(text: string | null | undefined, max: number): string {
  if (!text) return "";
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= max) return text;
  return words.slice(0, max).join(" ") + "…";
}

/* =========================================================
   PAGE
========================================================= */

export default function PublicPoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  /* ---------- Load ---------- */

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_URL}/api/policies`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Unable to load policies (${res.status}).`);
        }

        const json = await res.json();
        const loaded: Policy[] = Array.isArray(json?.data) ? json.data : [];

        if (!cancelled) setPolicies(loaded);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Unable to load policies.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- Derived ---------- */

  const filtered = useMemo(() => {
    return policies.filter((p) => {
      if (activeCategory !== "all" && p.category !== activeCategory) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = `${p.title} ${p.description ?? ""} ${p.version ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [policies, activeCategory, search]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: policies.length };
    policies.forEach((p) => {
      counts[p.category] = (counts[p.category] ?? 0) + 1;
    });
    return counts;
  }, [policies]);

  const categoriesInUse = useMemo(() => {
    return CATEGORIES.filter(
      (c) => (categoryCounts[c.id] ?? 0) > 0 || activeCategory === c.id
    );
  }, [categoryCounts, activeCategory]);

  const lastUpdated = useMemo(() => {
    const dates = policies
      .map((p) => (p.updated_at ? new Date(p.updated_at).getTime() : 0))
      .filter((t) => t > 0);
    if (dates.length === 0) return "";
    return new Date(Math.max(...dates)).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, [policies]);

  return (
    <main className="overflow-hidden bg-white text-[#172033]">
      {/* ---------- marquee animation (matches other pages) ---------- */}
      <style>{`
        @keyframes mv-marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .mv-marquee{animation:mv-marquee 35s linear infinite}
        @media (prefers-reduced-motion: reduce){ .mv-marquee{animation:none} }
      `}</style>

      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="relative isolate overflow-hidden bg-[#252B68] px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-[#FFE900]/15 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#F58220]/20 blur-3xl" />
        </div>

        <span className="pointer-events-none absolute right-[8%] top-[20%] hidden text-5xl opacity-25 sm:block">
          📘
        </span>
        <span className="pointer-events-none absolute right-[16%] bottom-[16%] hidden text-4xl opacity-20 sm:block">
          🛡️
        </span>

        <div className="relative mx-auto max-w-7xl">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex items-center gap-1.5 text-xs font-bold text-blue-200/70"
          >
            <Link href="/" className="transition hover:text-white">
              Home
            </Link>
            <ChevronRight size={12} className="opacity-60" />
            <span className="text-[#FFE900]">Policies</span>
          </nav>

          <div className="grid items-end gap-8 lg:grid-cols-[1.4fr_0.9fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#FFE900] backdrop-blur-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FFE900]" />
                School Documents
              </div>

              <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Our School
                <span className="relative block text-[#FFE900]">
                  Policies.
                  <svg
                    className="absolute -bottom-2 left-0 w-full max-w-sm text-[#F58220]"
                    viewBox="0 0 300 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 9c60-6 140-8 296-4"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-8 text-blue-100 sm:text-lg">
                Transparency is at the heart of Mount View. Browse and download
                our current school policies — from safeguarding and academic
                standards to health, safety and finance.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm">
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#FFE900]/80">
                  Policies
                </p>
                <p className="mt-1 text-2xl font-black text-white">
                  {loading ? "—" : policies.length}
                </p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#FFE900]/80">
                  Categories
                </p>
                <p className="mt-1 text-2xl font-black text-white">
                  {loading
                    ? "—"
                    : Object.keys(categoryCounts).filter((k) => k !== "all").length}
                </p>
              </div>
              <div className="col-span-2 rounded-xl bg-white/10 p-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#FFE900]/80">
                  Last updated
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  {loading ? "—" : lastUpdated || "Not yet published"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* =====================================================
          MOVING RIBBON — policy topics
      ====================================================== */}
      <section className="overflow-hidden border-y border-slate-200 bg-white py-4">
        <div className="mv-marquee flex w-max gap-10 whitespace-nowrap">
          {[...ribbonItems, ...ribbonItems].map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-[#252B68]/70"
            >
              <span className="text-[#F58220]">✦</span>
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* =====================================================
          SEARCH & FILTER
      ====================================================== */}
      <section className="relative bg-white px-4 pb-10 pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search policies by title, description or version…"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-[#172033] outline-none transition focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2 text-xs font-bold text-slate-500">
                <Filter size={14} />
                {filtered.length} of {policies.length}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  activeCategory === "all"
                    ? "bg-[#252B68] text-white shadow-md"
                    : "border border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-[#252B68]/40 hover:text-[#252B68]"
                }`}
              >
                <BookMarked size={12} />
                All
                <span
                  className={`ml-0.5 rounded-full px-1.5 text-[10px] ${
                    activeCategory === "all"
                      ? "bg-white/25"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {categoryCounts.all ?? 0}
                </span>
              </button>

              {categoriesInUse.map((cat) => {
                const Icon = cat.icon;
                const count = categoryCounts[cat.id] ?? 0;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                      isActive
                        ? "text-white shadow-md"
                        : "border border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-[#252B68]/40 hover:text-[#252B68]"
                    }`}
                    style={isActive ? { backgroundColor: cat.accent } : undefined}
                  >
                    <Icon size={12} />
                    {cat.short}
                    <span
                      className={`ml-0.5 rounded-full px-1.5 text-[10px] ${
                        isActive ? "bg-white/25" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          POLICY LIST
      ====================================================== */}
      <section className="bg-white px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {loading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white p-16 text-slate-500">
              <Loader2 size={22} className="animate-spin text-[#F58220]" />
              <span className="text-sm font-semibold">Loading policies…</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-red-600 shadow-sm">
                <AlertCircle size={22} />
              </div>
              <p className="text-sm font-bold text-red-800">Could not load policies</p>
              <p className="max-w-md text-xs text-red-700">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-2 rounded-full bg-red-600 px-5 py-2 text-xs font-bold text-white hover:bg-red-700"
              >
                Try again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                <BookMarked size={24} />
              </div>
              <p className="mt-4 text-lg font-black text-[#252B68]">
                {policies.length === 0
                  ? "No policies published yet"
                  : "No policies match your filters"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {policies.length === 0
                  ? "Please check back soon — we're adding our policies."
                  : "Try a different category or clear your search."}
              </p>
              {(search || activeCategory !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setActiveCategory("all");
                  }}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#252B68] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#1c2156]"
                >
                  <X size={12} />
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="mb-4 text-xs font-bold text-slate-500">
                Showing{" "}
                <span className="text-[#252B68]">{filtered.length}</span>{" "}
                {filtered.length === 1 ? "policy" : "policies"}
                {activeCategory !== "all" && (
                  <>
                    {" "}
                    in{" "}
                    <span className="text-[#252B68]">
                      {categoryConfig(activeCategory).label}
                    </span>
                  </>
                )}
                {search && (
                  <>
                    {" "}
                    matching <span className="text-[#252B68]">&ldquo;{search}&rdquo;</span>
                  </>
                )}
              </p>

              <div className="grid items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((policy) => {
                  const cat = categoryConfig(policy.category);
                  const CatIcon = cat.icon;
                  const hasFile = Boolean(policy.file_url);
                  const displayDescription = truncateWords(
                    policy.description,
                    MAX_DESCRIPTION_WORDS
                  );

                  return (
                    <article
                      key={policy.id}
                      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#252B68]/30 hover:shadow-xl"
                    >
                      <div
                        className="h-1.5 w-full"
                        style={{ backgroundColor: cat.accent }}
                      />

                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white"
                            style={{ backgroundColor: cat.accent }}
                          >
                            <CatIcon size={10} />
                            {cat.label}
                          </span>
                          {policy.version && (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                              v{policy.version.replace(/^v/i, "")}
                            </span>
                          )}
                        </div>

                        <div className="mt-4 flex items-start gap-3">
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                            style={{ backgroundColor: cat.accent }}
                          >
                            <CatIcon size={20} />
                          </div>
                          <h3 className="text-lg font-black leading-tight text-[#252B68]">
                            {policy.title}
                          </h3>
                        </div>

                        {displayDescription && (
                          <p className="mt-3 flex-1 whitespace-pre-line text-sm leading-6 text-slate-600">
                            {displayDescription}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-500">
                          {policy.effective_date && (
                            <span className="inline-flex items-center gap-1">
                              <Calendar size={11} />
                              Effective {fmtDate(policy.effective_date)}
                            </span>
                          )}
                          {policy.file_size != null && (
                            <span className="inline-flex items-center gap-1">
                              <FileText size={11} />
                              {fmtFileSize(policy.file_size)}
                            </span>
                          )}
                        </div>

                        {hasFile ? (
                          <div className="mt-5 flex gap-2">
                            <a
                              href={policy.file_url ?? "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group/btn inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#252B68] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1c2156]"
                            >
                              <ExternalLink size={14} />
                              View
                            </a>
                            <a
                              href={policy.file_url ?? "#"}
                              download={policy.file_name ?? undefined}
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-[#F58220] bg-white px-4 py-2.5 text-sm font-bold text-[#F58220] transition hover:bg-[#F58220] hover:text-white"
                            >
                              <Download size={14} />
                              Download
                            </a>
                          </div>
                        ) : (
                          <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-2.5 text-center text-xs font-semibold text-slate-400">
                            File coming soon
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* =====================================================
          INFO STRIP
      ====================================================== */}
      <section className="relative overflow-hidden bg-[#FDF9EE] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#F58220]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#F58220]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              Our Commitment
            </p>
            <h2 className="mt-4 text-3xl font-black text-[#252B68] sm:text-4xl">
              Open, honest, and ready to share.
            </h2>
            <p className="mt-5 leading-8 text-slate-600">
              We believe families should always be able to see how our school
              operates. Every policy below is the current version in use — if
              you need an older version or one that isn&apos;t listed yet,
              please contact the school office.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Safeguarding first",
                text: "Every member of our community is protected by clear, current safeguarding procedures.",
                accent: "#DC2626",
              },
              {
                icon: CheckCircle2,
                title: "Always up to date",
                text: "Policies are reviewed regularly and updated the moment changes are approved.",
                accent: "#16A34A",
              },
              {
                icon: FileText,
                title: "Easy to download",
                text: "Every document is available as a PDF or Word file — no account required.",
                accent: "#252B68",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md transition group-hover:scale-110"
                    style={{ backgroundColor: item.accent }}
                  >
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-4 text-lg font-black text-[#252B68]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          CTA
      ====================================================== */}
      <section className="relative isolate overflow-hidden bg-[#252B68] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#FFE900]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-[30rem] w-[30rem] rounded-full bg-[#F58220]/20 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#FFE900]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
            Can&rsquo;t find what you need?
          </p>
          <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">
            We&rsquo;re here to help.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-blue-100">
            If a policy you&rsquo;re looking for isn&rsquo;t listed here, or
            you need a specific version, please reach out to the school office
            and we&rsquo;ll send it to you directly.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#F58220] px-7 py-3.5 font-black text-white shadow-xl transition hover:-translate-y-1 hover:bg-[#d96e12] hover:shadow-2xl"
            >
              Contact the School
              <span className="transition group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="/admissions"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/30 bg-white/10 px-7 py-3.5 font-black text-white backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white hover:text-[#252B68]"
            >
              Apply for Admission
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}