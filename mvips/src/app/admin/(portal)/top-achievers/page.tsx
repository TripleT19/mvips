"use client";

import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers,
  Loader2,
  Medal,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Sigma,
  Trash2,
  Trophy,
  Upload,
  UserPlus,
  X,
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "admin_token";
const MAX_PHOTO_MB = 5;
const MAX_SUBJECT = 50;
const MAX_TOTAL = MAX_SUBJECT * 3;

type Level = "class" | "subject";
type SubjectKey = "english" | "maths" | "science";

const SUBJECTS: { key: SubjectKey; label: string; short: string; icon: React.ReactNode }[] = [
  { key: "english", label: "English",     short: "ENG", icon: <BookOpen size={14} /> },
  { key: "maths",   label: "Mathematics", short: "MAT", icon: <Sigma size={14} /> },
  { key: "science", label: "Science",     short: "SCI", icon: <Trophy size={14} /> },
];

interface TopAchiever {
  id: number;
  academic_year_id: number;
  academic_year_name: string | null;
  student_name: string;
  student_photo_url: string | null;
  position: number;
  subject: SubjectKey | null;
  english_score: number;
  maths_score: number;
  science_score: number;
  total_score: number;
  average_score: number;
  note: string | null;
  is_published: boolean;
}

interface YearOption {
  id: number;
  name: string;
  is_current: boolean;
}

/* =========================================================
   Helpers
========================================================= */

function authHeaders(json = true): HeadersInit {
  const token =
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  const h: Record<string, string> = { Accept: "application/json" };
  if (json) h["Content-Type"] = "application/json";
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function ordinal(n: number): string {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

function initials(name: string): string {
  return (
    name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "?"
  );
}

function clampScore(v: number): number {
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > MAX_SUBJECT) return MAX_SUBJECT;
  return Math.round(v * 10) / 10;
}

/* =========================================================
   PAGE
========================================================= */

export default function AdminTopAchieversPage() {
  const [level, setLevel] = useState<Level>("class");
  const [subject, setSubject] = useState<SubjectKey>("english");
  const [achievers, setAchievers] = useState<TopAchiever[]>([]);
  const [years, setYears] = useState<YearOption[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [counts, setCounts] = useState<{ class: number; english: number; maths: number; science: number }>({
    class: 0, english: 0, maths: 0, science: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [editing, setEditing] = useState<TopAchiever | null>(null);

  const [deleting, setDeleting] = useState<TopAchiever | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [result, setResult] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);

  /* ------------------------------------------------------------------
     Load
  ------------------------------------------------------------------ */

  const load = async (opts: { silent?: boolean } = {}) => {
    if (!opts.silent) setLoading(true);
    else setRefreshing(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (selectedYearId != null) params.set("academic_year_id", String(selectedYearId));
      if (level === "subject") params.set("subject", subject);

      const res = await fetch(`${API_URL}/api/admin/top-achievers?${params.toString()}`, {
        headers: authHeaders(false),
        cache: "no-store",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Unable to load achievers.");

      setAchievers(Array.isArray(json?.data) ? json.data : []);
      setYears(Array.isArray(json?.years) ? json.years : []);
      if (json?.counts) setCounts(json.counts);
      if (selectedYearId == null && json?.academic_year_id != null) {
        setSelectedYearId(json.academic_year_id);
      }
    } catch (e: any) {
      setError(e?.message || "Unable to load achievers.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load({ silent: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, subject, selectedYearId]);

  /* ------------------------------------------------------------------
     Actions
  ------------------------------------------------------------------ */

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/top-achievers/${deleting.id}`, {
        method: "DELETE",
        headers: authHeaders(false),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Unable to delete.");
      setResult({ type: "success", title: "Achiever deleted", message: `"${deleting.student_name}" was removed.` });
      setDeleting(null);
      await load({ silent: true });
    } catch (e: any) {
      setResult({ type: "error", title: "Delete failed", message: e?.message || "Something went wrong." });
    } finally {
      setDeleteBusy(false);
    }
  }

  async function togglePublished(a: TopAchiever) {
    try {
      const body: any = {
        student_name: a.student_name,
        subject: a.subject,
        note: a.note,
        is_published: !a.is_published,
      };
      if (a.subject === null) {
        body.english_score = a.english_score;
        body.maths_score = a.maths_score;
        body.science_score = a.science_score;
      } else {
        body.score = a.total_score;
      }
      const res = await fetch(`${API_URL}/api/admin/top-achievers/${a.id}`, {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Unable to update.");
      setResult({
        type: "success",
        title: a.is_published ? "Unpublished" : "Published",
        message: `"${a.student_name}" is now ${a.is_published ? "hidden" : "visible"} on the public page.`,
      });
      await load({ silent: true });
    } catch (e: any) {
      setResult({ type: "error", title: "Update failed", message: e?.message || "Something went wrong." });
    }
  }

  /* ------------------------------------------------------------------
     Stats
  ------------------------------------------------------------------ */

  const stats = useMemo(() => {
    if (achievers.length === 0) {
      return { total: 0, published: 0, topScore: 0 };
    }
    return {
      total: achievers.length,
      published: achievers.filter((a) => a.is_published).length,
      topScore: Math.max(...achievers.map((a) => a.total_score)),
    };
  }, [achievers]);

  const activeSubjectLabel =
    level === "class" ? "Class Level" : SUBJECTS.find((s) => s.key === subject)?.label ?? "";

  /* ------------------------------------------------------------------
     Render
  ------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#252B68] text-[#FFE900]">
              <Medal size={22} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#F58220]">
                Mount View Admin
              </p>
              <h1 className="text-base font-black text-[#252B68]">Top Achievers</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {years.length > 0 && (
              <select
                value={selectedYearId ?? ""}
                onChange={(e) => setSelectedYearId(Number(e.target.value))}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#252B68] focus:ring-4 focus:ring-[#252B68]/10"
              >
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name} {y.is_current ? "(current)" : ""}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={() => load({ silent: true })}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Alerts */}
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

        {/* Tabs + Add buttons */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-100">
            <button
              type="button"
              onClick={() => setLevel("class")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition ${
                level === "class"
                  ? "bg-[#252B68] text-white shadow"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Trophy size={15} />
              Class Level
              <span
                className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  level === "class" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {counts.class}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setLevel("subject")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition ${
                level === "subject"
                  ? "bg-[#252B68] text-white shadow"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <BookOpen size={15} />
              Subject Level
              <span
                className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  level === "subject" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {counts.english + counts.maths + counts.science}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSingleModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-[#252B68] bg-white px-4 py-2 text-sm font-black text-[#252B68] transition hover:bg-[#252B68]/5"
            >
              <UserPlus size={15} />
              Add One
            </button>
            <button
              type="button"
              onClick={() => setShowBatchModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#F58220] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#d96e12]"
            >
              <Layers size={15} />
              Batch Add
            </button>
          </div>
        </div>

        {/* Subject chips (only when on subject level) */}
        {level === "subject" && (
          <div className="mb-5 inline-flex rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-100">
            {SUBJECTS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSubject(s.key)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition ${
                  subject === s.key
                    ? "bg-[#F58220] text-white shadow"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {s.icon}
                {s.label}
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    subject === s.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {counts[s.key]}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total" value={stats.total} color="text-[#252B68]" />
          <StatCard label="Published" value={stats.published} color="text-emerald-600" />
          <StatCard
            label={level === "class" ? "Top Total" : "Top Score"}
            value={
              level === "class"
                ? `${stats.topScore.toFixed(0)}/${MAX_TOTAL}`
                : `${stats.topScore.toFixed(0)}/${MAX_SUBJECT}`
            }
            color="text-[#F58220]"
          />
          <StatCard label="Viewing" value={activeSubjectLabel} color="text-[#252B68]" />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white p-12 text-slate-500">
            <Loader2 size={20} className="animate-spin" />
            Loading achievers…
          </div>
        ) : achievers.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Trophy size={22} />
            </div>
            <p className="mt-4 font-bold text-[#172033]">No achievers yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Add one achiever, or batch-add multiple at once.
            </p>
            <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowSingleModal(true)}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-[#252B68] bg-white px-4 py-2.5 text-sm font-bold text-[#252B68] hover:bg-[#252B68]/5"
              >
                <UserPlus size={16} />
                Add One
              </button>
              <button
                type="button"
                onClick={() => setShowBatchModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#F58220] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#d96e12]"
              >
                <Layers size={16} />
                Batch Add
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Position</th>
                    <th className="px-4 py-3">Student</th>
                    {level === "class" ? (
                      <>
                        <th className="px-4 py-3 text-center">
                          ENG<span className="ml-1 text-[9px] font-semibold text-slate-400">/{MAX_SUBJECT}</span>
                        </th>
                        <th className="px-4 py-3 text-center">
                          MAT<span className="ml-1 text-[9px] font-semibold text-slate-400">/{MAX_SUBJECT}</span>
                        </th>
                        <th className="px-4 py-3 text-center">
                          SCI<span className="ml-1 text-[9px] font-semibold text-slate-400">/{MAX_SUBJECT}</span>
                        </th>
                        <th className="px-4 py-3 text-center">
                          Total<span className="ml-1 text-[9px] font-semibold text-slate-400">/{MAX_TOTAL}</span>
                        </th>
                      </>
                    ) : (
                      <th className="px-4 py-3 text-center">
                        Score<span className="ml-1 text-[9px] font-semibold text-slate-400">/{MAX_SUBJECT}</span>
                      </th>
                    )}
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {achievers.map((a) => (
                    <tr key={a.id} className="transition hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex h-9 min-w-[44px] items-center justify-center rounded-lg px-2 text-xs font-black ${
                            a.position === 1
                              ? "bg-[#FFE900] text-[#252B68]"
                              : a.position === 2
                              ? "bg-slate-200 text-slate-700"
                              : a.position === 3
                              ? "bg-orange-200 text-orange-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {ordinal(a.position)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-2 ring-slate-200">
                            {a.student_photo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={a.student_photo_url}
                                alt={a.student_name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-black text-[#252B68]">
                                {initials(a.student_name)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-[#172033]">{a.student_name}</p>
                            {a.note && (
                              <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">{a.note}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {level === "class" ? (
                        <>
                          <td className="px-4 py-3 text-center font-semibold text-slate-700">
                            {a.english_score.toFixed(0)}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-slate-700">
                            {a.maths_score.toFixed(0)}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-slate-700">
                            {a.science_score.toFixed(0)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex rounded-lg bg-[#252B68]/10 px-2.5 py-1 text-xs font-black text-[#252B68]">
                              {a.total_score.toFixed(0)}
                            </span>
                          </td>
                        </>
                      ) : (
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex rounded-lg bg-[#F58220]/10 px-2.5 py-1 text-xs font-black text-[#F58220]">
                            {a.total_score.toFixed(0)}
                          </span>
                        </td>
                      )}

                      <td className="px-4 py-3 text-center">
                        {a.is_published ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Draft
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => togglePublished(a)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#252B68]"
                            title={a.is_published ? "Unpublish" : "Publish"}
                          >
                            {a.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditing(a)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#252B68]"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(a)}
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
              {achievers.map((a) => (
                <div key={a.id} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                        a.position === 1
                          ? "bg-[#FFE900] text-[#252B68]"
                          : a.position === 2
                          ? "bg-slate-200 text-slate-700"
                          : a.position === 3
                          ? "bg-orange-200 text-orange-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {a.position}
                    </div>
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-2 ring-slate-200">
                      {a.student_photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.student_photo_url}
                          alt={a.student_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-black text-[#252B68]">
                          {initials(a.student_name)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-[#172033]">{a.student_name}</p>
                      <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                        {level === "class"
                          ? `ENG ${a.english_score.toFixed(0)} · MAT ${a.maths_score.toFixed(0)} · SCI ${a.science_score.toFixed(0)} · Total ${a.total_score.toFixed(0)}/${MAX_TOTAL}`
                          : `Score ${a.total_score.toFixed(0)}/${MAX_SUBJECT}`}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditing(a)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => togglePublished(a)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                        >
                          {a.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(a)}
                          className="rounded-md p-1.5 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SINGLE ADD MODAL */}
      {showSingleModal && (
        <SingleAchieverModal
          level={level}
          subject={subject}
          yearId={selectedYearId}
          years={years}
          onClose={() => setShowSingleModal(false)}
          onSaved={async (msg) => {
            setShowSingleModal(false);
            setResult({ type: "success", title: "Saved", message: msg });
            await load({ silent: true });
          }}
        />
      )}

      {/* BATCH ADD MODAL */}
      {showBatchModal && (
        <BatchAchieverModal
          level={level}
          subject={subject}
          yearId={selectedYearId}
          onClose={() => setShowBatchModal(false)}
          onSaved={async (msg) => {
            setShowBatchModal(false);
            setResult({ type: "success", title: "Batch Saved", message: msg });
            await load({ silent: true });
          }}
        />
      )}

      {/* EDIT MODAL */}
      {editing && (
        <EditAchieverModal
          achiever={editing}
          onClose={() => setEditing(null)}
          onSaved={async (msg) => {
            setEditing(null);
            setResult({ type: "success", title: "Saved", message: msg });
            await load({ silent: true });
          }}
        />
      )}

      {/* DELETE CONFIRM */}
      {deleting && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
                <Trash2 size={22} className="text-red-600" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-[#172033]">Delete achiever?</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                You are about to permanently delete{" "}
                <span className="font-semibold text-slate-700">
                  &ldquo;{deleting.student_name}&rdquo;
                </span>
                . The photo will also be removed. This cannot be undone.
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
   StatCard
========================================================= */

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-xl font-black ${color}`}>{value}</p>
    </div>
  );
}

/* =========================================================
   Shared: Image Picker (used in all modals)
========================================================= */

function ImagePicker({
  preview,
  onFile,
  onClear,
  size = "large",
}: {
  preview: string;
  onFile: (file: File) => void;
  onClear: () => void;
  size?: "small" | "large";
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onFile(file);
  }

  const dims = size === "small" ? "h-12 w-12" : "h-24 w-24";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`relative ${dims} shrink-0 overflow-hidden rounded-full bg-slate-100 ring-2 ring-slate-200 transition hover:ring-[#252B68]`}
        title="Choose photo"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <ImageIcon size={size === "small" ? 14 : 22} />
          </div>
        )}
      </button>

      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-200"
        >
          <Upload size={10} />
          {preview ? "Change" : "Upload"}
        </button>
        {preview && (
          <button
            type="button"
            onClick={() => {
              onClear();
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-100"
          >
            <X size={10} />
            Remove
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

/* =========================================================
   Single Add Modal
========================================================= */

function SingleAchieverModal({
  level,
  subject,
  yearId,
  years,
  onClose,
  onSaved,
}: {
  level: Level;
  subject: SubjectKey;
  yearId: number | null;
  years: YearOption[];
  onClose: () => void;
  onSaved: (msg: string) => Promise<void>;
}) {
  const [studentName, setStudentName] = useState("");
  const [english, setEnglish] = useState("0");
  const [maths, setMaths] = useState("0");
  const [science, setScience] = useState("0");
  const [score, setScore] = useState("0");
  const [note, setNote] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!photoFile) return;
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!studentName.trim()) {
      setError("Student name is required.");
      return;
    }
    if (yearId == null) {
      setError("Select an academic year first.");
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("academic_year_id", String(yearId));
      fd.append("student_name", studentName.trim());
      fd.append("note", note.trim());
      fd.append("is_published", isPublished ? "1" : "0");

      if (level === "class") {
        fd.append("english_score", String(clampScore(parseFloat(english || "0"))));
        fd.append("maths_score", String(clampScore(parseFloat(maths || "0"))));
        fd.append("science_score", String(clampScore(parseFloat(science || "0"))));
      } else {
        fd.append("subject", subject);
        fd.append("score", String(clampScore(parseFloat(score || "0"))));
      }

      if (photoFile) fd.append("photo", photoFile);

      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_URL}/api/admin/top-achievers`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: fd,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Unable to save.");

      await onSaved("Achiever created.");
    } catch (err: any) {
      setError(err?.message || "Unable to save.");
    } finally {
      setBusy(false);
    }
  }

  const subjectLabel = level === "subject" ? SUBJECTS.find((s) => s.key === subject)?.label : null;

  return (
    <div className="fixed inset-0 z-[160] flex items-start justify-center overflow-y-auto bg-black/60 p-4">
      <form
        onSubmit={submit}
        className="my-4 w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#252B68] px-6 py-4 text-white">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#FFE900]">
              {level === "class" ? "New · Class Level" : `New · ${subjectLabel}`}
            </p>
            <h2 className="mt-1 text-lg font-black">Add Top Achiever</h2>
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

        <div className="space-y-4 px-6 py-6">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-start gap-4">
            <ImagePicker
              preview={photoPreview}
              onFile={(f) => setPhotoFile(f)}
              onClear={() => {
                setPhotoFile(null);
                setPhotoPreview("");
              }}
            />
            <div className="flex-1">
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Student name *
                </span>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Thandiwe Mwale"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                  required
                />
              </label>
            </div>
          </div>

          {level === "class" ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <NumberField label={`English /${MAX_SUBJECT}`} value={english} onChange={setEnglish} />
              <NumberField label={`Maths /${MAX_SUBJECT}`} value={maths} onChange={setMaths} />
              <NumberField label={`Science /${MAX_SUBJECT}`} value={science} onChange={setScience} />
            </div>
          ) : (
            <NumberField label={`Score /${MAX_SUBJECT}`} value={score} onChange={setScore} />
          )}

          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Note (optional)
            </span>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
            />
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-[#252B68]">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#252B68]"
            />
            Publish on public page
          </label>
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
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Create
          </button>
        </div>
      </form>
    </div>
  );
}

/* =========================================================
   Batch Add Modal
========================================================= */

type BatchRow = {
  key: string;
  student_name: string;
  english_score: string;
  maths_score: string;
  science_score: string;
  score: string;
  note: string;
  photoFile: File | null;
  photoPreview: string;
};

function newRow(): BatchRow {
  return {
    key: Math.random().toString(36).slice(2),
    student_name: "",
    english_score: "",
    maths_score: "",
    science_score: "",
    score: "",
    note: "",
    photoFile: null,
    photoPreview: "",
  };
}

function BatchAchieverModal({
  level,
  subject,
  yearId,
  onClose,
  onSaved,
}: {
  level: Level;
  subject: SubjectKey;
  yearId: number | null;
  onClose: () => void;
  onSaved: (msg: string) => Promise<void>;
}) {
  const [rows, setRows] = useState<BatchRow[]>([newRow(), newRow(), newRow()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Revoke previews on unmount
  useEffect(() => {
    return () => {
      rows.forEach((r) => {
        if (r.photoPreview.startsWith("blob:")) URL.revokeObjectURL(r.photoPreview);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateRow(key: string, patch: Partial<BatchRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function setRowPhoto(key: string, file: File) {
    const url = URL.createObjectURL(file);
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        if (r.photoPreview.startsWith("blob:")) URL.revokeObjectURL(r.photoPreview);
        return { ...r, photoFile: file, photoPreview: url };
      })
    );
  }

  function clearRowPhoto(key: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        if (r.photoPreview.startsWith("blob:")) URL.revokeObjectURL(r.photoPreview);
        return { ...r, photoFile: null, photoPreview: "" };
      })
    );
  }

  function addRow() {
    setRows((prev) => [...prev, newRow()]);
  }

  function removeRow(key: string) {
    setRows((prev) => {
      const target = prev.find((r) => r.key === key);
      if (target && target.photoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(target.photoPreview);
      }
      return prev.length > 1 ? prev.filter((r) => r.key !== key) : prev;
    });
  }

  const filledRows = rows.filter((r) => r.student_name.trim() !== "");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (yearId == null) {
      setError("Please select an academic year first.");
      return;
    }
    if (filledRows.length === 0) {
      setError("Add at least one student with a name.");
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("academic_year_id", String(yearId));
      if (level === "subject") fd.append("subject", subject);

      filledRows.forEach((r, i) => {
        fd.append(`achievers[${i}][student_name]`, r.student_name.trim());
        fd.append(`achievers[${i}][note]`, r.note.trim());

        if (level === "class") {
          fd.append(`achievers[${i}][english_score]`, String(clampScore(parseFloat(r.english_score || "0"))));
          fd.append(`achievers[${i}][maths_score]`, String(clampScore(parseFloat(r.maths_score || "0"))));
          fd.append(`achievers[${i}][science_score]`, String(clampScore(parseFloat(r.science_score || "0"))));
        } else {
          fd.append(`achievers[${i}][score]`, String(clampScore(parseFloat(r.score || "0"))));
        }

        if (r.photoFile) {
          fd.append(`achievers[${i}][photo]`, r.photoFile);
        }
      });

      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_URL}/api/admin/top-achievers/batch`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: fd,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || "Unable to save batch.");
      }

      await onSaved(json?.message || "Batch saved.");
    } catch (err: any) {
      setError(err?.message || "Unable to save batch.");
    } finally {
      setBusy(false);
    }
  }

  const subjectLabel = level === "subject" ? SUBJECTS.find((s) => s.key === subject)?.label : null;

  return (
    <div className="fixed inset-0 z-[160] flex items-start justify-center overflow-y-auto bg-black/60 p-4">
      <form
        onSubmit={submit}
        className="my-4 w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#252B68] px-6 py-4 text-white">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#FFE900]">
              Batch Add · {level === "class" ? "Class Level" : subjectLabel}
            </p>
            <h2 className="mt-1 text-lg font-black">Add multiple achievers</h2>
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

        <div className="max-h-[70vh] overflow-y-auto px-4 py-4 sm:px-6">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="rounded-xl border border-slate-200">
            <div className="hidden bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 md:grid md:grid-cols-[36px_60px_1fr_90px_90px_90px_1fr_36px] md:items-center md:gap-2">
              <span>#</span>
              <span>Photo</span>
              <span>Student name *</span>
              {level === "class" ? (
                <>
                  <span className="text-center">ENG /50</span>
                  <span className="text-center">MAT /50</span>
                  <span className="text-center">SCI /50</span>
                </>
              ) : (
                <>
                  <span className="text-center">Score /50</span>
                  <span />
                  <span />
                </>
              )}
              <span>Note</span>
              <span></span>
            </div>

            <div className="divide-y divide-slate-100">
              {rows.map((row, i) => (
                <div
                  key={row.key}
                  className="grid gap-2 px-3 py-3 md:grid-cols-[36px_60px_1fr_90px_90px_90px_1fr_36px] md:items-center"
                >
                  <div className="text-xs font-bold text-slate-400">{i + 1}</div>

                  <ImagePicker
                    preview={row.photoPreview}
                    onFile={(f) => setRowPhoto(row.key, f)}
                    onClear={() => clearRowPhoto(row.key)}
                    size="small"
                  />

                  <input
                    type="text"
                    value={row.student_name}
                    onChange={(e) => updateRow(row.key, { student_name: e.target.value })}
                    placeholder="Student name"
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                  />

                  {level === "class" ? (
                    <>
                      <ScoreInput value={row.english_score} onChange={(v) => updateRow(row.key, { english_score: v })} />
                      <ScoreInput value={row.maths_score} onChange={(v) => updateRow(row.key, { maths_score: v })} />
                      <ScoreInput value={row.science_score} onChange={(v) => updateRow(row.key, { science_score: v })} />
                    </>
                  ) : (
                    <>
                      <ScoreInput value={row.score} onChange={(v) => updateRow(row.key, { score: v })} />
                      <div />
                      <div />
                    </>
                  )}

                  <input
                    type="text"
                    value={row.note}
                    onChange={(e) => updateRow(row.key, { note: e.target.value })}
                    placeholder="Optional"
                    maxLength={500}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                  />

                  <button
                    type="button"
                    onClick={() => removeRow(row.key)}
                    disabled={rows.length <= 1}
                    className="self-center rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                    aria-label="Remove row"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={addRow}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-[#252B68]/30 px-4 py-2 text-sm font-bold text-[#252B68] transition hover:border-[#252B68] hover:bg-[#252B68]/5"
          >
            <Plus size={15} />
            Add row
          </button>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="rounded-full bg-[#252B68]/10 px-2 py-0.5 text-[11px] font-black text-[#252B68]">
              {filledRows.length} ready
            </span>
            of {rows.length} rows · rows without a name are skipped
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || filledRows.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#252B68] px-6 py-2.5 text-sm font-black text-white transition hover:bg-[#1c2156] disabled:opacity-50"
            >
              {busy ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              Save {filledRows.length > 0 ? `(${filledRows.length})` : ""}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function ScoreInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <input
        type="number"
        min={0}
        max={MAX_SUBJECT}
        step={0.5}
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            onChange("");
            return;
          }
          onChange(String(clampScore(parseFloat(raw))));
        }}
        placeholder="0"
        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 pr-8 text-center text-sm font-black text-[#252B68] outline-none focus:border-[#F58220] focus:ring-2 focus:ring-[#F58220]/20"
      />
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">
        /50
      </span>
    </div>
  );
}

/* =========================================================
   Edit Modal — handles photo upload for both levels
========================================================= */

function EditAchieverModal({
  achiever,
  onClose,
  onSaved,
}: {
  achiever: TopAchiever;
  onClose: () => void;
  onSaved: (msg: string) => Promise<void>;
}) {
  const isSubject = achiever.subject !== null;

  const [studentName, setStudentName] = useState(achiever.student_name);
  const [english, setEnglish] = useState<string>(achiever.english_score.toString());
  const [maths, setMaths] = useState<string>(achiever.maths_score.toString());
  const [science, setScience] = useState<string>(achiever.science_score.toString());
  const [score, setScore] = useState<string>(achiever.total_score.toString());
  const [note, setNote] = useState(achiever.note ?? "");
  const [isPublished, setIsPublished] = useState(achiever.is_published);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(achiever.student_photo_url ?? "");
  const [removePhoto, setRemovePhoto] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!photoFile) return;
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    setRemovePhoto(false);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!studentName.trim()) {
      setError("Student name is required.");
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("student_name", studentName.trim());
      fd.append("note", note.trim());
      fd.append("is_published", isPublished ? "1" : "0");
      if (achiever.subject) fd.append("subject", achiever.subject);

      if (isSubject) {
        fd.append("score", String(clampScore(parseFloat(score || "0"))));
      } else {
        fd.append("english_score", String(clampScore(parseFloat(english || "0"))));
        fd.append("maths_score", String(clampScore(parseFloat(maths || "0"))));
        fd.append("science_score", String(clampScore(parseFloat(science || "0"))));
      }

      if (photoFile) fd.append("photo", photoFile);
      if (removePhoto && !photoFile) fd.append("remove_photo", "1");

      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_URL}/api/admin/top-achievers/${achiever.id}`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: fd,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Unable to save.");

      await onSaved("Achiever updated.");
    } catch (err: any) {
      setError(err?.message || "Unable to save.");
    } finally {
      setBusy(false);
    }
  }

  const subjectLabel = achiever.subject
    ? SUBJECTS.find((s) => s.key === achiever.subject)?.label
    : "Class Level";

  return (
    <div className="fixed inset-0 z-[160] flex items-start justify-center overflow-y-auto bg-black/60 p-4">
      <form
        onSubmit={submit}
        className="my-4 w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#252B68] px-6 py-4 text-white">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#FFE900]">
              Edit · {subjectLabel}
            </p>
            <h2 className="mt-1 text-lg font-black">{achiever.student_name}</h2>
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

        <div className="space-y-4 px-6 py-6">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-start gap-4">
            <ImagePicker
              preview={photoPreview}
              onFile={(f) => setPhotoFile(f)}
              onClear={() => {
                setPhotoFile(null);
                setPhotoPreview("");
                setRemovePhoto(true);
              }}
            />
            <div className="flex-1">
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Student name *
                </span>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
                  required
                />
              </label>
            </div>
          </div>

          {isSubject ? (
            <NumberField label={`Score /${MAX_SUBJECT}`} value={score} onChange={setScore} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <NumberField label={`English /${MAX_SUBJECT}`} value={english} onChange={setEnglish} />
              <NumberField label={`Maths /${MAX_SUBJECT}`} value={maths} onChange={setMaths} />
              <NumberField label={`Science /${MAX_SUBJECT}`} value={science} onChange={setScience} />
            </div>
          )}

          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Note
            </span>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
            />
          </label>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-bold text-[#252B68]">Published</p>
            <button
              type="button"
              onClick={() => setIsPublished((v) => !v)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                isPublished ? "bg-emerald-500" : "bg-slate-300"
              }`}
              aria-pressed={isPublished}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  isPublished ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
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
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <input
        type="number"
        min={0}
        max={MAX_SUBJECT}
        step={0.5}
        value={value}
        onChange={(e) => onChange(String(clampScore(parseFloat(e.target.value || "0"))))}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-[#252B68] outline-none focus:border-[#252B68] focus:ring-2 focus:ring-[#252B68]/10"
      />
    </label>
  );
}