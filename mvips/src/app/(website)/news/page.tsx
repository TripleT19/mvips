"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  Newspaper,
  X,
  Users,
} from "lucide-react";

/* ============================================================
 * API CONFIG
 * ============================================================ */
const API_URL =
  (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "") ||
  "http://127.0.0.1:8000";

/* ============================================================
 * TYPES
 * ============================================================ */

type CategoryValue =
  | string
  | { id?: number | string; name?: string; title?: string; slug?: string }
  | null
  | undefined;

type ClassValue =
  | string
  | { id?: number | string; name?: string; title?: string; slug?: string }
  | null
  | undefined;

type Story = {
  id: number | string;
  title: string;
  slug: string;
  category?: CategoryValue;
  excerpt?: string | null;
  description?: string | null;
  content?: string | null;
  image?: string | null;
  image_path?: string | null;
  image_url?: string | null;
  featured?: boolean | number | null;
  author?: string | null;
  published_at?: string | null;
  event_date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  class_name?: ClassValue;
};

type Event = {
  id: number | string;
  title: string;
  slug: string;
  description?: string | null;
  location?: string | null;
  class_name?: ClassValue;
  event_date: string;
  start_time?: string | null;
  end_time?: string | null;
  image?: string | null;
  image_path?: string | null;
  image_url?: string | null;
  featured?: boolean | number | null;
  status?: string | null;
  author?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

/* ============================================================
 * SAFE FETCH + EXTRACTOR
 * ============================================================ */

async function safeFetchJson(path: string): Promise<unknown> {
  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      console.error(`[news] ${url} responded ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (err) {
    console.error(`[news] Failed to fetch ${url}:`, err);
    return null;
  }
}

function extractArray<T = unknown>(payload: unknown): T[] {
  if (!payload) return [];
  const p = payload as Record<string, unknown>;

  if (p.data && typeof p.data === "object" && !Array.isArray(p.data)) {
    const inner = (p.data as Record<string, unknown>).data;
    if (Array.isArray(inner)) return inner as T[];
  }
  if (Array.isArray(p.data)) return p.data as T[];
  for (const key of ["stories", "events", "items", "results", "data"]) {
    const value = p[key];
    if (Array.isArray(value)) return value as T[];
  }
  if (Array.isArray(payload)) return payload as T[];
  return [];
}

/* ============================================================
 * FORMATTERS
 * ============================================================ */

function getCategoryName(category: CategoryValue): string {
  if (!category) return "";
  if (typeof category === "string") return category;
  if (typeof category === "object") {
    return category.name || category.title || category.slug || "";
  }
  return "";
}

function getClassName(className: ClassValue): string {
  if (!className) return "";
  if (typeof className === "string") return className;
  if (typeof className === "object") {
    return className.name || className.title || className.slug || "";
  }
  return "";
}

function formatDate(dateValue: string | null | undefined): string {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue.substring(0, 10);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(dateValue: string | null | undefined): string {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue.substring(0, 10);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(time: string | null | undefined): string {
  if (!time) return "";
  const parts = time.split(":");
  if (parts.length < 2) return time;
  const hours = Number(parts[0]);
  const minutes = parts[1];
  if (Number.isNaN(hours)) return time;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes} ${suffix}`;
}

function getImageUrl(image: string | null | undefined): string | null {
  if (!image) return null;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/")) return `${API_URL}${image}`;
  return `${API_URL}/storage/${image}`;
}

/* ============================================================
 * CONTENT RENDERING
 * ============================================================ */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function decodeCommonEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function looksLikeHtml(text: string): boolean {
  return /<\/?(p|div|br|h[1-6]|ul|ol|li|a|strong|em|b|i|u|span|img|blockquote|pre|code|table|thead|tbody|tr|td|th|hr)\b/i.test(
    text
  );
}

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}

function stripExcessiveBoldHtml(html: string): string {
  const totalText = html.replace(/<[^>]*>/g, "").trim();
  if (!totalText) return html;

  const boldPattern = /<(?:strong|b)\b[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi;
  let boldText = "";
  let match: RegExpExecArray | null;
  while ((match = boldPattern.exec(html)) !== null) {
    boldText += match[1].replace(/<[^>]*>/g, "");
  }
  boldText = boldText.trim();

  if (boldText.length / totalText.length > 0.7) {
    return html.replace(/<\/?(?:strong|b)\b[^>]*>/gi, "");
  }
  return html;
}

function stripMarkdownBold(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, "$1");
}

function normaliseNewlines(text: string): string {
  return text
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}

function plainTextToHtml(text: string): string {
  const clean = stripMarkdownBold(text);
  const hasDoubleNewlines = /\n\s*\n/.test(clean);

  let blocks: string[];

  if (hasDoubleNewlines) {
    blocks = clean.split(/\n\s*\n/);
  } else if (clean.includes("\n")) {
    blocks = clean.split("\n");
  } else {
    blocks = [clean];
  }

  blocks = blocks.map((b) => b.trim()).filter(Boolean);

  if (blocks.length === 1 && blocks[0].length > 400) {
    const long = blocks[0];
    const sentences = long
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const grouped: string[] = [];
    const perGroup = 3;
    for (let i = 0; i < sentences.length; i += perGroup) {
      grouped.push(sentences.slice(i, i + perGroup).join(" "));
    }

    if (grouped.length > 1) {
      blocks = grouped;
    } else {
      const wrap = 350;
      const broken: string[] = [];
      let buf = long;
      while (buf.length > wrap) {
        const cut = buf.lastIndexOf(" ", wrap);
        if (cut === -1) break;
        broken.push(buf.slice(0, cut).trim());
        buf = buf.slice(cut + 1).trim();
      }
      if (buf) broken.push(buf);
      if (broken.length > 1) blocks = broken;
    }
  }

  return blocks
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function formatContent(raw: string | null | undefined): string {
  let text = raw ?? "";
  text = normaliseNewlines(text).trim();
  if (!text) return "";
  if (looksLikeHtml(text)) {
    return stripExcessiveBoldHtml(sanitizeHtml(text));
  }
  text = decodeCommonEntities(text);
  return plainTextToHtml(text);
}

function formatExcerpt(raw: string | null | undefined): string {
  if (!raw) return "";
  const text = normaliseNewlines(String(raw));
  if (looksLikeHtml(text)) {
    return sanitizeHtml(text).replace(/<[^>]*>/g, "").trim();
  }
  return stripMarkdownBold(decodeCommonEntities(text)).trim();
}

function getStoryDate(story: Story): string {
  return (
    story.published_at ||
    story.event_date ||
    story.created_at ||
    story.updated_at ||
    ""
  );
}

/* ============================================================
 * PAGE CONTENT
 * ============================================================ */

function NewsPageContent() {
  const searchParams = useSearchParams();

  const [stories, setStories] = useState<Story[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  /* ---------- auto-open from ?story= / ?event= ---------- */
  const autoOpenedParam = useRef<string | null>(null);

  useEffect(() => {
    if (loadingStories || loadingEvents) return;

    const storySlug = searchParams.get("story");
    const eventSlug = searchParams.get("event");
    const paramKey = storySlug
      ? `story:${storySlug}`
      : eventSlug
      ? `event:${eventSlug}`
      : null;

    if (!paramKey || autoOpenedParam.current === paramKey) return;

    if (storySlug) {
      const found = stories.find((s) => s.slug === storySlug);
      if (found) {
        setSelectedStory(found);
        autoOpenedParam.current = paramKey;
      }
    } else if (eventSlug) {
      const found = events.find((e) => e.slug === eventSlug);
      if (found) {
        setSelectedEvent(found);
        autoOpenedParam.current = paramKey;
      }
    }
  }, [loadingStories, loadingEvents, stories, events, searchParams]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedStory(null);
        setSelectedEvent(null);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    if (selectedStory || selectedEvent) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedStory, selectedEvent]);

  useEffect(() => {
    let mounted = true;

    async function loadNews() {
      try {
        setLoadingStories(true);
        const json = await safeFetchJson(
          `/api/stories?status=published&per_page=50`
        );
        if (!mounted) return;
        setStories(extractArray<Story>(json));
        if (!json) {
          setError(
            "We could not load the latest school news. Please try again shortly."
          );
        }
      } finally {
        if (mounted) setLoadingStories(false);
      }
    }

    async function loadEvents() {
      try {
        setLoadingEvents(true);
        const json = await safeFetchJson(`/api/events?per_page=50`);
        if (!mounted) return;
        setEvents(extractArray<Event>(json));
      } finally {
        if (mounted) setLoadingEvents(false);
      }
    }

    loadNews();
    loadEvents();

    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const names = stories
      .map((s) => getCategoryName(s.category))
      .filter(Boolean);
    return ["All", ...Array.from(new Set(names))];
  }, [stories]);

  const filteredStories = useMemo(() => {
    if (selectedCategory === "All") return stories;
    return stories.filter(
      (story) => getCategoryName(story.category) === selectedCategory
    );
  }, [stories, selectedCategory]);

  const featuredStory = useMemo(() => {
    return (
      filteredStories.find((s) => Boolean(s.featured)) ||
      filteredStories[0] ||
      null
    );
  }, [filteredStories]);

  const latestStories = useMemo(() => {
    if (!featuredStory) return filteredStories;
    return filteredStories.filter((s) => s.id !== featuredStory.id);
  }, [filteredStories, featuredStory]);

  const upcomingEvents = useMemo(() => {
    return [...events]
      .sort(
        (a, b) =>
          new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      )
      .slice(0, 6);
  }, [events]);

  return (
    <>
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

        {/* =====================================================
            HERO
        ====================================================== */}
        <section className="relative overflow-hidden bg-[#252B68]">
          <div className="pointer-events-none absolute inset-0">
            <div className="mv-blob absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#FFE900]/15 blur-3xl" />
            <div className="mv-blob absolute -bottom-40 right-0 h-[30rem] w-[30rem] rounded-full bg-[#F58220]/25 blur-3xl [animation-delay:-6s]" />
            <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-[#4a55b8]/40 blur-3xl" />
          </div>

          <span className="mv-float pointer-events-none absolute left-[5%] top-[18%] z-0 text-4xl opacity-80 sm:text-5xl">
            📰
          </span>
          <span className="mv-float-alt pointer-events-none absolute right-[6%] top-[12%] z-0 text-4xl opacity-80 sm:text-5xl">
            📅
          </span>
          <span className="mv-float pointer-events-none absolute left-[10%] bottom-[16%] z-0 text-3xl opacity-70 sm:text-4xl">
            ✨
          </span>
          <span className="mv-float-alt pointer-events-none absolute right-[10%] bottom-[14%] z-0 text-3xl opacity-70 sm:text-4xl">
            🎉
          </span>
          <span className="mv-pop pointer-events-none absolute left-1/2 top-[8%] hidden text-2xl opacity-60 lg:block">
            🏆
          </span>

          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-[#FFE900] backdrop-blur">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#FFE900]" />
                Mount View News &amp; Events
              </div>

              <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                What&apos;s happening at{" "}
                <span className="relative inline-block text-[#FFE900]">
                  Mount View?
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
                Discover the latest news, achievements, celebrations and
                upcoming events from Mount View International Primary School
                &amp; Early Years Centre.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full bg-[#F58220] px-5 py-2.5 text-sm font-bold text-white shadow-lg">
                  Fostering growth
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20">
                  Building excellence
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20">
                  Sharing our story
                </span>
              </div>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <a
                  href="#news"
                  className="group rounded-full bg-[#F58220] px-7 py-4 text-center font-black text-white shadow-xl transition hover:-translate-y-1 hover:bg-[#d96e12] hover:shadow-2xl"
                >
                  Latest News
                  <span className="ml-2 inline-block transition group-hover:translate-x-1">
                    ↓
                  </span>
                </a>
                <a
                  href="#events"
                  className="rounded-full border-2 border-white/30 bg-white/10 px-7 py-4 text-center font-black text-white backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white hover:text-[#252B68]"
                >
                  Upcoming Events
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            MARQUEE STRIP
        ====================================================== */}
        <section className="overflow-hidden border-y border-slate-200 bg-white py-4">
          <div className="mv-marquee flex w-max gap-10 whitespace-nowrap">
            {[
              "Latest News",
              "Upcoming Events",
              "School Achievements",
              "Class Activities",
              "Community Stories",
              "Celebrations",
              "Sports News",
              "Creative Arts",
              "Latest News",
              "Upcoming Events",
              "School Achievements",
              "Class Activities",
              "Community Stories",
              "Celebrations",
              "Sports News",
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

        {/* =====================================================
            NEWS
        ====================================================== */}
        <section
          id="news"
          className="scroll-mt-24 bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-[#F58220]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#F58220]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                  School News
                </p>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl">
                  Latest from Mount View
                </h2>
                <p className="mt-4 max-w-2xl leading-8 text-slate-600">
                  Keep up with the latest activities, achievements and stories
                  from our school community.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-[#252B68]/5 px-4 py-2 text-sm font-semibold text-[#252B68]">
                <Newspaper size={18} />
                {stories.length}{" "}
                {stories.length === 1
                  ? "published story"
                  : "published stories"}
              </div>
            </div>

            {!loadingStories && categories.length > 1 && (
              <div className="mb-10 flex gap-2 overflow-x-auto pb-2">
                {categories.map((category) => {
                  const active = selectedCategory === category;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold transition ${
                        active
                          ? "bg-[#252B68] text-white shadow-md"
                          : "bg-gray-100 text-gray-600 hover:bg-[#252B68]/10 hover:text-[#252B68]"
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            )}

            {error && (
              <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                {error}
              </div>
            )}

            {loadingStories && (
              <div className="grid gap-8 lg:grid-cols-2">
                <div className="h-[420px] animate-pulse rounded-3xl bg-gray-100" />
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
                  <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
                  <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
                  <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
                </div>
              </div>
            )}

            {!loadingStories && filteredStories.length === 0 && (
              <div className="rounded-3xl border border-gray-200 bg-gray-50 px-6 py-16 text-center">
                <Newspaper size={42} className="mx-auto mb-4 text-[#252B68]" />
                <h3 className="text-xl font-bold text-[#252B68]">
                  No news stories yet
                </h3>
                <p className="mx-auto mt-2 max-w-md text-gray-600">
                  There are currently no published stories in this category.
                </p>
              </div>
            )}

            {!loadingStories && featuredStory && (
              <div className="grid gap-8 lg:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSelectedStory(featuredStory)}
                  className="group overflow-hidden rounded-[2rem] border border-slate-100 bg-white text-left shadow-lg transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
                >
                  <div className="relative h-72 overflow-hidden sm:h-96">
                    {getImageUrl(
                      featuredStory.image_url ||
                        featuredStory.image ||
                        featuredStory.image_path
                    ) ? (
                      <Image
                        src={
                          getImageUrl(
                            featuredStory.image_url ||
                              featuredStory.image ||
                              featuredStory.image_path
                          )!
                        }
                        alt={featuredStory.title}
                        fill
                        unoptimized
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#252B68] to-[#171B4A]">
                        <Newspaper size={70} className="text-white/30" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                    <div className="absolute left-5 top-5">
                      <span className="rounded-full bg-[#FFE900] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#252B68] shadow-lg">
                        Featured
                      </span>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      {getCategoryName(featuredStory.category) && (
                        <span className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                          {getCategoryName(featuredStory.category)}
                        </span>
                      )}
                      <h3 className="text-2xl font-black leading-tight text-white sm:text-3xl">
                        {featuredStory.title}
                      </h3>
                      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/80">
                        <div className="flex items-center gap-2">
                          <CalendarDays size={15} />
                          {formatDate(getStoryDate(featuredStory))}
                        </div>
                        {featuredStory.author && (
                          <div className="flex items-center gap-2">
                            <Users size={15} />
                            <span>By {featuredStory.author}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="line-clamp-3 leading-7 text-gray-600">
                      {formatExcerpt(
                        featuredStory.excerpt || featuredStory.description
                      ) ||
                        "Read the latest news from Mount View International Primary School & Early Years Centre."}
                    </p>
                    <div className="mt-5 flex items-center gap-2 font-black text-[#252B68]">
                      Read story
                      <ArrowRight
                        size={17}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </div>
                  </div>
                </button>

                <div>
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-xl font-black text-[#252B68]">
                      Latest News
                    </h3>
                  </div>

                  {latestStories.length === 0 ? (
                    <div className="rounded-2xl bg-gray-50 p-8 text-center text-gray-500">
                      More stories will appear here soon.
                    </div>
                  ) : (
                    <div className="grid gap-5 sm:grid-cols-2">
                      {latestStories.slice(0, 6).map((story) => {
                        const imageUrl = getImageUrl(
                          story.image_url || story.image || story.image_path
                        );
                        return (
                          <button
                            key={story.id}
                            type="button"
                            onClick={() => setSelectedStory(story)}
                            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition duration-300 hover:-translate-y-1 hover:border-[#252B68]/30 hover:shadow-xl"
                          >
                            <div className="relative h-40 overflow-hidden">
                              {imageUrl ? (
                                <Image
                                  src={imageUrl}
                                  alt={story.title}
                                  fill
                                  unoptimized
                                  className="object-cover transition duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-[#252B68]">
                                  <Newspaper
                                    size={40}
                                    className="text-white/30"
                                  />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            </div>
                            <div className="p-5">
                              {getCategoryName(story.category) && (
                                <p className="mb-2 text-xs font-black uppercase tracking-wide text-[#F58220]">
                                  {getCategoryName(story.category)}
                                </p>
                              )}
                              <h4 className="line-clamp-2 text-lg font-black leading-snug text-[#252B68]">
                                {story.title}
                              </h4>
                              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                                <div className="flex items-center gap-1.5">
                                  <CalendarDays size={14} />
                                  {formatShortDate(getStoryDate(story))}
                                </div>
                                {story.author && (
                                  <div className="flex items-center gap-1.5">
                                    <Users size={14} />
                                    <span>{story.author}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* =====================================================
            EVENTS
        ====================================================== */}
        <section
          id="events"
          className="relative scroll-mt-24 overflow-hidden bg-slate-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="mv-blob absolute -left-24 top-40 h-72 w-72 rounded-full bg-[#FFE900]/20 blur-3xl" />
            <div className="mv-blob absolute -right-24 bottom-40 h-72 w-72 rounded-full bg-[#F58220]/15 blur-3xl [animation-delay:-6s]" />
          </div>

          <span className="mv-float pointer-events-none absolute left-[4%] top-12 text-5xl opacity-15">
            📅
          </span>
          <span className="mv-float-alt pointer-events-none absolute right-[4%] bottom-12 text-5xl opacity-15">
            🎉
          </span>

          <div className="relative mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-[#F58220]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#F58220]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                  What&apos;s Coming Up
                </p>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl">
                  Upcoming Events
                </h2>
                <p className="mt-4 max-w-2xl leading-8 text-slate-600">
                  Mark your calendar and join us for the exciting activities
                  happening across our school community.
                </p>
              </div>
            </div>

            {loadingEvents ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-80 animate-pulse rounded-3xl bg-white"
                  />
                ))}
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="rounded-3xl border border-gray-200 bg-white px-6 py-14 text-center">
                <CalendarDays
                  size={42}
                  className="mx-auto mb-4 text-[#252B68]"
                />
                <h3 className="text-xl font-bold text-[#252B68]">
                  No upcoming events
                </h3>
                <p className="mt-2 text-gray-600">
                  Check back soon for upcoming school activities and events.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {upcomingEvents.map((event) => {
                  const imageUrl = getImageUrl(
                    event.image_url || event.image || event.image_path
                  );

                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => setSelectedEvent(event)}
                      className="group overflow-hidden rounded-[2rem] border border-slate-100 bg-white text-left shadow-lg transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
                    >
                      <div className="relative h-52 overflow-hidden">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={event.title}
                            fill
                            unoptimized
                            className="object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#252B68] to-[#171B4A]">
                            <CalendarDays
                              size={55}
                              className="text-white/30"
                            />
                          </div>
                        )}

                        <div className="absolute left-4 top-4">
                          <div className="rounded-xl bg-white px-3 py-2 text-center shadow-lg">
                            <p className="text-xs font-bold uppercase text-[#F58220]">
                              {new Date(event.event_date).toLocaleDateString(
                                "en-GB",
                                { month: "short" }
                              )}
                            </p>
                            <p className="text-2xl font-black leading-none text-[#252B68]">
                              {new Date(event.event_date).getDate()}
                            </p>
                          </div>
                        </div>

                        {event.featured && (
                          <div className="absolute right-4 top-4">
                            <span className="rounded-full bg-[#FFE900] px-3 py-1.5 text-xs font-black text-[#252B68] shadow-lg">
                              Featured
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-6">
                        <h3 className="text-xl font-black leading-tight text-[#252B68]">
                          {event.title}
                        </h3>

                        {event.description && (
                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-600">
                            {formatExcerpt(event.description)}
                          </p>
                        )}

                        <div className="mt-5 space-y-2.5 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <CalendarDays
                              size={16}
                              className="shrink-0 text-[#F58220]"
                            />
                            {formatDate(event.event_date)}
                          </div>

                          {(event.start_time || event.end_time) && (
                            <div className="flex items-center gap-2">
                              <Clock3
                                size={16}
                                className="shrink-0 text-[#F58220]"
                              />
                              {formatTime(event.start_time)}
                              {event.end_time && (
                                <> – {formatTime(event.end_time)}</>
                              )}
                            </div>
                          )}

                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin
                                size={16}
                                className="shrink-0 text-[#F58220]"
                              />
                              <span className="line-clamp-1">
                                {event.location}
                              </span>
                            </div>
                          )}

                          {getClassName(event.class_name) && (
                            <div className="flex items-center gap-2">
                              <Users
                                size={16}
                                className="shrink-0 text-[#F58220]"
                              />
                              {getClassName(event.class_name)}
                            </div>
                          )}
                        </div>

                        <div className="mt-6 flex items-center gap-2 font-black text-[#252B68]">
                          View event
                          <ChevronRight
                            size={17}
                            className="transition-transform group-hover:translate-x-1"
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* =====================================================
            COMMUNITY CTA
        ====================================================== */}
        <section className="relative overflow-hidden bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-[#252B68] p-10 text-center shadow-2xl sm:p-14">
            <div className="pointer-events-none absolute inset-0">
              <div className="mv-blob absolute -left-24 top-0 z-0 h-72 w-72 rounded-full bg-[#FFE900]/15 blur-3xl" />
              <div className="mv-blob absolute -bottom-32 right-0 z-0 h-96 w-96 rounded-full bg-[#F58220]/25 blur-3xl [animation-delay:-6s]" />
            </div>

            <span className="mv-float pointer-events-none absolute left-[8%] top-6 text-4xl opacity-40">
              💬
            </span>
            <span className="mv-float-alt pointer-events-none absolute right-[8%] bottom-6 text-4xl opacity-40">
              💛
            </span>

            <div className="relative z-10">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#FFE900]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                Our School Community
              </p>
              <h2 className="mt-4 text-3xl font-black leading-tight text-white sm:text-4xl">
                Fostering growth, excellence and empathy.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl leading-8 text-blue-100">
                From classroom achievements to community celebrations, every
                story reflects the people who make Mount View special.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="/contact"
                  className="group rounded-full bg-[#F58220] px-8 py-4 font-black text-white shadow-xl transition hover:-translate-y-1 hover:bg-[#d96e12] hover:shadow-2xl"
                >
                  Contact the School
                  <span className="ml-2 inline-block transition group-hover:translate-x-1">
                    →
                  </span>
                </Link>
                <Link
                  href="/school-life"
                  className="rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 font-black text-white backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white hover:text-[#252B68]"
                >
                  Explore School Life
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            BRAND STATEMENT
        ====================================================== */}
        <section className="relative overflow-hidden border-t border-slate-100 bg-white px-4 py-14 text-center sm:px-6 lg:px-8">
          <span className="mv-float pointer-events-none absolute left-[15%] top-1/2 -translate-y-1/2 text-3xl opacity-30">
            ✨
          </span>
          <span className="mv-float-alt pointer-events-none absolute right-[15%] top-1/2 -translate-y-1/2 text-3xl opacity-30">
            📰
          </span>
          <div className="relative mx-auto max-w-4xl">
            <p className="text-2xl font-black text-[#252B68] sm:text-3xl">
              Fostering <span className="text-[#F58220]">growth</span>,{" "}
              <span className="text-[#252B68]">excellence</span> and{" "}
              <span className="text-[#F58220]">empathy</span>.
            </p>
            <p className="mt-3 text-sm font-medium text-slate-500">
              Mount View International Primary School &amp; Early Years Centre
            </p>
          </div>
        </section>
      </main>

      {/* =====================================================
          STORY MODAL
      ====================================================== */}
      {selectedStory && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"
          onClick={() => setSelectedStory(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="news-modal-title"
        >
          <div
            className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedStory(null)}
              aria-label="Close article"
              className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur transition hover:bg-black"
            >
              <X size={23} />
            </button>

            {getImageUrl(
              selectedStory.image_url ||
                selectedStory.image ||
                selectedStory.image_path
            ) && (
              <div className="relative h-56 w-full shrink-0 sm:h-72 lg:h-80">
                <Image
                  src={
                    getImageUrl(
                      selectedStory.image_url ||
                        selectedStory.image ||
                        selectedStory.image_path
                    )!
                  }
                  alt={selectedStory.title}
                  fill
                  unoptimized
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-5 left-6 right-16 sm:left-8">
                  {getCategoryName(selectedStory.category) && (
                    <span className="mb-3 inline-block rounded-full bg-[#FFE900] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[#252B68]">
                      {getCategoryName(selectedStory.category)}
                    </span>
                  )}
                  <h2
                    id="news-modal-title"
                    className="text-2xl font-black leading-tight text-white sm:text-3xl lg:text-4xl"
                  >
                    {selectedStory.title}
                  </h2>
                </div>
              </div>
            )}

            <div className="overflow-y-auto">
              <article className="mx-auto max-w-4xl px-6 py-7 sm:px-10 sm:py-9">
                {!getImageUrl(
                  selectedStory.image_url ||
                    selectedStory.image ||
                    selectedStory.image_path
                ) && (
                  <>
                    {getCategoryName(selectedStory.category) && (
                      <span className="mb-3 inline-block rounded-full bg-[#252B68] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white">
                        {getCategoryName(selectedStory.category)}
                      </span>
                    )}
                    <h2
                      id="news-modal-title"
                      className="text-3xl font-black leading-tight text-[#252B68] sm:text-4xl"
                    >
                      {selectedStory.title}
                    </h2>
                  </>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-gray-200 pb-5 text-sm text-gray-500">
                  {getStoryDate(selectedStory) && (
                    <div className="flex items-center gap-2">
                      <CalendarDays size={16} className="text-[#F58220]" />
                      {formatDate(getStoryDate(selectedStory))}
                    </div>
                  )}
                  {selectedStory.author && (
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-[#F58220]" />
                      <span>
                        By{" "}
                        <strong className="font-semibold text-[#252B68]">
                          {selectedStory.author}
                        </strong>
                      </span>
                    </div>
                  )}
                  {getClassName(selectedStory.class_name) && (
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-[#F58220]" />
                      {getClassName(selectedStory.class_name)}
                    </div>
                  )}
                </div>

                {(selectedStory.excerpt || selectedStory.description) && (
                  <div className="mt-7 rounded-xl border-l-4 border-[#FFE900] bg-yellow-50 px-4 py-3">
                    <p className="text-base font-medium leading-7 text-gray-700">
                      {formatExcerpt(
                        selectedStory.excerpt || selectedStory.description
                      )}
                    </p>
                  </div>
                )}

                <div
                  className="story-content mt-7 text-[17px] leading-8 text-gray-700"
                  dangerouslySetInnerHTML={{
                    __html: formatContent(
                      selectedStory.content ||
                        selectedStory.description ||
                        "No additional article content is available."
                    ),
                  }}
                />

                <div className="mt-10 border-t border-gray-200 pt-6">
                  <button
                    type="button"
                    onClick={() => setSelectedStory(null)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#252B68] px-6 py-3 font-bold text-white transition hover:bg-[#171B4A]"
                  >
                    <X size={17} />
                    Close Article
                  </button>
                </div>
              </article>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          EVENT MODAL
      ====================================================== */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"
          onClick={() => setSelectedEvent(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-modal-title"
        >
          <div
            className="relative flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              aria-label="Close event"
              className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur transition hover:bg-black"
            >
              <X size={23} />
            </button>

            {getImageUrl(
              selectedEvent.image_url ||
                selectedEvent.image ||
                selectedEvent.image_path
            ) ? (
              <div className="relative h-56 w-full shrink-0 sm:h-72 lg:h-80">
                <Image
                  src={
                    getImageUrl(
                      selectedEvent.image_url ||
                        selectedEvent.image ||
                        selectedEvent.image_path
                    )!
                  }
                  alt={selectedEvent.title}
                  fill
                  unoptimized
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-5 left-6 right-16 sm:left-8">
                  {selectedEvent.featured && (
                    <span className="mb-3 inline-block rounded-full bg-[#FFE900] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[#252B68]">
                      Featured
                    </span>
                  )}
                  <h2
                    id="event-modal-title"
                    className="text-2xl font-black leading-tight text-white sm:text-3xl lg:text-4xl"
                  >
                    {selectedEvent.title}
                  </h2>
                </div>
              </div>
            ) : (
              <div className="flex h-32 w-full shrink-0 items-center justify-center bg-gradient-to-br from-[#252B68] to-[#171B4A] sm:h-40">
                <CalendarDays size={56} className="text-white/30" />
              </div>
            )}

            <div className="overflow-y-auto">
              <div className="mx-auto max-w-3xl px-6 py-7 sm:px-10 sm:py-9">
                {!getImageUrl(
                  selectedEvent.image_url ||
                    selectedEvent.image ||
                    selectedEvent.image_path
                ) && (
                  <h2
                    id="event-modal-title"
                    className="mb-5 text-3xl font-black leading-tight text-[#252B68] sm:text-4xl"
                  >
                    {selectedEvent.title}
                  </h2>
                )}

                <div className="grid gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-5 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#252B68]/10">
                      <CalendarDays size={18} className="text-[#252B68]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                        Date
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-[#172033]">
                        {formatDate(selectedEvent.event_date)}
                      </p>
                    </div>
                  </div>

                  {(selectedEvent.start_time || selectedEvent.end_time) && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#252B68]/10">
                        <Clock3 size={18} className="text-[#252B68]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                          Time
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-[#172033]">
                          {formatTime(selectedEvent.start_time)}
                          {selectedEvent.end_time && (
                            <> – {formatTime(selectedEvent.end_time)}</>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedEvent.location && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#252B68]/10">
                        <MapPin size={18} className="text-[#252B68]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                          Location
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-[#172033]">
                          {selectedEvent.location}
                        </p>
                      </div>
                    </div>
                  )}

                  {getClassName(selectedEvent.class_name) && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#252B68]/10">
                        <Users size={18} className="text-[#252B68]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                          Audience
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-[#172033]">
                          {getClassName(selectedEvent.class_name)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-7">
                  <h3 className="text-lg font-black text-[#252B68]">
                    About this event
                  </h3>
                  <div
                    className="story-content mt-3 text-[17px] leading-8 text-gray-700"
                    dangerouslySetInnerHTML={{
                      __html: formatContent(
                        selectedEvent.description ||
                          "More details about this event will be shared soon. Please contact the school office if you have any questions."
                      ),
                    }}
                  />
                </div>

                <div className="mt-8 border-t border-gray-200 pt-6">
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#252B68] px-6 py-3 font-bold text-white transition hover:bg-[#171B4A]"
                  >
                    <X size={17} />
                    Close Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .story-content {
          word-break: break-word;
        }
        .story-content > p {
          margin-bottom: 1.25rem;
        }
        .story-content > p:last-child {
          margin-bottom: 0;
        }
        .story-content strong,
        .story-content b {
          font-weight: 600;
          color: #1e293b;
        }
        .story-content em,
        .story-content i {
          font-style: italic;
        }
        .story-content h1,
        .story-content h2,
        .story-content h3,
        .story-content h4 {
          font-weight: 700;
          color: #252b68;
          margin-top: 1.75rem;
          margin-bottom: 0.75rem;
          line-height: 1.3;
        }
        .story-content h1 {
          font-size: 1.5rem;
        }
        .story-content h2 {
          font-size: 1.35rem;
        }
        .story-content h3 {
          font-size: 1.2rem;
        }
        .story-content ul,
        .story-content ol {
          margin: 1rem 0 1.25rem 1.5rem;
          padding-left: 0.5rem;
        }
        .story-content ul {
          list-style-type: disc;
        }
        .story-content ol {
          list-style-type: decimal;
        }
        .story-content li {
          margin-bottom: 0.5rem;
        }
        .story-content a {
          color: #252b68;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .story-content a:hover {
          color: #f58220;
        }
        .story-content blockquote {
          border-left: 4px solid #f58220;
          padding-left: 1rem;
          margin: 1.25rem 0;
          color: #475569;
          font-style: italic;
        }
        .story-content br {
          display: block;
          content: "";
          margin-bottom: 0.25rem;
        }
        .story-content img {
          max-width: 100%;
          height: auto;
          border-radius: 1rem;
          margin: 1rem 0;
        }
        .story-content code {
          background: #f1f5f9;
          padding: 0.1rem 0.35rem;
          border-radius: 0.25rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.85em;
        }
      `}</style>
    </>
  );
}

/* ============================================================
 * PAGE WRAPPER
 * ============================================================ */

function NewsPageSkeleton() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-[#252B68]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <div className="h-10 w-64 animate-pulse rounded-full bg-white/10" />
          <div className="mt-6 h-16 w-full max-w-2xl animate-pulse rounded-lg bg-white/10" />
          <div className="mt-4 h-4 w-full max-w-xl animate-pulse rounded bg-white/10" />
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="h-[420px] animate-pulse rounded-3xl bg-gray-100" />
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
            <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
            <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
            <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function NewsPage() {
  return (
    <Suspense fallback={<NewsPageSkeleton />}>
      <NewsPageContent />
    </Suspense>
  );
}