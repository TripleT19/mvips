"use client";

import ImageWithFallback from "../../components/ImageWithFallback";
import NewsletterSubscribeForm from "../../components/NewsletterSubscribeForm";
import {
  ArrowRight,
  Calendar,
  Download,
  FileText,
  Loader2,
  Search,
  Star,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

/* =========================================================
   API / HELPERS
========================================================= */

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "") ||
  "http://127.0.0.1:8000";

type Newsletter = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  term: string | null;
  year: number;
  published_on: string | null;
  file_url: string | null;
  file_original_name: string | null;
  file_size: number | null;
  cover_image_url: string | null;
  featured: boolean;
};

type ApiResponse = {
  success: boolean;
  data: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    data: Newsletter[];
  };
  years: number[];
  terms: string[];
};

function resolveUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const trimmed = url.startsWith("/") ? url : `/${url}`;
  return `${API_URL}${trimmed}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function fileSize(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* =========================================================
   PAGE
========================================================= */

export default function NewslettersPage() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  const [selected, setSelected] = useState<Newsletter | null>(null);

  /* ---------------------------------------------------------
     Load
     --------------------------------------------------------- */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        params.set("per_page", "100");
        if (search.trim()) params.set("search", search.trim());
        if (yearFilter) params.set("year", yearFilter);

        const res = await fetch(
          `${API_URL}/api/newsletters?${params.toString()}`,
          { cache: "no-store" }
        );

        const json = (await res.json()) as ApiResponse;

        if (!res.ok) {
          throw new Error("Unable to load newsletters.");
        }

        if (!cancelled) {
          setNewsletters(json.data?.data ?? []);
          setYears(json.years ?? []);
          setTotal(json.data?.total ?? 0);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const message =
            e instanceof Error ? e.message : "Unable to load newsletters.";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const t = setTimeout(load, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search, yearFilter]);

  /* Grouped by year */
  const groupedByYear = useMemo(() => {
    return newsletters.reduce<Record<number, Newsletter[]>>((acc, n) => {
      if (!acc[n.year]) acc[n.year] = [];
      acc[n.year].push(n);
      return acc;
    }, {});
  }, [newsletters]);

  const sortedYears = useMemo(
    () =>
      Object.keys(groupedByYear)
        .map((y) => parseInt(y, 10))
        .sort((a, b) => b - a),
    [groupedByYear]
  );

  const featured = useMemo(
    () => newsletters.find((n) => n.featured) ?? newsletters[0] ?? null,
    [newsletters]
  );

  /* Lock body scroll when modal is open */
  useEffect(() => {
    if (!selected) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selected]);

  /* Escape closes modal */
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  return (
    <main className="overflow-hidden bg-white text-[#172033]">
      {/* ---------- shared animation styles ---------- */}
      <style>{`
        @keyframes mv-float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-16px) rotate(8deg)} }
        @keyframes mv-float-alt { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(14px) rotate(-8deg)} }
        @keyframes mv-blob { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(24px,-28px) scale(1.1)} 66%{transform:translate(-20px,18px) scale(.94)} }
        @keyframes mv-pop { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
        @keyframes mv-marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }

        .mv-float{animation:mv-float 6s ease-in-out infinite}
        .mv-float-alt{animation:mv-float-alt 7s ease-in-out infinite}
        .mv-blob{animation:mv-blob 16s ease-in-out infinite}
        .mv-pop{animation:mv-pop 3.5s ease-in-out infinite}
        .mv-marquee{animation:mv-marquee 40s linear infinite}

        @media (prefers-reduced-motion: reduce){
          .mv-float,.mv-float-alt,.mv-blob,.mv-pop,.mv-marquee{animation:none}
        }
      `}</style>

      {/* =========================================================
          HERO
      ========================================================== */}
      <section className="relative isolate overflow-hidden bg-[#252B68]">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="mv-blob absolute -right-40 -top-40 z-0 h-[32rem] w-[32rem] rounded-full bg-[#FFE900]/15 blur-3xl" />
          <div className="mv-blob absolute -bottom-48 -left-40 z-0 h-[32rem] w-[32rem] rounded-full bg-[#F58220]/25 blur-3xl [animation-delay:-6s]" />
          <div className="absolute left-1/3 top-1/4 h-64 w-64 rounded-full bg-[#4a55b8]/30 blur-3xl" />
        </div>

        {/* floating emoji cliparts */}
        <span className="mv-float pointer-events-none absolute left-[4%] top-[20%] z-0 text-4xl opacity-80 sm:text-5xl">
          📰
        </span>
        <span className="mv-float-alt pointer-events-none absolute right-[6%] top-[14%] z-0 text-4xl opacity-80 sm:text-5xl">
          📄
        </span>
        <span className="mv-float pointer-events-none absolute left-[8%] bottom-[14%] z-0 text-3xl opacity-70 sm:text-4xl">
          ✨
        </span>
        <span className="mv-float-alt pointer-events-none absolute right-[10%] bottom-[16%] z-0 text-3xl opacity-70 sm:text-4xl">
          🎉
        </span>
        <span className="mv-pop pointer-events-none absolute left-[55%] top-[8%] hidden text-2xl opacity-60 lg:block">
          🏆
        </span>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left: copy */}
            <div>
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-[#FFE900] backdrop-blur">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#FFE900]" />
                Newsletters · Mount View International
              </div>

              <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Stay up to date with{" "}
                <span className="relative inline-block text-[#FFE900]">
                  every term.
                  <svg
                    className="absolute -bottom-2 left-0 w-full text-[#F58220]"
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

              <p className="mt-7 max-w-2xl text-lg leading-8 text-blue-100 sm:text-xl">
                Download our latest newsletters to catch up on school news,
                events, achievements and everything happening in our
                community. Subscribe to receive each new edition by email.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full bg-[#F58220] px-5 py-2.5 text-sm font-bold text-white shadow-lg">
                  School News
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20">
                  Achievements
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20">
                  Events
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20">
                  Community
                </span>
              </div>

              <div className="mt-9 grid max-w-xl grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition hover:-translate-y-1 hover:border-[#FFE900]/40 hover:bg-white/10">
                  <p className="text-2xl font-black text-[#FFE900]">{total}</p>
                  <p className="mt-1 text-xs font-semibold text-blue-100">
                    Newsletters
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition hover:-translate-y-1 hover:border-[#FFE900]/40 hover:bg-white/10">
                  <p className="text-2xl font-black text-[#FFE900]">
                    {years.length || "—"}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-blue-100">
                    Years
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition hover:-translate-y-1 hover:border-[#FFE900]/40 hover:bg-white/10">
                  <p className="text-2xl font-black text-[#FFE900]">PDF</p>
                  <p className="mt-1 text-xs font-semibold text-blue-100">
                    Format
                  </p>
                </div>
              </div>
            </div>

            {/* Right: subscribe */}
            <div id="subscribe" className="scroll-mt-24">
              <NewsletterSubscribeForm variant="dark" />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          MARQUEE STRIP
      ========================================================== */}
      <section className="overflow-hidden border-y border-slate-200 bg-white py-4">
        <div className="mv-marquee flex w-max gap-10 whitespace-nowrap">
          {[
            "Latest Editions",
            "Termly Round-Ups",
            "School News",
            "Achievements",
            "Events & Trips",
            "Community Stories",
            "Sports Updates",
            "Creative Arts",
            "Latest Editions",
            "Termly Round-Ups",
            "School News",
            "Achievements",
            "Events & Trips",
            "Community Stories",
            "Sports Updates",
            "Creative Arts",
          ].map((item, i) => (
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

      {/* =========================================================
          FEATURED EDITION
      ========================================================== */}
      {featured && (
        <section className="relative overflow-hidden bg-slate-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="pointer-events-none absolute inset-0">
            <div className="mv-blob absolute -left-24 top-40 h-72 w-72 rounded-full bg-[#FFE900]/20 blur-3xl" />
            <div className="mv-blob absolute -right-24 bottom-40 h-72 w-72 rounded-full bg-[#F58220]/15 blur-3xl [animation-delay:-6s]" />
          </div>

          <div className="relative mx-auto max-w-7xl">
            <div className="mb-10 text-center">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#F58220]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#F58220]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                Latest Edition
              </p>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl">
                Fresh off the press.
              </h2>
            </div>

            <div className="relative isolate overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-slate-100 lg:grid lg:grid-cols-[0.85fr_1.15fr]">
              {/* Cover */}
              <div className="relative isolate">
                <div className="relative h-full min-h-[320px] w-full">
                  {featured.cover_image_url ? (
                    <ImageWithFallback
                      src={resolveUrl(featured.cover_image_url)}
                      alt={featured.title}
                      className="h-full min-h-[320px] w-full"
                    />
                  ) : (
                    <div className="flex h-full min-h-[320px] w-full items-center justify-center bg-gradient-to-br from-[#252B68] to-[#171B4A]">
                      <div className="text-center">
                        <p className="text-6xl">📄</p>
                        <p className="mt-4 text-sm font-black uppercase tracking-widest text-[#FFE900]">
                          Newsletter
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#0B0F2E]/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-white/10" />

                  <div className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full bg-[#FFE900] px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#252B68] shadow-lg">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#F58220]" />
                    Latest
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="relative p-8 sm:p-10 lg:p-12">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#F58220]">
                  {featured.term ? `${featured.term} · ` : ""}
                  {featured.year}
                </p>

                <h3 className="mt-3 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl">
                  {featured.title}
                </h3>

                {featured.description && (
                  <p className="mt-5 leading-8 text-slate-600">
                    {featured.description}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap gap-2">
                  {featured.published_on && (
                    <span className="rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700">
                      📅 {formatDate(featured.published_on)}
                    </span>
                  )}

                  {featured.file_size && (
                    <span className="rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700">
                      📄 {fileSize(featured.file_size)}
                    </span>
                  )}

                  <span className="rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700">
                    🖨 PDF
                  </span>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setSelected(featured)}
                    className="group inline-flex items-center gap-2 rounded-full bg-[#F58220] px-6 py-3.5 font-black text-white shadow-lg shadow-[#F58220]/30 transition hover:-translate-y-1 hover:bg-[#d96e12] hover:shadow-xl"
                  >
                    View Details
                    <ArrowRight
                      size={16}
                      className="transition group-hover:translate-x-1"
                    />
                  </button>

                  <a
                    href={`${API_URL}/api/newsletters/${featured.slug}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border-2 border-[#252B68]/20 px-6 py-3.5 font-black text-[#252B68] transition hover:-translate-y-1 hover:border-[#252B68] hover:bg-[#252B68] hover:text-white"
                  >
                    <Download size={16} />
                    Download PDF
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================
          ARCHIVE
      ========================================================== */}
      <section
        id="archive"
        className="relative scroll-mt-24 overflow-hidden bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="mv-blob absolute -left-24 top-40 h-72 w-72 rounded-full bg-[#FFE900]/15 blur-3xl" />
          <div className="mv-blob absolute -right-24 bottom-40 h-72 w-72 rounded-full bg-[#F58220]/10 blur-3xl [animation-delay:-8s]" />
        </div>

        <span className="mv-float pointer-events-none absolute left-[4%] top-16 text-5xl opacity-15">
          📚
        </span>
        <span className="mv-float-alt pointer-events-none absolute right-[4%] bottom-16 text-5xl opacity-15">
          🗂
        </span>

        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#F58220]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#F58220]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              Newsletter Archive
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl">
              Every edition, one click away.
            </h2>

            <p className="mt-5 leading-8 text-slate-600">
              Browse by year or search by title. Click any edition to view
              details and download the PDF.
            </p>
          </div>

          {/* Filters */}
          <div className="mx-auto mt-10 grid max-w-2xl gap-3 sm:grid-cols-[1fr_180px]">
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search newsletters…"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10"
              />
            </div>

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10"
            >
              <option value="">All years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Loading / error / empty */}
          {loading && (
            <div className="mt-16 flex justify-center">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Loader2 size={20} className="animate-spin text-[#F58220]" />
                Loading newsletters…
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="mt-16 rounded-[2rem] border border-red-200 bg-red-50 p-8 text-center text-red-800">
              {error}
            </div>
          )}

          {!loading && !error && newsletters.length === 0 && (
            <div className="mt-16 rounded-[2rem] border border-slate-200 bg-slate-50 p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
                📭
              </div>
              <h3 className="mt-5 text-xl font-black text-[#252B68]">
                No newsletters yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-600">
                New editions will appear here as soon as they&apos;re
                published. Subscribe above and you&apos;ll get an email when
                they are.
              </p>
              <a
                href="#subscribe"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#F58220] px-6 py-3 font-black text-white transition hover:-translate-y-1 hover:bg-[#d96e12] hover:shadow-lg"
              >
                Subscribe for Updates
                <ArrowRight size={16} />
              </a>
            </div>
          )}

          {/* Year groups */}
          {!loading &&
            !error &&
            sortedYears.map((year) => (
              <div key={year} className="mt-14">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#252B68] text-sm font-black text-[#FFE900]">
                    {String(year).slice(-2)}
                  </div>

                  <div>
                    <p className="text-2xl font-black text-[#252B68]">
                      {year}
                    </p>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      {groupedByYear[year].length}{" "}
                      {groupedByYear[year].length === 1
                        ? "Edition"
                        : "Editions"}
                    </p>
                  </div>

                  <div className="ml-2 h-px flex-1 bg-slate-200" />
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {groupedByYear[year].map((newsletter) => (
                    <button
                      key={newsletter.id}
                      type="button"
                      onClick={() => setSelected(newsletter)}
                      className="group relative isolate flex flex-col overflow-hidden rounded-[2rem] bg-white text-left shadow-lg ring-1 ring-slate-100 transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
                    >
                      {/* Cover */}
                      <div className="relative isolate aspect-[16/10] w-full overflow-hidden bg-slate-100">
                        {newsletter.cover_image_url ? (
                          <ImageWithFallback
                            src={resolveUrl(newsletter.cover_image_url)}
                            alt={newsletter.title}
                            className="h-full w-full transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#252B68] via-[#252B68] to-[#171B4A]">
                            <div className="text-center">
                              <p className="text-5xl">📄</p>
                            </div>
                          </div>
                        )}

                        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

                        {newsletter.term && (
                          <span className="absolute left-4 top-4 z-20 inline-flex items-center rounded-full bg-[#FFE900] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#252B68] shadow-md">
                            {newsletter.term}
                          </span>
                        )}

                        {newsletter.featured && (
                          <span className="absolute right-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full bg-[#F58220] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-md">
                            <Star size={11} className="fill-white" />
                            Featured
                          </span>
                        )}
                      </div>

                      {/* Body */}
                      <div className="flex flex-1 flex-col p-6">
                        <p className="text-[11px] font-black uppercase tracking-widest text-[#F58220]">
                          {formatDate(newsletter.published_on) || year}
                        </p>

                        <h3 className="mt-2 line-clamp-2 text-xl font-black text-[#252B68]">
                          {newsletter.title}
                        </h3>

                        {newsletter.description && (
                          <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">
                            {newsletter.description}
                          </p>
                        )}

                        <div className="mt-auto pt-5">
                          <div className="mb-4 flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            <span className="inline-flex items-center gap-1.5">
                              <FileText size={11} />
                              PDF
                            </span>
                            {newsletter.file_size && (
                              <span>{fileSize(newsletter.file_size)}</span>
                            )}
                          </div>

                          <div className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#252B68] px-5 py-3 text-sm font-black text-white transition group-hover:bg-[#F58220]">
                            View Details
                            <ArrowRight
                              size={15}
                              className="transition group-hover:translate-x-1"
                            />
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* =========================================================
          NEVER MISS AN EDITION
      ========================================================== */}
      <section
        id="subscribe-section"
        className="relative scroll-mt-24 overflow-hidden bg-slate-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      >
        <span className="mv-float pointer-events-none absolute left-[6%] top-12 text-5xl opacity-20">
          📨
        </span>
        <span className="mv-float-alt pointer-events-none absolute right-[6%] bottom-12 text-5xl opacity-20">
          🔔
        </span>

        <div className="relative mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#FFE900] p-8 shadow-2xl sm:p-12 lg:p-16">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#F58220]/30 blur-3xl" />

            <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-[#252B68]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#252B68]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                  Never Miss an Edition
                </p>

                <h2 className="mt-4 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl">
                  Get every newsletter straight to your inbox.
                </h2>

                <p className="mt-5 max-w-xl text-lg leading-8 text-[#252B68]/80">
                  Enter your email below and we&apos;ll deliver every new
                  edition as soon as it&apos;s published. No spam, and you can
                  unsubscribe any time with one click.
                </p>

                <div className="mt-8">
                  <NewsletterSubscribeForm variant="light" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="group rounded-2xl bg-white/70 p-5 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-lg">
                  <p className="text-3xl transition group-hover:scale-110">
                    📨
                  </p>
                  <p className="mt-3 text-sm font-black text-[#252B68]">
                    Email Delivery
                  </p>
                  <p className="mt-1 text-xs text-[#252B68]/70">
                    Every edition to your inbox
                  </p>
                </div>

                <div className="group rounded-2xl bg-white/70 p-5 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-lg">
                  <p className="text-3xl transition group-hover:scale-110">
                    📄
                  </p>
                  <p className="mt-3 text-sm font-black text-[#252B68]">
                    PDF Format
                  </p>
                  <p className="mt-1 text-xs text-[#252B68]/70">
                    Easy to read, print and share
                  </p>
                </div>

                <div className="group rounded-2xl bg-white/70 p-5 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-lg">
                  <p className="text-3xl transition group-hover:scale-110">
                    🗂
                  </p>
                  <p className="mt-3 text-sm font-black text-[#252B68]">
                    Full Archive
                  </p>
                  <p className="mt-1 text-xs text-[#252B68]/70">
                    Browse every past edition
                  </p>
                </div>

                <div className="group rounded-2xl bg-white/70 p-5 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-lg">
                  <p className="text-3xl transition group-hover:scale-110">
                    🔔
                  </p>
                  <p className="mt-3 text-sm font-black text-[#252B68]">
                    Stay Informed
                  </p>
                  <p className="mt-1 text-xs text-[#252B68]/70">
                    News, events and reminders
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          ADMISSIONS CTA
      ========================================================== */}
      <section className="relative isolate overflow-hidden bg-[#252B68] py-20 sm:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="mv-blob absolute -right-40 -top-40 z-0 h-96 w-96 rounded-full bg-[#F58220]/20 blur-3xl" />
          <div className="mv-blob absolute -bottom-40 -left-40 z-0 h-96 w-96 rounded-full bg-[#FFE900]/15 blur-3xl [animation-delay:-6s]" />
        </div>

        <span className="mv-float pointer-events-none absolute left-[8%] top-10 text-4xl opacity-30">
          🎓
        </span>
        <span className="mv-float-alt pointer-events-none absolute right-[8%] bottom-10 text-4xl opacity-30">
          💛
        </span>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#FFE900]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                Join Our Community
              </p>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                Be part of the Mount View story.
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100">
                Discover a school where your child can learn, grow and thrive —
                and stay connected to every milestone through our newsletters.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/admissions"
                  className="group inline-flex items-center justify-center rounded-full bg-[#F58220] px-8 py-4 font-black text-white shadow-lg transition hover:-translate-y-1 hover:bg-[#d96e12] hover:shadow-xl"
                >
                  Explore Admissions
                  <span className="ml-2 inline-block transition group-hover:translate-x-1">
                    →
                  </span>
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 font-bold text-white backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white hover:text-[#252B68]"
                >
                  Make an Enquiry
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-7 backdrop-blur-sm sm:p-9">
              <div className="mv-pop flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFE900] text-2xl text-[#252B68]">
                ♡
              </div>

              <h3 className="mt-6 text-2xl font-black text-white">
                Fostering growth, excellence and empathy.
              </h3>

              <p className="mt-4 leading-8 text-blue-100">
                Our newsletters celebrate the everyday moments — from classroom
                breakthroughs to sports victories — that shape our school
                community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          BRAND STRIP
      ========================================================== */}
      <section className="relative overflow-hidden bg-[#171B4A] px-4 py-10 text-center">
        <span className="mv-float pointer-events-none absolute left-[15%] top-1/2 -translate-y-1/2 text-3xl opacity-30">
          ✨
        </span>
        <span className="mv-float-alt pointer-events-none absolute right-[15%] top-1/2 -translate-y-1/2 text-3xl opacity-30">
          📰
        </span>
        <p className="relative text-lg font-black text-[#FFE900] sm:text-xl">
          Fostering growth, excellence and empathy.
        </p>

        <p className="relative mt-2 text-sm text-blue-200">
          Established in 1975 · Mount View International Primary School & Early
          Years Centre
        </p>
      </section>

      {/* =========================================================
          DETAILS MODAL
      ========================================================== */}
      {selected && (
        <NewsletterDetailsModal
          newsletter={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </main>
  );
}

/* =========================================================
   MODAL
========================================================= */

function NewsletterDetailsModal({
  newsletter,
  onClose,
}: {
  newsletter: Newsletter;
  onClose: () => void;
}) {
  const downloadUrl = `${API_URL}/api/newsletters/${newsletter.slug}/download`;
  const coverUrl = resolveUrl(newsletter.cover_image_url);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${newsletter.title} details`}
    >
      <div
        className="relative my-4 w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-30 rounded-full bg-white/95 p-2 text-slate-600 shadow-md transition hover:bg-white hover:text-[#252B68]"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Cover */}
        <div className="relative isolate h-56 w-full overflow-hidden bg-gradient-to-br from-[#252B68] to-[#171B4A] sm:h-72">
          {coverUrl ? (
            <ImageWithFallback
              src={coverUrl}
              alt={newsletter.title}
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="text-center">
                <p className="text-6xl">📄</p>
                <p className="mt-4 text-sm font-black uppercase tracking-widest text-[#FFE900]">
                  Mount View Newsletter
                </p>
              </div>
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#0B0F2E]/90 via-[#0B0F2E]/30 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 z-20 p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              {newsletter.term && (
                <span className="inline-flex items-center rounded-full bg-[#FFE900] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#252B68] shadow-md">
                  {newsletter.term}
                </span>
              )}

              {newsletter.featured && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F58220] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-md">
                  <Star size={11} className="fill-white" />
                  Featured
                </span>
              )}

              <span className="inline-flex items-center rounded-full border border-white/20 bg-black/30 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white backdrop-blur-md">
                {newsletter.year}
              </span>
            </div>

            <h2 className="mt-3 text-2xl font-black leading-tight text-white sm:text-3xl">
              {newsletter.title}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 pb-5 text-xs font-bold uppercase tracking-wider text-slate-500">
            <span className="inline-flex items-center gap-2">
              <Calendar size={13} className="text-[#F58220]" />
              {formatDate(newsletter.published_on) || "—"}
            </span>

            <span className="inline-flex items-center gap-2">
              <FileText size={13} className="text-[#F58220]" />
              PDF · {fileSize(newsletter.file_size) || "—"}
            </span>
          </div>

          {newsletter.description ? (
            <p className="mt-6 whitespace-pre-line leading-8 text-slate-600">
              {newsletter.description}
            </p>
          ) : (
            <p className="mt-6 leading-8 text-slate-600">
              Download this edition to catch up on school news, events and
              achievements from {newsletter.term || newsletter.year}.
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#F58220] px-6 py-4 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#d96e12] hover:shadow-xl"
            >
              <Download size={17} />
              Download PDF
            </a>

            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#252B68]/20 px-6 py-4 font-black text-[#252B68] transition hover:-translate-y-0.5 hover:border-[#252B68] hover:bg-[#252B68] hover:text-white"
            >
              <FileText size={17} />
              Open in New Tab
            </a>
          </div>

          {newsletter.file_original_name && (
            <p className="mt-4 text-center text-xs text-slate-400">
              {newsletter.file_original_name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}