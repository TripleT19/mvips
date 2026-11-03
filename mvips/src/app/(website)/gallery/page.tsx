"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Images,
  X,
  CalendarDays,
  ArrowRight,
  Loader2,
  ImageOff,
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

type GalleryImage = {
  id: number | string;
  image_url?: string | null;
  image_path?: string | null;
  sort_order: number;
};

type Gallery = {
  id: number | string;
  title: string;
  slug: string;
  description?: string | null;
  cover_image?: string | null;
  image_count?: number;
  event_date?: string | null;
  status?: string | null;
  featured?: boolean | null;
  class_name?: string | null;
  updated_at?: string | null;
  images?: GalleryImage[];
};

/* ============================================================
 * HELPERS
 * ============================================================ */

function getImageUrl(image: GalleryImage | null | undefined): string | null {
  if (!image) return null;
  if (image.image_url) {
    if (
      image.image_url.startsWith("http://") ||
      image.image_url.startsWith("https://")
    ) {
      return image.image_url;
    }
    return `${API_URL}${image.image_url.startsWith("/") ? "" : "/"}${
      image.image_url
    }`;
  }
  if (image.image_path) {
    return `${API_URL}/storage/${image.image_path}`;
  }
  return null;
}

function getNewestFirstImages(images: GalleryImage[] = []): GalleryImage[] {
  return [...images].sort((a, b) => b.sort_order - a.sort_order);
}

function formatDate(date: string | null | undefined): string | null {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function truncate(text: string | null | undefined, length = 130): string {
  if (!text) return "";
  if (text.length <= length) return text;
  return `${text.substring(0, length).trim()}...`;
}

function extractArray<T = unknown>(payload: unknown): T[] {
  if (!payload) return [];
  const p = payload as Record<string, unknown>;

  if (p.data && typeof p.data === "object" && !Array.isArray(p.data)) {
    const inner = (p.data as Record<string, unknown>).data;
    if (Array.isArray(inner)) return inner as T[];
  }
  if (Array.isArray(p.data)) return p.data as T[];
  for (const key of ["galleries", "gallery", "items", "results"]) {
    const value = p[key];
    if (Array.isArray(value)) return value as T[];
  }
  if (Array.isArray(payload)) return payload as T[];
  return [];
}

/* ============================================================
 * PAGE CONTENT
 * ============================================================ */

function GalleryPageContent() {
  const searchParams = useSearchParams();

  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const visibleGalleries = useMemo(() => {
    return galleries
      .filter(
        (gallery) =>
          gallery.status === "published" &&
          gallery.images &&
          gallery.images.length > 0
      )
      .sort(
        (a, b) =>
          new Date(b.updated_at || 0).getTime() -
          new Date(a.updated_at || 0).getTime()
      );
  }, [galleries]);

  async function loadGalleries() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/gallery?per_page=50`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `Gallery request failed with status ${response.status}`
        );
      }

      const result = await response.json();

      if (result && result.success === false) {
        throw new Error(result.message || "Unable to load gallery.");
      }

      const list = extractArray<Gallery>(result);
      setGalleries(list);
    } catch (err) {
      console.error("Gallery loading error:", err);
      setError("We couldn't load the gallery right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGalleries();
  }, []);

  function openGallery(gallery: Gallery) {
    const newestImages = getNewestFirstImages(gallery.images || []);
    if (!newestImages.length) return;
    setSelectedGallery({ ...gallery, images: newestImages });
    setSelectedImageIndex(0);
    document.body.style.overflow = "hidden";
  }

  function closeGallery() {
    setSelectedGallery(null);
    setSelectedImageIndex(0);
    document.body.style.overflow = "";
  }

  function showNextImage() {
    if (!selectedGallery || !Array.isArray(selectedGallery.images)) return;
    const total = selectedGallery.images.length;
    if (total <= 1) return;
    setSelectedImageIndex((current) => (current >= total - 1 ? 0 : current + 1));
  }

  function showPreviousImage() {
    if (!selectedGallery || !Array.isArray(selectedGallery.images)) return;
    const total = selectedGallery.images.length;
    if (total <= 1) return;
    setSelectedImageIndex((current) => (current <= 0 ? total - 1 : current - 1));
  }

  /* ---------- auto-open from ?album= ---------- */
  const autoOpenedParam = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (selectedGallery) return;

    const albumSlug = searchParams.get("album");
    if (!albumSlug) return;
    if (autoOpenedParam.current === albumSlug) return;

    const found = visibleGalleries.find((g) => g.slug === albumSlug);
    if (found) {
      openGallery(found);
      autoOpenedParam.current = albumSlug;
    }
  }, [loading, visibleGalleries, searchParams, selectedGallery]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!selectedGallery) return;
      if (event.key === "Escape") closeGallery();
      if (event.key === "ArrowRight") showNextImage();
      if (event.key === "ArrowLeft") showPreviousImage();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedGallery]);

  const lightboxImages =
    selectedGallery && Array.isArray(selectedGallery.images)
      ? selectedGallery.images
      : [];
  const lightboxOpen = Boolean(selectedGallery) && lightboxImages.length > 0;
  const lightboxTotal = lightboxImages.length;
  const currentImage = lightboxImages[selectedImageIndex];
  const currentImageUrl = currentImage ? getImageUrl(currentImage) : null;

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
        .mv-marquee{animation:mv-marquee 35s linear infinite}

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
          📸
        </span>
        <span className="mv-float-alt pointer-events-none absolute right-[6%] top-[12%] z-0 text-4xl opacity-80 sm:text-5xl">
          🎨
        </span>
        <span className="mv-float pointer-events-none absolute left-[10%] bottom-[16%] z-0 text-3xl opacity-70 sm:text-4xl">
          ✨
        </span>
        <span className="mv-float-alt pointer-events-none absolute right-[10%] bottom-[14%] z-0 text-3xl opacity-70 sm:text-4xl">
          🏆
        </span>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-[#FFE900] backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#FFE900]" />
              School Gallery
            </div>

            <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Moments at{" "}
              <span className="relative inline-block text-[#FFE900]">
                Mount View.
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
              Explore memories from our learning experiences, celebrations,
              activities, competitions and school community.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full bg-[#F58220] px-5 py-2.5 text-sm font-bold text-white shadow-lg">
                Learning
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20">
                Celebrations
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20">
                Competitions
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20">
                Community
              </span>
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a
                href="#albums"
                className="group rounded-full bg-[#F58220] px-7 py-4 text-center font-black text-white shadow-xl transition hover:-translate-y-1 hover:bg-[#d96e12] hover:shadow-2xl"
              >
                Browse Albums
                <span className="ml-2 inline-block transition group-hover:translate-x-1">
                  ↓
                </span>
              </a>
              <Link
                href="/news"
                className="rounded-full border-2 border-white/30 bg-white/10 px-7 py-4 text-center font-black text-white backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white hover:text-[#252B68]"
              >
                Read Our News
              </Link>
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
            "Learning",
            "Celebrations",
            "Sports Day",
            "Swimming Gala",
            "Field Trips",
            "Creative Arts",
            "House Competitions",
            "Community Events",
            "Learning",
            "Celebrations",
            "Sports Day",
            "Swimming Gala",
            "Field Trips",
            "Creative Arts",
            "House Competitions",
            "Community Events",
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
          ALBUM GRID
      ====================================================== */}
      <section
        id="albums"
        className="relative scroll-mt-24 overflow-hidden bg-slate-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="mv-blob absolute -left-24 top-40 h-72 w-72 rounded-full bg-[#FFE900]/20 blur-3xl" />
          <div className="mv-blob absolute -right-24 bottom-40 h-72 w-72 rounded-full bg-[#F58220]/15 blur-3xl [animation-delay:-6s]" />
        </div>

        <span className="mv-float pointer-events-none absolute left-[4%] top-12 text-5xl opacity-15">
          🖼️
        </span>
        <span className="mv-float-alt pointer-events-none absolute right-[4%] bottom-12 text-5xl opacity-15">
          📷
        </span>

        <div className="relative mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-[#F58220]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#F58220]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                Explore our albums
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-[#252B68] sm:text-4xl">
                School Life in Pictures
              </h2>
              <p className="mt-4 max-w-2xl leading-8 text-slate-600">
                Browse our latest school moments and discover what makes the
                Mount View community special.
              </p>
            </div>

            {!loading && visibleGalleries.length > 0 && (
              <div className="flex items-center gap-2 rounded-full bg-[#252B68]/5 px-4 py-2 text-sm font-semibold text-[#252B68]">
                <Images className="h-4 w-4" />
                {visibleGalleries.length}
                {visibleGalleries.length === 1 ? " album" : " albums"}
              </div>
            )}
          </div>

          {loading && (
            <div className="flex min-h-[350px] items-center justify-center">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#252B68]/10">
                  <Loader2 className="h-7 w-7 animate-spin text-[#252B68]" />
                </div>
                <div>
                  <p className="font-semibold text-[#252B68]">
                    Loading our gallery...
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Please wait a moment.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
              <ImageOff className="mx-auto h-10 w-10 text-red-400" />
              <h3 className="mt-4 text-lg font-bold text-red-800">
                Gallery unavailable
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-red-700">
                {error}
              </p>
              <button
                onClick={loadGalleries}
                className="mt-6 rounded-full bg-[#252B68] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1d2258]"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && visibleGalleries.length === 0 && (
            <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-slate-200 bg-white px-6">
              <div className="max-w-md text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#252B68]/10">
                  <Images className="h-10 w-10 text-[#252B68]" />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-[#252B68]">
                  Our gallery is coming soon
                </h3>
                <p className="mt-3 leading-7 text-gray-600">
                  We are preparing photos from life and learning at Mount View
                  International Primary School &amp; Early Years Centre.
                </p>
                <Link
                  href="/"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#252B68] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1d2258]"
                >
                  Back to Home
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}

          {!loading && !error && visibleGalleries.length > 0 && (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {visibleGalleries.map((gallery) => {
                const images = getNewestFirstImages(gallery.images);
                const coverImage =
                  getImageUrl(images[0]) || gallery.cover_image;
                const eventDate = formatDate(gallery.event_date);

                return (
                  <article
                    key={gallery.id}
                    className="group overflow-hidden rounded-[2rem] bg-white shadow-lg ring-1 ring-slate-100 transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
                  >
                    <button
                      type="button"
                      onClick={() => openGallery(gallery)}
                      className="relative block h-64 w-full overflow-hidden bg-slate-100 text-left"
                      aria-label={`View ${gallery.title} gallery`}
                    >
                      {coverImage ? (
                        <Image
                          src={coverImage}
                          alt={gallery.title}
                          fill
                          unoptimized
                          className="object-cover transition duration-700 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ImageOff className="h-10 w-10 text-gray-300" />
                        </div>
                      )}

                      <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-[#252B68]/90 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
                        <Images className="h-3.5 w-3.5" />
                        {gallery.image_count || images.length} photos
                      </div>

                      {gallery.featured && (
                        <div className="absolute left-4 top-4 rounded-full bg-[#FFE900] px-3 py-1.5 text-xs font-black uppercase tracking-wider text-[#252B68] shadow-lg">
                          Featured
                        </div>
                      )}

                      <div className="absolute inset-0 flex items-center justify-center bg-[#252B68]/0 transition duration-300 group-hover:bg-[#252B68]/40">
                        <span className="translate-y-3 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#252B68] opacity-0 shadow-lg transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                          View Photos
                        </span>
                      </div>
                    </button>

                    <div className="p-6">
                      {eventDate && (
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#F58220]">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {eventDate}
                        </div>
                      )}

                      <h3 className="text-xl font-black leading-tight text-[#252B68]">
                        {gallery.title}
                      </h3>

                      {gallery.class_name && (
                        <span className="mt-2 inline-block rounded-full bg-[#252B68]/5 px-3 py-1 text-xs font-semibold text-[#252B68]">
                          {gallery.class_name}
                        </span>
                      )}

                      {gallery.description && (
                        <p className="mt-3 text-sm leading-7 text-slate-600">
                          {truncate(gallery.description)}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => openGallery(gallery)}
                        className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#F58220] transition group-hover:gap-3"
                      >
                        View album
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          CTA
      ====================================================== */}
      <section className="relative overflow-hidden bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-[#252B68] p-10 text-center shadow-2xl sm:p-14">
          <div className="pointer-events-none absolute inset-0">
            <div className="mv-blob absolute -left-24 top-0 z-0 h-72 w-72 rounded-full bg-[#FFE900]/15 blur-3xl" />
            <div className="mv-blob absolute -bottom-32 right-0 z-0 h-96 w-96 rounded-full bg-[#F58220]/25 blur-3xl [animation-delay:-6s]" />
          </div>

          <span className="mv-float pointer-events-none absolute left-[8%] top-6 text-4xl opacity-40">
            🎓
          </span>
          <span className="mv-float-alt pointer-events-none absolute right-[8%] bottom-6 text-4xl opacity-40">
            💛
          </span>

          <div className="relative z-10">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#FFE900]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              Join Our Community
            </p>
            <h2 className="mt-4 text-3xl font-black leading-tight text-white sm:text-4xl">
              Ready to be part of the Mount View story?
            </h2>
            <p className="mx-auto mt-5 max-w-2xl leading-8 text-blue-100">
              From the first day of Nursery to the last day of Year 6, every
              moment here is worth celebrating. Come and see what makes Mount
              View special.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/admissions"
                className="group rounded-full bg-[#F58220] px-8 py-4 font-black text-white shadow-xl transition hover:-translate-y-1 hover:bg-[#d96e12] hover:shadow-2xl"
              >
                Apply for Admission
                <span className="ml-2 inline-block transition group-hover:translate-x-1">
                  →
                </span>
              </Link>
              <Link
                href="/contact"
                className="rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 font-black text-white backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white hover:text-[#252B68]"
              >
                Contact the School
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
          📸
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

      {/* =====================================================
          LIGHTBOX
      ====================================================== */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={selectedGallery?.title || "Gallery"}
          onClick={closeGallery}
        >
          <button
            type="button"
            onClick={closeGallery}
            className="absolute right-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
            aria-label="Close gallery"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="absolute left-5 top-5 z-20 max-w-[70%]">
            <p className="text-lg font-bold text-white">
              {selectedGallery?.title}
            </p>
            <p className="mt-1 text-sm text-white/60">
              {selectedImageIndex + 1} of {lightboxTotal}
            </p>
          </div>

          {lightboxTotal > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showPreviousImage();
              }}
              className="absolute left-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 sm:left-7"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
          )}

          <div
            className="relative h-[75vh] w-full max-w-6xl"
            onClick={(event) => event.stopPropagation()}
          >
            {currentImageUrl ? (
              <Image
                src={currentImageUrl}
                alt={`${selectedGallery?.title} - photo ${
                  selectedImageIndex + 1
                }`}
                fill
                unoptimized
                className="object-contain"
                sizes="100vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ImageOff className="h-14 w-14 text-white/30" />
              </div>
            )}
          </div>

          {lightboxTotal > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showNextImage();
              }}
              className="absolute right-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 sm:right-7"
              aria-label="Next image"
            >
              <ChevronRight className="h-7 w-7" />
            </button>
          )}

          {lightboxTotal > 1 && (
            <div
              className="absolute bottom-5 left-1/2 flex max-w-[90vw] -translate-x-1/2 gap-2 overflow-x-auto rounded-xl bg-black/50 p-2 backdrop-blur-md"
              onClick={(event) => event.stopPropagation()}
            >
              {lightboxImages.map((image, index) => {
                const imageUrl = getImageUrl(image);
                return (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                      index === selectedImageIndex
                        ? "border-[#FFE900]"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                    aria-label={`View photo ${index + 1}`}
                  >
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gray-800">
                        <ImageOff className="h-4 w-4 text-gray-500" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

/* ============================================================
 * PAGE WRAPPER
 * ============================================================ */

function GalleryPageSkeleton() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-[#252B68]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <div className="h-10 w-48 animate-pulse rounded-full bg-white/10" />
          <div className="mt-6 h-16 w-full max-w-2xl animate-pulse rounded-lg bg-white/10" />
          <div className="mt-4 h-4 w-full max-w-xl animate-pulse rounded bg-white/10" />
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-96 animate-pulse rounded-2xl bg-gray-100"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function GalleryPage() {
  return (
    <Suspense fallback={<GalleryPageSkeleton />}>
      <GalleryPageContent />
    </Suspense>
  );
}