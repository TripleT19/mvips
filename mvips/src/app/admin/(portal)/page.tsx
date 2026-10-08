"use client";

import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  Calendar,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  Clock,
  FileText,
  GalleryHorizontalEnd,
  GraduationCap,
  Image as ImageIcon,
  LayoutDashboard,
  Loader2,
  MapPin,
  RefreshCw,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const ADMIN_TOKEN_KEY = "admin_token";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

interface DashboardStats {
  stories: number;
  published_stories: number;
  draft_stories: number;
  events: number;
  upcoming_events: number;
  galleries: number;
  gallery_albums: number;
  users: number;
  active_users: number;
}

interface AdmissionStats {
  total: number;
  submitted: number;
  document_verification: number;
  assessments_scheduled: number;
  assessments_completed: number;
  awaiting_approval: number;
  approved: number;
  denied: number;
  waitlisted: number;
  enrolled: number;
}

interface RecentStory {
  id: number;
  title: string;
  slug: string;
  author: string | null;
  status: string;
  featured: boolean;
  image_url: string | null;
  category: { id: number; name: string; slug: string } | null;
  created_at: string;
}

interface UpcomingEvent {
  id: number;
  title: string;
  slug: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  class_name: string | null;
  status: string;
  featured: boolean;
}

interface RecentUser {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface RecentApplication {
  id: number;
  application_number: string;
  legal_first_name: string;
  middle_name: string | null;
  legal_surname: string;
  status: string;
  source: string;
  submitted: boolean;
  submitted_at: string | null;
  created_at: string;
  academic_year: { id: number; name: string } | null;
  class_applied: { id: number; name: string } | null;
}

interface DashboardData {
  stats: DashboardStats;
  admissions: AdmissionStats;
  recent_stories: RecentStory[];
  upcoming_events: UpcomingEvent[];
  recent_users: RecentUser[];
  recent_applications: RecentApplication[];
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(ADMIN_TOKEN_KEY)
      : null;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  return headers;
}

function fullName(app: {
  legal_first_name: string;
  middle_name?: string | null;
  legal_surname: string;
}) {
  return [app.legal_first_name, app.middle_name, app.legal_surname]
    .filter(Boolean)
    .join(" ");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function formatRelative(value: string | null | undefined) {
  if (!value) return "—";

  try {
    const date = new Date(value);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60_000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  } catch {
    return value;
  }
}

function roleLabel(role?: string | null) {
  if (!role) return "—";

  const normalized = role.toLowerCase().replace(/[\s-]+/g, "_");

  switch (normalized) {
    case "administrator":
    case "admin":
      return "Administrator";
    case "editor":
      return "Editor";
    case "staff":
      return "Staff";
    case "headteacher":
    case "head_teacher":
    case "principal":
      return "Headteacher";
    case "admissions_officer":
    case "admission_officer":
      return "Admissions Officer";
    default:
      return role
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
  }
}

function statusLabel(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  submitted: "bg-blue-50 text-blue-700",
  document_verification: "bg-amber-50 text-amber-700",
  assessment_scheduled: "bg-violet-50 text-violet-700",
  assessment_completed: "bg-indigo-50 text-indigo-700",
  principal_review: "bg-orange-50 text-orange-700",
  approved: "bg-green-50 text-green-700",
  denied: "bg-red-50 text-red-700",
  waitlisted: "bg-purple-50 text-purple-700",
  enrolled: "bg-emerald-50 text-emerald-700",
  transferred: "bg-cyan-50 text-cyan-700",
  withdrawn: "bg-rose-50 text-rose-700",
};

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (opts: { silent?: boolean } = {}) => {
    if (!opts.silent) setLoading(true);
    else setRefreshing(true);

    setError("");

    try {
      const response = await fetch(`${API_URL}/api/admin/dashboard`, {
        headers: authHeaders(),
        cache: "no-store",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.message || "Unable to load the dashboard."
        );
      }

      setData(payload.data as DashboardData);
    } catch (e: any) {
      setError(e?.message || "Unable to load the dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033]">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Welcome back. Here is what is happening at Mount View.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadDashboard({ silent: true })}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={refreshing ? "animate-spin" : ""}
          />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && !data && (
        <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Loader2
              size={20}
              className="animate-spin text-[#F58220]"
            />
            Loading dashboard…
          </div>
        </div>
      )}

      {/* Content */}
      {data && (
        <>
          {/* Website stats */}
          <section>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
              Website Overview
            </h2>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                label="Total Stories"
                value={data.stats.stories}
                sublabel={`${data.stats.published_stories} published`}
                icon={<BookOpen size={22} />}
                accent="text-[#252B68]"
                bg="bg-[#252B68]/10"
                href="/admin/stories"
              />
              <StatCard
                label="Events"
                value={data.stats.events}
                sublabel={`${data.stats.upcoming_events} upcoming`}
                icon={<CalendarDays size={22} />}
                accent="text-[#F58220]"
                bg="bg-[#F58220]/10"
                href="/admin/events"
              />
              <StatCard
                label="Gallery Albums"
                value={data.stats.galleries}
                sublabel="Image collections"
                icon={<GalleryHorizontalEnd size={22} />}
                accent="text-emerald-600"
                bg="bg-emerald-50"
                href="/admin/gallery"
              />
              <StatCard
                label="Users"
                value={data.stats.users}
                sublabel={`${data.stats.active_users} active`}
                icon={<Users size={22} />}
                accent="text-violet-600"
                bg="bg-violet-50"
                href="/admin/users"
              />
            </div>
          </section>

          {/* Admissions pipeline */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Admissions Pipeline
              </h2>

              <Link
                href="/admin/admissions"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#252B68] hover:underline"
              >
                View all
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#252B68]/10 text-[#252B68]">
                  <ClipboardCheck size={22} />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Total Applications
                  </p>

                  <p className="text-2xl font-black text-[#252B68]">
                    {data.admissions.total}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <PipelineCell
                  label="Submitted"
                  value={data.admissions.submitted}
                  tone="blue"
                />
                <PipelineCell
                  label="Documents"
                  value={data.admissions.document_verification}
                  tone="amber"
                />
                <PipelineCell
                  label="Assessments"
                  value={
                    data.admissions.assessments_scheduled +
                    data.admissions.assessments_completed
                  }
                  tone="violet"
                />
                <PipelineCell
                  label="Awaiting Approval"
                  value={data.admissions.awaiting_approval}
                  tone="orange"
                />
                <PipelineCell
                  label="Enrolled"
                  value={data.admissions.enrolled}
                  tone="emerald"
                />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
                <MiniStat
                  label="Approved"
                  value={data.admissions.approved}
                  className="text-green-600"
                />
                <MiniStat
                  label="Waitlisted"
                  value={data.admissions.waitlisted}
                  className="text-purple-600"
                />
                <MiniStat
                  label="Denied"
                  value={data.admissions.denied}
                  className="text-red-600"
                />
              </div>
            </div>
          </section>

          {/* Recent applications + Recent users */}
          <section className="grid gap-6 lg:grid-cols-2">
            <Panel
              title="Recent Applications"
              icon={<FileText size={17} />}
              href="/admin/admissions"
              hrefLabel="View all"
            >
              {data.recent_applications.length === 0 ? (
                <EmptyState
                  icon={<FileText size={22} />}
                  title="No applications yet"
                  subtitle="New applications will appear here as they come in."
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.recent_applications.map((application) => (
                    <li key={application.id}>
                      <Link
                        href={`/admin/admissions?application=${application.id}`}
                        className="flex items-center gap-3 py-3 transition hover:bg-slate-50/50"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#252B68] text-sm font-bold text-white">
                          {application.legal_first_name?.[0] ?? "?"}
                          {application.legal_surname?.[0] ?? ""}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#172033]">
                            {fullName(application)}
                          </p>

                          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="font-mono">
                              {application.application_number}
                            </span>
                            {application.class_applied && (
                              <>
                                <span>·</span>
                                <span>
                                  {application.class_applied.name}
                                </span>
                              </>
                            )}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            STATUS_COLORS[application.status] ??
                            "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {statusLabel(application.status)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel
              title="Recent Users"
              icon={<Users size={17} />}
              href="/admin/users"
              hrefLabel="Manage users"
            >
              {data.recent_users.length === 0 ? (
                <EmptyState
                  icon={<Users size={22} />}
                  title="No users yet"
                  subtitle="Created accounts will appear here."
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.recent_users.map((user) => (
                    <li
                      key={user.id}
                      className="flex items-center gap-3 py-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-[#252B68]">
                        {user.name
                          ?.split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")
                          .toUpperCase() || "U"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#172033]">
                          {user.name}
                        </p>

                        <p className="truncate text-xs text-slate-500">
                          {user.email}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="rounded-full bg-[#252B68]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#252B68]">
                          {roleLabel(user.role)}
                        </span>

                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Pending
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </section>

          {/* Recent stories + Upcoming events */}
          <section className="grid gap-6 lg:grid-cols-2">
            <Panel
              title="Recent Stories"
              icon={<BookOpen size={17} />}
              href="/admin/stories"
              hrefLabel="All stories"
            >
              {data.recent_stories.length === 0 ? (
                <EmptyState
                  icon={<BookOpen size={22} />}
                  title="No stories yet"
                  subtitle="Published and draft stories will appear here."
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.recent_stories.map((story) => (
                    <li key={story.id}>
                      <Link
                        href={`/admin/stories/${story.id}`}
                        className="flex items-center gap-3 py-3 transition hover:bg-slate-50/50"
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          {story.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={story.image_url}
                              alt={story.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                              <ImageIcon size={18} />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#172033]">
                            {story.title}
                          </p>

                          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            {story.category && (
                              <span>{story.category.name}</span>
                            )}
                            {story.category && <span>·</span>}
                            <span>{formatRelative(story.created_at)}</span>
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            story.status === "published"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {story.status}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel
              title="Upcoming Events"
              icon={<CalendarDays size={17} />}
              href="/admin/events"
              hrefLabel="All events"
            >
              {data.upcoming_events.length === 0 ? (
                <EmptyState
                  icon={<Calendar size={22} />}
                  title="No upcoming events"
                  subtitle="Scheduled events will appear here."
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.upcoming_events.map((event) => (
                    <li key={event.id}>
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="flex items-center gap-3 py-3 transition hover:bg-slate-50/50"
                      >
                        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[#F58220]/10 text-[#F58220]">
                          <span className="text-[10px] font-bold uppercase leading-none">
                            {new Date(event.event_date).toLocaleString(
                              undefined,
                              { month: "short" }
                            )}
                          </span>

                          <span className="text-base font-black leading-none">
                            {new Date(event.event_date).getDate()}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#172033]">
                            {event.title}
                          </p>

                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            {event.start_time && (
                              <span className="inline-flex items-center gap-1">
                                <Clock size={11} />
                                {event.start_time}
                              </span>
                            )}

                            {event.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin size={11} />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>

                        <ChevronRight
                          size={16}
                          className="shrink-0 text-slate-300"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </section>

          {/* School website shortcut */}
          <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-[#252B68] to-[#171B4A] p-6 text-white shadow-sm">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFE900]/10 text-[#FFE900]">
                  <GraduationCap size={24} />
                </div>

                <div>
                  <p className="text-base font-bold">
                    Mount View International Primary School
                  </p>

                  <p className="mt-0.5 text-sm text-white/70">
                    View the public website to see live content.
                  </p>
                </div>
              </div>

              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Open website
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Sub-components
|--------------------------------------------------------------------------
*/

function StatCard({
  label,
  value,
  sublabel,
  icon,
  accent,
  bg,
  href,
}: {
  label: string;
  value: number;
  sublabel?: string;
  icon: React.ReactNode;
  accent: string;
  bg: string;
  href?: string;
}) {
  const content = (
    <div className="flex h-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#252B68]/30 hover:shadow-md">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>

        <p className="mt-2 text-3xl font-black text-[#172033]">{value}</p>

        {sublabel && (
          <p className="mt-1 text-xs text-slate-500">{sublabel}</p>
        )}
      </div>

      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bg} ${accent}`}
      >
        {icon}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
}

function PipelineCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "blue" | "amber" | "violet" | "orange" | "emerald";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
    orange: "bg-orange-50 text-orange-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };

  return (
    <div className={`rounded-xl p-3 ${tones[tone]}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
        {label}
      </p>

      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="text-center">
      <p className={`text-lg font-black ${className ?? "text-[#172033]"}`}>
        {value}
      </p>

      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
    </div>
  );
}

function Panel({
  title,
  icon,
  href,
  hrefLabel,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  href: string;
  hrefLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="text-[#252B68]">{icon}</span>

          <h3 className="text-sm font-bold text-[#172033]">{title}</h3>
        </div>

        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#252B68] hover:underline"
        >
          {hrefLabel}
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="px-5 py-2">{children}</div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        {icon}
      </div>

      <p className="mt-3 text-sm font-semibold text-[#172033]">{title}</p>

      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}