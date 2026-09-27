"use client";

import { useEffect, useMemo, useState } from "react";
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

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function getImageUrl(image) {
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

function getNewestFirstImages(images = []) {
  return [...images].sort(
    (a, b) => b.sort_order - a.sort_order
  );
}

function formatDate(date) {
  if (!date) return null;

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function truncate(text, length = 130) {
  if (!text) return "";

  if (text.length <= length) return text;

  return `${text.substring(0, length).trim()}...`;
}

export default function GalleryPage() {
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedGallery, setSelectedGallery] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] =
    useState(0);

  /*
   * Only show published galleries that contain images.
   *
   * Galleries are sorted by updated_at so that:
   * - newly created galleries appear first
   * - galleries that receive new photos move to the top
   */
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
          new Date(b.updated_at).getTime() -
          new Date(a.updated_at).getTime()
      );
  }, [galleries]);

  async function loadGalleries() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/gallery?per_page=50`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Gallery request failed with status ${response.status}`
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message || "Unable to load gallery."
        );
      }

      /*
       * Laravel pagination returns:
       *
       * {
       *   success: true,
       *   data: {
       *     data: [...]
       *   }
       * }
       *
       * This also supports a simple array response.
       */
      const galleryData = Array.isArray(result.data)
        ? result.data
        : result.data?.data || [];

      setGalleries(galleryData);
    } catch (err) {
      console.error("Gallery loading error:", err);

      setError(
        "We couldn't load the gallery right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGalleries();
  }, []);

  function openGallery(gallery) {
    const newestImages = getNewestFirstImages(
      gallery.images || []
    );

    if (!newestImages.length) return;

    setSelectedGallery({
      ...gallery,
      images: newestImages,
    });

    setSelectedImageIndex(0);

    document.body.style.overflow = "hidden";
  }

  function closeGallery() {
    setSelectedGallery(null);
    setSelectedImageIndex(0);
    document.body.style.overflow = "";
  }

  function showNextImage() {
    if (!selectedGallery) return;

    setSelectedImageIndex((current) =>
      current >= selectedGallery.images.length - 1
        ? 0
        : current + 1
    );
  }

  function showPreviousImage() {
    if (!selectedGallery) return;

    setSelectedImageIndex((current) =>
      current <= 0
        ? selectedGallery.images.length - 1
        : current - 1
    );
  }

  useEffect(() => {
    function handleKeyDown(event) {
      if (!selectedGallery) return;

      if (event.key === "Escape") {
        closeGallery();
      }

      if (event.key === "ArrowRight") {
        showNextImage();
      }

      if (event.key === "ArrowLeft") {
        showPreviousImage();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedGallery]);

  return (
    <main className="min-h-screen bg-white text-[#172033]">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#252B68]">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#FFE900]/10" />

        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-[#F58220]/10" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12 lg:py-24">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
              <Camera className="h-4 w-4 text-[#FFE900]" />

              School Gallery
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Moments at Mount View
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl">
              Explore memories from our learning experiences,
              celebrations, activities, competitions and school
              community.
            </p>

            <div className="mt-8 h-1.5 w-20 rounded-full bg-[#FFE900]" />
          </div>
        </div>
      </section>

      {/* GALLERY SECTION */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12 lg:py-20">
        {/* HEADER */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#F58220]">
              Explore our albums
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#252B68] sm:text-4xl">
              School Life in Pictures
            </h2>

            <p className="mt-3 max-w-2xl text-gray-600">
              Browse our latest school moments and discover
              what makes the Mount View community special.
            </p>
          </div>

          {!loading && visibleGalleries.length > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-[#252B68]/5 px-4 py-2 text-sm font-semibold text-[#252B68]">
              <Images className="h-4 w-4" />

              {visibleGalleries.length}

              {visibleGalleries.length === 1
                ? " album"
                : " albums"}
            </div>
          )}
        </div>

        {/* LOADING */}
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

        {/* ERROR */}
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
              className="mt-6 rounded-lg bg-[#252B68] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d2258]"
            >
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading &&
          !error &&
          visibleGalleries.length === 0 && (
            <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-gray-200 bg-gray-50 px-6">
              <div className="max-w-md text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#252B68]/10">
                  <Images className="h-10 w-10 text-[#252B68]" />
                </div>

                <h3 className="mt-6 text-2xl font-bold text-[#252B68]">
                  Our gallery is coming soon
                </h3>

                <p className="mt-3 leading-7 text-gray-600">
                  We are preparing photos from life and
                  learning at Mount View International Primary
                  School & Early Years Centre.
                </p>

                <Link
                  href="/"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#252B68] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d2258]"
                >
                  Back to Home

                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}

        {/* ALBUM GRID */}
        {!loading &&
          !error &&
          visibleGalleries.length > 0 && (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {visibleGalleries.map((gallery) => {
                const images = getNewestFirstImages(
                  gallery.images
                );

                const coverImage =
                  getImageUrl(images[0]) ||
                  gallery.cover_image;

                const eventDate = formatDate(
                  gallery.event_date
                );

                return (
                  <article
                    key={gallery.id}
                    className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    {/* COVER IMAGE */}
                    <button
                      type="button"
                      onClick={() => openGallery(gallery)}
                      className="relative block h-64 w-full overflow-hidden bg-gray-100 text-left"
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

                      {/* PHOTO COUNT */}
                      <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-[#252B68]/90 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
                        <Images className="h-3.5 w-3.5" />

                        {gallery.image_count ||
                          images.length}{" "}
                        photos
                      </div>

                      {/* FEATURED */}
                      {gallery.featured && (
                        <div className="absolute left-4 top-4 rounded-full bg-[#FFE900] px-3 py-1.5 text-xs font-bold text-[#252B68]">
                          Featured
                        </div>
                      )}

                      {/* HOVER OVERLAY */}
                      <div className="absolute inset-0 flex items-center justify-center bg-[#252B68]/0 transition duration-300 group-hover:bg-[#252B68]/35">
                        <span className="translate-y-3 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#252B68] opacity-0 shadow-lg transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                          View Photos
                        </span>
                      </div>
                    </button>

                    {/* ALBUM DETAILS */}
                    <div className="p-5">
                      {eventDate && (
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#F58220]">
                          <CalendarDays className="h-3.5 w-3.5" />

                          {eventDate}
                        </div>
                      )}

                      <h3 className="text-xl font-bold leading-tight text-[#252B68]">
                        {gallery.title}
                      </h3>

                      {gallery.class_name && (
                        <span className="mt-2 inline-block rounded-full bg-[#252B68]/5 px-3 py-1 text-xs font-semibold text-[#252B68]">
                          {gallery.class_name}
                        </span>
                      )}

                      {gallery.description && (
                        <p className="mt-3 text-sm leading-6 text-gray-600">
                          {truncate(gallery.description)}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => openGallery(gallery)}
                        className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#252B68] transition hover:text-[#F58220]"
                      >
                        View album

                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
      </section>

      {/* LIGHTBOX */}
      {selectedGallery && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={selectedGallery.title}
          onClick={closeGallery}
        >
          {/* CLOSE BUTTON */}
          <button
            type="button"
            onClick={closeGallery}
            className="absolute right-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
            aria-label="Close gallery"
          >
            <X className="h-6 w-6" />
          </button>

          {/* TITLE */}
          <div className="absolute left-5 top-5 z-20 max-w-[70%]">
            <p className="text-lg font-bold text-white">
              {selectedGallery.title}
            </p>

            <p className="mt-1 text-sm text-white/60">
              {selectedImageIndex + 1} of{" "}
              {selectedGallery.images.length}
            </p>
          </div>

          {/* PREVIOUS */}
          {selectedGallery.images.length > 1 && (
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

          {/* MAIN IMAGE */}
          <div
            className="relative h-[75vh] w-full max-w-6xl"
            onClick={(event) => event.stopPropagation()}
          >
            {(() => {
              const image =
                selectedGallery.images[selectedImageIndex];

              const imageUrl = getImageUrl(image);

              if (!imageUrl) {
                return (
                  <div className="flex h-full items-center justify-center">
                    <ImageOff className="h-14 w-14 text-white/30" />
                  </div>
                );
              }

              return (
                <Image
                  src={imageUrl}
                  alt={`${selectedGallery.title} - photo ${
                    selectedImageIndex + 1
                  }`}
                  fill
                  unoptimized
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              );
            })()}
          </div>

          {/* NEXT */}
          {selectedGallery.images.length > 1 && (
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

          {/* THUMBNAILS */}
          {selectedGallery.images.length > 1 && (
            <div
              className="absolute bottom-5 left-1/2 flex max-w-[90vw] -translate-x-1/2 gap-2 overflow-x-auto rounded-xl bg-black/50 p-2 backdrop-blur-md"
              onClick={(event) => event.stopPropagation()}
            >
              {selectedGallery.images.map(
                (image, index) => {
                  const imageUrl = getImageUrl(image);

                  return (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() =>
                        setSelectedImageIndex(index)
                      }
                      className={`relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                        index === selectedImageIndex
                          ? "border-[#FFE900]"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                      aria-label={`View photo ${
                        index + 1
                      }`}
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
                }
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

