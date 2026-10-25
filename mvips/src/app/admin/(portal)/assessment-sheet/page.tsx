"use client";

import {
  AlertCircle, BookOpen, CheckCircle2, ChevronDown, Clock, FileText,
  Loader2, Lock, Save, Search, Send, Sparkles, TrendingUp, User, X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "admin_token";

/* ============================================================
 * TYPES
 * ============================================================ */

interface SectionLite {
  id: number;
  name: string;
  school_class_name?: string;
  stream_name?: string;
  stream_colour?: string | null;
  can_mark: boolean;
  can_assess: boolean;
}

interface CtxTerm { id: number; name: string }
interface Ctx {
  current_academic_year: { id: number; name: string } | null;
  terms: CtxTerm[];
  sections: SectionLite[];
}

interface RosterStudent {
  id: number;
  student_number: string;
  full_name: string;
  photo_url: string | null;
  graded: number;
  total: number;
  progress: number;
}

interface ObjectiveRow { id: number; name: string; rating: string | null }
interface StrandRow { strand_id: number; strand_name: string; objectives: ObjectiveRow[] }

interface CoreSubject {
  subject_id: number;
  subject_name: string;
  total_marks: number;
  effort_shown: string | null;
  teacher_observation: string | null;
  strands: StrandRow[];
  scored_marks: number | null;
  percentage: number | null;
  grade: string | null;
  achievement: string | null;
}

interface SpecialistSubject {
  subject_id: number;
  subject_name: string;
  total_marks: number;
  scored_marks: number | null;
  percentage: number | null;
  grade: string | null;
  achievement: string | null;
}

interface WeekRow { week: number; score: number | null; max_score: number }
interface WeeklyTest { test_type: string; label: string; max_score: number; weeks: WeekRow[] }

interface PublishState {
  status: "draft" | "submitted" | "published" | "held";
  submitted_at: string | null;
  submitted_by_name: string | null;
  published_at: string | null;
  published_by_name: string | null;
  hold_reason: string | null;
  is_class_teacher: boolean;
  can_edit: boolean;
  can_submit: boolean;
  can_unsubmit: boolean;
}

interface FormData {
  student: { id: number; student_number: string; full_name: string; photo_url: string | null };
  class_stream: { id: number; name: string; school_class_name?: string; stream_name?: string };
  academic_year: { id: number; name: string };
  term: { id: number; name: string; start_date: string | null; end_date: string | null };
  attendance: { total_sessions: number; present: number; late: number; percentage: number | null };
  teacher_scope: "class_teacher" | "subject_teacher";
  is_subject_teacher_only: boolean;
  editable_subject_ids: number[] | null;

  can_manage_skill_club: boolean;
  led_clubs: { id: number; name: string; colour: string | null }[];

  total_weeks: number;

  core_subjects: CoreSubject[];
  specialist_subjects: SpecialistSubject[];
  weekly_tests: WeeklyTest[];
  class_teacher_observation: string | null;
  skill_enhancement_club: string | null;
  publish: PublishState;
}

type Toast = { type: "success" | "error"; msg: string };

/* ============================================================
 * CONSTANTS
 * ============================================================ */

const RATINGS = [
  { value: "basic", label: "Basic", pct: "20%" },
  { value: "aspiring", label: "Aspiring", pct: "40%" },
  { value: "good", label: "Good", pct: "60%" },
  { value: "high", label: "High", pct: "80%" },
  { value: "exceeding", label: "Exceeding", pct: "100%" },
  { value: "unclassified", label: "Unclassified", pct: "—" },
];

const EFFORT_OPTIONS = RATINGS.filter((r) => r.value !== "unclassified");

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

function initialsOf(name: string): string {
  return (
    (name || "").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?"
  );
}

function gradeFor(pct: number): [string, string] {
  if (pct >= 81) return ["A+", "Outstanding"];
  if (pct >= 61) return ["A", "High"];
  if (pct >= 41) return ["B", "Good"];
  if (pct >= 21) return ["C", "Aspiring"];
  if (pct >= 10) return ["D", "Basic"];
  return ["E", "Unclassified"];
}

function clampScore(score: number | null, max: number): number | null {
  if (score === null || Number.isNaN(score)) return null;
  if (max <= 0) return 0;
  if (score < 0) return 0;
  if (score > max) return max;
  return score;
}

/** Responsive grid class depending on how many weeks we need to render. */
function weekGridClass(count: number): string {
  if (count <= 4)  return "grid-cols-2 sm:grid-cols-4";
  if (count <= 6)  return "grid-cols-3 sm:grid-cols-6";
  if (count <= 10) return "grid-cols-4 sm:grid-cols-5 md:grid-cols-10";
  if (count <= 14) return "grid-cols-4 sm:grid-cols-7";
  return "grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10";
}

/* ============================================================
 * PAGE
 * ============================================================ */

export default function AssessmentSheetPage() {
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const [ctxErr, setCtxErr] = useState("");

  const [sectionId, setSectionId] = useState<number | null>(null);
  const [termId, setTermId] = useState<number | null>(null);

  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [form, setForm] = useState<FormData | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showUnsubmitConfirm, setShowUnsubmitConfirm] = useState(false);

  const [toast, setToast] = useState<Toast | null>(null);
  const [search, setSearch] = useState("");

  /* ---------- Load context ---------- */
  useEffect(() => {
    (async () => {
      try {
        const [sectRes, ctxRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/assessment-sheet/sections`, { headers: authHeaders(), cache: "no-store" }),
          fetch(`${API_URL}/api/admin/assessment-objectives/context`, { headers: authHeaders(), cache: "no-store" }),
        ]);

        const sectData = await sectRes.json();
        const ctxData = await ctxRes.json();

        if (!sectRes.ok) throw new Error(sectData?.message || "Failed to load sections");
        if (!ctxRes.ok) throw new Error(ctxData?.message || "Failed to load context");

        const sections: SectionLite[] = (sectData.data ?? []).filter(
          (s: SectionLite) => Boolean(s.can_assess)
        );

        const c = ctxData.data;

        setCtx({
          current_academic_year: c.current_academic_year,
          terms: c.terms ?? [],
          sections,
        });

        if (sections.length) setSectionId(sections[0].id);
        if (c.terms?.length) setTermId(c.terms[0].id);
      } catch (e: any) {
        setCtxErr(e?.message || "Failed.");
      }
    })();
  }, []);

  /* ---------- Load roster ---------- */
  const loadRoster = useCallback(async () => {
    if (!sectionId || !termId) return;
    setRosterLoading(true);
    try {
      const params = new URLSearchParams({
        class_stream_id: String(sectionId),
        term_id: String(termId),
      });
      const res = await fetch(`${API_URL}/api/admin/assessment-sheet/roster?${params}`, {
        headers: authHeaders(), cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Load failed");
      setRoster(data.data.students ?? []);
    } catch (e: any) {
      setToast({ type: "error", msg: e?.message || "Failed." });
      setRoster([]);
    } finally { setRosterLoading(false); }
  }, [sectionId, termId]);

  useEffect(() => { loadRoster(); }, [loadRoster]);

  /* ---------- Load form ---------- */
  const loadForm = useCallback(async (studentId: number) => {
    if (!sectionId || !termId || !ctx?.current_academic_year) return;
    setFormLoading(true);
    try {
      const params = new URLSearchParams({
        term_id: String(termId),
        academic_year_id: String(ctx.current_academic_year.id),
        class_stream_id: String(sectionId),
      });
      const res = await fetch(`${API_URL}/api/admin/assessment-sheet/${studentId}/form?${params}`, {
        headers: authHeaders(), cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Load failed");
      setForm(data.data);
      setDirty(false);
    } catch (e: any) {
      setForm(null);
      setToast({ type: "error", msg: e?.message || "Failed." });
    } finally { setFormLoading(false); }
  }, [sectionId, termId, ctx]);

  useEffect(() => {
    if (selectedStudent) loadForm(selectedStudent);
    else setForm(null);
  }, [selectedStudent, loadForm]);

  /* ---------- Save ---------- */
  async function saveForm() {
    if (!form || !sectionId || !termId || !ctx?.current_academic_year) return;
    setSaving(true);
    try {
      const payload = {
        term_id: termId,
        academic_year_id: ctx.current_academic_year.id,
        class_stream_id: sectionId,
        objective_ratings: form.core_subjects.flatMap((s) =>
          s.strands.flatMap((st) =>
            st.objectives.map((o) => ({ objective_id: o.id, rating: o.rating }))
          )
        ),
        core_subjects: form.core_subjects.map((s) => ({
          subject_id: s.subject_id,
          effort_shown: s.effort_shown,
          teacher_observation: s.teacher_observation,
        })),
        specialist_subjects: form.specialist_subjects.map((s) => ({
          subject_id: s.subject_id,
          scored_marks: s.scored_marks,
        })),
        weekly_tests: form.weekly_tests.flatMap((t) =>
          t.weeks.map((w) => ({
            test_type: t.test_type,
            week_number: w.week,
            score: w.score,
            max_score: w.max_score,
          }))
        ),
        class_teacher_observation: form.publish.is_class_teacher
          ? form.class_teacher_observation
          : undefined,
        skill_enhancement_club: form.can_manage_skill_club
          ? form.skill_enhancement_club
          : undefined,
      };

      const res = await fetch(`${API_URL}/api/admin/assessment-sheet/${form.student.id}/form`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Save failed");

      setToast({ type: "success", msg: "Assessment saved." });
      setDirty(false);
      await loadForm(form.student.id);
      await loadRoster();
    } catch (e: any) {
      setToast({ type: "error", msg: e?.message || "Save failed." });
    } finally {
      setSaving(false);
    }
  }

  /* ---------- Submit / Recall ---------- */
  async function submitForPublishing() {
    if (!form || !sectionId || !termId || !ctx?.current_academic_year) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/assessment-sheet/${form.student.id}/submit`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          term_id: termId,
          academic_year_id: ctx.current_academic_year.id,
          class_stream_id: sectionId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Submit failed");
      setToast({ type: "success", msg: json.message });
      setShowSubmitConfirm(false);
      await loadForm(form.student.id);
      await loadRoster();
    } catch (e: any) {
      setToast({ type: "error", msg: e?.message || "Submit failed." });
    } finally {
      setSubmitting(false);
    }
  }

  async function recallSubmission() {
    if (!form || !termId || !ctx?.current_academic_year) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/assessment-sheet/${form.student.id}/unsubmit`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          term_id: termId,
          academic_year_id: ctx.current_academic_year.id,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed");
      setToast({ type: "success", msg: json.message });
      setShowUnsubmitConfirm(false);
      await loadForm(form.student.id);
      await loadRoster();
    } catch (e: any) {
      setToast({ type: "error", msg: e?.message || "Failed." });
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------- Local form mutations ---------- */
  function setRating(strandId: number, objectiveId: number, rating: string | null) {
    if (!form) return;
    setForm({
      ...form,
      core_subjects: form.core_subjects.map((s) => ({
        ...s,
        strands: s.strands.map((st) =>
          st.strand_id === strandId
            ? { ...st, objectives: st.objectives.map((o) => o.id === objectiveId ? { ...o, rating } : o) }
            : st
        ),
      })),
    });
    setDirty(true);
  }

  function setEffort(subjectId: number, effort: string | null) {
    if (!form) return;
    setForm({
      ...form,
      core_subjects: form.core_subjects.map((s) =>
        s.subject_id === subjectId ? { ...s, effort_shown: effort } : s
      ),
    });
    setDirty(true);
  }

  function setObservation(subjectId: number, obs: string) {
    if (!form) return;
    setForm({
      ...form,
      core_subjects: form.core_subjects.map((s) =>
        s.subject_id === subjectId ? { ...s, teacher_observation: obs } : s
      ),
    });
    setDirty(true);
  }

  function setSpecialistScore(subjectId: number, rawScore: number | null) {
    if (!form) return;
    setForm({
      ...form,
      specialist_subjects: form.specialist_subjects.map((s) => {
        if (s.subject_id !== subjectId) return s;

        const score = clampScore(rawScore, s.total_marks);
        const pct = score !== null && s.total_marks > 0
          ? +(((score / s.total_marks) * 100).toFixed(1)) : null;
        const [grade, achievement] = pct === null ? [null, null] : gradeFor(pct);

        return { ...s, scored_marks: score, percentage: pct, grade, achievement };
      }),
    });
    setDirty(true);
  }

  function setWeekScore(testType: string, week: number, rawScore: number | null) {
    if (!form) return;
    setForm({
      ...form,
      weekly_tests: form.weekly_tests.map((t) => {
        if (t.test_type !== testType) return t;
        return {
          ...t,
          weeks: t.weeks.map((w) => {
            if (w.week !== week) return w;
            const score = clampScore(rawScore, w.max_score);
            return { ...w, score };
          }),
        };
      }),
    });
    setDirty(true);
  }

  function setClassObs(v: string) {
    if (!form) return;
    setForm({ ...form, class_teacher_observation: v });
    setDirty(true);
  }

  function setSkillClub(v: string) {
    if (!form) return;
    setForm({ ...form, skill_enhancement_club: v });
    setDirty(true);
  }

  /* ---------- Derived ---------- */
  const currentSection = useMemo(
    () => ctx?.sections.find((s) => s.id === sectionId) ?? null,
    [ctx?.sections, sectionId]
  );

  const filteredRoster = useMemo(() => {
    if (!search.trim()) return roster;
    const q = search.trim().toLowerCase();
    return roster.filter((r) =>
      r.full_name.toLowerCase().includes(q) || r.student_number.toLowerCase().includes(q)
    );
  }, [roster, search]);

  const publish = form?.publish;
  const locked = publish ? !publish.can_edit : false;
  const isSubjectTeacherOnly = form?.is_subject_teacher_only ?? false;

  /* ---------- Render guards ---------- */
  if (ctxErr) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-red-600">
          <AlertCircle size={20} /> {ctxErr}
        </div>
      </div>
    );
  }

  if (!ctx) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={22} className="animate-spin text-[#F58220]" />
      </div>
    );
  }

  if (ctx.sections.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        <AlertCircle className="mr-2 inline" size={18} />
        You are not assigned to any class section, so there is nothing to mark.
      </div>
    );
  }

  if (!ctx.current_academic_year) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        <AlertCircle className="mr-2 inline" size={18} />
        No current academic year is active. Ask an administrator to activate one.
      </div>
    );
  }

  if (ctx.terms.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        <AlertCircle className="mr-2 inline" size={18} />
        No academic terms exist. Add terms under Administration → Terms first.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#172033]">Assessment Sheet</h1>
        <p className="mt-1 text-sm text-slate-500">
          Grade objectives, weekly tests, specialists and observations. Only the
          class teacher can submit for publishing.
        </p>
      </div>

      {/* Selector bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">My Class Section</label>
            <div className="relative">
              <select
                value={sectionId ?? ""}
                onChange={(e) => { setSectionId(Number(e.target.value)); setSelectedStudent(null); }}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-10 text-sm font-medium outline-none focus:border-[#252B68]"
              >
                {ctx.sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.stream_name ? ` · ${s.stream_name}` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Term</label>
            <div className="relative">
              <select
                value={termId ?? ""}
                onChange={(e) => { setTermId(Number(e.target.value)); setSelectedStudent(null); }}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-10 text-sm font-medium outline-none focus:border-[#252B68]"
              >
                {ctx.terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Academic Year</label>
            <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700">
              {ctx.current_academic_year.name}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        {/* Roster */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-bold text-[#172033]">
              {currentSection?.name ?? "Section"} · {roster.length} student{roster.length === 1 ? "" : "s"}
            </p>
            <div className="relative mt-2">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student..."
                className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-[#252B68]"
              />
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {rosterLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={18} className="animate-spin text-[#F58220]" />
              </div>
            ) : filteredRoster.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-slate-500">
                {roster.length === 0 ? "No students in this section." : "No students match your search."}
              </div>
            ) : (
              filteredRoster.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStudent(s.id)}
                  className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-left transition ${
                    selectedStudent === s.id ? "bg-[#252B68]/5" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#252B68] to-[#4A5496] text-xs font-bold text-white shadow-sm ring-2 ring-white">
                    {s.photo_url ? (
                      <img src={s.photo_url} alt={s.full_name} className="h-full w-full object-cover" />
                    ) : (
                      initialsOf(s.full_name)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#172033]">{s.full_name}</p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <div className="h-1 w-16 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all ${
                            s.progress >= 100 ? "bg-emerald-500" : s.progress >= 50 ? "bg-amber-500" : "bg-red-400"
                          }`}
                          style={{ width: `${Math.min(s.progress, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500">{s.progress}%</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Form */}
        <div>
          {!selectedStudent && (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#252B68]/10 to-[#F58220]/10">
                <User size={28} className="text-[#252B68]" />
              </div>
              <p className="mt-4 text-sm font-bold text-[#172033]">Pick a student to start</p>
              <p className="mt-1 max-w-xs text-xs text-slate-500">
                Select someone from the list to open their assessment sheet.
              </p>
            </div>
          )}

          {selectedStudent && formLoading && !form && (
            <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
              <Loader2 size={22} className="animate-spin text-[#F58220]" />
            </div>
          )}

          {form && (
            <div className="space-y-4">
              <PublishBanner
                state={form.publish}
                submitting={submitting}
                onSubmit={() => setShowSubmitConfirm(true)}
                onUnsubmit={() => setShowUnsubmitConfirm(true)}
              />

              <div className={locked ? "pointer-events-none opacity-70" : ""}>
                {/* Hero card */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="relative h-24 bg-gradient-to-r from-[#252B68] via-[#3A4087] to-[#F58220]">
                    <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px),radial-gradient(circle_at_80%_60%,white_1px,transparent_1px)] [background-size:24px_24px]" />
                  </div>

                  <div className="relative px-5 pb-5">
                    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
                      <div className="-mt-12 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-gradient-to-br from-[#252B68] to-[#4A5496] text-2xl font-black text-white shadow-lg">
                        {form.student.photo_url ? (
                          <img src={form.student.photo_url} alt={form.student.full_name} className="h-full w-full object-cover" />
                        ) : (
                          initialsOf(form.student.full_name)
                        )}
                      </div>

                      <div className="min-w-0 flex-1 pb-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-xl font-bold text-[#172033]">{form.student.full_name}</h2>
                          {isSubjectTeacherOnly && (
                            <span className="rounded-md bg-[#F58220]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#F58220]">
                              Subject Teacher
                            </span>
                          )}
                          {form.can_manage_skill_club && !form.publish.is_class_teacher && (
                            <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700">
                              Club Lead
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-slate-500">
                          {form.student.student_number}
                          <span className="mx-1.5">·</span>
                          {form.class_stream.name}
                          <span className="mx-1.5">·</span>
                          {form.term.name}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <SaveStatusBadge locked={locked} dirty={dirty} saving={saving} />
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <MiniStat icon={<Clock size={14} />} label="Sessions" value={form.attendance.total_sessions} />
                      <MiniStat icon={<CheckCircle2 size={14} />} label="Present" value={form.attendance.present} tone="text-emerald-700" />
                      <MiniStat icon={<Sparkles size={14} />} label="Late" value={form.attendance.late} tone="text-amber-700" />
                      <MiniStat icon={<TrendingUp size={14} />} label="Attendance" value={form.attendance.percentage !== null ? `${form.attendance.percentage}%` : "—"} tone="text-[#252B68]" />
                    </div>
                  </div>
                </div>

                {isSubjectTeacherOnly &&
                 form.core_subjects.length === 0 &&
                 form.specialist_subjects.length === 0 && (
                  <Section title="Subjects" icon={<BookOpen size={15} />}>
                    <p className="text-sm text-slate-500">
                      You are not assigned to teach any subject in this section.
                      Contact the administration if this is unexpected.
                    </p>
                  </Section>
                )}

                {/* 1. Core subjects */}
                {form.core_subjects.map((subject) => (
                  <CoreSubjectCard
                    key={subject.subject_id}
                    subject={subject}
                    onRating={(sid, oid, v) => setRating(sid, oid, v)}
                    onEffort={(v) => setEffort(subject.subject_id, v)}
                    onObservation={(v) => setObservation(subject.subject_id, v)}
                  />
                ))}

                {/* 2. Weekly tests — directly below core subjects */}
                {!isSubjectTeacherOnly && form.weekly_tests.length > 0 && (
                  <Section
                    title={`Weekly Tests · ${form.total_weeks} week${form.total_weeks === 1 ? "" : "s"}`}
                    icon={<BookOpen size={15} />}
                  >
                    <div className="space-y-4">
                      {form.weekly_tests.map((t) => (
                        <div key={t.test_type}>
                          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                            {t.label} <span className="text-slate-400">(max {t.max_score})</span>
                          </p>
                          <div className={`grid gap-2 ${weekGridClass(t.weeks.length)}`}>
                            {t.weeks.map((w) => (
                              <div
                                key={w.week}
                                className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-1.5 transition hover:border-slate-300"
                              >
                                <p className="text-[10px] font-bold text-slate-500">Wk {w.week}</p>
                                <input
                                  type="number"
                                  min={0}
                                  max={w.max_score}
                                  step="any"
                                  value={w.score ?? ""}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    if (raw === "") {
                                      setWeekScore(t.test_type, w.week, null);
                                      return;
                                    }
                                    const n = Number(raw);
                                    if (Number.isNaN(n)) return;
                                    setWeekScore(t.test_type, w.week, n);
                                  }}
                                  placeholder="—"
                                  className="mt-1 h-7 w-full rounded border border-slate-200 bg-white px-1.5 text-center text-xs font-semibold outline-none focus:border-[#252B68]"
                                />
                                <p className="mt-0.5 text-right text-[9px] font-medium text-slate-400">/{w.max_score}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* 3. Specialist subjects — below weekly tests */}
                {form.specialist_subjects.length > 0 && (
                  <Section title="Specialist Subjects" icon={<BookOpen size={15} />}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          <tr>
                            <th className="pb-2 pr-3">Subject</th>
                            <th className="pb-2 px-3 text-center">Total</th>
                            <th className="pb-2 px-3 text-center">Scored</th>
                            <th className="pb-2 px-3 text-center">%</th>
                            <th className="pb-2 px-3 text-center">Grade</th>
                            <th className="pb-2 pl-3">Achievement</th>
                          </tr>
                        </thead>
                        <tbody>
                          {form.specialist_subjects.map((s) => {
                            const atMax =
                              s.scored_marks !== null &&
                              s.total_marks > 0 &&
                              s.scored_marks >= s.total_marks;

                            return (
                              <tr key={s.subject_id} className="border-t border-slate-100">
                                <td className="py-2 pr-3 text-sm font-medium text-[#172033]">{s.subject_name}</td>
                                <td className="py-2 px-3 text-center text-sm text-slate-600">{s.total_marks}</td>
                                <td className="py-2 px-3 text-center">
                                  <input
                                    type="number"
                                    min={0}
                                    max={s.total_marks}
                                    step="any"
                                    value={s.scored_marks ?? ""}
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      if (raw === "") {
                                        setSpecialistScore(s.subject_id, null);
                                        return;
                                      }
                                      const n = Number(raw);
                                      if (Number.isNaN(n)) return;
                                      setSpecialistScore(s.subject_id, n);
                                    }}
                                    onBlur={(e) => {
                                      const raw = e.target.value;
                                      if (raw === "") return;
                                      const n = Number(raw);
                                      if (Number.isNaN(n)) return;
                                      setSpecialistScore(s.subject_id, n);
                                    }}
                                    className={`h-8 w-20 rounded-lg border px-2 text-center text-sm font-semibold outline-none transition ${
                                      atMax
                                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 focus:border-emerald-500"
                                        : "border-slate-200 bg-white text-[#172033] focus:border-[#252B68]"
                                    }`}
                                  />
                                  <p className="mt-1 text-[10px] font-medium text-slate-400">
                                    Max {s.total_marks}
                                  </p>
                                </td>
                                <td className="py-2 px-3 text-center text-sm text-slate-600">
                                  {s.percentage !== null ? `${s.percentage}%` : "—"}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {s.grade ? <GradePill grade={s.grade} /> : <span className="text-xs text-slate-400">—</span>}
                                </td>
                                <td className="py-2 pl-3 text-sm text-slate-600">{s.achievement ?? "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Section>
                )}

                {/* 4a. Skill Enhancement Club — class teacher OR club lead */}
                {form.can_manage_skill_club && (
                  <Section title="Skill Enhancement Club" icon={<Sparkles size={15} />}>
                    <textarea
                      value={form.skill_enhancement_club ?? ""}
                      onChange={(e) => setSkillClub(e.target.value)}
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#252B68]"
                    />
                    {form.led_clubs.length > 0 && (
                      <p className="mt-1.5 text-xs text-slate-500">
                        Recording as club lead of{" "}
                        {form.led_clubs.map((c) => c.name).join(", ")}.
                      </p>
                    )}
                  </Section>
                )}

                {/* 4b. Class Teacher's Observation — class teacher only */}
                {form.publish.is_class_teacher && (
                  <Section title="Class Teacher's Observation" icon={<Sparkles size={15} />}>
                    <textarea
                      value={form.class_teacher_observation ?? ""}
                      onChange={(e) => setClassObs(e.target.value)}
                      rows={4}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#252B68]"
                    />
                  </Section>
                )}

                {/* Sticky save bar */}
                {dirty && (
                  <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-2xl border border-[#252B68]/20 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
                    <p className="text-xs font-semibold text-[#252B68]">
                      You have unsaved changes
                    </p>
                    <button
                      onClick={saveForm}
                      disabled={saving}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#252B68] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#1d2255] disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      {saving ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showSubmitConfirm && form && (
        <ConfirmModal
          title="Submit for publishing?"
          message="Once submitted, you will not be able to edit the assessment sheet. An admin will review and publish the results."
          confirmLabel="Submit"
          tone="default"
          busy={submitting}
          onClose={() => setShowSubmitConfirm(false)}
          onConfirm={submitForPublishing}
        />
      )}

      {showUnsubmitConfirm && form && (
        <ConfirmModal
          title="Recall submission?"
          message="The sheet becomes editable again. This only works before the admin publishes the results."
          confirmLabel="Recall"
          tone="danger"
          busy={submitting}
          onClose={() => setShowUnsubmitConfirm(false)}
          onConfirm={recallSubmission}
        />
      )}

      {toast && <ToastBox {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

/* ============================================================
 * SUB-COMPONENTS
 * ============================================================ */

function SaveStatusBadge({ locked, dirty, saving }: {
  locked: boolean;
  dirty: boolean;
  saving: boolean;
}) {
  if (locked) {
    return (
      <div className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <Lock size={12} /> Locked
      </div>
    );
  }

  if (saving) {
    return (
      <div className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 text-[10px] font-bold uppercase tracking-wider text-blue-700">
        <Loader2 size={12} className="animate-spin" /> Saving…
      </div>
    );
  }

  if (dirty) {
    return (
      <div className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 text-[10px] font-bold uppercase tracking-wider text-amber-700">
        <AlertCircle size={12} /> Unsaved
      </div>
    );
  }

  return (
    <div className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
      <CheckCircle2 size={12} /> Saved
    </div>
  );
}

function PublishBanner({
  state, submitting, onSubmit, onUnsubmit,
}: {
  state: PublishState;
  submitting: boolean;
  onSubmit: () => void;
  onUnsubmit: () => void;
}) {
  if (state.status === "draft") {
    if (!state.is_class_teacher) return null;

    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <FileText size={15} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#172033]">Draft</p>
            <p className="text-xs text-slate-500">
              Save your changes, then submit when ready.
            </p>
          </div>
        </div>
        {state.can_submit && (
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#F58220] px-3 text-xs font-bold text-white hover:bg-[#d97212] disabled:opacity-50"
          >
            {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            Submit for Publishing
          </button>
        )}
      </div>
    );
  }

  if (state.status === "submitted") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Clock size={15} />
          </div>
          <div>
            <p className="text-sm font-bold text-blue-900">Submitted — awaiting admin review</p>
            <p className="text-xs text-blue-700">
              {state.submitted_by_name && `Submitted by ${state.submitted_by_name}. `}
              Fields are locked.
            </p>
          </div>
        </div>
        {state.can_unsubmit && (
          <button
            onClick={onUnsubmit}
            disabled={submitting}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
          >
            {submitting ? <Loader2 size={13} className="animate-spin" /> : null}
            Recall
          </button>
        )}
      </div>
    );
  }

  if (state.status === "published") {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
          <CheckCircle2 size={15} />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-900">Published</p>
          <p className="text-xs text-emerald-700">
            {state.published_by_name && `Published by ${state.published_by_name}. `}
            Results are visible to parents.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
        <AlertCircle size={15} />
      </div>
      <div>
        <p className="text-sm font-bold text-amber-900">On hold — outstanding fees</p>
        <p className="text-xs text-amber-800">
          {state.hold_reason || "Fees balance outstanding. Settle it and ask an admin to retry."}
        </p>
      </div>
    </div>
  );
}

function ConfirmModal({
  title, message, confirmLabel, tone, busy, onClose, onConfirm,
}: {
  title: string; message: string; confirmLabel: string;
  tone: "default" | "danger"; busy: boolean;
  onClose: () => void; onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-5">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone === "danger" ? "bg-red-50" : "bg-[#F58220]/10"}`}>
            {tone === "danger"
              ? <AlertCircle size={22} className="text-red-600" />
              : <Send size={22} className="text-[#F58220]" />}
          </div>
          <h3 className="mt-4 text-base font-bold text-[#172033]">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{message}</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button onClick={onClose} disabled={busy}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={busy}
            className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white disabled:opacity-50 ${
              tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-[#F58220] hover:bg-[#d97212]"
            }`}>
            {busy && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#252B68] to-[#4A5496] text-white">
          {icon}
        </div>
        <h3 className="text-sm font-bold text-[#172033]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function MiniStat({ icon, label, value, tone = "text-[#172033]" }: {
  icon: React.ReactNode; label: string; value: number | string; tone?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex items-center gap-1.5 text-slate-400">
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
      </div>
      <p className={`mt-1 text-lg font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function CoreSubjectCard({
  subject, onRating, onEffort, onObservation,
}: {
  subject: CoreSubject;
  onRating: (strandId: number, objId: number, v: string | null) => void;
  onEffort: (v: string | null) => void;
  onObservation: (v: string) => void;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#252B68] to-[#4A5496] text-white">
            <BookOpen size={15} />
          </div>
          <h3 className="text-sm font-bold text-[#172033]">{subject.subject_name}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold uppercase tracking-wider text-slate-600">
            Total {subject.total_marks}
          </span>
          {subject.scored_marks !== null && (
            <span className="rounded-md bg-[#252B68]/10 px-2 py-0.5 font-bold text-[#252B68]">
              {subject.scored_marks} / {subject.total_marks}
            </span>
          )}
          {subject.grade && <GradePill grade={subject.grade} />}
          {subject.achievement && (
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
              {subject.achievement}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4 px-4 py-3">
        {subject.strands.length === 0 ? (
          <p className="text-sm text-slate-500">
            No objectives have been defined for <strong>{subject.subject_name}</strong> this term.
            Add them under Academics → Assessment Objectives.
          </p>
        ) : (
          subject.strands.map((st) => (
            <div key={st.strand_id}>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">{st.strand_name}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {st.objectives.map((o) => (
                  <div key={o.id} className={`rounded-xl border p-2.5 transition ${
                    o.rating ? "border-[#252B68]/25 bg-[#252B68]/5" : "border-slate-200 bg-slate-50/50"
                  }`}>
                    <p className="truncate text-xs font-semibold text-[#172033]">{o.name}</p>
                    <select
                      value={o.rating ?? ""}
                      onChange={(e) => onRating(st.strand_id, o.id, e.target.value || null)}
                      className={`mt-1.5 h-8 w-full rounded-lg border px-2 text-xs font-semibold outline-none ${
                        o.rating ? "border-[#252B68]/40 bg-white text-[#252B68]" : "border-slate-200 bg-white text-slate-500"
                      }`}
                    >
                      <option value="">— Not graded</option>
                      {RATINGS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label} ({r.pct})</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Effort Shown</label>
            <select
              value={subject.effort_shown ?? ""}
              onChange={(e) => onEffort(e.target.value || null)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68]"
            >
              <option value="">—</option>
              {EFFORT_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Teacher&apos;s Observation</label>
            <input
              value={subject.teacher_observation ?? ""}
              onChange={(e) => onObservation(e.target.value)}
              placeholder="Add note..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#252B68]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function GradePill({ grade }: { grade: string }) {
  const tone =
    grade === "A+" ? "bg-fuchsia-100 text-fuchsia-700"
    : grade === "A" ? "bg-indigo-100 text-indigo-700"
    : grade === "B" ? "bg-blue-100 text-blue-700"
    : grade === "C" ? "bg-emerald-100 text-emerald-700"
    : grade === "D" ? "bg-red-100 text-red-700"
    : "bg-slate-100 text-slate-700";
  return (
    <span className={`inline-flex min-w-[28px] justify-center rounded-md px-2 py-0.5 text-[11px] font-black ${tone}`}>
      {grade}
    </span>
  );
}

function ToastBox({ type, msg, onClose }: Toast & { onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-5 right-5 z-[200] w-full max-w-sm">
      <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${
        type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"
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