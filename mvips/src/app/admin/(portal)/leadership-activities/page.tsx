"use client";

import {
  AlertCircle,
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "admin_token";
const MAX_IMAGE_MB = 5;
const MAX_STORY_WORDS = 100;

const CATEGORY_OPTIONS = [
  "Student Council",
  "Service Learning",
  "Community Project",
  "Public Speaking",
  "Environmental Action",
  "Community Partnership",
  "Other",
];

/* =========================================================
   TYPES
========================================================= */

type Status = "draft" | "published";

interface LeadershipActivity {
  id: number;
  title: string;
  slug: string;
  story: string;
  category: string | null;
  participants: string | null;
  activity_date: string | null;
  image_url: string | null;
  featured: boolean;
  status: Status;
  created_at?: string;
}

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/* =========================================================
   HELPERS
========================================================= */

function authHeaders(json = true): HeadersInit {
  const token =
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

  const h: Record<string, string> = { Accept: "application/json" };
  if (json) h["Content-Type"] = "application/json";
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

/* Word-count helpers — mirrored on the academics page */
function countWords(str: string): number {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

function trimToWords(str: string, max: number): string {
  const words = str.trim().split(/\s+/).filter(Boolean);
  if (words.length <= max) return str;
  return words.slice(0, max).join(" ");
}

/* =========================================================
   PAGE
========================================================= */

export default function AdminLeadershipActivitiesPage() {
  const [items, setItems] = useState<LeadershipActivity[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LeadershipActivity | null>(null);

  const [deleting, setDeleting] = useState<LeadershipActivity | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [result, setResult] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  /* ------------------------------------------------------------------
     Fetch
  ------------------------------------------------------------------ */

  const load = async (page = 1, opts: { silent?: boolean } = {}) => {
    if (!opts.silent) setLoading(true);
    else setRefreshing(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("per_page", "20");

      if (search.trim()) params.set("search", search.trim());
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("category", categoryFilter);

      const res = await fetch(
        `${API_URL}/api/admin/leadership-activities?${params.toString()}`,
        { headers: authHeaders(false), cache: "no-store" }
      );

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || "Unable to load activities.");
      }

      setItems(Array.isArray(json?.data?.data) ? json.data.data : []);
      setPagination({
        current_page: json?.data?.current_page ?? 1,
        last_page: json?.data?.last_page ?? 1,
        per_page: json?.data?.per_page ?? 20,
        total: json?.data?.total ?? 0,
      });
      setAvailableCategories(Array.isArray(json?.categories) ? json.categories : []);
    } catch (e: any) {
      setError(e?.message || "Unable to load activities.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(1, { silent: true }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, categoryFilter]);

  /* ------------------------------------------------------------------
     Actions
  ------------------------------------------------------------------ */

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);

    try {
      const res = await fetch(
        `${API_URL}/api/admin/leadership-activities/${deleting.id}`,
        { method: "DELETE", headers: authHeaders(false) }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Unable to delete.");

      setResult({
        type: "success",
        title: "Activity Deleted",
        message: `"${deleting.title}" was removed.`,
      });
      setDeleting(null);
      await load(pagination.current_page, { silent: true });
    } catch (e: any) {
      setResult({
        type: "error",
        title: "Delete Failed",
        message: e?.message || "Something went wrong.",
      });
    } finally {
      setDeleteBusy(false);
    }
  }

  async function toggleStatus(item: LeadershipActivity) {
    const newStatus: Status = item.status === "published" ? "draft" : "published";
    try {
      const res = await fetch(
        `${API_URL}/api/admin/leadership-activities/${item.id}`,
        {
          method: "PUT",
          headers: authHeaders(true),
          body: JSON.stringify({
            title: item.title,
            story: item.story,
            category: item.category,
            participants: item.participants,
            activity_date: item.activity_date,
            featured: item.featured,
            status: newStatus,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Unable to update.");

      setResult({
        type: "success",
        title: newStatus === "published" ? "Published" : "Moved to Draft",
        message: `"${item.title}" is now ${newStatus}.`,
      });
      await load(pagination.current_page, { silent: true });
    } catch (e: any) {
      setResult({
        type: "error",
        title: "Update Failed",
        message: e?.message || "Something went wrong.",
      });
    }
  }

  async function toggleFeatured(item: LeadershipActivity) {
    try {
      const res = await fetch(
        `${API_URL}/api/admin/leadership-activities/${item.id}`,
        {
          method: "PUT",
          headers: authHeaders(true),
          body: JSON.stringify({
            title: item.title,
            story: item.story,
            category: item.category,
            participants: item.participants,
            activity_date: item.activity_date,
            featured: !item.featured,
            status: item.status,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Unable to update.");

      setResult({
        type: "success",
        title: item.featured ? "Removed from Featured" : "Marked as Featured",
        message: `"${item.title}" updated.`,
      });
      await load(pagination.current_page, { silent: true });
    } catch (e: any) {
      setResult({
        type: "error",
        title: "Update Failed",
        message: e?.message || "Something went wrong.",
      });
    }
  }

  /* ------------------------------------------------------------------
     Render
  ------------------------------------------------------------------ */

  const publishedCount = items.filter((i) => i.status === "published").length;
  const draftCount = items.filter((i) => i.status === "draft").length;
  const featuredCount = items.filter((i) => i.featured).length;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#252B68] text-[#FFE900]">
              <Award size={22} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#F58220]">
                Mount View Admin
              </p>
              <h1 className="text-base font-black text-[#252B68]">
                Leadership & Global Citizenship
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                setRefreshing(true);
                try {
                  await load(pagination.current_page, { silent: true });
                } finally {
                  setRefreshing(false);
                }
              }}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#252B68] px-4 py-2 text-sm font-bold text-white hover:bg-[#1c2156]"
            >
              <Plus size={16} />
              New Activity
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total", value: pagination.total, color: "text-[#252B68]" },
            { label: "Published", value: publishedCount, color: "text-emerald-600" },
            { label: "Drafts", value: draftCount, color: "text-amber-600" },
            { label: "Featured", value: featuredCount, color: "text-[#F58220]" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-slate-100 bg-white p-4"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {s.label}
              </p>
              <p className={`mt-1 text-2xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-4">
          <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr]">
            <label className="relative block">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title or story…"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10"
              />
            </label>

            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              placeholder="All categories"
              options={[
                ...new Set([...CATEGORY_OPTIONS, ...availableCategories]),
              ].map((c) => ({ value: c, label: c }))}
            />

            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All status"
              options={[
                { value: "published", label: "Published" },
                { value: "draft", label: "Draft" },
              ]}
            />
          </div>
        </div>

        {/* Result / error */}
        {result && (
          <div
            className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 ${
              result.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {result.type === "success" ? (
              <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
            )}
            <div className="flex-1">
              <p className="text-sm font-bold">{result.title}</p>
              <p className="mt-0.5 text-sm">{result.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="rounded-lg p-1 hover:bg-white/50"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
            <button
              type="button"
              onClick={() => setError("")}
              className="ml-auto rounded-lg p-1 hover:bg-red-100"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Table / list */}
        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white p-12 text-slate-500">
            <Loader2 size={20} className="animate-spin" />
            Loading activities…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Award size={22} />
            </div>
            <p className="mt-4 font-bold text-[#172033]">No activities yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Upload your first leadership activity to get started.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#F58220] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#df7014]"
            >
              <Plus size={17} />
              New Activity
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Activity</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="transition hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-11 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                            {item.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.image_url}
                                alt={item.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-400">
                                <ImageIcon size={16} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 font-semibold text-[#172033]">
                              <span className="truncate">{item.title}</span>
                              {item.featured && (
                                <Star
                                  size={13}
                                  className="shrink-0 fill-[#F58220] text-[#F58220]"
                                />
                              )}
                            </p>
                            {item.participants && (
                              <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                                {item.participants}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {item.category || "—"}
                      </td>

                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(item.activity_date)}
                      </td>

                      <td className="px-4 py-3">
                        <StatusPill status={item.status} />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(item);
                              setShowForm(true);
                            }}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#252B68]"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleFeatured(item)}
                            className={`rounded-lg p-2 transition ${
                              item.featured
                                ? "text-[#F58220] hover:bg-[#F58220]/10"
                                : "text-slate-500 hover:bg-slate-100"
                            }`}
                            title={item.featured ? "Remove featured" : "Mark featured"}
                          >
                            <Star
                              size={16}
                              className={item.featured ? "fill-current" : ""}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleStatus(item)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-emerald-600"
                            title={item.status === "published" ? "Move to draft" : "Publish"}
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(item)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="divide-y divide-slate-100 md:hidden">
              {items.map((item) => (
                <div key={item.id} className="px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {item.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          <ImageIcon size={18} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 font-bold text-[#172033]">
                        <span className="truncate">{item.title}</span>
                        {item.featured && (
                          <Star
                            size={12}
                            className="shrink-0 fill-[#F58220] text-[#F58220]"
                          />
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {item.category || "—"} · {formatDate(item.activity_date)}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <StatusPill status={item.status} />

                        <button
                          type="button"
                          onClick={() => {
                            setEditing(item);
                            setShowForm(true);
                          }}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(item)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                          title="Toggle status"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(item)}
                          className="rounded-md p-1.5 text-red-500 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold text-slate-500">
                  Page {pagination.current_page} of {pagination.last_page} ·{" "}
                  {pagination.total} total
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => load(pagination.current_page - 1)}
                    disabled={pagination.current_page <= 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => load(pagination.current_page + 1)}
                    disabled={pagination.current_page >= pagination.last_page}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <LeadershipFormModal
          activity={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={async (msg) => {
            setShowForm(false);
            setEditing(null);
            setResult({ type: "success", title: "Saved", message: msg });
            await load(pagination.current_page, { silent: true });
          }}
        />
      )}

      {/* Delete confirmation */}
      {deleting && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
                <Trash2 size={22} className="text-red-600" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-[#172033]">
                Delete activity?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                You are about to permanently delete{" "}
                <span className="font-semibold text-slate-700">
                  &ldquo;{deleting.title}&rdquo;
                </span>
                . The image will also be removed. This cannot be undone.
              </p>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                disabled={deleteBusy}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteBusy}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteBusy ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* =========================================================
   Sub-components
========================================================= */

function Select({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={17}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

function StatusPill({ status }: { status: Status }) {
  return status === "published" ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Published
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Draft
    </span>
  );
}

/* =========================================================
   Form modal
========================================================= */

function LeadershipFormModal({
  activity,
  onClose,
  onSaved,
}: {
  activity: LeadershipActivity | null;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const isEdit = Boolean(activity);

  const [title, setTitle] = useState(activity?.title ?? "");
  const [story, setStory] = useState(
    trimToWords(activity?.story ?? "", MAX_STORY_WORDS)
  );
  const [category, setCategory] = useState(activity?.category ?? "");
  const [participants, setParticipants] = useState(activity?.participants ?? "");
  const [activityDate, setActivityDate] = useState(
    activity?.activity_date
      ? String(activity.activity_date).substring(0, 10)
      : new Date().toISOString().substring(0, 10)
  );
  const [featured, setFeatured] = useState(activity?.featured ?? false);
  const [status, setStatus] = useState<Status>(activity?.status ?? "published");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(
    activity?.image_url ?? ""
  );
  const [removeImage, setRemoveImage] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const imageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    setRemoveImage(false);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Image must be a JPG, PNG or WebP.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`Image must be smaller than ${MAX_IMAGE_MB} MB.`);
      e.target.value = "";
      return;
    }

    setError("");
    setImageFile(file);
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview("");
    setRemoveImage(true);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  /* Enforce max 100 words on every keystroke / paste */
  function handleStoryChange(e: ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    const words = value.trim().split(/\s+/).filter(Boolean);
    if (words.length > MAX_STORY_WORDS) {
      setStory(words.slice(0, MAX_STORY_WORDS).join(" "));
    } else {
      setStory(value);
    }
  }

  const storyWords = countWords(story);
  const storyCounterClass =
    storyWords >= MAX_STORY_WORDS
      ? "text-red-600"
      : storyWords >= 80
      ? "text-amber-600"
      : "text-slate-400";

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!story.trim()) {
      setError("Story is required.");
      return;
    }
    if (countWords(story) > MAX_STORY_WORDS) {
      setError(`Story must be ${MAX_STORY_WORDS} words or fewer.`);
      return;
    }
    if (!activityDate) {
      setError("Activity date is required.");
      return;
    }

    setBusy(true);

    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("story", story.trim());
      fd.append("category", category.trim());
      fd.append("participants", participants.trim());
      fd.append("activity_date", activityDate);
      fd.append("featured", featured ? "1" : "0");
      fd.append("status", status);
      if (imageFile) fd.append("image", imageFile);
      if (removeImage && !imageFile) fd.append("remove_image", "1");

      const url = isEdit
        ? `${API_URL}/api/admin/leadership-activities/${activity!.id}`
        : `${API_URL}/api/admin/leadership-activities`;

      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: fd,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Unable to save.");

      await onSaved(
        isEdit ? "Activity updated successfully." : "Activity created successfully."
      );
    } catch (err: any) {
      setError(err?.message || "Unable to save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[160] flex items-start justify-center overflow-y-auto bg-black/60 p-4">
      <form
        onSubmit={submit}
        className="my-4 w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#252B68] px-6 py-4 text-white">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#FFE900]">
              {isEdit ? "Edit activity" : "New activity"}
            </p>
            <h2 className="mt-1 text-lg font-black">
              {isEdit ? activity?.title : "Leadership & Global Citizenship"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg bg-white/10 p-2 hover:bg-white/20 disabled:opacity-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[75vh] space-y-6 overflow-y-auto px-6 py-6">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#252B68]">
              Details
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Title *
                </span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Year 6 students lead community clean-up"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Category
                </span>
                <input
                  type="text"
                  list="leadership-category-options"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Student Council, Service Learning…"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                />
                <datalist id="leadership-category-options">
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Activity date *
                </span>
                <input
                  type="date"
                  value={activityDate}
                  onChange={(e) => setActivityDate(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                  required
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Participants
                </span>
                <input
                  type="text"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  placeholder="e.g. Year 6 students · Student Council"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                />
              </label>

              {/* Story with 100-word limit */}
              <label className="block sm:col-span-2">
                <span className="mb-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <span>Story * · max {MAX_STORY_WORDS} words</span>
                  <span
                    className={`font-mono ${storyCounterClass} transition-colors`}
                  >
                    {storyWords} / {MAX_STORY_WORDS}
                  </span>
                </span>
                <textarea
                  rows={8}
                  value={story}
                  onChange={handleStoryChange}
                  placeholder="Describe the activity — what happened, who took part, and the impact it made… (max 100 words)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                  required
                />
                {storyWords >= MAX_STORY_WORDS && (
                  <p className="mt-1 text-[11px] font-semibold text-red-600">
                    Word limit reached. Trim your story to continue editing.
                  </p>
                )}
              </label>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#252B68]"
                />
                Mark as featured
              </label>

              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Status
                </span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                  className="rounded-lg border-0 bg-transparent text-sm font-semibold outline-none"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </label>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#252B68]">
              Featured image (optional)
            </h3>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 sm:w-56">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <ImageIcon size={26} />
                  </div>
                )}

                {imagePreview && (
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-red-600 shadow hover:bg-white"
                    aria-label="Remove image"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex-1">
                <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-4 text-sm font-semibold text-slate-600 transition hover:border-[#252B68] hover:bg-white">
                  <Upload size={18} />
                  {imageFile || (isEdit && activity?.image_url)
                    ? "Replace image"
                    : "Choose image"}

                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <p className="mt-2 text-xs text-slate-500">
                  JPG, PNG or WebP. Maximum {MAX_IMAGE_MB} MB.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#252B68] px-5 py-3 text-sm font-bold text-white hover:bg-[#1c2156] disabled:opacity-50"
          >
            {busy ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Upload size={15} />
            )}
            {isEdit ? "Save changes" : "Create activity"}
          </button>
        </div>
      </form>
    </div>
  );
}