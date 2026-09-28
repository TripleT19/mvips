"use client";

import {
  Activity,
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  FolderOpen,
  GalleryHorizontalEnd,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Story = {
  id: number;
  title: string;
  slug?: string;
  status?: string;
  published_at?: string | null;
  created_at?: string;
  category?: {
    id?: number;
    name?: string;
    slug?: string;
  } | null;
  image_url?: string | null;
};

type EventItem = {
  id: number;
  title: string;
  slug?: string;
  event_date?: string;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  status?: string;
  image_url?: string | null;
};

type DashboardStats = {
  stories: number;
  publishedStories: number;
  draftStories: number;
  events: number;
  upcomingEvents: number;
  galleries: number;
};

type DashboardResponse = {
  success?: boolean;
  data?: {
    stories?: {
      total?: number;
      published?: number;
      drafts?: number;
    };
    events?: {
      total?: number;
      published?: number;
      upcoming?: number;
    };
    gallery?: {
      total?: number;
      published?: number;
    };
    stats?: {
      stories?: number;
      published_stories?: number;
      draft_stories?: number;
      events?: number;
      upcoming_events?: number;
      galleries?: number;
      gallery_albums?: number;
    };
    recent_stories?: Story[];
    upcoming_events?: EventItem[];
  };
};

function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#f6f7fb] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-40 animate-pulse rounded-3xl bg-white shadow-sm" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-2xl bg-white shadow-sm"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "No date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatEventDate(value?: string | null) {
  if (!value) return "Date not set";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(value?: string | null) {
  if (!value) return "";

  const parts = value.split(":");

  if (parts.length < 2) return value;

  const hours = Number(parts[0]);
  const minutes = parts[1];

  if (Number.isNaN(hours)) return value;

  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${minutes} ${suffix}`;
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getInitials(name?: string) {
  if (!name) return "MV";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass,
  href,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ElementType;
  iconClass: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#252B68]/20 hover:shadow-lg"
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-slate-50 transition-transform duration-300 group-hover:scale-125" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-[#172033]">
            {value}
          </p>

          <p className="mt-1 text-xs font-medium text-slate-400">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={21} strokeWidth={2} />
        </div>
      </div>

      <div className="relative mt-4 flex items-center gap-1 text-xs font-semibold text-[#252B68]">
        <span>Manage</span>
        <ArrowRight
          size={14}
          className="transition-transform group-hover:translate-x-1"
        />
      </div>
    </a>
  );
}

function SectionHeader({
  title,
  description,
  href,
  linkText = "View all",
}: {
  title: string;
  description: string;
  href: string;
  linkText?: string;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-[#172033]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <a
        href={href}
        className="inline-flex items-center gap-1 self-start text-sm font-semibold text-[#252B68] hover:text-[#F58220]"
      >
        {linkText}
        <ChevronRight size={16} />
      </a>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState<DashboardStats>({
    stories: 0,
    publishedStories: 0,
    draftStories: 0,
    events: 0,
    upcomingEvents: 0,
    galleries: 0,
  });

  const [recentStories, setRecentStories] = useState<Story[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [adminName, setAdminName] = useState("Administrator");

  const loadDashboard = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const token = localStorage.getItem("admin_token");

        if (!token) {
          window.location.href = "/admin/login";
          return;
        }

        const response = await fetch(
          `${API_URL}/api/admin/dashboard`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
          window.location.href = "/admin/login";
          return;
        }

        if (!response.ok) {
          throw new Error(
            `Dashboard request failed: ${response.status}`
          );
        }

        const responseData: DashboardResponse = await response.json();

        const dashboardData = responseData?.data ?? {};

        /*
         * Your current Laravel API returns:
         *
         * data.stories.total
         * data.stories.published
         * data.stories.drafts
         *
         * data.events.total
         * data.events.published
         * data.events.upcoming
         *
         * data.gallery.total
         * data.gallery.published
         *
         * The fallback below also supports the older stats format.
         */

        const storyStats = dashboardData.stories ?? {};
        const eventStats = dashboardData.events ?? {};
        const galleryStats = dashboardData.gallery ?? {};
        const legacyStats = dashboardData.stats ?? {};

        setStats({
          stories: Number(
            storyStats.total ??
              legacyStats.stories ??
              0
          ),

          publishedStories: Number(
            storyStats.published ??
              legacyStats.published_stories ??
              0
          ),

          draftStories: Number(
            storyStats.drafts ??
              legacyStats.draft_stories ??
              0
          ),

          events: Number(
            eventStats.total ??
              legacyStats.events ??
              0
          ),

          upcomingEvents: Number(
            eventStats.upcoming ??
              legacyStats.upcoming_events ??
              0
          ),

          galleries: Number(
            galleryStats.total ??
              legacyStats.galleries ??
              legacyStats.gallery_albums ??
              0
          ),
        });

        const stories = Array.isArray(dashboardData.recent_stories)
          ? dashboardData.recent_stories
          : [];

        const events = Array.isArray(dashboardData.upcoming_events)
          ? dashboardData.upcoming_events
          : [];

        setRecentStories(stories);
        setUpcomingEvents(events);
      } catch (error) {
        console.error("Dashboard loading error:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    setMounted(true);

    const storedUser = localStorage.getItem("admin_user");

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);

        if (user?.name) {
          setAdminName(user.name);
        }
      } catch {
        // Ignore malformed local storage data.
      }
    }

    loadDashboard();
  }, [loadDashboard]);

  if (!mounted || loading) {
    return <DashboardLoading />;
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb]">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-[#252B68] px-6 py-7 shadow-xl sm:px-8 sm:py-9">
          <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#FFE900]/10" />
          <div className="absolute -bottom-32 right-24 h-64 w-64 rounded-full bg-[#F58220]/10" />
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/[0.04] to-transparent" />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur">
                <Sparkles size={14} className="text-[#FFE900]" />
                Mount View Administration
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {getGreeting()}, {adminName.split(" ")[0]}
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
                Manage your school website, stories, events and gallery
                content from one central dashboard.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="/admin/stories"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#FFE900] px-4 py-2.5 text-sm font-bold text-[#252B68] shadow-sm transition hover:bg-white"
                >
                  <Plus size={17} />
                  New Story
                </a>

                <a
                  href="/admin/events"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
                >
                  <CalendarDays size={17} />
                  Add Event
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start lg:self-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold text-white ring-1 ring-white/10">
                {getInitials(adminName)}
              </div>

              <div>
                <p className="text-sm font-bold text-white">
                  {adminName}
                </p>
                <p className="mt-0.5 text-xs text-white/60">
                  Website Administrator
                </p>
              </div>

              <button
                type="button"
                onClick={() => loadDashboard(true)}
                disabled={refreshing}
                className="ml-2 flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/15 disabled:opacity-50"
                title="Refresh dashboard"
              >
                <RefreshCw
                  size={17}
                  className={refreshing ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#172033]">
                Website overview
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                A quick look at your current website content.
              </p>
            </div>

            <div className="hidden items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm ring-1 ring-slate-200 sm:flex">
              <Activity size={14} className="text-emerald-500" />
              System active
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              title="Stories"
              value={stats.stories}
              subtitle={`${stats.publishedStories} published · ${stats.draftStories} drafts`}
              icon={BookOpen}
              iconClass="bg-[#252B68]/10 text-[#252B68]"
              href="/admin/stories"
            />

            <StatCard
              title="Events"
              value={stats.events}
              subtitle={`${stats.upcomingEvents} upcoming`}
              icon={CalendarDays}
              iconClass="bg-[#F58220]/10 text-[#F58220]"
              href="/admin/events"
            />

            <StatCard
              title="Gallery albums"
              value={stats.galleries}
              subtitle="Published school albums"
              icon={GalleryHorizontalEnd}
              iconClass="bg-[#FFE900]/20 text-[#8a7800]"
              href="/admin/gallery"
            />

            <StatCard
              title="Published stories"
              value={stats.publishedStories}
              subtitle="Visible on the website"
              icon={Eye}
              iconClass="bg-emerald-50 text-emerald-600"
              href="/admin/stories"
            />

            <StatCard
              title="Draft stories"
              value={stats.draftStories}
              subtitle="Waiting to be published"
              icon={FileText}
              iconClass="bg-amber-50 text-amber-600"
              href="/admin/stories"
            />

            <StatCard
              title="Upcoming events"
              value={stats.upcomingEvents}
              subtitle="Future school activities"
              icon={Clock3}
              iconClass="bg-sky-50 text-sky-600"
              href="/admin/events"
            />
          </div>
        </section>

        {/* Quick actions */}
        <section className="mt-7">
          <SectionHeader
            title="Quick actions"
            description="Common tasks for managing the school website."
            href="/admin"
            linkText=""
          />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <a
              href="/admin/stories"
              className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#252B68]/10 text-[#252B68]">
                <Plus size={19} />
              </div>

              <p className="mt-3 text-sm font-bold text-[#172033]">
                New story
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Publish news
              </p>

              <ArrowRight
                size={15}
                className="mt-3 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#252B68]"
              />
            </a>

            <a
              href="/admin/events"
              className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F58220]/10 text-[#F58220]">
                <CalendarDays size={19} />
              </div>

              <p className="mt-3 text-sm font-bold text-[#172033]">
                New event
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Add activity
              </p>

              <ArrowRight
                size={15}
                className="mt-3 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#F58220]"
              />
            </a>

            <a
              href="/admin/gallery"
              className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFE900]/25 text-[#8a7800]">
                <Upload size={19} />
              </div>

              <p className="mt-3 text-sm font-bold text-[#172033]">
                Add gallery
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Upload photos
              </p>

              <ArrowRight
                size={15}
                className="mt-3 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#8a7800]"
              />
            </a>

            <a
              href="/admin/media"
              className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <ImageIcon size={19} />
              </div>

              <p className="mt-3 text-sm font-bold text-[#172033]">
                Media library
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Manage files
              </p>

              <ArrowRight
                size={15}
                className="mt-3 text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-600"
              />
            </a>
          </div>
        </section>

        {/* Content area */}
        <div className="mt-7 grid grid-cols-1 gap-6 xl:grid-cols-5">
          {/* Recent stories */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-3">
            <SectionHeader
              title="Recent stories"
              description="Latest news and updates from the school."
              href="/admin/stories"
            />

            {recentStories.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentStories.slice(0, 5).map((story) => (
                  <a
                    key={story.id}
                    href={`/admin/stories`}
                    className="group flex gap-4 py-4 first:pt-1 last:pb-1"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {story.image_url ? (
                        <img
                          src={story.image_url}
                          alt=""
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <BookOpen size={22} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {story.category?.name && (
                          <span className="rounded-full bg-[#252B68]/8 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#252B68]">
                            {story.category.name}
                          </span>
                        )}

                        {story.status && (
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
                              story.status === "published"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-amber-50 text-amber-600"
                            }`}
                          >
                            {story.status}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-2 line-clamp-1 text-sm font-bold text-[#172033] group-hover:text-[#252B68]">
                        {story.title}
                      </h3>

                      <p className="mt-1 text-xs text-slate-400">
                        {formatDate(
                          story.published_at ?? story.created_at
                        )}
                      </p>
                    </div>

                    <ChevronRight
                      size={17}
                      className="mt-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#252B68]"
                    />
                  </a>
                ))}
              </div>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-xl bg-slate-50 text-center">
                <BookOpen size={30} className="text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  No recent stories
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Published stories will appear here.
                </p>
              </div>
            )}
          </section>

          {/* Upcoming events */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <SectionHeader
              title="Upcoming events"
              description="What is coming up at Mount View."
              href="/admin/events"
            />

            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 5).map((event) => (
                  <a
                    key={event.id}
                    href="/admin/events"
                    className="group flex gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-[#252B68]/15 hover:bg-slate-50"
                  >
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[#252B68] text-white">
                      <CalendarDays size={16} />
                      <span className="mt-0.5 text-[9px] font-bold uppercase">
                        Event
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-1 text-sm font-bold text-[#172033] group-hover:text-[#252B68]">
                        {event.title}
                      </h3>

                      <p className="mt-1 text-xs font-medium text-[#F58220]">
                        {formatEventDate(event.event_date)}
                      </p>

                      {(event.start_time || event.location) && (
                        <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                          {event.start_time
                            ? formatTime(event.start_time)
                            : ""}
                          {event.start_time && event.location
                            ? " · "
                            : ""}
                          {event.location ?? ""}
                        </p>
                      )}
                    </div>

                    <ChevronRight
                      size={16}
                      className="mt-3 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#F58220]"
                    />
                  </a>
                ))}
              </div>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-xl bg-slate-50 text-center">
                <CalendarDays size={30} className="text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  No upcoming events
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Add a new event to keep the school community informed.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Bottom information */}
        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#252B68]/10 text-[#252B68]">
                <TrendingUp size={19} />
              </div>

              <div>
                <p className="text-sm font-bold text-[#172033]">
                  Content activity
                </p>
                <p className="text-xs text-slate-400">
                  Keep the website fresh
                </p>
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#252B68]"
                style={{
                  width: `${Math.min(
                    Math.max(stats.publishedStories * 10, 10),
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F58220]/10 text-[#F58220]">
                <FolderOpen size={19} />
              </div>

              <div>
                <p className="text-sm font-bold text-[#172033]">
                  School gallery
                </p>
                <p className="text-xs text-slate-400">
                  {stats.galleries} published album
                  {stats.galleries === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <a
              href="/admin/gallery"
              className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#252B68] hover:text-[#F58220]"
            >
              Manage gallery
              <ArrowRight size={13} />
            </a>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFE900]/30 text-[#756500]">
                <Users size={19} />
              </div>

              <div>
                <p className="text-sm font-bold text-[#172033]">
                  Administration
                </p>
                <p className="text-xs text-slate-400">
                  Manage website access
                </p>
              </div>
            </div>

            <a
              href="/admin/users"
              className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#252B68] hover:text-[#F58220]"
            >
              Manage users
              <ArrowRight size={13} />
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 border-t border-slate-200 py-5 text-center">
          <p className="text-xs text-slate-400">
            Mount View International Primary School & Early Years Centre
          </p>
          <p className="mt-1 text-[11px] text-slate-300">
            Fostering growth, excellence and empathy
          </p>
        </footer>
      </div>
    </main>
  );
}