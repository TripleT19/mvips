"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

/* =========================================================
   Config
========================================================= */

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "") ||
  "http://127.0.0.1:8000";

/* =========================================================
   Types
========================================================= */

type Status = "pending" | "approved" | "rejected";
type ActionType = "approve" | "reject" | "delete";

type Alumnus = {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  year_left: number;
  location: string;
  current_role: string;
  organization: string | null;
  bio: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
  message_to_students: string | null;
  show_contact: boolean;
  status: Status;
  approved_at: string | null;
  approved_by_name: string | null;
  approved_by_role: string | null;
  admin_notes: string | null;
  created_at: string;
};

type ConfirmState = {
  type: ActionType;
  person: Alumnus;
} | null;

/* =========================================================
   Helpers
========================================================= */

function extractArray<T = unknown>(payload: unknown): T[] {
  if (!payload) return [];
  const p = payload as Record<string, unknown>;
  if (p.data && typeof p.data === "object" && !Array.isArray(p.data)) {
    const inner = (p.data as Record<string, unknown>).data;
    if (Array.isArray(inner)) return inner as T[];
  }
  if (Array.isArray(p.data)) return p.data as T[];
  for (const key of ["alumni", "alumnus", "items", "results"]) {
    const v = p[key];
    if (Array.isArray(v)) return v as T[];
  }
  if (Array.isArray(payload)) return payload as T[];
  return [];
}

function getImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return `${API_URL}${url}`;

  try {
    const parsed = new URL(url);
    const isPhotoLocal =
      parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    if (!isPhotoLocal) return url;

    try {
      const api = new URL(API_URL);
      const apiIsLocal =
        api.hostname === "localhost" || api.hostname === "127.0.0.1";
      if (!apiIsLocal) {
        parsed.protocol = api.protocol;
        parsed.host = api.host;
        return parsed.toString();
      }
    } catch {
      /* fall through */
    }

    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      const match = host.match(/^(.+)-\d+\.app\.github\.dev$/);
      if (match) {
        const backendPort = parsed.port || "8000";
        return `https://${match[1]}-${backendPort}.app.github.dev${parsed.pathname}`;
      }
    }

    return url;
  } catch {
    return url;
  }
}

function authHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("admin_token")
      : null;

  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* =========================================================
   Action metadata
========================================================= */

const ACTION_META: Record<
  ActionType,
  {
    title: (name: string) => string;
    body: (person: Alumnus) => React.ReactNode;
    confirmLabel: string;
    processingLabel: string;
    tone: {
      iconBg: string;
      iconRing: string;
      iconText: string;
      button: string;
      buttonHover: string;
    };
  }
> = {
  approve: {
    title: (name) => `Approve ${name}?`,
    body: (p) => (
      <>
        Their full profile — photo, role, bio and any contact details they
        chose to share — will be{" "}
        <span className="font-semibold text-slate-800">
          published to the public alumni directory
        </span>{" "}
        immediately. You can reject or delete them later if needed.
        {!p.show_contact && (p.email || p.phone) && (
          <span className="mt-2 block rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
            Note: this alumnus chose <strong>not</strong> to show email or
            phone publicly. Only staff can see those details.
          </span>
        )}
        <span className="mt-2 block rounded-lg bg-slate-50 px-3 py-2 text-[12px] text-slate-600">
          Your name will be recorded as the approver and shown in the review
          history of this submission.
        </span>
      </>
    ),
    confirmLabel: "Approve & publish",
    processingLabel: "Approving…",
    tone: {
      iconBg: "bg-emerald-50",
      iconRing: "ring-emerald-100",
      iconText: "text-emerald-600",
      button: "bg-emerald-600",
      buttonHover: "hover:bg-emerald-700",
    },
  },
  reject: {
    title: (name) => `Reject ${name}?`,
    body: () => (
      <>
        Their submission will be{" "}
        <span className="font-semibold text-slate-800">
          hidden from the public directory
        </span>{" "}
        and marked as rejected. You can add an internal note below — only staff
        will ever see it.
        <span className="mt-2 block rounded-lg bg-slate-50 px-3 py-2 text-[12px] text-slate-600">
          Your name will be recorded as the reviewer for this decision.
        </span>
      </>
    ),
    confirmLabel: "Reject submission",
    processingLabel: "Rejecting…",
    tone: {
      iconBg: "bg-amber-50",
      iconRing: "ring-amber-100",
      iconText: "text-amber-600",
      button: "bg-amber-500",
      buttonHover: "hover:bg-amber-600",
    },
  },
  delete: {
    title: (name) => `Delete ${name} permanently?`,
    body: () => (
      <>
        <span className="font-semibold text-rose-700">
          This cannot be undone.
        </span>{" "}
        The submission, uploaded photo and all associated data will be removed
        from the database forever.
      </>
    ),
    confirmLabel: "Delete permanently",
    processingLabel: "Deleting…",
    tone: {
      iconBg: "bg-rose-50",
      iconRing: "ring-rose-100",
      iconText: "text-rose-600",
      button: "bg-rose-600",
      buttonHover: "hover:bg-rose-700",
    },
  },
};

/* =========================================================
   Entry — Suspense boundary (required for useSearchParams)
========================================================= */

export default function AdminAlumniPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminAlumniPageInner />
    </Suspense>
  );
}

function AdminPageSkeleton() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-3">
        <div className="h-10 w-1/3 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-6 w-2/3 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-14 animate-pulse rounded-2xl bg-white" />
        <div className="h-14 animate-pulse rounded-2xl bg-white" />
        <div className="h-14 animate-pulse rounded-2xl bg-white" />
      </div>
    </main>
  );
}

/* =========================================================
   Page
========================================================= */

function AdminAlumniPageInner() {
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<Status>("pending");
  const [data, setData] = useState<Alumnus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  /* ---------- Notification-driven auto-expand ---------- */
  const [pendingScrollId, setPendingScrollId] = useState<number | null>(null);

  /* ---------- Confirm modal ---------- */
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [confirmNote, setConfirmNote] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [processing, setProcessing] = useState(false);

  /* ---------- Read ?expand=<id> from notification click ---------- */
  useEffect(() => {
    const raw = searchParams.get("expand");
    if (!raw) return;
    const id = parseInt(raw, 10);
    if (isNaN(id)) return;

    setTab("pending");
    setExpandedId(id);
    setPendingScrollId(id);
  }, [searchParams]);

  /* ---------- Data ---------- */

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API_URL}/api/admin/alumni?status=${tab}`,
        { headers: authHeaders() }
      );

      if (res.status === 401 || res.status === 403) {
        setError(
          "Admin access required. Please sign in with an admin or headteacher account."
        );
        setData([]);
        return;
      }
      if (!res.ok) throw new Error(`Failed to load (${res.status}).`);

      const json = await res.json();
      setData(extractArray<Alumnus>(json));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load submissions."
      );
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------- Scroll to the auto-expanded row once it renders ---------- */
  useEffect(() => {
    if (loading || pendingScrollId == null) return;

    /* Wait one frame so the accordion animation starts, then scroll */
    const t = setTimeout(() => {
      const el = document.querySelector(
        `[data-alumnus-id="${pendingScrollId}"]`
      );
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      setPendingScrollId(null);
    }, 100);

    return () => clearTimeout(t);
  }, [loading, pendingScrollId, data.length]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((a) =>
      [a.full_name, a.location, a.current_role, a.organization ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [data, search]);

  /* ---------- Modal control ---------- */

  function openConfirm(type: ActionType, person: Alumnus) {
    setConfirm({ type, person });
    setConfirmNote("");
    setConfirmError("");
  }

  function closeConfirm() {
    if (processing) return;
    setConfirm(null);
    setConfirmNote("");
    setConfirmError("");
  }

  async function performAction() {
    if (!confirm || processing) return;

    const { type, person } = confirm;
    setProcessing(true);
    setConfirmError("");

    try {
      let url = "";
      let method: "PATCH" | "DELETE" = "PATCH";
      let body: string | undefined;

      if (type === "approve") {
        url = `${API_URL}/api/admin/alumni/${person.id}/approve`;
      } else if (type === "reject") {
        url = `${API_URL}/api/admin/alumni/${person.id}/reject`;
        body = JSON.stringify({ admin_notes: confirmNote.trim() || null });
      } else {
        url = `${API_URL}/api/admin/alumni/${person.id}`;
        method = "DELETE";
      }

      const res = await fetch(url, {
        method,
        headers: {
          ...authHeaders(),
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body,
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(
          payload?.message || `${type} failed (${res.status}).`
        );
      }

      setData((d) => d.filter((a) => a.id !== person.id));
      if (expandedId === person.id) setExpandedId(null);

      setConfirm(null);
      setConfirmNote("");
      setConfirmError("");
    } catch (err) {
      setConfirmError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setProcessing(false);
    }
  }

  /* =========================================================
     Render
  ========================================================= */

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#F58220]">
              Admin · Alumni
            </p>
            <h1 className="mt-2 text-3xl font-black text-[#252B68] sm:text-4xl">
              Alumni submissions
            </h1>
            <p className="mt-2 text-slate-600">
              Click a name to expand their full submission and review it.
            </p>
          </div>
          <button
            onClick={load}
            className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-600 transition hover:border-[#252B68]/40 hover:text-[#252B68]"
          >
            ⟳ Refresh
          </button>
        </header>

        {/* Tabs + search */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["pending", "approved", "rejected"] as Status[]).map((s) => (
              <button
                key={s}
                onClick={() => setTab(s)}
                className={`rounded-full px-5 py-2.5 text-sm font-black uppercase tracking-wider transition ${
                  tab === s
                    ? "bg-[#252B68] text-white shadow"
                    : "border border-slate-200 bg-white text-[#252B68] hover:border-[#252B68]/40"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="relative w-full md:max-w-xs">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, place, role…"
              className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#F58220] focus:ring-2 focus:ring-[#F58220]/20"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-800">
            {error}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex animate-pulse items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="h-14 w-14 rounded-full bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-slate-100" />
                  <div className="h-3 w-1/2 rounded bg-slate-100" />
                </div>
                <div className="h-8 w-24 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFE900] text-2xl">
              🎓
            </div>
            <h3 className="mt-5 text-xl font-black text-[#252B68]">
              {search
                ? "No submissions match your search."
                : `No ${tab} submissions right now.`}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {search
                ? "Clear the search field to see everything."
                : tab === "pending"
                ? "New submissions will appear here as they arrive."
                : `Once an alumnus is ${tab}, they'll appear here.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((a) => (
              <AccordionRow
                key={a.id}
                person={a}
                open={expandedId === a.id}
                onToggle={() =>
                  setExpandedId((current) => (current === a.id ? null : a.id))
                }
                onApprove={() => openConfirm("approve", a)}
                onReject={() => openConfirm("reject", a)}
                onDelete={() => openConfirm("delete", a)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {confirm && (
        <ConfirmModal
          action={confirm.type}
          person={confirm.person}
          note={confirmNote}
          onNoteChange={setConfirmNote}
          error={confirmError}
          processing={processing}
          onCancel={closeConfirm}
          onConfirm={performAction}
        />
      )}
    </main>
  );
}

/* =========================================================
   Confirm modal
========================================================= */

function ConfirmModal({
  action,
  person,
  note,
  onNoteChange,
  error,
  processing,
  onCancel,
  onConfirm,
}: {
  action: ActionType;
  person: Alumnus;
  note: string;
  onNoteChange: (v: string) => void;
  error: string;
  processing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const meta = ACTION_META[action];
  const photo = getImageUrl(person.photo_url);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !processing) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [processing, onCancel]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !processing) onCancel();
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start gap-4 p-5">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-4 ${meta.tone.iconBg} ${meta.tone.iconRing} ${meta.tone.iconText}`}
          >
            <ActionIcon action={action} />
          </div>

          <div className="min-w-0 flex-1">
            <h2
              id="confirm-title"
              className="text-lg font-black leading-tight text-[#172033]"
            >
              {meta.title(person.full_name)}
            </h2>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-[#F58220]">
              Class of {person.year_left}
              {person.organization ? ` · ${person.organization}` : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            aria-label="Close"
            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Mini profile preview */}
        <div className="mx-5 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-white">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt={person.full_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#252B68] to-[#3B4490] text-xs font-black text-[#FFE900]">
                {initialsOf(person.full_name)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-[#252B68]">
              {person.full_name}
            </p>
            <p className="truncate text-xs font-semibold text-slate-500">
              {person.current_role} · {person.location}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
              person.status === "approved"
                ? "bg-emerald-100 text-emerald-800"
                : person.status === "rejected"
                ? "bg-rose-100 text-rose-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {person.status}
          </span>
        </div>

        {/* Body copy */}
        <div className="px-5 pt-4 text-sm leading-relaxed text-slate-600">
          {meta.body(person)}
        </div>

        {/* Note textarea (reject only) */}
        {action === "reject" && (
          <div className="px-5 pt-4">
            <label
              htmlFor="reject-note"
              className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500"
            >
              Internal note (optional)
            </label>
            <textarea
              id="reject-note"
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Why are you rejecting this submission? Only staff will see this."
              disabled={processing}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-[#F58220] focus:bg-white focus:ring-2 focus:ring-[#F58220]/20 disabled:opacity-60"
            />
            <p className="mt-1 text-right text-[10px] font-semibold text-slate-400">
              {note.length}/500
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-5 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-800">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={processing}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${meta.tone.button} ${meta.tone.buttonHover}`}
          >
            {processing ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                {meta.processingLabel}
              </>
            ) : (
              <>
                <ActionIcon action={action} size={14} />
                {meta.confirmLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Action icon
========================================================= */

function ActionIcon({
  action,
  size = 22,
}: {
  action: ActionType;
  size?: number;
}) {
  if (action === "approve") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12.5l2.5 2.5L16 9.5" />
      </svg>
    );
  }
  if (action === "reject") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9 9l6 6" />
        <path d="M15 9l-6 6" />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

/* =========================================================
   Accordion row
========================================================= */

function AccordionRow({
  person,
  open,
  onToggle,
  onApprove,
  onReject,
  onDelete,
}: {
  person: Alumnus;
  open: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  const photo = getImageUrl(person.photo_url);
  const reviewed = person.status !== "pending" && person.approved_at;

  return (
    <article
      data-alumnus-id={person.id}
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
        open
          ? "border-[#252B68]/40 shadow-md"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      {/* ---------- Collapsed header — no nested buttons ---------- */}
      <div className="flex items-center gap-3 p-4 transition hover:bg-slate-50/60">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-4 text-left"
        >
          {/* Avatar */}
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[#252B68] ring-2 ring-[#FFE900]/40">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt={person.full_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-black text-[#FFE900]">
                {initialsOf(person.full_name)}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-black text-[#252B68]">
                {person.full_name}
              </h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                  person.status === "approved"
                    ? "bg-emerald-100 text-emerald-800"
                    : person.status === "rejected"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {person.status}
              </span>
            </div>
            <p className="mt-1 truncate text-xs font-semibold text-slate-600">
              <span className="text-[#F58220]">
                Class of {person.year_left}
              </span>
              {" · "}
              {person.current_role}
              {person.organization ? ` · ${person.organization}` : ""}
              {" · "}
              {person.location}
            </p>

            {reviewed && person.approved_by_name && (
              <p className="mt-1 truncate text-[10px] font-semibold text-slate-400">
                {person.status === "approved" ? "Approved" : "Rejected"} by{" "}
                <span className="text-slate-600">
                  {person.approved_by_name}
                </span>
                {person.approved_at && (
                  <>
                    {" · "}
                    {formatDateShort(person.approved_at)}
                  </>
                )}
              </p>
            )}
          </div>
        </button>

        {/* Action buttons — siblings, not children */}
        <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
          {person.status !== "approved" && (
            <button
              type="button"
              onClick={onApprove}
              title="Approve"
              aria-label="Approve"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-700"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </button>
          )}
          {person.status !== "rejected" && (
            <button
              type="button"
              onClick={onReject}
              title="Reject"
              aria-label="Reject"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white transition hover:bg-amber-600"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            title="Delete"
            aria-label="Delete"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-600 transition hover:bg-rose-50"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            </svg>
          </button>
        </div>

        {/* Chevron — separate toggle button */}
        <button
          type="button"
          onClick={onToggle}
          aria-label={open ? "Collapse" : "Expand"}
          aria-expanded={open}
          className={`ml-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-transform duration-300 ${
            open ? "rotate-180 bg-[#252B68] text-white" : ""
          }`}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {/* ---------- Expanded panel ---------- */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-slate-100 px-4 pb-5 pt-5 sm:px-6">
            <div className="grid gap-5 md:grid-cols-[180px_1fr]">
              <div className="mx-auto w-full max-w-[180px]">
                <div className="aspect-square w-full overflow-hidden rounded-2xl bg-slate-100">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo}
                      alt={person.full_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl text-slate-300">
                      🎓
                    </div>
                  )}
                </div>
              </div>

              <div className="min-w-0 space-y-4">
                <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                  <Detail label="Current role">{person.current_role}</Detail>
                  <Detail label="Organisation">
                    {person.organization || "—"}
                  </Detail>
                  <Detail label="Location">{person.location}</Detail>
                  <Detail label="Year left">Class of {person.year_left}</Detail>
                  <Detail label="Email">
                    {person.email ? (
                      <a
                        href={`mailto:${person.email}`}
                        className="text-[#F58220] hover:underline"
                      >
                        {person.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </Detail>
                  <Detail label="Phone">
                    {person.phone ? (
                      <a
                        href={`tel:${person.phone}`}
                        className="text-[#F58220] hover:underline"
                      >
                        {person.phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </Detail>
                  <Detail label="LinkedIn">
                    {person.linkedin_url ? (
                      <a
                        href={person.linkedin_url}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-[#F58220] hover:underline"
                      >
                        {person.linkedin_url}
                      </a>
                    ) : (
                      "—"
                    )}
                  </Detail>
                  <Detail label="Show contact publicly">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        person.show_contact
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {person.show_contact ? "Yes" : "No"}
                    </span>
                  </Detail>
                </div>

                {person.bio && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Bio
                    </p>
                    <p className="mt-1 rounded-xl bg-slate-50 p-3 text-sm leading-7 text-slate-700">
                      {person.bio}
                    </p>
                  </div>
                )}

                {person.message_to_students && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Message for students
                    </p>
                    <p className="mt-1 rounded-xl border-l-4 border-[#FFE900] bg-slate-50 p-3 text-sm italic leading-7 text-slate-700">
                      &ldquo;{person.message_to_students}&rdquo;
                    </p>
                  </div>
                )}

                {person.admin_notes && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-rose-600">
                      Admin note
                    </p>
                    <p className="mt-1 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
                      {person.admin_notes}
                    </p>
                  </div>
                )}

                {/* Approval / rejection trace */}
                {reviewed && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      {person.status === "approved"
                        ? "Approval"
                        : "Rejection"}
                    </p>
                    <div
                      className={`mt-1 rounded-xl p-3 ${
                        person.status === "approved"
                          ? "bg-emerald-50 text-emerald-900"
                          : "bg-rose-50 text-rose-900"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${
                            person.status === "approved"
                              ? "bg-emerald-600"
                              : "bg-rose-600"
                          }`}
                        >
                          {person.status === "approved" ? "✓" : "✕"}
                        </span>
                        <p className="text-sm font-semibold">
                          {person.status === "approved"
                            ? "Approved"
                            : "Rejected"}
                          {person.approved_by_name ? (
                            <> by {person.approved_by_name}</>
                          ) : (
                            <span className="font-normal opacity-70">
                              {" "}
                              · reviewer unavailable
                            </span>
                          )}
                        </p>
                      </div>
                      {person.approved_by_role && (
                        <p className="mt-1 pl-8 text-xs capitalize opacity-80">
                          {person.approved_by_role.replace(/_/g, " ")}
                        </p>
                      )}
                      {person.approved_at && (
                        <p className="mt-0.5 pl-8 text-xs opacity-70">
                          {formatDateTime(person.approved_at)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-400">
                  Submitted {formatDateTime(person.created_at)}
                </p>
              </div>
            </div>

            {/* Mobile actions */}
            <div className="mt-5 flex flex-wrap gap-2 sm:hidden">
              {person.status !== "approved" && (
                <button
                  type="button"
                  onClick={onApprove}
                  className="flex-1 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  ✓ Approve
                </button>
              )}
              {person.status !== "rejected" && (
                <button
                  type="button"
                  onClick={onReject}
                  className="flex-1 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-black text-white transition hover:bg-amber-600"
                >
                  ✕ Reject
                </button>
              )}
              <button
                type="button"
                onClick={onDelete}
                className="flex-1 rounded-full border border-rose-200 bg-white px-5 py-2.5 text-sm font-black text-rose-600 transition hover:bg-rose-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   Detail row
========================================================= */

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-slate-800">
        {children}
      </p>
    </div>
  );
}