"use client";

import { useEffect, useMemo, useState } from "react";
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
  Sparkles,
  Users,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

type CategoryValue =
  | string
  | {
      id?: number | string;
      name?: string;
      title?: string;
      slug?: string;
    }
  | null
  | undefined;

type ClassValue =
  | string
  | {
      id?: number | string;
      name?: string;
      title?: string;
      slug?: string;
    }
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

  /* AUTHOR */
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

type ApiResponse = {
  success?: boolean;
  data?: unknown;
  stories?: unknown;
  events?: unknown;
};

function getCategoryName(category: CategoryValue): string {
  if (!category) return "";

  if (typeof category === "string") {
    return category;
  }

  if (typeof category === "object") {
    return category.name || category.title || category.slug || "";
  }

  return "";
}

function getClassName(className: ClassValue): string {
  if (!className) return "";

  if (typeof className === "string") {
    return className;
  }

  if (typeof className === "object") {
    return className.name || className.title || className.slug || "";
  }

  return "";
}

function formatDate(
  dateValue: string | null | undefined
): string {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue.substring(0, 10);
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(
  dateValue: string | null | undefined
): string {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue.substring(0, 10);
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(
  time: string | null | undefined
): string {
  if (!time) return "";

  const parts = time.split(":");

  if (parts.length < 2) {
    return time;
  }

  const hours = Number(parts[0]);
  const minutes = parts[1];

  if (Number.isNaN(hours)) {
    return time;
  }

  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${minutes} ${suffix}`;
}

function getImageUrl(
  image: string | null | undefined
): string | null {
  if (!image) return null;

  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  if (image.startsWith("/")) {
    return `${API_URL}${image}`;
  }

  return `${API_URL}/storage/${image}`;
}

function getNewsArray(
  responseData: ApiResponse
): Story[] {
  if (
    responseData?.data &&
    typeof responseData.data === "object" &&
    "data" in responseData.data &&
    Array.isArray(
      (responseData.data as { data?: unknown }).data
    )
  ) {
    return (responseData.data as { data: Story[] }).data;
  }

  if (
    responseData?.data &&
    Array.isArray(responseData.data)
  ) {
    return responseData.data as Story[];
  }

  if (Array.isArray(responseData?.stories)) {
    return responseData.stories as Story[];
  }

  return [];
}

function getEventsArray(
  responseData: ApiResponse
): Event[] {
  if (
    responseData?.data &&
    typeof responseData.data === "object" &&
    "data" in responseData.data &&
    Array.isArray(
      (responseData.data as { data?: unknown }).data
    )
  ) {
    return (responseData.data as { data: Event[] }).data;
  }

  if (
    responseData?.data &&
    Array.isArray(responseData.data)
  ) {
    return responseData.data as Event[];
  }

  if (Array.isArray(responseData?.events)) {
    return responseData.events as Event[];
  }

  return [];
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

export default function NewsPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  const [loadingStories, setLoadingStories] =
    useState<boolean>(true);

  const [loadingEvents, setLoadingEvents] =
    useState<boolean>(true);

  const [error, setError] = useState<string>("");

  const [selectedCategory, setSelectedCategory] =
    useState<string>("All");

  const [selectedStory, setSelectedStory] =
    useState<Story | null>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedStory(null);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  useEffect(() => {
    if (selectedStory) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedStory]);

  useEffect(() => {
    let mounted = true;

    async function loadNews() {
      try {
        setLoadingStories(true);

        const response = await fetch(
          `${API_URL}/api/stories?status=published&per_page=50`,
          {
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `News request failed: ${response.status}`
          );
        }

        const responseData =
          (await response.json()) as ApiResponse;

        if (mounted) {
          setStories(getNewsArray(responseData));
        }
      } catch (err) {
        console.error("Failed to load news:", err);

        if (mounted) {
          setError(
            "We could not load the latest school news. Please try again shortly."
          );
        }
      } finally {
        if (mounted) {
          setLoadingStories(false);
        }
      }
    }

    async function loadEvents() {
      try {
        setLoadingEvents(true);

        const response = await fetch(
          `${API_URL}/api/events?per_page=50`,
          {
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Events request failed: ${response.status}`
          );
        }

        const responseData =
          (await response.json()) as ApiResponse;

        if (mounted) {
          setEvents(getEventsArray(responseData));
        }
      } catch (err) {
        console.error("Failed to load events:", err);
      } finally {
        if (mounted) {
          setLoadingEvents(false);
        }
      }
    }

    loadNews();
    loadEvents();

    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const categoryNames = stories
      .map((story) =>
        getCategoryName(story.category)
      )
      .filter(Boolean);

    return [
      "All",
      ...Array.from(new Set(categoryNames)),
    ];
  }, [stories]);

  const filteredStories = useMemo(() => {
    if (selectedCategory === "All") {
      return stories;
    }

    return stories.filter(
      (story) =>
        getCategoryName(story.category) ===
        selectedCategory
    );
  }, [stories, selectedCategory]);

  const featuredStory = useMemo(() => {
    return (
      filteredStories.find(
        (story) => Boolean(story.featured)
      ) ||
      filteredStories[0] ||
      null
    );
  }, [filteredStories]);

  const latestStories = useMemo(() => {
    if (!featuredStory) {
      return filteredStories;
    }

    return filteredStories.filter(
      (story) => story.id !== featuredStory.id
    );
  }, [filteredStories, featuredStory]);

  const upcomingEvents = useMemo(() => {
    return [...events]
      .sort((a, b) => {
        const first =
          new Date(a.event_date).getTime();

        const second =
          new Date(b.event_date).getTime();

        return first - second;
      })
      .slice(0, 6);
  }, [events]);

  return (
    <>
      <main className="min-h-screen bg-white text-[#172033]">

        {/* =====================================================
            HERO
        ====================================================== */}
        <section className="relative overflow-hidden bg-[#252B68]">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#FFE900]/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-[#F58220]/20 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
                <Newspaper
                  size={17}
                  className="text-[#FFE900]"
                />
                Mount View News & Events
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                What's happening at{" "}
                <span className="text-[#FFE900]">
                  Mount View?
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl">
                Discover the latest news, achievements,
                celebrations and upcoming events from
                Mount View International Primary School
                & Early Years Centre.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white">
                  <Sparkles
                    size={16}
                    className="text-[#FFE900]"
                  />
                  Fostering growth
                </div>

                <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white">
                  <Users
                    size={16}
                    className="text-[#FFE900]"
                  />
                  Building excellence
                </div>

                <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white">
                  <Newspaper
                    size={16}
                    className="text-[#FFE900]"
                  />
                  Sharing our story
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            NEWS SECTION
        ====================================================== */}
        <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
          <div className="mb-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-[#F58220]">
                School News
              </p>

              <h2 className="text-3xl font-black text-[#252B68] sm:text-4xl">
                Latest from Mount View
              </h2>

              <p className="mt-3 max-w-2xl text-gray-600">
                Keep up with the latest activities,
                achievements and stories from our school
                community.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold text-[#252B68]">
              <Newspaper size={18} />
              {stories.length}{" "}
              {stories.length === 1
                ? "published story"
                : "published stories"}
            </div>
          </div>

          {/* Categories */}
          {!loadingStories &&
            categories.length > 1 && (
              <div className="mb-10 flex gap-2 overflow-x-auto pb-2">
                {categories.map((category) => {
                  const active =
                    selectedCategory === category;

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() =>
                        setSelectedCategory(category)
                      }
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

          {/* Loading */}
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

          {/* No stories */}
          {!loadingStories &&
            filteredStories.length === 0 && (
              <div className="rounded-3xl border border-gray-200 bg-gray-50 px-6 py-16 text-center">
                <Newspaper
                  size={42}
                  className="mx-auto mb-4 text-[#252B68]"
                />

                <h3 className="text-xl font-bold text-[#252B68]">
                  No news stories yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-gray-600">
                  There are currently no published stories
                  in this category.
                </p>
              </div>
            )}

          {/* Featured + Latest */}
          {!loadingStories &&
            featuredStory && (
              <div className="grid gap-8 lg:grid-cols-2">

                {/* Featured story */}
                <button
                  type="button"
                  onClick={() =>
                    setSelectedStory(featuredStory)
                  }
                  className="group overflow-hidden rounded-3xl border border-gray-200 bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
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
                        <Newspaper
                          size={70}
                          className="text-white/30"
                        />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                    <div className="absolute left-5 top-5">
                      <span className="rounded-full bg-[#FFE900] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#252B68]">
                        Featured
                      </span>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      {getCategoryName(
                        featuredStory.category
                      ) && (
                        <span className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                          {getCategoryName(
                            featuredStory.category
                          )}
                        </span>
                      )}

                      <h3 className="text-2xl font-black leading-tight text-white sm:text-3xl">
                        {featuredStory.title}
                      </h3>

                      {/* DATE + AUTHOR */}
                      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/80">
                        <div className="flex items-center gap-2">
                          <CalendarDays size={15} />

                          {formatDate(
                            getStoryDate(featuredStory)
                          )}
                        </div>

                        {featuredStory.author && (
                          <div className="flex items-center gap-2">
                            <Users size={15} />

                            <span>
                              By {featuredStory.author}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="line-clamp-3 leading-7 text-gray-600">
                      {featuredStory.excerpt ||
                        featuredStory.description ||
                        "Read the latest news from Mount View International Primary School & Early Years Centre."}
                    </p>

                    <div className="mt-5 flex items-center gap-2 font-bold text-[#252B68]">
                      Read story
                      <ArrowRight
                        size={17}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </div>
                  </div>
                </button>

                {/* Latest stories */}
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
                      {latestStories
                        .slice(0, 6)
                        .map((story) => {
                          const imageUrl =
                            getImageUrl(
                              story.image_url ||
                                story.image ||
                                story.image_path
                            );

                          return (
                            <button
                              key={story.id}
                              type="button"
                              onClick={() =>
                                setSelectedStory(story)
                              }
                              className="group overflow-hidden rounded-2xl border border-gray-200 bg-white text-left transition duration-300 hover:-translate-y-1 hover:border-[#252B68]/20 hover:shadow-xl"
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
                                {getCategoryName(
                                  story.category
                                ) && (
                                  <p className="mb-2 text-xs font-black uppercase tracking-wide text-[#F58220]">
                                    {getCategoryName(
                                      story.category
                                    )}
                                  </p>
                                )}

                                <h4 className="line-clamp-2 text-lg font-black leading-snug text-[#252B68]">
                                  {story.title}
                                </h4>

                                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                                  <div className="flex items-center gap-1.5">
                                    <CalendarDays size={14} />

                                    {formatShortDate(
                                      getStoryDate(story)
                                    )}
                                  </div>

                                  {story.author && (
                                    <div className="flex items-center gap-1.5">
                                      <Users size={14} />

                                      <span>
                                        {story.author}
                                      </span>
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
        </section>

        {/* =====================================================
            UPCOMING EVENTS
        ====================================================== */}
        <section className="bg-gray-50">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
            <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-[#F58220]">
                  What's Coming Up
                </p>

                <h2 className="text-3xl font-black text-[#252B68] sm:text-4xl">
                  Upcoming Events
                </h2>

                <p className="mt-3 max-w-2xl text-gray-600">
                  Mark your calendar and join us for the
                  exciting activities happening across our
                  school community.
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
                  Check back soon for upcoming school
                  activities and events.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {upcomingEvents.map((event) => {
                  const imageUrl = getImageUrl(
                    event.image_url ||
                      event.image ||
                      event.image_path
                  );

                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.slug}`}
                      className="group overflow-hidden rounded-3xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl"
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
                              {new Date(
                                event.event_date
                              ).toLocaleDateString(
                                "en-GB",
                                {
                                  month: "short",
                                }
                              )}
                            </p>

                            <p className="text-2xl font-black leading-none text-[#252B68]">
                              {new Date(
                                event.event_date
                              ).getDate()}
                            </p>
                          </div>
                        </div>

                        {event.featured && (
                          <div className="absolute right-4 top-4">
                            <span className="rounded-full bg-[#FFE900] px-3 py-1.5 text-xs font-black text-[#252B68]">
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
                            {event.description}
                          </p>
                        )}

                        <div className="mt-5 space-y-2.5 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <CalendarDays
                              size={16}
                              className="shrink-0 text-[#F58220]"
                            />

                            {formatDate(
                              event.event_date
                            )}
                          </div>

                          {(event.start_time ||
                            event.end_time) && (
                            <div className="flex items-center gap-2">
                              <Clock3
                                size={16}
                                className="shrink-0 text-[#F58220]"
                              />

                              {formatTime(
                                event.start_time
                              )}

                              {event.end_time && (
                                <>
                                  {" "}
                                  –{" "}
                                  {formatTime(
                                    event.end_time
                                  )}
                                </>
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

                          {getClassName(
                            event.class_name
                          ) && (
                            <div className="flex items-center gap-2">
                              <Users
                                size={16}
                                className="shrink-0 text-[#F58220]"
                              />

                              {getClassName(
                                event.class_name
                              )}
                            </div>
                          )}
                        </div>

                        <div className="mt-6 flex items-center gap-2 font-bold text-[#252B68]">
                          View event
                          <ChevronRight
                            size={17}
                            className="transition-transform group-hover:translate-x-1"
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* =====================================================
            SCHOOL MESSAGE
        ====================================================== */}
        <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#252B68] px-7 py-12 sm:px-12 lg:px-16">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#FFE900]/20 blur-3xl" />

            <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#F58220]/20 blur-3xl" />

            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#FFE900]">
                  Our School Community
                </p>

                <h2 className="max-w-3xl text-3xl font-black leading-tight text-white sm:text-4xl">
                  Fostering growth, excellence and
                  empathy.
                </h2>

                <p className="mt-4 max-w-2xl text-white/75">
                  From classroom achievements to
                  community celebrations, every story
                  reflects the people who make Mount View
                  special.
                </p>
              </div>

              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FFE900] px-6 py-3.5 font-black text-[#252B68] transition hover:bg-white"
              >
                Contact the School
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* =======================================================
          NEWS ARTICLE MODAL
      ======================================================== */}
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
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              onClick={() =>
                setSelectedStory(null)
              }
              aria-label="Close article"
              className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur transition hover:bg-black"
            >
              <X size={23} />
            </button>

            {/* Article image */}
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
                  {getCategoryName(
                    selectedStory.category
                  ) && (
                    <span className="mb-3 inline-block rounded-full bg-[#FFE900] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[#252B68]">
                      {getCategoryName(
                        selectedStory.category
                      )}
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

            {/* Article content */}
            <div className="overflow-y-auto">
              <article className="mx-auto max-w-4xl px-6 py-7 sm:px-10 sm:py-9">

                {!getImageUrl(
                  selectedStory.image_url ||
                    selectedStory.image ||
                    selectedStory.image_path
                ) && (
                  <>
                    {getCategoryName(
                      selectedStory.category
                    ) && (
                      <span className="mb-3 inline-block rounded-full bg-[#252B68] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white">
                        {getCategoryName(
                          selectedStory.category
                        )}
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

                {/* Meta */}
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-gray-200 pb-5 text-sm text-gray-500">

                  {getStoryDate(selectedStory) && (
                    <div className="flex items-center gap-2">
                      <CalendarDays
                        size={16}
                        className="text-[#F58220]"
                      />

                      {formatDate(
                        getStoryDate(selectedStory)
                      )}
                    </div>
                  )}

                  {/* AUTHOR */}
                  {selectedStory.author && (
                    <div className="flex items-center gap-2">
                      <Users
                        size={16}
                        className="text-[#F58220]"
                      />

                      <span>
                        By{" "}
                        <strong className="font-semibold text-[#252B68]">
                          {selectedStory.author}
                        </strong>
                      </span>
                    </div>
                  )}

                  {getClassName(
                    selectedStory.class_name
                  ) && (
                    <div className="flex items-center gap-2">
                      <Users
                        size={16}
                        className="text-[#F58220]"
                      />

                      {getClassName(
                        selectedStory.class_name
                      )}
                    </div>
                  )}
                </div>

                {/* Excerpt */}
                {selectedStory.excerpt && (
                  <p className="mt-7 text-lg font-semibold leading-8 text-gray-600">
                    {selectedStory.excerpt}
                  </p>
                )}

                {/* Full content */}
                <div
                  className="prose prose-lg mt-7 max-w-none prose-headings:font-black prose-headings:text-[#252B68] prose-a:text-[#252B68] prose-strong:text-[#252B68] prose-p:leading-8 prose-img:rounded-2xl"
                  dangerouslySetInnerHTML={{
                    __html:
                      selectedStory.content ||
                      selectedStory.description ||
                      "<p>No additional article content is available.</p>",
                  }}
                />

                {/* Bottom close */}
                <div className="mt-10 border-t border-gray-200 pt-6">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedStory(null)
                    }
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
    </>
  );
}