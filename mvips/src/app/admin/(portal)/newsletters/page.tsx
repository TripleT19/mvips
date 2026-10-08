"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const ADMIN_TOKEN_KEY = "admin_token";

const MAX_FILE_MB = 20;
const MAX_COVER_MB = 5;

/* ------------------------------------------------------------------
| Types
------------------------------------------------------------------ */

type NewsletterStatus = "draft" | "published";

interface NewsletterRecord {
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
  status: NewsletterStatus;
  created_at?: string;
}

interface Paginated<T> {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  data: T[];
}

interface PaginatedResponse<T> {
  success: boolean;
  data: Paginated<T>;
  years?: number[];
}

interface ActionMenuState {
  newsletter: NewsletterRecord;
  top: number;
  left: number;
}

const ACTION_MENU_WIDTH = 224;
const ACTION_MENU_HEIGHT = 220;
const ACTION_MENU_OFFSET = 6;

const TERM_OPTIONS = [
  "Term 1",
  "Term 2",
  "Term 3",
  "Annual",
  "Special Edition",
];

/* ------------------------------------------------------------------
| Helpers
------------------------------------------------------------------ */

function authHeaders(json = true): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(ADMIN_TOKEN_KEY)
      : null;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (json) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  return headers;
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

function fileSize(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function resolveUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const trimmed = url.startsWith("/") ? url : `/${url}`;
  return `${API_URL}${trimmed}`;
}

/* ==================================================================
| PAGE
================================================================== */

export default function AdminNewslettersPage() {
  const [items, setItems] = useState<NewsletterRecord[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });

  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NewsletterRecord | null>(null);

  const [deleting, setDeleting] = useState<NewsletterRecord | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [actionMenu, setActionMenu] = useState<ActionMenuState | null>(null);

  const [result, setResult] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  /* ------------------------------------------------------------------
  | Fetching
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
      if (yearFilter) params.set("year", yearFilter);
      if (statusFilter) params.set("status", statusFilter);

      const response = await fetch(
        `${API_URL}/api/admin/newsletters?${params.toString()}`,
        { headers: authHeaders(false), cache: "no-store" }
      );

      const json = (await response.json()) as PaginatedResponse<NewsletterRecord>;

      if (!response.ok) {
        throw new Error(
          (json as any)?.message || "Unable to load newsletters."
        );
      }

      setItems(Array.isArray(json.data?.data) ? json.data.data : []);
      setPagination({
        current_page: json.data?.current_page ?? 1,
        last_page: json.data?.last_page ?? 1,
        per_page: json.data?.per_page ?? 20,
        total: json.data?.total ?? 0,
      });
      setAvailableYears(json.years ?? []);
    } catch (e: any) {
      setError(e?.message || "Unable to load newsletters.");
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
    const t = setTimeout(() => {
      load(1, { silent: true });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, yearFilter, statusFilter]);

  /* Close action menu on scroll/resize */
  useEffect(() => {
    if (!actionMenu) return;

    const close = () => setActionMenu(null);

    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);

    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [actionMenu]);

  /* ------------------------------------------------------------------
  | Stats
  ------------------------------------------------------------------ */

  const publishedCount = useMemo(
    () => items.filter((i) => i.status === "published").length,
    [items]
  );
  const draftCount = useMemo(
    () => items.filter((i) => i.status === "draft").length,
    [items]
  );
  const featuredCount = useMemo(
    () => items.filter((i) => i.featured).length,
    [items]
  );

  /* ------------------------------------------------------------------
  | Action Menu
  ------------------------------------------------------------------ */

  function openActionMenu(
    newsletter: NewsletterRecord,
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    const rect = event.currentTarget.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = rect.right - ACTION_MENU_WIDTH;
    if (left < 8) left = 8;
    if (left + ACTION_MENU_WIDTH > vw - 8) {
      left = vw - ACTION_MENU_WIDTH - 8;
    }

    const spaceBelow = vh - rect.bottom - ACTION_MENU_OFFSET;
    let top: number;

    if (spaceBelow < ACTION_MENU_HEIGHT) {
      top = Math.max(8, rect.top - ACTION_MENU_HEIGHT - ACTION_MENU_OFFSET);
    } else {
      top = rect.bottom + ACTION_MENU_OFFSET;
    }

    setActionMenu({ newsletter, top, left });
  }

  function closeActionMenu() {
    setActionMenu(null);
  }

  /* ------------------------------------------------------------------
  | Actions
  ------------------------------------------------------------------ */

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);

    try {
      const response = await fetch(
        `${API_URL}/api/admin/newsletters/${deleting.id}`,
        { method: "DELETE", headers: authHeaders(false) }
      );

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.message || "Unable to delete newsletter.");
      }

      setResult({
        type: "success",
        title: "Newsletter Deleted",
        message: `"${deleting.title}" was removed successfully.`,
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

  async function toggleStatus(newsletter: NewsletterRecord) {
    closeActionMenu();
    const newStatus: NewsletterStatus =
      newsletter.status === "published" ? "draft" : "published";

    try {
      const response = await fetch(
        `${API_URL}/api/admin/newsletters/${newsletter.id}`,
        {
          method: "PUT",
          headers: authHeaders(true),
          body: JSON.stringify({
            title: newsletter.title,
            description: newsletter.description,
            term: newsletter.term,
            year: newsletter.year,
            published_on: newsletter.published_on,
            featured: newsletter.featured,
            status: newStatus,
          }),
        }
      );

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.message || "Unable to update status.");
      }

      setResult({
        type: "success",
        title: newStatus === "published" ? "Published" : "Moved to Draft",
        message: `"${newsletter.title}" is now ${newStatus}.`,
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

  async function toggleFeatured(newsletter: NewsletterRecord) {
    closeActionMenu();

    try {
      const response = await fetch(
        `${API_URL}/api/admin/newsletters/${newsletter.id}`,
        {
          method: "PUT",
          headers: authHeaders(true),
          body: JSON.stringify({
            title: newsletter.title,
            description: newsletter.description,
            term: newsletter.term,
            year: newsletter.year,
            published_on: newsletter.published_on,
            featured: !newsletter.featured,
            status: newsletter.status,
          }),
        }
      );

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.message || "Unable to update featured flag.");
      }

      setResult({
        type: "success",
        title: newsletter.featured
          ? "Removed from Featured"
          : "Marked as Featured",
        message: `"${newsletter.title}" updated.`,
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
  | Render
  ------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-slate-50">
      <Header
        refreshing={refreshing}
        onRefresh={async () => {
          setRefreshing(true);
          try {
            await load(pagination.current_page, { silent: true });
          } finally {
            setRefreshing(false);
          }
        }}
        onUpload={() => {
          setEditing(null);
          setShowForm(true);
        }}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <StatsRow
          total={pagination.total}
          published={publishedCount}
          drafts={draftCount}
          featured={featuredCount}
        />

        <FiltersBar
          search={search}
          onSearchChange={setSearch}
          year={yearFilter}
          onYearChange={setYearFilter}
          years={availableYears}
          status={statusFilter}
          onStatusChange={setStatusFilter}
        />

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

        <NewslettersTable
          data={items}
          loading={loading}
          pagination={pagination}
          actionMenuOpenId={actionMenu?.newsletter.id ?? null}
          onOpenMenu={openActionMenu}
          onCloseMenu={closeActionMenu}
          onEdit={(n) => {
            setEditing(n);
            setShowForm(true);
          }}
          onDelete={(n) => setDeleting(n)}
          onToggleStatus={toggleStatus}
          onToggleFeatured={toggleFeatured}
          onPageChange={(p) => load(p)}
          onUpload={() => {
            setEditing(null);
            setShowForm(true);
          }}
        />
      </div>

      {/* Fixed-position action menu */}
      {actionMenu && (
        <>
          <button
            type="button"
            aria-label="Close actions menu"
            onClick={closeActionMenu}
            className="fixed inset-0 z-[140] cursor-default bg-transparent"
          />

          <div
            role="menu"
            style={{
              position: "fixed",
              top: actionMenu.top,
              left: actionMenu.left,
              width: ACTION_MENU_WIDTH,
            }}
            className="z-[150] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-left shadow-2xl"
          >
            <button
              type="button"
              onClick={() => {
                setEditing(actionMenu.newsletter);
                setShowForm(true);
                closeActionMenu();
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <Pencil size={16} />
              Edit Newsletter
            </button>

            <button
              type="button"
              onClick={() => {
                if (actionMenu.newsletter.file_url) {
                  window.open(
                    resolveUrl(actionMenu.newsletter.file_url),
                    "_blank"
                  );
                }
                closeActionMenu();
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <Eye size={16} />
              Preview PDF
            </button>

            <button
              type="button"
              onClick={() => toggleFeatured(actionMenu.newsletter)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <Star size={16} />
              {actionMenu.newsletter.featured
                ? "Remove Featured"
                : "Mark as Featured"}
            </button>

            <button
              type="button"
              onClick={() => toggleStatus(actionMenu.newsletter)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <CheckCircle2 size={16} />
              {actionMenu.newsletter.status === "published"
                ? "Move to Draft"
                : "Publish"}
            </button>

            <button
              type="button"
              onClick={() => {
                if (actionMenu.newsletter.file_url) {
                  const link = document.createElement("a");
                  link.href = resolveUrl(actionMenu.newsletter.file_url);
                  link.download =
                    actionMenu.newsletter.file_original_name ||
                    "newsletter.pdf";
                  link.target = "_blank";
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                }
                closeActionMenu();
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <Download size={16} />
              Download
            </button>

            <div className="my-1 border-t border-slate-100" />

            <button
              type="button"
              onClick={() => {
                setDeleting(actionMenu.newsletter);
                closeActionMenu();
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </>
      )}

      {/* Upload / Edit modal */}
      {showForm && (
        <NewsletterFormModal
          newsletter={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={async (msg) => {
            setShowForm(false);
            setEditing(null);
            setResult({
              type: "success",
              title: "Saved",
              message: msg,
            });
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
                Delete Newsletter?
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                You are about to permanently delete{" "}
                <span className="font-semibold text-slate-700">
                  &ldquo;{deleting.title}&rdquo;
                </span>
                . The PDF and cover image will also be removed. This action
                cannot be undone.
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
                    <Loader2 size={17} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={17} />
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

/* ==================================================================
| Page Header — matches the admissions page pattern
================================================================== */

function Header({
  refreshing,
  onRefresh,
  onUpload,
}: {
  refreshing: boolean;
  onRefresh: () => void;
  onUpload: () => void;
}) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#252B68] text-[#FFE900]">
            <FileText size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#F58220]">
              Mount View Admin
            </p>
            <h1 className="text-base font-black text-[#252B68]">
              Newsletters
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={onUpload}
            className="inline-flex items-center gap-2 rounded-xl bg-[#252B68] px-4 py-2 text-sm font-bold text-white hover:bg-[#1c2156]"
          >
            <Plus size={16} />
            Upload Newsletter
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==================================================================
| Stats Row
================================================================== */

function StatsRow({
  total,
  published,
  drafts,
  featured,
}: {
  total: number;
  published: number;
  drafts: number;
  featured: number;
}) {
  const items = [
    { label: "Total", value: total, color: "text-[#252B68]" },
    { label: "Published", value: published, color: "text-emerald-600" },
    { label: "Drafts", value: drafts, color: "text-amber-600" },
    { label: "Featured", value: featured, color: "text-[#F58220]" },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-slate-100 bg-white p-4"
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {item.label}
          </p>
          <p className={`mt-1 text-2xl font-black ${item.color}`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ==================================================================
| Filters Bar
================================================================== */

function FiltersBar({
  search,
  onSearchChange,
  year,
  onYearChange,
  years,
  status,
  onStatusChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  year: string;
  onYearChange: (v: string) => void;
  years: number[];
  status: string;
  onStatusChange: (v: string) => void;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-4">
      <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr]">
        <label className="relative block">
          <span className="sr-only">Search</span>
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title or description…"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10"
          />
        </label>

        <SelectFilter
          value={year}
          onChange={onYearChange}
          placeholder="All years"
          options={years.map((y) => ({
            value: String(y),
            label: String(y),
          }))}
        />

        <SelectFilter
          value={status}
          onChange={onStatusChange}
          placeholder="All status"
          options={[
            { value: "published", label: "Published" },
            { value: "draft", label: "Draft" },
          ]}
        />
      </div>
    </div>
  );
}

function SelectFilter({
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
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
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

/* ==================================================================
| Table
================================================================== */

function NewslettersTable({
  data,
  loading,
  pagination,
  actionMenuOpenId,
  onOpenMenu,
  onCloseMenu,
  onEdit,
  onDelete,
  onToggleStatus,
  onToggleFeatured,
  onPageChange,
  onUpload,
}: {
  data: NewsletterRecord[];
  loading: boolean;
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  actionMenuOpenId: number | null;
  onOpenMenu: (
    newsletter: NewsletterRecord,
    event: React.MouseEvent<HTMLButtonElement>
  ) => void;
  onCloseMenu: () => void;
  onEdit: (n: NewsletterRecord) => void;
  onDelete: (n: NewsletterRecord) => void;
  onToggleStatus: (n: NewsletterRecord) => void;
  onToggleFeatured: (n: NewsletterRecord) => void;
  onPageChange: (page: number) => void;
  onUpload: () => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white p-12 text-slate-500">
        <Loader2 size={20} className="animate-spin" />
        Loading newsletters…
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <FileText size={22} />
        </div>
        <p className="mt-4 font-bold text-[#172033]">No newsletters yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Upload your first newsletter to get started.
        </p>
        <button
          type="button"
          onClick={onUpload}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#F58220] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#df7014]"
        >
          <Plus size={17} />
          Upload Newsletter
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Newsletter</th>
              <th className="px-4 py-3">Term / Year</th>
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item) => {
              const isMenuOpen = actionMenuOpenId === item.id;

              return (
                <tr
                  key={item.id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        {item.cover_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={resolveUrl(item.cover_image_url)}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            <FileText size={17} />
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
                        {item.description && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    <p className="font-semibold text-slate-700">
                      {item.term || "—"}
                    </p>
                    <p className="text-xs text-slate-500">{item.year}</p>
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-xs">
                      <p className="font-semibold text-slate-700">
                        {fileSize(item.file_size)}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-slate-500">
                        {item.file_original_name || "PDF"}
                      </p>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-slate-500">
                    {formatDate(item.published_on)}
                  </td>

                  <td className="px-4 py-3">
                    {item.status === "published" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Draft
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(e) =>
                        isMenuOpen ? onCloseMenu() : onOpenMenu(item, e)
                      }
                      className={`rounded-lg p-2 transition ${
                        isMenuOpen
                          ? "bg-[#252B68] text-white hover:bg-[#1d2255]"
                          : "text-slate-500 hover:bg-slate-100 hover:text-[#252B68]"
                      }`}
                      aria-label="Open newsletter actions"
                      aria-haspopup="menu"
                      aria-expanded={isMenuOpen}
                    >
                      <MoreVertical size={19} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="divide-y divide-slate-100 md:hidden">
        {data.map((item) => (
          <div key={item.id} className="px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {item.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveUrl(item.cover_image_url)}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <FileText size={17} />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-bold text-[#172033]">
                      <span className="truncate">{item.title}</span>
                      {item.featured && (
                        <Star
                          size={12}
                          className="shrink-0 fill-[#F58220] text-[#F58220]"
                        />
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {item.term || "—"} · {item.year}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) =>
                      actionMenuOpenId === item.id
                        ? onCloseMenu()
                        : onOpenMenu(item, e)
                    }
                    className={`rounded-lg p-2 transition ${
                      actionMenuOpenId === item.id
                        ? "bg-[#252B68] text-white"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                    aria-label="Open newsletter actions"
                  >
                    <MoreVertical size={17} />
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {item.status === "published" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Draft
                    </span>
                  )}

                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {fileSize(item.file_size)}
                  </span>
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
              onClick={() => onPageChange(pagination.current_page - 1)}
              disabled={pagination.current_page <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              type="button"
              onClick={() => onPageChange(pagination.current_page + 1)}
              disabled={pagination.current_page >= pagination.last_page}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================================================================
| Upload / Edit modal
================================================================== */

function NewsletterFormModal({
  newsletter,
  onClose,
  onSaved,
}: {
  newsletter: NewsletterRecord | null;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const isEdit = Boolean(newsletter);

  const [title, setTitle] = useState(newsletter?.title ?? "");
  const [description, setDescription] = useState(
    newsletter?.description ?? ""
  );
  const [term, setTerm] = useState(newsletter?.term ?? "");
  const [year, setYear] = useState<number>(
    newsletter?.year ?? new Date().getFullYear()
  );
  const [publishedOn, setPublishedOn] = useState(
    newsletter?.published_on
      ? String(newsletter.published_on).substring(0, 10)
      : new Date().toISOString().substring(0, 10)
  );
  const [featured, setFeatured] = useState(newsletter?.featured ?? false);
  const [status, setStatus] = useState<NewsletterStatus>(
    newsletter?.status ?? "published"
  );

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>(
    newsletter?.cover_image_url ? resolveUrl(newsletter.cover_image_url) : ""
  );
  const [removeCover, setRemoveCover] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!coverFile) return;

    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    setRemoveCover(false);

    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  function handlePdfChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please select a PDF file.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`PDF must be smaller than ${MAX_FILE_MB} MB.`);
      e.target.value = "";
      return;
    }

    setError("");
    setPdfFile(file);
  }

  function handleCoverChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Cover must be a JPG, PNG or WebP image.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_COVER_MB * 1024 * 1024) {
      setError(`Cover must be smaller than ${MAX_COVER_MB} MB.`);
      e.target.value = "";
      return;
    }

    setError("");
    setCoverFile(file);
    setRemoveCover(false);
  }

  function clearPdf() {
    setPdfFile(null);
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  }

  function clearCover() {
    setCoverFile(null);
    setCoverPreview("");
    setRemoveCover(true);
    if (coverInputRef.current) coverInputRef.current.value = "";
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!year || year < 2000 || year > 2100) {
      setError("Please enter a valid year.");
      return;
    }

    if (!isEdit && !pdfFile) {
      setError("Please attach the newsletter PDF.");
      return;
    }

    setBusy(true);

    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("description", description.trim());
      fd.append("term", term.trim());
      fd.append("year", String(year));
      fd.append("published_on", publishedOn);
      fd.append("featured", featured ? "1" : "0");
      fd.append("status", status);

      if (pdfFile) fd.append("file", pdfFile);
      if (coverFile) fd.append("cover", coverFile);
      if (removeCover && !coverFile) fd.append("remove_cover", "1");

      const url = isEdit
        ? `${API_URL}/api/admin/newsletters/${newsletter!.id}`
        : `${API_URL}/api/admin/newsletters`;

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem(ADMIN_TOKEN_KEY)}`,
          // Note: DO NOT set Content-Type — the browser must set it
          // automatically with the multipart boundary.
        },
        body: fd,
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(
          json?.message || "Unable to save the newsletter."
        );
      }

      await onSaved(
        isEdit
          ? "Newsletter updated successfully."
          : "Newsletter uploaded successfully."
      );
    } catch (e: any) {
      setError(e?.message || "Unable to save the newsletter.");
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
              {isEdit ? "Edit newsletter" : "New newsletter"}
            </p>
            <h2 className="mt-1 text-lg font-black">
              {isEdit ? newsletter?.title : "Upload a newsletter"}
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

          {/* Details */}
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
                  placeholder="e.g. Term 1 2025 Newsletter"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                  required
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Description
                </span>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short summary of what parents will find inside..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Term
                </span>
                <select
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                >
                  <option value="">No term</option>
                  {TERM_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Year *
                </span>
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value || "0", 10))}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Published on
                </span>
                <input
                  type="date"
                  value={publishedOn}
                  onChange={(e) => setPublishedOn(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Status
                </span>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as NewsletterStatus)
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </label>
            </div>

            <label className="mt-3 inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#252B68]"
              />
              Mark as featured (shown first on the public page)
            </label>
          </section>

          {/* PDF */}
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#252B68]">
              Newsletter PDF {!isEdit && "*"}
            </h3>

            {!pdfFile && isEdit && newsletter?.file_original_name && (
              <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#252B68] shadow-sm">
                  <FileText size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#172033]">
                    {newsletter.file_original_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {fileSize(newsletter.file_size)} · Current file
                  </p>
                </div>
              </div>
            )}

            {pdfFile && (
              <div className="mb-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
                  <FileText size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-emerald-800">
                    {pdfFile.name}
                  </p>
                  <p className="text-xs text-emerald-600">
                    {fileSize(pdfFile.size)} · Ready to upload
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearPdf}
                  className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-100"
                  aria-label="Remove PDF"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-6 text-sm font-semibold text-slate-600 transition hover:border-[#252B68] hover:bg-white">
              <Upload size={18} />
              {pdfFile || (isEdit && newsletter?.file_original_name)
                ? "Replace PDF"
                : "Choose PDF file"}

              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handlePdfChange}
                className="hidden"
              />
            </label>

            <p className="mt-2 text-xs text-slate-500">
              PDF only. Maximum {MAX_FILE_MB} MB.
            </p>
          </section>

          {/* Cover image */}
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#252B68]">
              Cover image (optional)
            </h3>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 sm:w-56">
                {coverPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <ImageIcon size={26} />
                  </div>
                )}

                {coverPreview && (
                  <button
                    type="button"
                    onClick={clearCover}
                    className="absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-red-600 shadow hover:bg-white"
                    aria-label="Remove cover"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex-1">
                <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-4 text-sm font-semibold text-slate-600 transition hover:border-[#252B68] hover:bg-white">
                  <ImageIcon size={18} />
                  Choose cover image

                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                </label>

                <p className="mt-2 text-xs text-slate-500">
                  JPG, PNG or WebP. Maximum {MAX_COVER_MB} MB.
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
            {isEdit ? "Save changes" : "Upload newsletter"}
          </button>
        </div>
      </form>
    </div>
  );
}