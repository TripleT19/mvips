"use client";

import {
  AlertCircle, CheckCircle2, ChevronDown, ClipboardCheck, DollarSign,
  Eye, Loader2, Lock, Search, Send, Users, X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "admin_token";

/* ============================================================
 * TYPES
 * ============================================================ */

interface LookupTerm { id: number; name: string; academic_year_id: number; }
interface LookupYear { id: number; name: string; is_current: boolean; }
interface LookupSection { id: number; name: string; school_class_id: number; }

interface SubmissionStudent {
  id: number;
  student_number: string;
  full_name: string;
  photo_url: string | null;
}

interface Submission {
  id: number;
  student: SubmissionStudent | null;
  class_stream: string | null;
  class_stream_id: number | null;
  term: string | null;
  status: "draft" | "submitted" | "published" | "held";
  submitted_at: string | null;
  submitted_by: string | null;
  published_at: string | null;
  published_by: string | null;
  hold_reason: string | null;
  fees_balance: number;
}

interface Stats {
  submitted: number;
  published: number;
  held: number;
  draft: number;
  will_be_blocked: number;
}

type Toast = { type: "success" | "error"; msg: string };
type Tab = "all" | "submitted" | "published" | "held";

/* ============================================================
 * HELPERS
 * ============================================================ */

function authHeaders(extra: Record<string, string> = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

function initials(name: string): string {
  return (name || "").split(" ").filter(Boolean).slice(0, 2)
    .map(p => p[0]).join("").toUpperCase() || "?";
}

function money(n: number): string {
  return `MWK ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return iso; }
}

/* ============================================================
 * PAGE
 * ============================================================ */

export default function ResultsPage() {
  const [terms, setTerms] = useState<LookupTerm[]>([]);
  const [years, setYears] = useState<LookupYear[]>([]);
  const [sections, setSections] = useState<LookupSection[]>([]);

  const [yearId, setYearId] = useState<number | null>(null);
  const [termId, setTermId] = useState<number | null>(null);
  const [sectionId, setSectionId] = useState<number | null>(null);

  const [stats, setStats] = useState<Stats>({
    submitted: 0, published: 0, held: 0, draft: 0, will_be_blocked: 0,
  });
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");

  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [bulkPublishing, setBulkPublishing] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  const [toast, setToast] = useState<Toast | null>(null);

  /* ---------- Load lookups ---------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/academic-lookups`, {
          headers: authHeaders(), cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load lookups");

        const d = data.data;
        setTerms(d.terms ?? []);
        setYears(d.years ?? []);
        setSections(d.class_streams ?? []);

        const current = (d.years ?? []).find((y: LookupYear) => y.is_current);
        const firstYear = current?.id ?? d.years?.[0]?.id ?? null;
        if (firstYear) setYearId(firstYear);

        const currentTerm = (d.terms ?? []).find(
          (t: LookupTerm) => t.academic_year_id === firstYear
        );
        if (currentTerm) setTermId(currentTerm.id);
      } catch (e: any) {
        setToast({ type: "error", msg: e?.message || "Failed." });
      }
    })();
  }, []);

  /* ---------- Load stats (independent of tab) ---------- */
  const loadStats = useCallback(async () => {
    if (!termId) return;
    setLoadingStats(true);
    try {
      const params = new URLSearchParams({ term_id: String(termId) });
      if (yearId)    params.set("academic_year_id", String(yearId));
      if (sectionId) params.set("class_stream_id", String(sectionId));

      const res = await fetch(`${API_URL}/api/admin/results/stats?${params}`, {
        headers: authHeaders(), cache: "no-store",
      });
      const data = await res.json();
      if (res.ok && data.data) setStats(data.data);
      // On failure, keep previous stats — never zero out on transient error
    } catch {
      /* keep previous */
    } finally {
      setLoadingStats(false);
    }
  }, [termId, yearId, sectionId]);

  /* ---------- Load list ---------- */
  const loadList = useCallback(async () => {
    if (!termId) return;
    setLoadingList(true);
    try {
      const params = new URLSearchParams({ term_id: String(termId) });
      if (yearId)    params.set("academic_year_id", String(yearId));
      if (sectionId) params.set("class_stream_id", String(sectionId));

      const res = await fetch(`${API_URL}/api/admin/results/submissions?${params}`, {
        headers: authHeaders(), cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      setSubmissions(data.data ?? []);
    } catch (e: any) {
      setToast({ type: "error", msg: e?.message || "Failed." });
      setSubmissions([]);
    } finally {
      setLoadingList(false);
    }
  }, [termId, yearId, sectionId]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadList(); }, [loadList]);

  /* ---------- Filtered rows ---------- */
  const filtered = useMemo(() => {
    let rows = submissions;

    if (tab !== "all") {
      rows = rows.filter(r => r.status === tab);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(r =>
        r.student?.full_name.toLowerCase().includes(q) ||
        r.student?.student_number.toLowerCase().includes(q)
      );
    }

    return rows;
  }, [submissions, tab, search]);

  /* ---------- Publish actions ---------- */
  async function publishOne(sub: Submission) {
    if (!sub.student || !termId || !yearId) return;
    setPublishingId(sub.id);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/results/${sub.student.id}/publish`,
        {
          method: "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            term_id: termId,
            academic_year_id: yearId,
          }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        setToast({ type: "error", msg: data?.message || "Publish failed." });
      } else {
        setToast({ type: "success", msg: data.message });
      }

      // Always reload — even on error, the submission state may have changed
      await Promise.all([loadStats(), loadList()]);
    } catch (e: any) {
      setToast({ type: "error", msg: e?.message || "Publish failed." });
    } finally {
      setPublishingId(null);
    }
  }

  async function bulkPublish() {
    if (!termId || !yearId) return;
    setBulkPublishing(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/results/bulk-publish`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          term_id: termId,
          academic_year_id: yearId,
          class_stream_id: sectionId ?? undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setToast({ type: "error", msg: data?.message || "Bulk publish failed." });
      } else {
        setToast({ type: "success", msg: data.message });
      }

      setShowBulkConfirm(false);
      await Promise.all([loadStats(), loadList()]);
    } catch (e: any) {
      setToast({ type: "error", msg: e?.message || "Bulk publish failed." });
    } finally {
      setBulkPublishing(false);
    }
  }

  /* ---------- Derived ---------- */
  const currentTerm = terms.find(t => t.id === termId);

  const canBulkPublish = stats.submitted > 0;

  /* ---------- Guard ---------- */
  if (!termId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={22} className="animate-spin text-[#F58220]" />
      </div>
    );
  }

  /* ============================================================
   * RENDER
   * ============================================================ */

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#172033]">Results</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review submitted reports, publish them, and monitor which parents
          are currently blocked by outstanding fees.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Academic Year
            </label>
            <div className="relative">
              <select
                value={yearId ?? ""}
                onChange={(e) => { setYearId(Number(e.target.value)); setTermId(null); }}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-10 text-sm font-medium outline-none focus:border-[#252B68]"
              >
                {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Term
            </label>
            <div className="relative">
              <select
                value={termId ?? ""}
                onChange={(e) => setTermId(Number(e.target.value))}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-10 text-sm font-medium outline-none focus:border-[#252B68]"
              >
                {terms
                  .filter(t => !yearId || t.academic_year_id === yearId)
                  .map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Class Section
            </label>
            <div className="relative">
              <select
                value={sectionId ?? ""}
                onChange={(e) => setSectionId(e.target.value ? Number(e.target.value) : null)}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-10 text-sm font-medium outline-none focus:border-[#252B68]"
              >
                <option value="">All sections</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Submitted"
          value={stats.submitted}
          hint="Awaiting publishing"
          tone="blue"
          icon={<ClipboardCheck size={17} />}
          loading={loadingStats}
        />
        <StatCard
          label="Published"
          value={stats.published}
          hint="Visible to parents"
          tone="emerald"
          icon={<CheckCircle2 size={17} />}
          loading={loadingStats}
        />
        <StatCard
          label="Held (fees)"
          value={stats.held}
          hint="Legacy — auto-converted on publish"
          tone="slate"
          icon={<Lock size={17} />}
          loading={loadingStats}
        />
        <StatCard
          label="Will be blocked"
          value={stats.will_be_blocked}
          hint="Published but fees outstanding"
          tone="amber"
          icon={<DollarSign size={17} />}
          loading={loadingStats}
        />
      </div>

      {/* Info banner about the new policy */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <AlertCircle size={18} className="mt-0.5 shrink-0 text-blue-600" />
        <p>
          Publishing is not blocked by outstanding fees. A published report
          becomes visible to parents the moment their balance reaches zero —
          no re-publish required.
        </p>
      </div>

      {/* Tabs + search */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="flex flex-wrap gap-1">
            <TabBtn active={tab === "all"}       onClick={() => setTab("all")}       label="All"        count={submissions.length} />
            <TabBtn active={tab === "submitted"} onClick={() => setTab("submitted")} label="Submitted"  count={stats.submitted} />
            <TabBtn active={tab === "published"} onClick={() => setTab("published")} label="Published"  count={stats.published} />
            <TabBtn active={tab === "held"}      onClick={() => setTab("held")}      label="Held"       count={stats.held} />
          </div>

          <div className="relative w-full max-w-xs">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student..."
              className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-[#252B68]"
            />
          </div>
        </div>

        {/* Bulk publish bar */}
        {tab === "submitted" && canBulkPublish && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F58220]/10 text-[#F58220]">
                <Send size={15} />
              </div>
              <p className="text-slate-700">
                <strong>{stats.submitted}</strong> report{stats.submitted === 1 ? "" : "s"} ready to publish
                {sectionId ? " in this section" : ""}.
              </p>
            </div>
            <button
              onClick={() => setShowBulkConfirm(true)}
              disabled={bulkPublishing}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#F58220] px-4 text-xs font-bold text-white hover:bg-[#d97212] disabled:opacity-50"
            >
              <Send size={13} />
              Publish all submitted
            </button>
          </div>
        )}

        {/* Table */}
        {loadingList ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin text-[#F58220]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <ClipboardCheck size={20} />
            </div>
            <p className="mt-3 text-sm font-semibold text-[#172033]">
              No submissions in this view
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {tab === "submitted"
                ? "Nothing waiting to be published for this term."
                : "Class teachers have not submitted any reports yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Student</th>
                  <th className="px-3 py-2.5">Section</th>
                  <th className="px-3 py-2.5">Submitted</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-right">Fees Balance</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub) => (
                  <tr key={sub.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#252B68] to-[#4A5496] text-[10px] font-bold text-white ring-2 ring-white">
                          {sub.student?.photo_url ? (
                            <img src={sub.student.photo_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            initials(sub.student?.full_name ?? "")
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#172033]">
                            {sub.student?.full_name ?? "Unknown student"}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {sub.student?.student_number ?? "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600">
                      {sub.class_stream ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600">
                      {fmtDate(sub.submitted_at)}
                      {sub.submitted_by && (
                        <p className="text-[10px] text-slate-400">by {sub.submitted_by}</p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill status={sub.status} fees={sub.fees_balance} />
                    </td>
                    <td className="px-3 py-3 text-right text-xs">
                      {sub.fees_balance > 0.001 ? (
                        <span className="font-bold text-amber-700">
                          {money(sub.fees_balance)}
                        </span>
                      ) : (
                        <span className="font-semibold text-emerald-700">Settled</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {sub.status === "submitted" || sub.status === "held" ? (
                        <button
                          onClick={() => publishOne(sub)}
                          disabled={publishingId === sub.id}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#F58220] px-3 text-[11px] font-bold text-white hover:bg-[#d97212] disabled:opacity-50"
                        >
                          {publishingId === sub.id
                            ? <Loader2 size={12} className="animate-spin" />
                            : <Send size={12} />}
                          Publish
                        </button>
                      ) : sub.status === "published" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          {fmtDate(sub.published_at)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk confirm modal */}
      {showBulkConfirm && (
        <ConfirmModal
          title="Publish all submitted?"
          message={
            `This will publish all ${stats.submitted} submitted report${stats.submitted === 1 ? "" : "s"}` +
            (sectionId ? " in the selected section" : "") +
            `. Parents with outstanding fees will see a "balance due" card instead of the report until the balance is cleared — no further action will be needed from you at that point.`
          }
          confirmLabel={`Publish ${stats.submitted}`}
          busy={bulkPublishing}
          onClose={() => setShowBulkConfirm(false)}
          onConfirm={bulkPublish}
        />
      )}

      {toast && <ToastBox {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

/* ============================================================
 * SUB-COMPONENTS
 * ============================================================ */

function StatCard({
  label, value, hint, tone, icon, loading,
}: {
  label: string; value: number; hint: string;
  tone: "blue" | "emerald" | "amber" | "slate";
  icon: React.ReactNode;
  loading: boolean;
}) {
  const tones: Record<string, { bg: string; text: string; iconBg: string; iconText: string }> = {
    blue:    { bg: "border-blue-200 bg-blue-50/60",       text: "text-blue-900",    iconBg: "bg-blue-100",    iconText: "text-blue-600" },
    emerald: { bg: "border-emerald-200 bg-emerald-50/60", text: "text-emerald-900", iconBg: "bg-emerald-100", iconText: "text-emerald-600" },
    amber:   { bg: "border-amber-200 bg-amber-50/60",     text: "text-amber-900",   iconBg: "bg-amber-100",   iconText: "text-amber-600" },
    slate:   { bg: "border-slate-200 bg-slate-50",        text: "text-slate-800",   iconBg: "bg-slate-100",   iconText: "text-slate-500" },
  };
  const t = tones[tone];

  return (
    <div className={`rounded-2xl border p-4 ${t.bg}`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-[10px] font-bold uppercase tracking-wider ${t.text} opacity-70`}>
          {label}
        </p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${t.iconBg} ${t.iconText}`}>
          {icon}
        </div>
      </div>
      <p className={`mt-2 text-3xl font-black ${t.text}`}>
        {loading ? <Loader2 size={22} className="animate-spin opacity-50" /> : value}
      </p>
      <p className={`mt-0.5 text-[11px] ${t.text} opacity-70`}>{hint}</p>
    </div>
  );
}

function StatusPill({ status, fees }: { status: string; fees: number }) {
  if (status === "submitted") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
        <ClipboardCheck size={10} />
        Submitted
      </span>
    );
  }
  if (status === "published") {
    if (fees > 0.001) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
          <Lock size={10} />
          Published · Blocked
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
        <CheckCircle2 size={10} />
        Published
      </span>
    );
  }
  if (status === "held") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">
        <Lock size={10} />
        Held
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
      {status}
    </span>
  );
}

function TabBtn({
  active, onClick, label, count,
}: {
  active: boolean; onClick: () => void; label: string; count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold uppercase tracking-wider transition ${
        active
          ? "bg-[#252B68] text-white shadow-sm"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      }`}
    >
      {label}
      <span className={`rounded px-1.5 text-[10px] ${
        active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
      }`}>
        {count}
      </span>
    </button>
  );
}

function ConfirmModal({
  title, message, confirmLabel, busy, onClose, onConfirm,
}: {
  title: string; message: string; confirmLabel: string;
  busy: boolean; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F58220]/10">
            <Send size={22} className="text-[#F58220]" />
          </div>
          <h3 className="mt-4 text-base font-bold text-[#172033]">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{message}</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            onClick={onClose}
            disabled={busy}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#F58220] px-4 text-sm font-semibold text-white hover:bg-[#d97212] disabled:opacity-50"
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToastBox({ type, msg, onClose }: Toast & { onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-5 right-5 z-[200] w-full max-w-sm">
      <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${
        type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}>
        {type === "success"
          ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
        <p className="flex-1 text-sm">{msg}</p>
        <button onClick={onClose}><X size={16} /></button>
      </div>
    </div>
  );
}