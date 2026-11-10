"use client";

import {
  AlertCircle,
  BookMarked,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Filter,
  GraduationCap,
  Heart,
  Landmark,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "admin_token";
const MAX_FILE_MB = 20;
const MAX_DESCRIPTION_WORDS = 100;

/* =========================================================
   TYPES
========================================================= */

interface Policy {
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
  is_active: boolean;
  sort_order: number;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

/* =========================================================
   CATEGORIES
========================================================= */

type CategoryConfig = {
  id: string;
  label: string;
  icon: React.ElementType;
  accent: string;
};

const CATEGORIES: CategoryConfig[] = [
  { id: "academic",      label: "Academic",                          icon: GraduationCap, accent: "#252B68" },
  { id: "behaviour",     label: "Behaviour & Discipline",            icon: Users,         accent: "#F58220" },
  { id: "safeguarding",  label: "Safeguarding & Child Protection",   icon: ShieldCheck,   accent: "#DC2626" },
  { id: "health_safety", label: "Health & Safety",                   icon: Heart,         accent: "#16A34A" },
  { id: "admissions",    label: "Admissions",                        icon: UserPlus,      accent: "#7C3AED" },
  { id: "finance",       label: "Finance",                           icon: Landmark,      accent: "#0891B2" },
  { id: "it_data",       label: "IT & Data Protection",              icon: Shield,        accent: "#4F46E5" },
  { id: "general",       label: "General",                           icon: FileText,      accent: "#64748B" },
];

const CATEGORY_MAP: Record<string, CategoryConfig> = CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.id]: c }),
  {}
);

const ACCEPTED_FILE_TYPES =
  ".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp";

/* =========================================================
   HELPERS
========================================================= */

function authHeaders(json = false): HeadersInit {
  const token =
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  const h: Record<string, string> = { Accept: "application/json" };
  if (json) h["Content-Type"] = "application/json";
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
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

function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso as string;
  }
}

function fmtFileSize(bytes: number | null | undefined) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Count words in a string (whitespace-split). */
function countWords(text: string): number {
  const trimmed = (text || "").trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

/**
 * Trim a string to at most `max` words, appending an ellipsis if it
 * was longer. Used to guard against legacy rows with longer descriptions.
 */
function truncateWords(text: string | null | undefined, max: number): string {
  if (!text) return "";
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= max) return text;
  return words.slice(0, max).join(" ") + "…";
}

function categoryConfig(id: string): CategoryConfig {
  return (
    CATEGORY_MAP[id] ?? {
      id: "general",
      label: id
        ? id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "General",
      icon: FileText,
      accent: "#64748B",
    }
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AdminPoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Policy | null>(null);

  const [deleting, setDeleting] = useState<Policy | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [toggleBusy, setToggleBusy] = useState<number | null>(null);

  const [result, setResult] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  /* ------------------------------------------------------------------
     Load
  ------------------------------------------------------------------ */

  const load = async (opts: { silent?: boolean } = {}) => {
    if (!opts.silent) setLoading(true);
    else setRefreshing(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/admin/policies`, {
        headers: authHeaders(false),
        cache: "no-store",
      });

      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.message || "Unable to load policies.");

      const loaded: Policy[] = Array.isArray(json?.data) ? json.data : [];
      setPolicies(loaded);
    } catch (e: any) {
      setError(e?.message || "Unable to load policies.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load({ silent: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------------------------------------------
     Derived: filter + counts
  ------------------------------------------------------------------ */

  const filtered = useMemo(() => {
    return policies.filter((p) => {
      if (activeCategory !== "all" && p.category !== activeCategory) return false;
      if (showOnlyActive && !p.is_active) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = `${p.title} ${p.description ?? ""} ${p.version ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [policies, activeCategory, showOnlyActive, search]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: policies.length };
    policies.forEach((p) => {
      counts[p.category] = (counts[p.category] ?? 0) + 1;
    });
    return counts;
  }, [policies]);

  const activeCount = policies.filter((p) => p.is_active).length;

  /* ------------------------------------------------------------------
     Toggle active — quick PUT
  ------------------------------------------------------------------ */

  async function toggleActive(policy: Policy) {
    setToggleBusy(policy.id);
    try {
      const fd = new FormData();
      fd.append("title", policy.title);
      fd.append("category", policy.category);
      fd.append("description", policy.description ?? "");
      fd.append("version", policy.version ?? "");
      fd.append("effective_date", policy.effective_date ?? "");
      fd.append("sort_order", String(policy.sort_order));
      fd.append("is_active", policy.is_active ? "0" : "1");

      const res = await fetch(`${API_URL}/api/admin/policies/${policy.id}`, {
        method: "PUT",
        headers: authHeaders(false),
        body: fd,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Unable to update.");

      setPolicies((prev) =>
        prev.map((p) =>
          p.id === policy.id ? { ...p, is_active: !p.is_active } : p
        )
      );
    } catch (e: any) {
      setResult({
        type: "error",
        title: "Update failed",
        message: e?.message || "Something went wrong.",
      });
    } finally {
      setToggleBusy(null);
    }
  }

  /* ------------------------------------------------------------------
     Delete
  ------------------------------------------------------------------ */

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/policies/${deleting.id}`, {
        method: "DELETE",
        headers: authHeaders(false),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Unable to delete.");

      setResult({
        type: "success",
        title: "Policy deleted",
        message: `"${deleting.title}" was removed.`,
      });
      setDeleting(null);
      await load({ silent: true });
    } catch (e: any) {
      setResult({
        type: "error",
        title: "Delete failed",
        message: e?.message || "Something went wrong.",
      });
    } finally {
      setDeleteBusy(false);
    }
  }

  /* ------------------------------------------------------------------
     Render
  ------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#252B68] text-[#FFE900]">
              <BookMarked size={22} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#F58220]">
                Mount View Admin
              </p>
              <h1 className="text-base font-black text-[#252B68]">
                School Policies
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => load({ silent: true })}
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
              New Policy
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Result / error banners */}
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

        {/* Summary stats */}
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Total policies
            </p>
            <p className="mt-1 text-2xl font-black text-[#252B68]">
              {policies.length}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
              Active
            </p>
            <p className="mt-1 text-2xl font-black text-emerald-800">
              {activeCount}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Categories in use
            </p>
            <p className="mt-1 text-2xl font-black text-[#252B68]">
              {Object.keys(categoryCounts).filter((k) => k !== "all").length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
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
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
            />
          </div>

          <label className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={showOnlyActive}
              onChange={(e) => setShowOnlyActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#252B68]"
            />
            Active only
          </label>
        </div>

        {/* Category chips */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              activeCategory === "all"
                ? "bg-[#252B68] text-white shadow-md"
                : "border border-slate-200 bg-white text-slate-600 hover:border-[#252B68]/40 hover:text-[#252B68]"
            }`}
          >
            <Filter size={12} />
            All ({categoryCounts.all ?? 0})
          </button>

          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count = categoryCounts[cat.id] ?? 0;
            if (count === 0 && activeCategory !== cat.id) return null;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  isActive
                    ? "text-white shadow-md"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-[#252B68]/40 hover:text-[#252B68]"
                }`}
                style={
                  isActive ? { backgroundColor: cat.accent } : undefined
                }
              >
                <Icon size={12} />
                {cat.label}
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

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white p-12 text-slate-500">
            <Loader2 size={20} className="animate-spin" />
            Loading policies…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <BookMarked size={22} />
            </div>
            <p className="mt-4 font-bold text-[#172033]">
              {policies.length === 0
                ? "No policies yet"
                : "No policies match your filters"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {policies.length === 0
                ? "Upload your first school policy to get started."
                : "Try a different category or clear your search."}
            </p>
            {policies.length === 0 && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setShowForm(true);
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#F58220] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#df7014]"
              >
                <Upload size={16} />
                Upload a Policy
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((policy) => {
              const cat = categoryConfig(policy.category);
              const CatIcon = cat.icon;
              const isToggling = toggleBusy === policy.id;
              const displayDescription = truncateWords(
                policy.description,
                MAX_DESCRIPTION_WORDS
              );

              return (
                <article
                  key={policy.id}
                  className={`group flex flex-col gap-3 rounded-2xl border bg-white p-4 transition hover:shadow-md sm:flex-row sm:items-center ${
                    policy.is_active
                      ? "border-slate-200"
                      : "border-slate-200 opacity-70"
                  }`}
                >
                  {/* Left: icon + info */}
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                      style={{ backgroundColor: cat.accent }}
                    >
                      <CatIcon size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-black text-[#172033]">
                          {policy.title}
                        </h3>
                        {policy.version && (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                            v{policy.version.replace(/^v/i, "")}
                          </span>
                        )}
                        {policy.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                            <CheckCircle2 size={9} />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Hidden
                          </span>
                        )}
                      </div>

                      {displayDescription && (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                          {displayDescription}
                        </p>
                      )}

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                        <span
                          className="inline-flex items-center gap-1 font-semibold"
                          style={{ color: cat.accent }}
                        >
                          <CatIcon size={10} />
                          {cat.label}
                        </span>
                        {policy.effective_date && (
                          <span>Effective {fmtDate(policy.effective_date)}</span>
                        )}
                        {policy.file_size != null && (
                          <span>{fmtFileSize(policy.file_size)}</span>
                        )}
                        <span>Updated {fmtDateTime(policy.updated_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:justify-end">
                    {policy.file_url && (
                      <>
                        <a
                          href={policy.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-[#252B68] hover:text-[#252B68]"
                          title="Open in new tab"
                        >
                          <ExternalLink size={12} />
                          <span className="hidden sm:inline">Open</span>
                        </a>
                        <a
                          href={policy.file_url}
                          download={policy.file_name ?? undefined}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-[#252B68] hover:text-[#252B68]"
                          title="Download"
                        >
                          <Download size={12} />
                          <span className="hidden sm:inline">Download</span>
                        </a>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleActive(policy)}
                      disabled={isToggling}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
                        policy.is_active
                          ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      } disabled:opacity-50`}
                      title={policy.is_active ? "Hide from public site" : "Show on public site"}
                    >
                      {isToggling ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : policy.is_active ? (
                        <X size={12} />
                      ) : (
                        <CheckCircle2 size={12} />
                      )}
                      <span className="hidden sm:inline">
                        {policy.is_active ? "Hide" : "Publish"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditing(policy);
                        setShowForm(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#252B68] transition hover:border-[#252B68] hover:bg-[#252B68] hover:text-white"
                      title="Edit"
                    >
                      <Pencil size={12} />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleting(policy)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-red-600 transition hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* ---------- Create / Edit modal ---------- */}
      {showForm && (
        <PolicyFormModal
          policy={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={async (msg) => {
            setShowForm(false);
            setEditing(null);
            setResult({ type: "success", title: "Saved", message: msg });
            await load({ silent: true });
          }}
        />
      )}

      {/* ---------- Delete confirmation ---------- */}
      {deleting && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
                <Trash2 size={22} className="text-red-600" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-[#172033]">
                Delete policy?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Deleting{" "}
                <span className="font-semibold text-slate-700">
                  &ldquo;{deleting.title}&rdquo;
                </span>{" "}
                will permanently remove it and its uploaded file. This cannot
                be undone.
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
   Policy Form Modal
========================================================= */

function PolicyFormModal({
  policy,
  onClose,
  onSaved,
}: {
  policy: Policy | null;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const isEdit = Boolean(policy);

  const [title, setTitle] = useState(policy?.title ?? "");
  const [category, setCategory] = useState(policy?.category ?? "academic");
  const [description, setDescription] = useState(policy?.description ?? "");
  const [version, setVersion] = useState(policy?.version ?? "");
  const [effectiveDate, setEffectiveDate] = useState(
    policy?.effective_date ? policy.effective_date.slice(0, 10) : ""
  );
  const [sortOrder, setSortOrder] = useState(policy?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(policy?.is_active ?? true);

  const [file, setFile] = useState<File | null>(null);
  const [removeFile, setRemoveFile] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ---- Live word counter ---- */
  const descriptionWords = countWords(description);
  const overWordLimit = descriptionWords > MAX_DESCRIPTION_WORDS;
  const nearWordLimit =
    !overWordLimit && descriptionWords >= MAX_DESCRIPTION_WORDS - 10;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`File must be smaller than ${MAX_FILE_MB} MB.`);
      e.target.value = "";
      return;
    }

    setError("");
    setFile(f);
    setRemoveFile(false);

    if (!title.trim()) {
      const base = f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
      setTitle(base.replace(/\b\w/g, (c) => c.toUpperCase()));
    }
  }

  function clearFile() {
    setFile(null);
    setRemoveFile(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!isEdit && !file) {
      setError("Please upload a policy document.");
      return;
    }
    if (overWordLimit) {
      setError(
        `Description must be ${MAX_DESCRIPTION_WORDS} words or fewer. You have ${descriptionWords}.`
      );
      return;
    }

    setBusy(true);

    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("category", category);
      fd.append("description", description.trim());
      fd.append("version", version.trim());
      fd.append("effective_date", effectiveDate);
      fd.append("sort_order", String(sortOrder));
      fd.append("is_active", isActive ? "1" : "0");

      if (file) fd.append("file", file);
      if (removeFile && !file) fd.append("remove_file", "1");

      const url = isEdit
        ? `${API_URL}/api/admin/policies/${policy!.id}`
        : `${API_URL}/api/admin/policies`;

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: authHeaders(false),
        body: fd,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Unable to save.");

      await onSaved(isEdit ? "Policy updated." : "Policy uploaded.");
    } catch (e: any) {
      setError(e?.message || "Unable to save.");
    } finally {
      setBusy(false);
    }
  }

  const hasExistingFile = isEdit && policy?.file_url && !removeFile;
  const activeCategory = categoryConfig(category);
  const ActiveIcon = activeCategory.icon;

  return (
    <div className="fixed inset-0 z-[160] flex items-start justify-center overflow-y-auto bg-black/60 p-4">
      <form
        onSubmit={submit}
        className="my-4 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#252B68] px-6 py-4 text-white">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#FFE900]">
              {isEdit ? "Edit policy" : "New policy"}
            </p>
            <h2 className="mt-1 text-lg font-black">
              {isEdit ? policy?.title : "Upload a school policy"}
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

        <div className="max-h-[75vh] space-y-5 overflow-y-auto px-6 py-6">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Policy title *
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Child Protection Policy"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
              required
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Category
              </span>
              <div className="relative">
                <div
                  className="pointer-events-none absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-white"
                  style={{ backgroundColor: activeCategory.accent }}
                >
                  <ActiveIcon size={13} />
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-11 pr-9 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <ChevronDownSafe />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Version
              </span>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. 2.1"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Effective date
              </span>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Sort order
              </span>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) =>
                  setSortOrder(parseInt(e.target.value || "0", 10))
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
              />
            </label>
          </div>

          {/* Description with word counter */}
          <label className="block">
            <div className="mb-1 flex items-end justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Description (optional)
              </span>
              <span
                className={`text-[11px] font-bold tabular-nums ${
                  overWordLimit
                    ? "text-red-600"
                    : nearWordLimit
                    ? "text-amber-600"
                    : "text-slate-400"
                }`}
                aria-live="polite"
              >
                {descriptionWords} / {MAX_DESCRIPTION_WORDS} words
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="A short summary (max 100 words) shown under the policy title on the public site."
              className={`w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                overWordLimit
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                  : "border-slate-200 focus:border-[#252B68] focus:ring-[#252B68]/10"
              }`}
              aria-invalid={overWordLimit}
            />
            <p
              className={`mt-1 text-[11px] ${
                overWordLimit
                  ? "font-semibold text-red-600"
                  : "text-slate-400"
              }`}
            >
              {overWordLimit
                ? `Please shorten by ${descriptionWords - MAX_DESCRIPTION_WORDS} word${
                    descriptionWords - MAX_DESCRIPTION_WORDS === 1 ? "" : "s"
                  } before saving.`
                : `A concise summary shown on the public policies page.`}
            </p>
          </label>

          <label className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#252B68]"
            />
            Active (visible on the public site)
          </label>

          {/* ---- File upload ---- */}
          <section>
            <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-[#252B68]">
              Policy document *
            </h3>
            <p className="mb-3 text-[11px] text-slate-500">
              PDF, Word or image · max {MAX_FILE_MB} MB.
            </p>

            {hasExistingFile && !file && (
              <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#252B68] shadow-sm">
                  <FileText size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#172033]">
                    {policy?.file_name ?? "Uploaded document"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {fmtFileSize(policy?.file_size)}
                  </p>
                </div>
                <a
                  href={policy?.file_url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:border-[#252B68] hover:text-[#252B68]"
                >
                  <ExternalLink size={12} />
                  View
                </a>
                <button
                  type="button"
                  onClick={clearFile}
                  className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-50"
                  aria-label="Remove file"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {file && (
              <div className="mb-3 flex items-center gap-3 rounded-xl border border-[#F58220]/40 bg-[#F58220]/5 px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#F58220] shadow-sm">
                  <FileText size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#172033]">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {fmtFileSize(file.size)} · ready to upload
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-50"
                  aria-label="Remove file"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-600 transition hover:border-[#252B68] hover:bg-white">
              <Upload size={18} />
              {file
                ? "Choose a different file"
                : hasExistingFile
                ? "Replace with a new file"
                : "Choose a file"}
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
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
            disabled={busy || overWordLimit}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#252B68] px-5 py-3 text-sm font-bold text-white hover:bg-[#1c2156] disabled:cursor-not-allowed disabled:opacity-50"
            title={
              overWordLimit
                ? `Description must be ${MAX_DESCRIPTION_WORDS} words or fewer`
                : undefined
            }
          >
            {busy ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            {isEdit ? "Save changes" : "Upload policy"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ChevronDownSafe() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}